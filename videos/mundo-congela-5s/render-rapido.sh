#!/usr/bin/env bash
# render-rapido.sh — final render (delivery) of mundo-congela-5s, the fast way.
#
# Why it's fast now:
#   - kit.js bindSeek clamps each scene to its own window, so only the visible scene's WebGL
#     draws on each frame (before: all 12 scenes redrew every frame, ~4-5x the GPU work).
#   - 2 workers: WebGL is software (SwiftShader, already multi-threaded), so on 4 cores
#     2 workers is the sweet spot (3-4 tie with 2; splitting the timeline into chunks
#     rendered at the same time gives nothing, the CPU is already saturated).
#
# Usage: ./render-rapido.sh [workers]   (default 2)
set -euo pipefail
cd "$(dirname "$0")"

WORKERS="${1:-2}"
OUT="renders/mundo-congela-5s.mp4"
mkdir -p renders

start=$(date +%s)
npx hyperframes render -q delivery -w "$WORKERS" --no-browser-gpu -o "$OUT"
end=$(date +%s)

dur=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT")
audio=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of default=nw=1:nk=1 "$OUT")
echo "render-rapido: $(( (end - start) / 60 ))m $(( (end - start) % 60 ))s · duration ${dur}s · audio: ${audio:-NONE}"
