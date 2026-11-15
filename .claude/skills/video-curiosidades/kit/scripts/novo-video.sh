#!/usr/bin/env bash
# novo-video.sh — cria videos/<slug>/ a partir do kit.
#   bash .claude/skills/video-curiosidades/kit/scripts/novo-video.sh <slug> [--ref R01|R02]
# --ref: escolha pela tabela "Escolha por tema" de referencias/REFERENCIAS.md (padrão R01).
# VIDEOS_DIR=/outra/pasta muda o destino (padrão: <raiz do repo>/videos).
set -euo pipefail
SLUG="${1:-}"; shift || true
REF="R01"
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) REF="$2"; shift 2 ;;
    --ref=*) REF="${1#--ref=}"; shift ;;
    *) echo "opção desconhecida: $1" >&2; exit 2 ;;
  esac
done
[[ "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "uso: novo-video.sh <slug-em-minusculas> [--ref R01|R02]" >&2; exit 2; }
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(git -C "$KIT" rev-parse --show-toplevel 2>/dev/null || pwd)"
DEST="${VIDEOS_DIR:-$ROOT/videos}/$SLUG"
[ -e "$DEST" ] && { echo "já existe: $DEST" >&2; exit 1; }
grep -q "\"$REF\"" "$KIT/template/assets/lib/presets.js" || { echo "ref $REF não está em presets.js" >&2; exit 2; }

mkdir -p "$(dirname "$DEST")"
cp -r "$KIT/template" "$DEST"
mkdir -p "$DEST/scripts"
cp "$KIT/scripts/"{comum.py,cenas.py,gera-hud-legendas.py,audio.py,previa.sh} "$DEST/scripts/"
cd "$DEST"
python3 - "$SLUG" "$REF" <<'EOF'
import json, sys, datetime
slug, ref = sys.argv[1], sys.argv[2]
for f in ("package.json", "meta.json", "video.json"):
    d = json.load(open(f, encoding="utf-8"))
    if "name" in d: d["name"] = slug
    if "id" in d: d["id"] = slug
    if f == "meta.json": d["createdAt"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    if f == "video.json": d["slug"] = slug; d["ref"] = ref
    json.dump(d, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2); open(f, "a").write("\n")
EOF
python3 scripts/cenas.py --criar >/dev/null
python3 scripts/gera-hud-legendas.py >/dev/null
echo "criado: $DEST (ref $REF)"
echo "próximo: SCRIPT.md -> python3 scripts/audio.py --dry-run -> audio.py -> cenas.py \"<1a palavra>\"... --criar -> gera-hud-legendas.py"
