#!/usr/bin/env python3
"""gera-hud-legendas.py — escreve compositions/hud.html e compositions/captions.html.

Rode de dentro de videos/<slug>/, depois de cenas.py:
  python3 scripts/gera-hud-legendas.py [--ref R01|R02] [--sem-hud] [--sem-contador]

Entradas: video.json (cenas, hud, legendas), audio/palavras.json, STORYBOARD.md (linha "- status:" de cada
"## Frame N", que vira o status da cena N no HUD) e o preset em assets/lib/presets.js.

video.json "hud" (ou null):
  { "inicio": 2.6, "fim": 52.53, "rotulo": "O CALOR VOLTA EM", "linha2": "AR −273 °C",
    "contador": { "de": 5, "ate": 0, "fim": 49.87, "unidade": "s", "casas": 2 } }     contador opcional
video.json "legendas":
  { "juntar": [["cento e vinte e dois", "122"]],   sequências faladas que viram número
    "numeros": { "cinco": "5" },                   palavras soltas que viram número
    "ocultar": [[0.8, 2.45]] }                     janelas (s absolutos) sem legenda, ex.: título do gancho
"""
import argparse
import html
import os
import re
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import ler_video, preset, ler_palavras, escrever_index, p, r3  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--ref")
ap.add_argument("--sem-hud", action="store_true")
ap.add_argument("--sem-contador", action="store_true")
a = ap.parse_args()

cfg = ler_video()
ref, P = preset(cfg, a.ref)
TOTAL = cfg["duracao"]
CENAS = cfg["cenas"]

# ---------------- HUD ----------------
hud = cfg.get("hud")
hud_on = bool(hud) and P["hud"]["ativo"] and not a.sem_hud
if hud_on:
    S, E = hud["inicio"], min(hud["fim"], TOTAL)
    D = r3(E - S)
    status = {}
    if os.path.exists(p("STORYBOARD.md")):
        sb = open(p("STORYBOARD.md"), encoding="utf-8").read()
        for bloco in re.split(r"\n## Frame ", sb)[1:]:
            m = re.search(r"^- status: (.+)$", bloco, re.M)
            n = int(re.match(r"\d+", bloco).group(0))
            if m and n <= len(CENAS):
                status[n] = m.group(1).strip()
    st_html, st_js = [], []
    for n, txt in sorted(status.items()):
        c = CENAS[n - 1]
        s, e = max(c["inicio"], S) - S, min(c["fim"], E) - S
        if e <= s:
            continue  # cena fora da janela do HUD
        st_html.append(f'      <div id="hud-st-{n:02d}" class="clip hud-status" data-start="{r3(s)}" data-duration="{r3(e - s)}">{html.escape(txt)}</div>')
        st_js.append(f'      tl.fromTo("#hud-st-{n:02d}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2, ease: "power2.out" }}, {r3(s)});')
    ct = None if a.sem_contador else hud.get("contador")
    H = P["hud"]
    num_html = js_ct = ""
    top_l2 = 60
    if ct:
        casas = ct.get("casas", 2)
        fmt0 = f'{ct["de"]:.{casas}f}'.replace(".", ",")
        num_html = f'      <div id="hud-num"><span id="hud-count">{fmt0}</span><span id="hud-unit">{html.escape(ct.get("unidade", ""))}</span></div>'
        cf = r3(ct.get("fim", E) - S)
        js_ct = f"""      const el = document.getElementById("hud-count");
      const c = {{ v: {ct["de"]} }};
      const fmt = (v) => v.toFixed({casas}).replace(".", ",").replace("-", "−");
      tl.fromTo(c, {{ v: {ct["de"]} }}, {{ v: {ct["ate"]}, duration: {cf}, ease: "none", onUpdate: () => {{ el.textContent = fmt(c.v); }} }}, 0);
      tl.fromTo("#hud-num", {{ color: "{H["numero"]["cor"]}" }}, {{ color: "{H["numero"]["cor_fim"]}", duration: 0.2, ease: "none" }}, {cf});
"""
        top_l2 = 196
    l2 = f'      <div id="hud-l2">{html.escape(hud["linha2"])}</div>' if hud.get("linha2") else ""
    top_st = top_l2 + (56 if l2 else 0)
    open(p("compositions/hud.html"), "w", encoding="utf-8").write(f"""<template>
  <!-- Gerado por scripts/gera-hud-legendas.py (ref {ref}). Não edite à mão. -->
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    #hud-box {{ position: absolute; left: 140px; right: 140px; top: {H["topo"]}px; height: {top_st + 60}px; text-align: center;
      color: #fff; text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55); }}
    #hud-scrim {{ position: absolute; left: -60px; right: -60px; top: -40px; bottom: -30px;
      background: radial-gradient(ellipse at 50% 50%, rgba(6, 12, 22, 0.74) 0%, rgba(6, 12, 22, 0.6) 45%, rgba(6, 12, 22, 0) 74%); }}
    #hud-label {{ position: absolute; left: 0; right: 0; top: 0; font-family: {H["rotulo"]["fonte"]}; font-weight: {H["rotulo"]["peso"]};
      font-size: {H["rotulo"]["tamanho"]}px; letter-spacing: {H["rotulo"]["espaco"]}; color: {H["rotulo"]["cor"]}; }}
    #hud-num {{ position: absolute; left: 0; right: 0; top: 34px; font-family: {H["numero"]["fonte"]}; font-size: {H["numero"]["tamanho"]}px;
      line-height: 1; font-variant-numeric: tabular-nums; color: {H["numero"]["cor"]}; }}
    #hud-unit {{ font-size: {round(H["numero"]["tamanho"] * 0.36)}px; margin-left: 10px; }}
    #hud-l2 {{ position: absolute; left: 0; right: 0; top: {top_l2}px; font-family: {H["rotulo"]["fonte"]}; font-weight: 600;
      font-size: 30px; letter-spacing: {H["rotulo"]["espaco"]}; color: {H["linha2"]["cor"]}; }}
    .hud-status {{ position: absolute; left: 0; right: 0; top: {top_st}px; font-family: {H["rotulo"]["fonte"]}; font-weight: 600;
      font-size: {H["status"]["tamanho"]}px; letter-spacing: {H["rotulo"]["espaco"]}; color: {H["status"]["cor"]}; }}
  </style>
  <div id="root" data-composition-id="hud" data-width="1080" data-height="1920">
    <div id="hud-box" class="clip" data-start="0" data-duration="{D}">
      <div id="hud-scrim" data-layout-ignore></div>
      <div id="hud-label">{html.escape(hud.get("rotulo", ""))}</div>
{num_html}
{l2}
{chr(10).join(st_html)}
    </div>
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#hud-box > *:not(.hud-status)", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25, ease: "power2.out" }}, 0);
{js_ct}{chr(10).join(st_js)}
      tl.set({{}}, {{}}, {D});
      window.__timelines = window.__timelines || {{}};
      window.__timelines["hud"] = tl;
    }})();
  </script>
</template>
""")
    print(f"hud.html: {len(st_html)} status, contador {'sim' if ct else 'não'}")
