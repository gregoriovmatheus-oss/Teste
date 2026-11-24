#!/usr/bin/env bash
# previa.sh — prévia barata antes do render de entrega.
#   bash scripts/previa.sh [pasta-do-video]
# Saídas: renders/previa.mp4 (draft, 15 fps) e renders/previa-folha.jpg (12 quadros, 180x320 cada).
# Mostre a folha ao usuário antes do render de entrega (render-rapido.sh).
# PREVIA_SEM_VIDEO=1 pula o mp4 e faz só a folha.
set -euo pipefail
cd "${1:-.}"
HF="${HF:-npx --yes hyperframes@0.9.52}"
mkdir -p renders
if [ -z "${PREVIA_SEM_VIDEO:-}" ]; then
  $HF render . -q draft --fps 15 --workers auto -o renders/previa.mp4 --quiet
  echo "vídeo: renders/previa.mp4"
fi
rm -rf renders/previa-quadros
$HF snapshot . --frames 12 --no-end -o renders/previa-quadros >/dev/null
# ordena pelo tempo do nome do arquivo, não alfabeticamente
mapfile -t Q < <(ls renders/previa-quadros/*.png | sort -V)
montage "${Q[@]}" -tile 6x2 -geometry 180x320+2+2 -background '#111' -quality 82 renders/previa-folha.jpg
echo "folha: renders/previa-folha.jpg (${#Q[@]} quadros)"
