#!/usr/bin/env bash
# novo-video.sh <slug> [--ref R11]: cria videos/<slug>/ a partir de kit/template (o fluxo real dos últimos vídeos).
# Fluxo depois: SCRIPT.md -> scripts/narrar.sh -> scripts/cenas.py "<2 palavras>"... --cauda 1.4 --criar
#   -> scripts/gera-hud-legendas.py --sem-hud -> cenas/fNN.js -> scripts/monta-cenas.py -> scripts/doc.py -> ./render-rapido.sh
set -euo pipefail
SLUG="${1:-}"; shift || true; REF="R11"
while [ $# -gt 0 ]; do case "$1" in --ref) REF="$2"; shift 2 ;; --ref=*) REF="${1#--ref=}"; shift ;; *) echo "opção desconhecida: $1" >&2; exit 2 ;; esac; done
[[ "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "uso: novo-video.sh <slug> [--ref R11]" >&2; exit 2; }
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(git -C "$KIT" rev-parse --show-toplevel 2>/dev/null || pwd)"
DEST="${VIDEOS_DIR:-$ROOT/videos}/$SLUG"
[ -e "$DEST" ] && { echo "já existe: $DEST" >&2; exit 1; }
grep -q "\"$REF\"" "$KIT/template/assets/lib/presets.js" || { echo "ref $REF não está em presets.js" >&2; exit 2; }
cp -r "$KIT/template" "$DEST"; cd "$DEST"
python3 - "$SLUG" "$REF" <<'PY'
import json, sys, datetime
slug, ref = sys.argv[1], sys.argv[2]
for f in ("package.json", "meta.json", "video.json"):
    d = json.load(open(f, encoding="utf-8"))
    if "name" in d: d["name"] = slug
    if "id" in d: d["id"] = slug
    if f == "meta.json": d["createdAt"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    if f == "video.json": d.update(slug=slug, ref=ref, cenas=[], doc={"capitulos": [], "hud": []})
    json.dump(d, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2); open(f, "a").write("\n")
PY
printf '# %s\n\nNarração (uma linha por cena, ~200 palavras para 75 s):\n\n---\n' "$SLUG" > SCRIPT.md
echo "criado: $DEST (ref $REF)"
