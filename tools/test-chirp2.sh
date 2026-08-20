#!/usr/bin/env bash
# test-chirp2.sh — one video, end to end, using Google Cloud Speech-to-Text V2 (Chirp 2).
# No local model, no local inference. Cloud Shell only uploads a small audio
# file and polls a status URL; all the heavy work happens on Google's side.
#
# Usage:
#   ./test-chirp2.sh <local-mp4-path> <output-vtt-path> [language_code]
#
# Example (matches what we've been calling "02-en.mp4" in earlier tests):
#   ./test-chirp2.sh /tmp/pl-captions/02-en.mp4 AWS_AI_OPS_demo/captions/ai-ops-en-2.vtt en-US

set -euo pipefail

PROJECT="project-5c15975f-e002-4ccf-b67"
BUCKET="project-5c15975f-e002-4ccf-b67-videos"
REGION="europe-west4"          # only region in the EU where Chirp 2 GA runs
INPUT_PREFIX="captions-input"
OUTPUT_PREFIX="captions-output"

MP4_PATH="${1:?Usage: $0 <local-mp4-path> <output-vtt-path> [language_code]}"
OUT_VTT="${2:?Usage: $0 <local-mp4-path> <output-vtt-path> [language_code]}"
LANG_CODE="${3:-en-US}"

BASENAME="$(basename "$MP4_PATH" .mp4)"
FLAC_LOCAL="/tmp/${BASENAME}.flac"
GCS_INPUT_URI="gs://${BUCKET}/${INPUT_PREFIX}/${BASENAME}.flac"
GCS_OUTPUT_URI="gs://${BUCKET}/${OUTPUT_PREFIX}/${BASENAME}/"

echo "== 1/6  Extracting audio (mono, 16kHz FLAC — the format Speech-to-Text likes best) =="
ffmpeg -y -i "$MP4_PATH" -vn -ac 1 -ar 16000 -c:a flac "$FLAC_LOCAL" -loglevel error
ls -lh "$FLAC_LOCAL"

echo "== 2/6  Uploading audio to Cloud Storage =="
gcloud storage cp "$FLAC_LOCAL" "$GCS_INPUT_URI"

echo "== 3/6  Submitting BatchRecognize request to Chirp 2 in ${REGION} =="
TOKEN="$(gcloud auth print-access-token)"

REQUEST_BODY=$(cat <<JSON
{
  "config": {
    "autoDecodingConfig": {},
    "languageCodes": ["${LANG_CODE}"],
    "model": "chirp_2",
    "features": { "enableWordTimeOffsets": true }
  },
  "files": [ { "uri": "${GCS_INPUT_URI}" } ],
  "recognitionOutputConfig": {
    "gcsOutputConfig": { "uri": "${GCS_OUTPUT_URI}" },
    "outputFormatConfig": { "vtt": {}, "native": {} }
  }
}
JSON
)

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://${REGION}-speech.googleapis.com/v2/projects/${PROJECT}/locations/${REGION}/recognizers/_:batchRecognize" \
  --data "${REQUEST_BODY}")

OP_NAME=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('name',''))" 2>/dev/null || true)

if [ -z "$OP_NAME" ]; then
  echo "!! Request failed, response was:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo "Operation started: $OP_NAME"

echo "== 4/6  Polling until done (this runs on Google's side, not here) =="
for i in $(seq 1 40); do
  sleep 5
  POLL=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "https://${REGION}-speech.googleapis.com/v2/${OP_NAME}")
  DONE=$(echo "$POLL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('done', False))" 2>/dev/null || echo "False")
  echo "  [$i/40] done=${DONE}"
  if [ "$DONE" = "True" ]; then
    break
  fi
done

if [ "$DONE" != "True" ]; then
  echo "!! Timed out waiting for the operation. Check it manually with:"
  echo "   curl -s -H \"Authorization: Bearer \$(gcloud auth print-access-token)\" \"https://${REGION}-speech.googleapis.com/v2/${OP_NAME}\" | python3 -m json.tool"
  exit 1
fi

ERROR=$(echo "$POLL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null || true)
if [ -n "$ERROR" ] && [ "$ERROR" != "None" ]; then
  echo "!! Transcription failed:"
  echo "$POLL" | python3 -m json.tool
  exit 1
fi

echo "== 5/6  Fetching the .vtt result from Cloud Storage =="
mkdir -p "$(dirname "$OUT_VTT")"
gcloud storage cp "${GCS_OUTPUT_URI}${BASENAME}.vtt" "$OUT_VTT"

echo "== 6/6  Done =="
echo "Saved: $OUT_VTT"
head -n 15 "$OUT_VTT"

echo
echo "Cleaning up the temporary local audio file."
rm -f "$FLAC_LOCAL"