elif os.path.exists(p("compositions/hud.html")):
    os.remove(p("compositions/hud.html"))
    print("hud.html removido (HUD desligado)")

# ---------------- legendas ----------------
L = P["legenda"]
lc = cfg.get("legendas", {})
words = ler_palavras()
strip = lambda t: re.sub(r"[^\wÀ-ÿ]", "", t.lower())  # noqa: E731
JUNTAR = [(x.lower().split(), rep) for x, rep in lc.get("juntar", [])]
NUM = {k.lower(): v for k, v in lc.get("numeros", {}).items()}
toks, i = [], 0
while i < len(words):
    feito = False
    for seq, rep in JUNTAR:
        if [strip(w["text"]) for w in words[i:i + len(seq)]] == seq:
            last = words[i + len(seq) - 1]
            tail = re.sub(r"^[\wÀ-ÿ]+", "", last["text"])
            toks.append(dict(text=rep + tail, start=words[i]["start"], end=last["end"], num=rep))
            i += len(seq)
            feito = True
            break
    if feito:
        continue
    w = words[i]
    t, core = w["text"], strip(w["text"])
    if core == "menos" and i + 1 < len(words) and re.match(r"^\d", words[i + 1]["text"]):
        nx = words[i + 1]
        m = re.match(r"^([\d.,]+)(.*)$", nx["text"])
        toks.append(dict(text="−" + nx["text"], start=w["start"], end=nx["end"], num="−" + m.group(1)))
        i += 2
        continue
    if core in NUM:
        rep = NUM[core]
        toks.append(dict(text=rep + re.sub(r"^[\wÀ-ÿ]+", "", t), start=w["start"], end=w["end"], num=rep))
    elif re.match(r"^\d", t):
        m = re.match(r"^([\d.,]*\d)(.*)$", t)
        toks.append(dict(text=t, start=w["start"], end=w["end"], num=m.group(1) if m else t))
    else:
        toks.append(dict(text=t, start=w["start"], end=w["end"], num=None))
    i += 1

