#!/usr/bin/env python3
"""
clean-vtt.py — fixes two systematic problems in the Chirp 2 output:
  1. everything comes back lowercase, no punctuation
  2. specific technical terms get misheard consistently

Run this on every generated .vtt before publishing. It rewrites the file
in place (keeps a .raw.vtt backup) and prints a summary of what changed,
so you know what still needs a human read-through.

Usage:
    python3 clean-vtt.py path/to/file.vtt [more files...]
    python3 clean-vtt.py AWS_AI_OPS_demo/captions/*.vtt
"""

import re
import sys
from pathlib import Path

# Known misheard PHRASES — check these before the single-word dictionary,
# since they're wrong in a way a word-by-word fix can't catch.
PHRASE_FIXES = [
    (r"\bamazon bad wars\b", "Amazon Bedrock"),
    (r"\blia\b", "l'IA"),
    (r"\bl'ia\b", "l'IA"),
    (r"\bassistant handbook\b", "runbook assistant"),
    (r"\bthe handbook\b", "the runbook"),
    (r"\bcloud watch\b", "CloudWatch"),
    (r"\becs farget\b", "ECS Fargate"),
    (r"\bscs fargate\b", "ECS Fargate"),
    (r"\bss farqet\b", "ECS Fargate"),
    (r"\bamda\b", "Lambda"),
    (r"\branbooks?\b", "runbook"),
    (r"\berutador\b", "enrutador"),
    (r"\btelephone modules?\b", "Terraform modules"),
    (r"\btelephone folder\b", "Terraform folder"),
    (r"\bcall back a\b", "roll back a"),
    (r"\bcall back the\b", "roll back the"),
    (r"\bhold back\b", "roll back"),
    (r"\bgitup\b", "GitHub"),
    (r"\bgit up actions?\b", "GitHub Actions"),
    (r"\bpa tricio lumbe\b", "Patricio Lumbe"),
    (r"\bpa tricio lumbi\b", "Patricio Lumbe"),
    (r"\bdevelop engineer\b", "DevOps engineer"),
    (r"\ba lost of revenue\b", "a loss of revenue"),
    (r"\ballow productivity\b", "low productivity"),
    (r"\belfi\b", "healthy"),
    (r"\bel fi\b", "healthy"),
    (r"\bews\b", "AWS"),
    (r"\baam\b", "IAM"),
    (r"\bfarget\b", "Fargate"),
]

# Known technical terms: (pattern, correct casing). Matched as whole words,
# case-insensitively, so "cloudwatch", "CloudWatch", "CLOUDWATCH" all fix.
TERM_FIXES = [
    (r"aws", "AWS"),
    (r"amazon", "Amazon"),
    (r"cloudwatch", "CloudWatch"),
    (r"event ?bridge", "EventBridge"),
    (r"step functions?", "Step Functions"),
    (r"lambda", "Lambda"),
    (r"bedrock", "Bedrock"),
    (r"terraform", "Terraform"),
    (r"argocd", "ArgoCD"),
    (r"kubernetes", "Kubernetes"),
    (r"docker", "Docker"),
    (r"keda", "KEDA"),
    (r"irsa", "IRSA"),
    (r"eks", "EKS"),
    (r"ecs", "ECS"),
    (r"ec2", "EC2"),
    (r"fargate", "Fargate"),
    (r"dynamodb", "DynamoDB"),
    (r"s3\b", "S3"),
    (r"sqs", "SQS"),
    (r"iam", "IAM"),
    (r"vpc", "VPC"),
    (r"waf", "WAF"),
    (r"\balb\b", "ALB"),
    (r"guardduty", "GuardDuty"),
    (r"security hub", "Security Hub"),
    (r"codepipeline", "CodePipeline"),
    (r"codebuild", "CodeBuild"),
    (r"codedeploy", "CodeDeploy"),
    (r"github actions?", "GitHub Actions"),
    (r"github", "GitHub"),
    (r"oidc", "OIDC"),
    (r"\boedc\b", "OIDC"),
    (r"\bstatic case\b", "static key"),
    (r"\bcloud case\b", "cloud key"),
    (r"\bpermanent cloud case\b", "permanent cloud key"),
    (r"\beye availability\b", "high availability"),
    (r"\ba eye variability\b", "high availability"),
    (r"\bprinciple of lease village\b", "principle of least privilege"),
    (r"\bglobal deliver\b", "global delivery"),
    (r"helm", "Helm"),
    (r"prometheus", "Prometheus"),
    (r"grafana", "Grafana"),
    (r"fastapi", "FastAPI"),
    (r"python", "Python"),
    (r"slack", "Slack"),
    (r"gcp\b", "GCP"),
    (r"firebase", "Firebase"),
    (r"cloudflare", "Cloudflare"),
    (r"claude", "Claude"),
    (r"english", "English"),
    (r"api\b", "API"),
]


