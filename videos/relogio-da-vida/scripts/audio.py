#!/usr/bin/env python3
"""audio.py — narração (ElevenLabs with-timestamps) + palavras.json + efeitos sonoros.

Rode de dentro de videos/<slug>/. GASTA CRÉDITOS: confira antes com --dry-run.
  python3 scripts/audio.py --dry-run                 mostra as chamadas, não chama nada
  python3 scripts/audio.py                           narração (SCRIPT.md) + efeitos (video.json "sfx")
  python3 scripts/audio.py --alvo 64                 ajusta a narração para 64 s com atempo (0,5x a 2x)
  python3 scripts/audio.py --so-tempo --alvo 62      reaplica o atempo na narração bruta já gerada (grátis)
  python3 scripts/audio.py --so-sfx [--sfx lista.json] [--forcar]

Narração: texto depois da primeira linha "---" de SCRIPT.md (linhas com # são ignoradas).
Voz premade nPczCjzI2devNBz1zQrb, modelo eleven_v4, idioma pt, velocidade 1.1.
A chave da API é injetada pelo proxy: este script não envia cabeçalho de chave.
Plano grátis: sem API de música e sem vozes da biblioteca (só premade). Trilha: use um efeito longo em loop.

Saídas: audio/narracao-bruta.mp3, audio/alinhamento.json, assets/audio/narracao.mp3, audio/palavras.json
  ([{id, text, start, end}] já no tempo final) e assets/audio/<nome>.mp3 para cada efeito.
Efeitos: [{"nome": "whoosh", "prompt": "fast cinematic whoosh", "duracao": 2.5, "em": 0.3, "volume": 0.7}]
  ("em" pode ser lista; é usado por cenas.py no index.html).
"""
import argparse
import base64
import json
import os
import re
import shutil
import ssl
import subprocess
import sys
import urllib.error
import urllib.request

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import ler_video, p, duracao_midia  # noqa: E402

API = "https://api.elevenlabs.io"
VOZ = "nPczCjzI2devNBz1zQrb"
MODELO = "eleven_v4"

ap = argparse.ArgumentParser()
ap.add_argument("--dry-run", action="store_true")
ap.add_argument("--alvo", type=float, help="duração final da narração em segundos (atempo)")
ap.add_argument("--so-tempo", action="store_true", help="só reaplica atempo na narração bruta")
ap.add_argument("--so-sfx", action="store_true")
ap.add_argument("--so-narracao", action="store_true")
ap.add_argument("--sfx", help="JSON com a lista de efeitos (padrão: video.json sfx)")
ap.add_argument("--forcar", action="store_true", help="regera efeitos que já existem")
ap.add_argument("--voz", default=VOZ)
ap.add_argument("--velocidade", type=float, default=1.1)
a = ap.parse_args()

CTX = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE") or None)


def post(caminho, corpo, query=""):
    url = API + caminho + query
    if a.dry_run:
        print(f"[dry-run] POST {url}\n{json.dumps(corpo, ensure_ascii=False, indent=2)[:1200]}")
        return None
    req = urllib.request.Request(url, data=json.dumps(corpo).encode(), method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=300) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")[:500]
        dica = " (plano grátis? só vozes premade, sem música)" if e.code in (401, 402, 403) else ""
        sys.exit(f"ElevenLabs {e.code}{dica}: {msg}")


def texto_roteiro():
    src = open(p("SCRIPT.md"), encoding="utf-8").read()
    partes = re.split(r"^---\s*$", src, maxsplit=1, flags=re.M)
    corpo = partes[1] if len(partes) > 1 else src
    linhas = [l for l in corpo.splitlines() if not l.lstrip().startswith(("#", ">", "<!--"))]
    txt = re.sub(r"\n{3,}", "\n\n", "\n".join(linhas)).strip()
    return re.sub(r"\*\*?|__", "", txt)


def palavras(al, fator=1.0):
    ws, cur, ini, fim = [], "", None, None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                ws.append((cur, ini, fim))
            cur, ini = "", None
            continue
        if ini is None:
            ini = s
        cur += ch
        fim = e
    if cur:
        ws.append((cur, ini, fim))
    return [{"id": f"w{i}", "text": t, "start": round(s / fator, 3), "end": round(e / fator, 3)} for i, (t, s, e) in enumerate(ws)]


def aplicar_tempo():
    bruta = p("audio/narracao-bruta.mp3")
    al = json.load(open(p("audio/alinhamento.json"), encoding="utf-8"))
    os.makedirs(p("assets/audio"), exist_ok=True)
    fator = 1.0
    if a.alvo:
        dur = duracao_midia(bruta)
        fator = dur / a.alvo
        if not 0.5 <= fator <= 2.0:
            sys.exit(f"atempo {fator:.3f} fora de 0,5-2,0 (bruta {dur:.2f} s, alvo {a.alvo} s): ajuste o roteiro")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", bruta, "-filter:a", f"atempo={fator:.5f}",
                        "-b:a", "128k", p("assets/audio/narracao.mp3")], check=True)
        print(f"atempo {fator:.4f}: {dur:.2f} s -> {a.alvo:.2f} s")
    else:
        shutil.copy(bruta, p("assets/audio/narracao.mp3"))
    ws = palavras(al, fator)
    json.dump(ws, open(p("audio/palavras.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"audio/palavras.json: {len(ws)} palavras, última termina em {ws[-1]['end']} s")


def narracao():
    txt = texto_roteiro()
    n = len(txt.split())
    print(f"roteiro: {n} palavras (~{n / 2.5:.0f} s a 2,5 palavras/s)")
    corpo = {"text": txt, "model_id": MODELO, "language_code": "pt", "voice_settings": {"speed": a.velocidade}}
    raw = post(f"/v1/text-to-speech/{a.voz}/with-timestamps", corpo, "?output_format=mp3_44100_128")
    if raw is None:
        return
    r = json.loads(raw)
    os.makedirs(p("audio"), exist_ok=True)
    open(p("audio/narracao-bruta.mp3"), "wb").write(base64.b64decode(r["audio_base64"]))
    json.dump(r.get("alignment") or r["normalized_alignment"], open(p("audio/alinhamento.json"), "w", encoding="utf-8"))
    aplicar_tempo()


def efeitos():
    lista = json.load(open(a.sfx, encoding="utf-8")) if a.sfx else ler_video().get("sfx", [])
    os.makedirs(p("assets/audio"), exist_ok=True)
    for s in lista:
        alvo = p("assets/audio", s["nome"] + ".mp3")
        if os.path.exists(alvo) and not a.forcar:
            print(f"já existe: {s['nome']}.mp3 (use --forcar)")
            continue
        corpo = {"text": s["prompt"], "prompt_influence": s.get("influencia", 0.5)}
        if s.get("duracao"):
            corpo["duration_seconds"] = s["duracao"]
        raw = post("/v1/sound-generation", corpo)
        if raw is not None:
            open(alvo, "wb").write(raw)
            print(f"efeito: {s['nome']}.mp3")


if a.so_tempo:
    aplicar_tempo()
else:
    if not a.so_sfx:
        narracao()
    if not a.so_narracao:
        efeitos()