# grupos de 2 a 4 palavras, quebrando em pontuação e pausas
grupos, cur = [], []
for k, t in enumerate(toks):
    cur.append(t)
    nxt = toks[k + 1] if k + 1 < len(toks) else None
    gap = (nxt["start"] - t["end"]) if nxt else 9
    forte = re.search(r"[.?!…]$", t["text"])
    fraco = re.search(r"[,:;]$", t["text"])
    if not nxt or len(cur) >= 4 or forte or ((fraco or gap >= 0.15) and len(cur) >= 2):
        grupos.append(cur)
        cur = []
out = []
for g in grupos:  # palavra solta que não fecha frase se junta à seguinte
    if out and len(out[-1]) == 1 and not re.search(r"[.?!…]$", out[-1][0]["text"]) and len(out[-1]) + len(g) <= 4:
        out[-1] = out[-1] + g
    else:
        out.append(g)
grupos = out
FUNC = {"o", "a", "os", "as", "de", "do", "da", "no", "na", "e", "ao", "que", "um", "é", "só", "seu", "sua", "vai", "em", "com", "por", "pra", "para"}
for _ in range(3):  # não deixa artigo/preposição no fim da linha
    for k in range(len(grupos) - 1):
        ga, gb = grupos[k], grupos[k + 1]
        if re.search(r"[.?!…,:;]$", ga[-1]["text"]):
            continue
        if len(ga) >= 3 and (len(gb) == 1 or strip(ga[-1]["text"]) in FUNC) and len(gb) < 4:
            gb.insert(0, ga.pop())

ocultar = lc.get("ocultar", [])
def oculto(s):  # noqa: E302
    return any(a0 <= s < a1 for a0, a1 in ocultar)

def esc(t):  # noqa: E302
    if t["num"]:
        return f'<span class="num">{html.escape(t["num"])}</span>{html.escape(t["text"][len(t["num"]):])}'
    return html.escape(t["text"])

cap_html, cap_js = [], []
for n, g in enumerate(grupos):
    s = g[0]["start"] - 0.05 if n else max(0.15, g[0]["start"] - 0.05)
    prox = grupos[n + 1][0]["start"] - 0.05 if n + 1 < len(grupos) else TOTAL - 0.1
    e = min(prox, g[-1]["end"] + 0.4, TOTAL - 0.05)
    if e <= s or oculto(s):
        continue
    cid = f"cap-{n:03d}"
    cap_html.append(f'    <div id="{cid}" class="clip cap" data-start="{r3(s)}" data-duration="{r3(e - s)}"><span class="cap-t">{" ".join(esc(t) for t in g)}</span></div>')
    cap_js.append(f'      cap("#{cid} .cap-t", {r3(s)}, {r3(e)});')

contorno = ""
if L.get("contorno"):
    contorno = f"-webkit-text-stroke: {L['contorno']}; paint-order: stroke fill;"
faixa = L.get("faixa") or ""
open(p("compositions/captions.html"), "w", encoding="utf-8").write(f"""<template>
  <!-- Gerado por scripts/gera-hud-legendas.py (ref {ref}). Não edite à mão. -->
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .cap {{ position: absolute; left: 130px; right: 310px; top: {L["y"]}px; height: {L["altura"]}px; display: flex; align-items: center;
      justify-content: center; text-align: center; overflow: visible; }}
    .cap-t {{ display: block; font-family: {L["fonte"]}; font-style: {L["estilo"]}; font-weight: {L["peso"]}; font-size: {L["tamanho"]}px;
      line-height: 1.04; color: {L["cor"]}; text-transform: {L["caixa"]}; text-shadow: {L["sombra"]}; {contorno}
 }}
    #cap-faixa {{ position: absolute; left: 40px; right: 220px; top: {L["y"] - 40}px; height: {L["altura"] + 80}px; background: {faixa or "none"}; }}
    .cap-t .num {{ color: {L["numero"]}; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920">
{'    <div id="cap-faixa" data-layout-ignore></div>' if faixa else ""}
{chr(10).join(cap_html)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      function cap(sel, s, e) {{
        tl.fromTo(sel, {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }}, s);
        tl.to(sel, {{ opacity: 0, duration: 0.1, ease: "power2.in" }}, Math.max(s + 0.13, e - 0.1));
        tl.set(sel, {{ opacity: 0, visibility: "hidden" }}, e);
      }}
{chr(10).join(cap_js)}
      tl.set({{}}, {{}}, {r3(TOTAL)});
      window.__timelines = window.__timelines || {{}};
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
""")
print(f"captions.html: {len(cap_html)} grupos (ref {ref})")
escrever_index(cfg, ref)  # inclui/remove o host do HUD