def is_timestamp_line(line: str) -> bool:
    return "-->" in line


def is_cue_number(line: str) -> bool:
    return line.strip().isdigit()


# Fixes that need a hand-written regex instead of the generic word-boundary
# wrapper below — most commonly because a simple \bpattern\b would also
# match unwanted things. "ai" -> "AI" is the main case: without care it
# also matches the "ai" in French contractions like "j'ai" (I have),
# "n'ai" etc., because an apostrophe counts as a word boundary too.
CUSTOM_FIXES = [
    (r"(?<!['’])\bai\b", "AI"),
]


def fix_text(text: str) -> str:
    for pattern, replacement in PHRASE_FIXES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    for pattern, replacement in CUSTOM_FIXES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    for pattern, replacement in TERM_FIXES:
        # Always require a word boundary on BOTH sides. Previously, when a
        # pattern already ended in r"\b" (e.g. "ai\b"), the leading \b was
        # dropped entirely, so "ai\b" matched the tail of ANY word ending in
        # "ai" — corrupting French "j'ai" into "j'AI", etc. Both sides are
        # now always anchored, regardless of what the pattern already has.
        left = "" if pattern.startswith(r"\b") else r"\b"
        right = "" if pattern.endswith(r"\b") else r"\b"
        text = re.sub(left + pattern + right, replacement, text, flags=re.IGNORECASE)
    return text


def capitalize_sentences(full_text: str) -> str:
    """Capitalize the first letter, after . ! ?, and the standalone pronoun 'i'."""
    def cap(m):
        return m.group(1) + m.group(2).upper()
    full_text = full_text[0].upper() + full_text[1:] if full_text else full_text
    full_text = re.sub(r"([.!?]\s+)([a-z])", cap, full_text)
    full_text = re.sub(r"\bi\b", "I", full_text)
    full_text = re.sub(r"\bi'(m|ll|ve|d)\b", lambda m: "I'" + m.group(1), full_text, flags=re.IGNORECASE)
    return full_text


def clean_vtt(path: Path) -> tuple[str, int]:
    raw = path.read_text(encoding="utf-8")
    lines = raw.splitlines()

    out = []
    changes = 0
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        if is_timestamp_line(line):
            out.append(line)
            i += 1
            # Collect this cue's text lines until a blank line or EOF, join
            # them into one string, so phrase-level fixes (which can span a
            # line-wrap, e.g. "assistant" / "handbook" on separate lines)
            # and capitalization both see the whole sentence at once.
            cue_lines = []
            while i < n and lines[i].strip() != "":
                cue_lines.append(lines[i])
                i += 1
            if cue_lines:
                original = " ".join(cue_lines)
                joined = fix_text(original)
                joined = capitalize_sentences(joined)
                if joined != original:
                    changes += 1
                # re-wrap onto the same number of lines it started with
                words = joined.split(" ")
                counts = [len(l.split()) for l in cue_lines]
                pos = 0
                for c in counts:
                    out.append(" ".join(words[pos:pos + c]))
                    pos += c
            continue
        out.append(line)
        i += 1

    return "\n".join(out) + "\n", changes


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    for arg in sys.argv[1:]:
        path = Path(arg)
        if not path.exists():
            print(f"skip (not found): {path}")
            continue
        backup = path.with_suffix(".raw.vtt")
        if not backup.exists():
            backup.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")

        cleaned, changes = clean_vtt(path)
        path.write_text(cleaned, encoding="utf-8")
        print(f"{path}: {changes} line(s) touched (backup: {backup.name})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
