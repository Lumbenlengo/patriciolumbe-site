#!/usr/bin/env python3
"""
make-captions.py — generate .vtt subtitle files for the portfolio videos.

v3: fixes the silent-hang bug from v2. urllib.request.urlretrieve has no
timeout at all, so a stalled connection (Cloud Shell network hiccup, GCS
throttling, whatever) would freeze forever with no error. This version:

  - sets a hard socket timeout on every connection
  - downloads in small chunks and PRINTS PROGRESS as it goes, so a stall
    is visible within seconds instead of being indistinguishable from
    "just slow"
  - retries a failed/stalled download up to 3 times with backoff
  - skips a video and moves on after repeated failures, instead of
    blocking the rest of the run

Everything else is unchanged: faster-whisper (CPU, int8), writes WEBVTT,
one .vtt per video in the right captions/ folder.

SETUP (already done, but for reference):
    pip install --user faster-whisper

RUN:
    export HF_HUB_DISABLE_XET=1
    python3 -u make-captions.py --model tiny
"""

import argparse
import http.client
import os
import socket
import sys
import time
import urllib.parse
import urllib.request

BUCKET = "https://storage.googleapis.com/project-5c15975f-e002-4ccf-b67-videos"

# (output .vtt path, spoken language, video URL)
VIDEOS = [
    ("AWS_AI_OPS_demo/captions/ai-ops-en-1.vtt", "en",
     f"{BUCKET}/Projecto INGLES/1.0 Serverless AI for 3 A.M. Incidents.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-2.vtt", "en",
     f"{BUCKET}/Projecto INGLES/2.0 AI Observerless Incident Response in Minutes.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-3.vtt", "en",
     f"{BUCKET}/Projecto INGLES/Projecto 0.0  Video em ingles.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-4.vtt", "en",
     f"{BUCKET}/Projecto INGLES/Projecto_ 1.0 _ Ingles Modular Terraform, CI CD Deployment and Github Actions.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-5.vtt", "en",
     f"{BUCKET}/Projecto INGLES/Projecto Ingles_ 2.0 _ ECS and CloudWatch Health Check Demo.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-6.vtt", "en",
     f"{BUCKET}/Projecto INGLES/_  Projecto Ingles_ 3.0 _    APP Testing Monitoring by Intentionally Breaking Service.mp4"),

    ("AWS_AI_OPS_demo/captions/ai-ops-fr-1.vtt", "fr",
     f"{BUCKET}/Projecto Frances/Projecto Video em frances.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-fr-2.vtt", "fr",
     f"{BUCKET}/Projecto Frances/Project 1.0 _ French_ Déploiement et reprise automatique avec Terraform.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-fr-3.vtt", "fr",
     f"{BUCKET}/Projecto Frances/_ Project 2.0 _ French_   Analyse d'incident via Slack et CloudWatch.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-fr-4.vtt", "fr",
     f"{BUCKET}/Projecto Frances/_  Project 3 _ French_       Mission Control, remédiation et suivi des incidents.mp4"),

    ("AWS_AI_OPS_demo/captions/ai-ops-es-1.vtt", "es",
     f"{BUCKET}/Projecto Espanhol/Projecto Video em espanhol.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-es-2.vtt", "es",
     f"{BUCKET}/Projecto Espanhol/ADDED Project 1.0 _ Espanhol_ Configurar Load Balancer en AWS EC2.mp4"),
    ("AWS_AI_OPS_demo/captions/ai-ops-es-3.vtt", "es",
     f"{BUCKET}/Projecto Espanhol/_Project 2.0 _ Espanhol_  Prise de décision via Mission Control.mp4"),

    ("AWS_AI_OPS_demo/captions/ai-ops-pt-1.vtt", "pt",
     f"{BUCKET}/Projecto Portugues/Projecto Video em portugues.mp4"),

    ("CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-1.vtt", "en",
     f"{BUCKET}/CLOUD PLATFORM WEB SITE/1.0- Secure, Fast, Cheap Website with Firebase.mp4"),
    ("CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-2.vtt", "en",
     f"{BUCKET}/CLOUD PLATFORM WEB SITE/2.0 Secure Automated Deployment to Firebase Hosting.mp4"),
    ("CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-3.vtt", "en",
     f"{BUCKET}/CLOUD PLATFORM WEB SITE/3.0 Secure Cloud Portfolio Platform Architecture Overview.mp4"),
]

TMP = "/tmp/pl-captions"
SOCKET_TIMEOUT = 20          # seconds of silence before a connection is abandoned
STALL_TIMEOUT = 25           # seconds with zero new bytes before we call it stalled
MAX_ATTEMPTS = 3
CHUNK = 1024 * 256           # 256 KB per read

# Global default: belt and suspenders against any library call that
# opens a socket without its own timeout (this is what actually caused
# the earlier hang — urlretrieve ignores everything except this).
socket.setdefaulttimeout(SOCKET_TIMEOUT)


