"""comum.py — funções compartilhadas pelos scripts do kit (rodam da pasta do vídeo)."""
import html
import json
import os
import re
import subprocess
import sys

W, H = 1080, 1920
PROJ = os.getcwd()


def p(*partes):
    return os.path.join(PROJ, *partes)


def r3(x):
    return round(x + 1e-9, 3)


def ler_video():
    try:
        return json.load(open(p("video.json"), encoding="utf-8"))
    except FileNotFoundError:
        sys.exit("video.json não encontrado: rode o script de dentro da pasta do vídeo (videos/<slug>/).")


def salvar_video(cfg):
    with open(p("video.json"), "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
        f.write("\n")


def ler_presets():
    src = open(p("assets/lib/presets.js"), encoding="utf-8").read()
    m = re.search(r"/\* PRESETS:INICIO \*/(.*)/\* PRESETS:FIM \*/", src, re.S)
    return json.loads(m.group(1))


def preset(cfg, ref=None):
    presets = ler_presets()
    ref = ref or cfg.get("ref") or "R01"
    if ref not in presets:
        sys.exit(f"ref {ref} não existe em presets.js (tem: {', '.join(presets)})")
    return ref, presets[ref]


def ler_palavras():
    try:
        ws = json.load(open(p("audio/palavras.json"), encoding="utf-8"))
    except FileNotFoundError:
        return []
    return [w for w in ws if w["text"].strip()]


def norm(t):
    return re.sub(r"[^\wÀ-ÿ]", "", t.lower())


def duracao_midia(arq):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=duration",
                              "-of", "csv=p=0", arq], capture_output=True, text=True, check=True).stdout
        return min(float(x) for x in out.split() if x.strip() not in ("", "N/A"))  # o menor: stream < container
    except Exception:
        return None


UR_LAT = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
UR_EXT = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"
FONTES = [
    ("EB Garamond", "normal", 400, "eb-garamond-latin-400-normal", UR_LAT),
    ("EB Garamond", "normal", 400, "eb-garamond-latin-ext-400-normal", UR_EXT),
    ("EB Garamond", "italic", 400, "eb-garamond-latin-400-italic", UR_LAT),
    ("EB Garamond", "italic", 400, "eb-garamond-latin-ext-400-italic", UR_EXT),
    ("Montserrat", "normal", 600, "montserrat-latin-600-normal", UR_LAT),
    ("Montserrat", "normal", 600, "montserrat-latin-ext-600-normal", UR_EXT),
    ("Anton", "normal", 400, "anton-latin-400-normal", UR_LAT),
    ("Anton", "normal", 400, "anton-latin-ext-400-normal", UR_EXT),
]


def css_fontes(familias, ind="      "):
    out = []
    for fam, est, peso, arq, ur in FONTES:
        if fam in familias and os.path.exists(p("assets/fonts", arq + ".woff2")):
            out.append(f'{ind}@font-face {{ font-family: "{fam}"; font-style: {est}; font-weight: {peso}; font-display: block; '
                       f'src: url("assets/fonts/{arq}.woff2") format("woff2"); unicode-range: {ur}; }}')
    return "\n".join(out)


def host(cid, src, ini, dur, faixa, tipo="graphics", z=1):
    return (f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="{src}" data-start="{r3(ini)}" '
            f'data-duration="{r3(dur)}" data-track-index="{faixa}" data-track-kind="{tipo}" data-width="{W}" '
            f'data-height="{H}" style="z-index: {z}"></div>')


def audio_tag(aid, src, ini, dur, faixa, vol, extra=""):
    return (f'      <audio id="{aid}" class="clip" src="{src}" data-start="{r3(ini)}" data-duration="{r3(dur)}" '
            f'data-track-index="{faixa}" data-volume="{vol}"{extra}></audio>')


def escrever_index(cfg, ref=None):
    ref, P = preset(cfg, ref)
    total = cfg["duracao"]
    linhas = []
    for c in cfg["cenas"]:
        linhas.append(host(c["id"], f'compositions/{c["id"]}.html', c["inicio"], c["fim"] - c["inicio"], 1))
    hud = cfg.get("hud")
    if hud and P["hud"]["ativo"] and os.path.exists(p("compositions/hud.html")):
        linhas.append(host("hud", "compositions/hud.html", hud["inicio"], hud["fim"] - hud["inicio"], 2, z=2))
    if os.path.exists(p("compositions/captions.html")):
        linhas.append(host("captions", "compositions/captions.html", 0, total, 3, tipo="captions", z=3))
    # áudio
    nar = cfg.get("narracao", {}).get("arquivo", "assets/audio/narracao.mp3")
    if os.path.exists(p(nar)):
        d = duracao_midia(p(nar)) or total
        linhas.append(audio_tag("narracao", nar, 0, min(d - 0.05, total), 10, 1))  # folga: o decoder lê ~50 ms a menos
    tr = cfg.get("trilha")
    if tr and os.path.exists(p(tr["arquivo"])):
        loop = tr.get("loop") or duracao_midia(p(tr["arquivo"])) or total
        k, st = 0, 0.0
        while st < total - 0.01:
            d = min(loop, total - st)
            fade = ' data-fade-out="1.2"' if st + d >= total - 0.01 else ""
            linhas.append(audio_tag(f"trilha-{k + 1}", tr["arquivo"], st, d, 11, tr.get("volume", 0.25), fade))
            k, st = k + 1, st + loop
    # faixa única de efeitos (audio/sfx-local.py gera assets/audio/sfx.mp3 com tudo mixado): antes sumia a cada cenas.py
    if os.path.exists(p("assets/audio/sfx.mp3")):
        linhas.append(audio_tag("sfx", "assets/audio/sfx.mp3", 0, min(duracao_midia(p("assets/audio/sfx.mp3")) or total, total), 12, cfg.get("sfx_volume", 0.5)))
    sfx = []
    for s in cfg.get("sfx", []):
        if s.get("em") is None:
            continue
        arq = f'assets/audio/{s["nome"]}.mp3'
        if not os.path.exists(p(arq)):
            print(f"aviso: {arq} não existe, efeito pulado", file=sys.stderr)
            continue
        d0 = duracao_midia(p(arq)) or 2
        for em in (s["em"] if isinstance(s["em"], list) else [s["em"]]):
            sfx.append((em, min(d0, total - em), s["nome"], arq, s.get("volume", 0.7)))
    fim_faixa, cont = [], {}
    for em, d, nome, arq, vol in sorted(sfx):
        k = next((i for i, f in enumerate(fim_faixa) if f <= em), len(fim_faixa))  # faixa livre, sem sobrepor
        if k == len(fim_faixa):
            fim_faixa.append(0)
        fim_faixa[k] = em + d
        cont[nome] = cont.get(nome, 0) + 1
        linhas.append(audio_tag(f"sfx-{nome}-{cont[nome]}", arq, em, d, 13 + k, vol))
    doc = f"""<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/lib/gsap.min.js"></script>
    <style>
{css_fontes(["EB Garamond", "Montserrat", "Anton"])}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: {P["fundo"]}; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <!-- Gerado por scripts/cenas.py a partir de video.json (ref {ref}). Edite video.json e rode de novo. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{r3(total)}" data-width="1080" data-height="1920">
{chr(10).join(linhas)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      tl.set({{}}, {{}}, {r3(total)});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""
    open(p("index.html"), "w", encoding="utf-8").write(doc)
