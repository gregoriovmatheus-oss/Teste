#!/usr/bin/env bash
# fila-render.sh <slug> [slug...]: renderiza em sequência, solto do terminal (sobrevive ao limite de 2 h), e faz a cópia crf23.
#   setsid nohup bash .claude/skills/video-curiosidades/kit/scripts/fila-render.sh a b c > /tmp/fila.out 2>&1 &
# Progresso: /tmp/fila.log ("<slug> pronto HH:MM"). Um render por vez: WebGL por software satura a CPU.
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
for s in "$@"; do
  while pgrep -f "hyperframes render" >/dev/null; do sleep 20; done
  cd "$ROOT/videos/$s" && rm -rf renders/work-* renders/.h* renders/snap && ./render-rapido.sh > renders/render.log 2>&1
  ffmpeg -y -loglevel error -i "renders/$s.mp4" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 160k -movflags +faststart "renders/$s-crf23.mp4"
  echo "$s pronto $(date -u +%H:%M)" >> /tmp/fila.log
done