def encode(url: str) -> str:
    parts = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((
        parts.scheme, parts.netloc,
        urllib.parse.quote(parts.path), parts.query, parts.fragment
    ))


def human(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f}{unit}"
        n /= 1024
    return f"{n:.0f}TB"


def download_once(url: str, dest: str) -> bool:
    """One attempt. Prints live progress. Aborts itself if no new bytes
    arrive for STALL_TIMEOUT seconds — this is the actual fix: we no
    longer trust the socket timeout alone, we watch wall-clock progress."""
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=SOCKET_TIMEOUT)
    except (urllib.error.URLError, socket.timeout, http.client.HTTPException) as exc:
        print(f"    connect failed: {exc}")
        return False

    total = resp.getheader("Content-Length")
    total = int(total) if total else None
    written = 0
    last_progress_time = time.time()
    last_written = 0
    tmp_dest = dest + ".part"

    try:
        with open(tmp_dest, "wb") as fh:
            while True:
                # Guard against a stalled read: if the socket itself hangs,
                # this call raises socket.timeout after SOCKET_TIMEOUT thanks
                # to setdefaulttimeout above, which is what v2 was missing.
                chunk = resp.read(CHUNK)
                if not chunk:
                    break
                fh.write(chunk)
                written += len(chunk)

                now = time.time()
                if written > last_written:
                    last_written = written
                    last_progress_time = now
                elif now - last_progress_time > STALL_TIMEOUT:
                    print(f"    stalled at {human(written)}, aborting this attempt")
                    return False

                if total:
                    pct = written * 100 // total
                    print(f"\r    {human(written)}/{human(total)} ({pct}%)", end="", flush=True)
                else:
                    print(f"\r    {human(written)} downloaded", end="", flush=True)
        print()  # newline after the progress line
    except (socket.timeout, http.client.HTTPException, OSError) as exc:
        print(f"\n    read failed: {exc}")
        return False
    finally:
        resp.close()

    if total and written != total:
        print(f"    incomplete: got {written}, expected {total}")
        return False

    os.replace(tmp_dest, dest)
    return True


def download(url: str, dest: str) -> bool:
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return True
    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"    attempt {attempt}/{MAX_ATTEMPTS}…")
        if download_once(encode(url), dest):
            return True
        wait = attempt * 5
        if attempt < MAX_ATTEMPTS:
            print(f"    retrying in {wait}s…")
            time.sleep(wait)
    return False


def format_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def transcribe(model, media: str, out_vtt: str, lang: str) -> bool:
    try:
        segments, _info = model.transcribe(media, language=lang, vad_filter=True)
        lines = ["WEBVTT", ""]
        for seg in segments:
            lines.append(f"{format_ts(seg.start)} --> {format_ts(seg.end)}")
            lines.append(seg.text.strip())
            lines.append("")
        os.makedirs(os.path.dirname(out_vtt) or ".", exist_ok=True)
        with open(out_vtt, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines))
        return True
    except Exception as exc:                        # noqa: BLE001
        print(f"    transcription failed: {exc}")
        return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="small",
                    help="tiny | base | small | medium (default: small)")
    ap.add_argument("--only", default="",
                    help="only process outputs containing this text, e.g. cloud-portfolio")
    args = ap.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("faster-whisper is not installed. Run:")
        print("    pip install --user faster-whisper")
        return 1

    os.makedirs(TMP, exist_ok=True)
    todo = [v for v in VIDEOS if args.only in v[0]]
    print(f"{len(todo)} video(s) to caption, model = {args.model} (CPU, int8)\n")

    print("Loading model (first run downloads it, ~150 MB)…")
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    ok = 0
    failed = []
    for i, (out_vtt, lang, url) in enumerate(todo, 1):
        print(f"[{i}/{len(todo)}] {out_vtt}  ({lang})")
        if os.path.exists(out_vtt):
            print("    already exists, skipping")
            ok += 1
            continue
        media = os.path.join(TMP, f"{i:02d}-{lang}.mp4")
        if not download(url, media):
            print("    giving up on this video after repeated failures, moving on")
            failed.append(out_vtt)
            continue
        print("    transcribing…")
        if transcribe(model, media, out_vtt, lang):
            print("    done")
            ok += 1
        else:
            failed.append(out_vtt)
        if os.path.exists(media):
            os.remove(media)  # free /tmp space immediately, one video at a time

    print(f"\n{ok}/{len(todo)} caption files ready.")
    if failed:
        print(f"{len(failed)} failed after retries, re-run with --only to retry just those:")
        for f in failed:
            print(f"    {f}")
    print("\nRead each .vtt once and fix any technical terms the model misheard")
    print("(Terraform, ArgoCD, KEDA, IRSA and Bedrock are common casualties).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())