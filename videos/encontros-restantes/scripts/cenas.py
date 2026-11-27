#!/usr/bin/env python3
"""cenas.py — tabela de cenas (início/fim) a partir de palavras.json e regenera index.html.

Rode de dentro de videos/<slug>/:
  python3 scripts/cenas.py                        usa cenas[].palavra de video.json
  python3 scripts/cenas.py "Por" "Primeiro:" ...  primeira(s) palavra(s) de cada cena, na ordem
  python3 scripts/cenas.py --criar                cria compositions/fNN.html que faltam (modelo do preset)

Cada cena começa em (início da palavra − --antes) e termina onde a próxima começa. A primeira começa em 0.
A última termina em video.json "duracao_fixa" ou na última palavra + --cauda.
Sem audio/palavras.json, usa os inicio/fim que já estão em video.json.
Escreve video.json (cenas, duracao), index.html e imprime a tabela.
"""
import argparse
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import ler_video, salvar_video, ler_palavras, norm, escrever_index, preset, p, r3  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("primeiras", nargs="*", help="primeira(s) palavra(s) de cada cena")
ap.add_argument("--antes", type=float, default=0.1, help="corte antes da palavra (s)")
ap.add_argument("--cauda", type=float, default=0.9, help="respiro depois da última palavra (s)")
ap.add_argument("--criar", action="store_true", help="cria as cenas que faltam a partir do modelo")
ap.add_argument("--ref", help="R01, R02... (padrão: video.json)")
a = ap.parse_args()

cfg = ler_video()
if a.ref:
    cfg["ref"] = a.ref
cenas = cfg.setdefault("cenas", [])
if a.primeiras:
    for i, w in enumerate(a.primeiras):
        if i >= len(cenas):
            cenas.append({"id": f"f{i + 1:02d}"})
        cenas[i]["palavra"] = w
    del cenas[len(a.primeiras):]

ws = ler_palavras()
if ws:
    toks = [norm(w["text"]) for w in ws]
    i0 = 0
    for k, c in enumerate(cenas):
        alvo = [norm(x) for x in c.get("palavra", "").split()]
        if not alvo:
            sys.exit(f'cena {c["id"]} sem "palavra"')
        achou = next((i for i in range(i0, len(ws)) if toks[i:i + len(alvo)] == alvo), None)
        if achou is None:
            sys.exit(f'"{c["palavra"]}" (cena {c["id"]}) não aparece em palavras.json depois da palavra {i0}')
        c["inicio"] = 0 if k == 0 else r3(round(ws[achou]["start"] - a.antes, 2))
        c["_w"] = achou
        i0 = achou + 1
    fim = cfg.get("duracao_fixa") or r3(round(ws[-1]["end"] + a.cauda, 2))
    for k, c in enumerate(cenas):
        c["fim"] = cenas[k + 1]["inicio"] if k + 1 < len(cenas) else fim
    cfg["duracao"] = fim
else:
    print("aviso: sem audio/palavras.json, usando os tempos de video.json", file=sys.stderr)
    cfg["duracao"] = cfg.get("duracao_fixa") or cenas[-1]["fim"]

# tabela
print("| Cena | Início | Fim | Dur | Primeira palavra |")
print("| --- | --- | --- | --- | --- |")
for c in cenas:
    print(f'| {c["id"]} | {c["inicio"]} | {c["fim"]} | {r3(c["fim"] - c["inicio"])} | {c.get("palavra", "")} |')
    c.pop("_w", None)
print(f'Total: {cfg["duracao"]} s')

# cenas que faltam (ou ainda iguais ao modelo, quando a ref muda)
ref, P = preset(cfg)
if a.criar:
    modelo = open(p("modelos", "cena-2d.html" if P["modo"] == "2d" else "cena-3d.html"), encoding="utf-8").read()
    for c in cenas:
        alvo = p("compositions", c["id"] + ".html")
        if os.path.exists(alvo) and not open(alvo, encoding="utf-8").read().startswith("<!-- Modelo de cena"):
            continue
        dur = r3(c["fim"] - c["inicio"])
        open(alvo, "w", encoding="utf-8").write(modelo.replace("__ID__", c["id"]).replace("__DUR__", str(dur)))
        print(f"criada: compositions/{c['id']}.html ({P['modo']}, {dur} s)")
for c in cenas:
    if not os.path.exists(p("compositions", c["id"] + ".html")):
        print(f"aviso: compositions/{c['id']}.html não existe (use --criar)", file=sys.stderr)

hud = cfg.get("hud")
if hud and hud.get("fim") and hud["fim"] > cfg["duracao"]:
    hud["fim"] = cfg["duracao"]
salvar_video(cfg)
escrever_index(cfg)
print("index.html e video.json atualizados. Depois: python3 scripts/gera-hud-legendas.py")
