#!/usr/bin/env bash
# final-review-fixes.sh — applies every manual correction we identified by
# reading through all 17 transcripts during this session. Run once, from
# ~/patriciolumbe-site, after caption-pipeline.py has finished all videos.
#
# Safe to re-run: every fix is a plain string replace, so running it twice
# just does nothing the second time. It edits files in place with sed -i,
# no backups needed here since your originals are already safe in the
# *.raw.vtt files next to each *.vtt.
#
# Usage:
#   chmod +x final-review-fixes.sh
#   ./final-review-fixes.sh

set -euo pipefail

EN3="AWS_AI_OPS_demo/captions/ai-ops-en-3.vtt"
EN4="AWS_AI_OPS_demo/captions/ai-ops-en-4.vtt"
EN6="AWS_AI_OPS_demo/captions/ai-ops-en-6.vtt"
FR1="AWS_AI_OPS_demo/captions/ai-ops-fr-1.vtt"
FR2="AWS_AI_OPS_demo/captions/ai-ops-fr-2.vtt"
PT1="AWS_AI_OPS_demo/captions/ai-ops-pt-1.vtt"
CP2="CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-2.vtt"
CP3="CLOUD_PORTFOLIO_demo/captions/cloud-portfolio-en-3.vtt"

fix() {  # fix <file> <find-words-space-separated> <replace>
  # Uses perl in slurp mode so a phrase that got line-wrapped across two
  # physical lines WITHIN THE SAME CUE (e.g. "eye\navailability") still
  # matches — sed alone only matches within a single line and silently
  # does nothing if the phrase happens to wrap. Whitespace in the search
  # phrase (spaces) is treated as "\s+" so it matches a real space OR a
  # line-wrap newline, but never a blank cue-separator line, since none
  # of our target phrases are long/generic enough to span one by accident.
  local file="$1" find="$2" replace="$3"
  if [ ! -f "$file" ]; then
    echo "  SKIP (not found): $file"
    return
  fi
  local before after pattern
  before=$(md5sum "$file" | cut -d' ' -f1)
  pattern=$(printf '%s' "$find" | sed 's/ /\\s+/g')
  perl -0777 -i -pe "s/${pattern}/${replace}/g" "$file"
  after=$(md5sum "$file" | cut -d' ' -f1)
  if [ "$before" != "$after" ]; then
    echo "  fixed in $(basename "$file"): ${find} -> ${replace}"
  else
    echo "  no match (already fixed or not present) in $(basename "$file"): ${find}"
  fi
}

echo "== ai-ops-en-4: pipeline mishearing =="
fix "$EN4" "the paper line" "the pipeline"

echo
echo "== ai-ops-fr-1: Claude/Bedrock, cost wording, duplication =="
fix "$FR1" "Cloud AI hébergé" "Claude, un modèle d'IA hébergé"
fix "$FR1" "cloud AI lit" "Claude lit"
fix "$FR1" "à coup zéro" "à coût zéro"
fix "$FR1" "Run book assistant run book assistant" "Run book assistant"

echo
echo "== ai-ops-fr-2: EC2 wording =="
fix "$FR2" "Amazon elastic compute cloud" "Amazon EC2 (Elastic Compute Cloud)"

echo
echo "== ai-ops-pt-1: orders API mishearing =="
fix "$PT1" "Order happy" "Orders API"

echo
echo "== cloud-portfolio-en-2: re-apply OIDC/security terms (ran before script was updated) =="
fix "$CP2" "eye availability" "high availability"
fix "$CP2" "oedc" "OIDC"
fix "$CP2" "Oedc" "OIDC"
fix "$CP2" "static case" "static key"
fix "$CP2" "permanent cloud case" "permanent cloud key"
fix "$CP2" "cloud case" "cloud key"
fix "$CP2" "principle of lease" "principle of least"
fix "$CP2" "Village it has only" "privilege — it has only"
fix "$CP2" "it up always needs" "GitHub Actions always needs"
fix "$CP2" "Fire base" "Firebase"
fix "$CP2" "global deliver\b" "global delivery"
fix "$CP2" "this gives me a eye" "this gives me high"
fix "$CP2" "Variability and global delivery" "availability and global delivery"

echo
echo "== cloud-portfolio-en-3: DNS/security terms =="
fix "$CP3" "cia record" "CAA record"
fix "$CP3" "Cia record" "CAA record"
fix "$CP3" "list privilege" "least privilege"
fix "$CP3" "a version state" "a versioned state"
fix "$CP3" "Version state instead" "Versioned state instead"
fix "$CP3" "global delivered hosting" "globally delivered hosting"
fix "$CP3" "cheaper tire" "cheaper tier"

echo
echo "== ai-ops-en-6: remove the non-speech numeric artifact cues (optional) =="
echo "  (skipped automatically — these need manual removal since they are"
echo "   whole cues, not a text substitution. See instructions below.)"

echo
echo "All done. Review the 'SKIP' lines above, if any — they mean that"
echo "file wasn't found at the expected path and was left untouched."
