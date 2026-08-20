#!/usr/bin/env python3
"""
caption-pipeline.py — the full Chirp 2 pipeline, one video at a time,
pausing after each so you can review before continuing.

For each video: extract audio (FLAC) -> upload to GCS -> submit to
Chirp 2 BatchRecognize -> poll until done -> download the .vtt ->
run it through clean-vtt.py -> show it to you -> ask "keep going? [y/n]".

Nothing here runs a local model. All transcription happens on Google's
side; this script just orchestrates gcloud/curl calls and waits.

SETUP (one-time):
    Requires: ffmpeg, gcloud (already authenticated), python3.
    Must be run from the repo root (~/patriciolumbe-site), same place
    clean-vtt.py lives.

RUN:
    python3 caption-pipeline.py                 # process everything not done yet
    python3 caption-pipeline.py --only ai-ops-fr # only videos matching this text
    python3 caption-pipeline.py --list           # just show the queue, don't run
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.parse

PROJECT = "project-5c15975f-e002-4ccf-b67"
BUCKET = "project-5c15975f-e002-4ccf-b67-videos"
REGION = "europe-west4"
BASE = f"https://storage.googleapis.com/{BUCKET}"

# (output .vtt path, spoken language, source video URL, gcp language code)
VIDEOS = [
    ("AWS_AI_OPS_demo/captions/ai-ops-en-1.vtt", "en",
     f"{BASE}/Projecto INGLES/1.0 Serverless AI for 3 A.M. Incidents.mp4", "en-US"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-2.vtt", "en",
     f"{BASE}/Projecto INGLES/2.0 AI Observerless Incident Response in Minutes.mp4", "en-US"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-3.vtt", "en",
     f"{BASE}/Projecto INGLES/Projecto 0.0  Video em ingles.mp4", "en-US"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-4.vtt", "en",
     f"{BASE}/Projecto INGLES/Projecto_ 1.0 _ Ingles Modular Terraform, CI CD Deployment and Github Actions.mp4", "en-US"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-5.vtt", "en",
     f"{BASE}/Projecto INGLES/Projecto Ingles_ 2.0 _ ECS and CloudWatch Health Check Demo.mp4", "en-US"),
    ("AWS_AI_OPS_demo/captions/ai-ops-en-6.vtt", "en",
     f"{BASE}/Projecto INGLES/_  Projecto Ingles_ 3.0 _    APP Testing Monitoring by Intentionally Breaking Service.mp4", "en-US"),

    ("AWS_AI_OPS_demo/captions/ai-ops-fr-1.vtt", "fr",
     f"{BASE}/Projecto Frances/Projecto Video em frances.mp4", "fr-FR"),
    ("AWS_AI_OPS_demo/captions/ai-ops-fr-2.vtt", "fr",
     f"{BASE}/Projecto Frances/Project 1.0 _ French_ Déploiement et reprise automatique avec Terraform.mp4", "fr-FR"),
    ("AWS_AI_OPS_demo/captions/ai-ops-fr-3.vtt", "fr",
     f"{BASE}/Projecto Frances/_ Project 2.0 _ French_   Analyse d'incident via Slack et CloudWatch.mp4", "fr-FR"),
    ("AWS_AI_OPS_demo/captions/ai-ops-fr-4.vtt", "fr",
     f"{BASE}/Projecto Frances/_  Project 3 _ French_       Mission Control, remédiation et suivi des incidents.mp4", "fr-FR"),

    ("AWS_AI_OPS_demo/captions/ai-ops-es-1.vtt", "es",
     f"{BASE}/Projecto Espanhol/Projecto Video em espanhol.mp4", "es-ES"),
    ("AWS_AI_OPS_demo/captions/ai-ops-es-2.vtt", "es",
     f"{BASE}/Projecto Espanhol/ADDED Project 1.0 _ Espanhol_ Configurar Load Balancer en AWS EC2.mp4", "es-ES"),
    ("AWS_AI_OPS_demo/captions/ai-ops-es-3.vtt", "es",
     f"{BASE}/Projecto Espanhol/_Project 2.0 _ Espanhol_  Prise de décision via Mission Control.mp4", "es-ES"),

    ("AWS_AI_OPS_demo/captions/ai-ops-pt-1.vtt", "pt",
     f"{BASE}/Projecto Portugues/Projecto Video em portugues.mp4", "pt-PT"),

    ("CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-1.vtt", "en",
     f"{BASE}/CLOUD PLATFORM WEB SITE/1.0- Secure, Fast, Cheap Website with Firebase.mp4", "en-US"),
    ("CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-2.vtt", "en",
     f"{BASE}/CLOUD PLATFORM WEB SITE/2.0 Secure Automated Deployment to Firebase Hosting.mp4", "en-US"),
    ("CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-3.vtt", "en",
     f"{BASE}/CLOUD PLATFORM WEB SITE/3.0 Secure Cloud Portfolio Platform Architecture Overview.mp4", "en-US"),
]

TMP = "/tmp/pl-captions"


def sh(cmd, check=True, capture=False):
    print(f"  $ {cmd}")
    if capture:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if check and r.returncode != 0:
            print(r.stdout)
            print(r.stderr)
            raise RuntimeError(f"command failed: {cmd}")
        return r.stdout
    r = subprocess.run(cmd, shell=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"command failed: {cmd}")


def gcs_object_name(url: str) -> str:
    """Extract the object path after the bucket name from a GCS https URL."""
    marker = f"{BASE}/"
    assert url.startswith(marker)
    return urllib.parse.unquote(url[len(marker):])


def access_token() -> str:
    return sh("gcloud auth print-access-token", capture=True).strip()


def process_one(out_vtt: str, lang: str, video_url: str, gcp_lang: str, idx: int, total: int) -> bool:
    print(f"\n{'=' * 70}")
    print(f"[{idx}/{total}] {out_vtt}  ({gcp_lang})")
    print(f"{'=' * 70}")

    if os.path.exists(out_vtt):
        print("  already exists locally, skipping (delete it first to redo)")
        return True

    os.makedirs(TMP, exist_ok=True)
    base = os.path.splitext(os.path.basename(out_vtt))[0]
    mp4_local = os.path.join(TMP, f"{base}.mp4")
    flac_local = os.path.join(TMP, f"{base}.flac")

    # 1. download source video
    obj_name = gcs_object_name(video_url)
    print("\n-- 1/6 downloading source video --")
    sh(f'gcloud storage cp "gs://{BUCKET}/{obj_name}" "{mp4_local}"')

    # 2. extract audio
    print("\n-- 2/6 extracting audio (mono, 16kHz FLAC) --")
    sh(f'ffmpeg -y -i "{mp4_local}" -vn -ac 1 -ar 16000 -c:a flac "{flac_local}" -loglevel error')

    # 3. upload audio
    print("\n-- 3/6 uploading audio --")
    input_uri = f"gs://{BUCKET}/captions-input/{base}.flac"
    sh(f'gcloud storage cp "{flac_local}" "{input_uri}"')

    # 4. submit BatchRecognize
    print("\n-- 4/6 submitting to Chirp 2 --")
    output_uri = f"gs://{BUCKET}/captions-output/"
    body = json.dumps({
        "files": [{"uri": input_uri}],
        "config": {
            "autoDecodingConfig": {},
            "model": "chirp_2",
            "languageCodes": [gcp_lang],
            "features": {"enableWordTimeOffsets": True},
        },
        "recognitionOutputConfig": {
            "gcsOutputConfig": {"uri": output_uri},
            "outputFormatConfig": {"vtt": {}},
        },
    })
    token = access_token()
    with open("/tmp/_body.json", "w") as f:
        f.write(body)
    resp = sh(
        f'curl -s -X POST -H "Content-Type: application/json" '
        f'-H "Authorization: Bearer {token}" '
        f'"https://{REGION}-speech.googleapis.com/v2/projects/{PROJECT}/locations/{REGION}/recognizers/_:batchRecognize" '
        f'--data @/tmp/_body.json',
        capture=True,
    )
    op = json.loads(resp)
    op_name = op.get("name")
    if not op_name:
        print("!! submission failed:")
        print(json.dumps(op, indent=2))
        return False
    print(f"  operation: {op_name}")

    # 5. poll
    print("\n-- 5/6 waiting for transcription --")
    result = None
    for attempt in range(60):
        time.sleep(5)
        token = access_token()
        poll = sh(
            f'curl -s -H "Authorization: Bearer {token}" '
            f'"https://{REGION}-speech.googleapis.com/v2/{op_name}"',
            capture=True,
        )
        state = json.loads(poll)
        print(f"  [{attempt + 1}/60] done={state.get('done', False)}")
        if state.get("done"):
            result = state
            break
    if result is None:
        print("!! timed out waiting for transcription")
        return False

    results = result.get("response", {}).get("results", {})
    file_result = results.get(input_uri) or next(iter(results.values()), {})
    if "error" in file_result:
        print("!! transcription error:")
        print(json.dumps(file_result["error"], indent=2))
        return False

    vtt_uri = file_result.get("cloudStorageResult", {}).get("vttFormatUri")
    if not vtt_uri:
        print("!! no .vtt produced:")
        print(json.dumps(result, indent=2))
        return False

    # 6. download + clean
    print("\n-- 6/6 downloading and cleaning the .vtt --")
    os.makedirs(os.path.dirname(out_vtt) or ".", exist_ok=True)
    sh(f'gcloud storage cp "{vtt_uri}" "{out_vtt}"')
    sh(f"python3 clean-vtt.py \"{out_vtt}\"")

    print(f"\n--- {out_vtt} ---")
    with open(out_vtt) as f:
        print(f.read())

    # cleanup local temp files
    for f in (mp4_local, flac_local):
        if os.path.exists(f):
            os.remove(f)

    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="", help="only process outputs containing this text")
    ap.add_argument("--list", action="store_true", help="just show the queue")
    args = ap.parse_args()

    todo = [v for v in VIDEOS if args.only in v[0]]
    pending = [v for v in todo if not os.path.exists(v[0])]

    if args.list:
        print(f"{len(todo)} total, {len(pending)} still pending:\n")
        for out_vtt, lang, url, gcp_lang in todo:
            mark = "  [done]" if os.path.exists(out_vtt) else "[pending]"
            print(f"{mark}  {out_vtt}")
        return 0

    print(f"{len(pending)} video(s) pending out of {len(todo)} total.\n")
    print("After each video, you'll see the cleaned transcript and be asked")
    print("whether to continue to the next one.\n")

    for i, (out_vtt, lang, url, gcp_lang) in enumerate(pending, 1):
        try:
            ok = process_one(out_vtt, lang, url, gcp_lang, i, len(pending))
        except Exception as exc:                     # noqa: BLE001
            print(f"\n!! unexpected error: {exc}")
            ok = False

        if i == len(pending):
            print("\nThat was the last one.")
            break

        while True:
            answer = input(
                f"\n{'OK — continue' if ok else 'That one had a problem — continue anyway'} "
                f"to the next video? [y/n] "
            ).strip().lower()
            if answer in ("y", "yes"):
                break
            if answer in ("n", "no"):
                print("Stopping here. Re-run the same command to pick up where you left off.")
                return 0
            print("Please answer y or n.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
