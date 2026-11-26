#!/usr/bin/env bash
# Instala a narração local (Kokoro ONNX, ~350 MB) uma vez por máquina/container.
set -euo pipefail
pip install -q kokoro-onnx soundfile
C=~/.cache/kokoro; mkdir -p $C; U=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -s $C/$f ] || curl -sSfL -o $C/$f $U/$f; done
echo "kokoro ok: $C"
