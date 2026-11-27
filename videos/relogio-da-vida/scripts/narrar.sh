#!/usr/bin/env bash
# narrar.sh [velocidade]: SCRIPT.md -> assets/audio/narracao.mp3 + audio/palavras.json (rode na pasta do projeto)
set -euo pipefail; cd "$(dirname "$0")/.."
[ -s ~/.cache/kokoro/kokoro-v1.0.onnx ] || bash scripts/setup-tts.sh
python3 audio/narra.py . "${1:-1.08}"
ffmpeg -y -loglevel error -i audio/narr_raw.wav -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=9" -ar 48000 -b:a 160k assets/audio/narracao.mp3
echo "narração: $(ffprobe -v error -show_entries format=duration -of csv=p=0 assets/audio/narracao.mp3) s"
