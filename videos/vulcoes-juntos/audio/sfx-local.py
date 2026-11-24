"""sfx-local.py: efeitos sintetizados localmente (sem API) para "E se todos os vulcões entrassem em erupção ao mesmo tempo?".
Whoosh em cada corte; ronco do chão e explosões (f01), contador e estouro (f02), fuga (f03), coluna (f04), vento de cinza (f05),
Tambora (f06), frio (f07), mercado (f08), turbina (f09), telhado (f10), estufa (f11), chuva e sol (f12), manhã (f13). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
import json, numpy as np, wave
SR = 48000
v = json.load(open('video.json')); DUR = v['duracao']
out = np.zeros(int(SR * (DUR + 2)))
rng = np.random.default_rng(7)
C = {c['id']: c['inicio'] for c in v['cenas']}
def lp(x, a):  # passa-baixa de 1 polo
    y = np.empty_like(x); acc = 0.0
    for i, s in enumerate(x): acc += a * (s - acc); y[i] = acc
    return y
def add(t, sig, g):
    i = int(t * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i] * g
def whoosh(d=0.55):
    n = int(SR * d); x = rng.standard_normal(n); k = np.linspace(0, 1, n)
    a = 0.02 + 0.25 * np.sin(np.pi * k) ** 2
    y = np.empty(n); acc = 0.0; b2 = 0.0
    for i in range(n): acc += a[i] * (x[i] - acc); b2 += a[i] * (acc - b2); y[i] = acc - b2 * 0.6
    return y * np.sin(np.pi * k) ** 1.5 / (np.abs(y).max() + 1e-9)
def thud(f0=70, d=0.6):
    n = int(SR * d); k = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(f0 * np.exp(-k * 5) + f0 * 0.55) / SR) * np.exp(-k * 7)
    nz = lp(rng.standard_normal(n), 0.06) * np.exp(-k * 12)
    return (tone + nz * 1.5) / 2
def shimmer(d=1.6, sobe=True):  # brilho: parciais agudas subindo + ar
    n = int(SR * d); k = np.linspace(0, 1, n); s = np.zeros(n)
    for f in [880, 1320, 1760, 2640, 3520]:
        fr = f * (1 + (0.35 * k if sobe else 0.35 * (1 - k)))
        s += np.sin(2 * np.pi * np.cumsum(fr) / SR + f) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * k + f))
    env = np.sin(np.pi * k) ** 1.2
    air = lp(rng.standard_normal(n), 0.4) * 0.6
    return (s / 5 + air) * env
def clique(d=0.12, f=180):
    n = int(SR * d); k = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * k) * np.exp(-k * 45) + lp(rng.standard_normal(n), 0.5) * np.exp(-k * 80) * 0.5)
def zumbido_cai(d=2.8):  # hum de 60 Hz descendo e morrendo
    n = int(SR * d); k = np.linspace(0, 1, n)
    f = 60 * (1 - 0.6 * k ** 2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * (1 - k) ** 1.5 * 0.7
def agua(d, a=0.12):  # chiado de água correndo
    n = int(SR * d); x = lp(rng.standard_normal(n), a)
    return x / (np.abs(x).max() + 1e-9)
def estalo():
    n = int(SR * 0.07); k = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-k * 120)
def uivo(d=1.6):
    n = int(SR * d); k = np.linspace(0, 1, n)
    f = 420 + 260 * np.sin(np.pi * np.clip(k * 1.3, 0, 1)) - 120 * k
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * np.sin(np.pi * k) ** 0.8 * 0.6
def env(sig, a=0.3, r=0.6):
    n = len(sig); e = np.ones(n); na, nr = int(SR * a), int(SR * r)
    e[:na] = np.linspace(0, 1, na); e[n - nr:] = np.linspace(1, 0, nr); return sig * e

# cortes
for c in v['cenas'][1:]:
    add(c['inicio'] - 0.38, whoosh(), 0.5)
def chuva(d, a=0.35):  # chiado de chuva (ruído rosado claro)
    n = int(SR * d); x = lp(rng.standard_normal(n), a) - lp(rng.standard_normal(n), 0.02) * 0.5
    return x / (np.abs(x).max() + 1e-9)
def estalar():  # estalo de dedos: clique seco + corpo curto
    n = int(SR * 0.09); k = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-k * 160) + np.sin(2 * np.pi * 1900 * k) * np.exp(-k * 90) * 0.6
def batida():  # tum-tum do coração
    return np.concatenate([thud(55, 0.18), np.zeros(int(SR * 0.05)), thud(48, 0.25) * 0.7])
def tique(f=2400):
    n = int(SR * 0.03); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 220)
def ronco(d, f0=32):  # tremor de terra: grave pulsante + chiado de pedra
    n = int(SR * d); k = np.arange(n) / SR
    s = np.sin(2 * np.pi * f0 * k + 3 * np.sin(2 * np.pi * 1.3 * k)) * (0.6 + 0.4 * np.sin(2 * np.pi * 5.7 * k))
    return s * 0.7 + lp(rng.standard_normal(n), 0.02) * 2.5
def boom(d=2.2, f0=38):
    return env(thud(f0, d), 0.005, d * 0.7) + env(lp(rng.standard_normal(int(SR * d)), 0.03) * np.exp(-np.arange(int(SR * d)) / SR * 2.2) * 2, 0.005, 0.3)
def tom_cai(d, f0, f1):
    n = int(SR * d); k = np.linspace(0, 1, n); f = f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - k) ** 0.5 * np.minimum(1, k * 20)
def crepita(d, dens=40):  # fogo / derretendo
    n = int(SR * d); x = np.zeros(n); r = np.random.default_rng(11)
    for t0 in r.uniform(0, d, int(d * dens)): i = int(t0 * SR); m = min(n, i + 200); x[i:m] += r.standard_normal(m - i) * np.exp(-np.arange(m - i) / 30) * r.uniform(0.2, 1)
    return x
def piu(f=3200):  # passarinho
    n = int(SR * 0.12); k = np.linspace(0, 1, n)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.35 * np.sin(np.pi * k))) / SR) * np.sin(np.pi * k) ** 2
# f01: o chão ronca, copo tilinta; um vulcão ao longe em "vulcão"; todos em "Todos"
add(C['f01'], env(ronco(5.9), 0.2, 0.4) * np.concatenate([np.linspace(0.5, 1, int(SR * 2.0)), np.ones(int(SR * 3.9))]), 0.35)
for i in range(14): add(C['f01'] + 0.4 + i * 0.37, tique(4200 + 300 * (i % 3)), 0.05)
add(C['f01'] + 3.0, boom(2.4, 34), 0.6)
for i, dt in enumerate([3.85, 4.0, 4.12, 4.3, 4.45]): add(C['f01'] + dt, boom(1.6, 40 + i * 4), 0.35)
# f02: o contador sobe (tiques acelerando) e todos estouram em câmera lenta
for dt in 1.35 + 2.05 * np.sqrt(np.linspace(0, 1, 34)): add(C['f02'] + dt, tique(2600), 0.07)
add(C['f02'] + 4.3, boom(2.6, 30), 0.7); add(C['f02'] + 4.35, shimmer(1.9, False), 0.3); add(C['f02'] + 4.0, whoosh(0.9), 0.4)
# f03: passos correndo, fogo crepitando, pedras caindo
for i in range(14): add(C['f03'] + 0.1 + i * 0.36, clique(0.07, 140), 0.25)
add(C['f03'], env(crepita(5.3), 0.3, 0.5), 0.12); add(C['f03'], env(ronco(5.3, 28), 0.3, 0.5), 0.2)
for dt in [3.8, 4.05, 4.4, 4.7, 4.95]: add(C['f03'] + dt, thud(90, 0.35), 0.4)
# f04: rugido da coluna subindo
n = int(SR * 4.6); k = np.linspace(0, 1, n); x = rng.standard_normal(n); y = np.empty(n); acc = 0.0
for i in range(n): acc += (0.01 + 0.08 * k[i]) * (x[i] - acc); y[i] = acc
add(C['f04'] + 0.2, env(y / (np.abs(y).max() + 1e-9), 0.4, 0.6), 0.45); add(C['f04'] + 0.2, env(ronco(4.6, 26), 0.3, 0.6), 0.25)
# f05: vento abafado de cinza
add(C['f05'], env(agua(5.5, 0.03), 0.6, 0.6), 0.2); add(C['f05'] + 2.6, env(tom_cai(2.6, 140, 90), 0.3, 0.8), 0.15)
# f06: Tambora explode em "vulcão"; o véu se espalha
add(C['f06'] + 2.05, boom(2.2, 32), 0.6); add(C['f06'] + 2.4, shimmer(2.5, False), 0.25)
# f07: vento frio, termômetro desce
add(C['f07'], env(agua(6.7, 0.08), 0.6, 0.8), 0.15); add(C['f07'] + 3.05, env(tom_cai(0.9, 1400, 500), 0.02, 0.3), 0.18)
add(C['f07'] + 4.35, shimmer(2.0, False), 0.18)
# f08: zumbido da lâmpada, falhas, passos lentos
add(C['f08'], env(zumbido_cai(6.5) * 0 + np.sin(2 * np.pi * 120 * np.arange(int(SR * 6.5)) / SR) * 0.4, 0.3, 0.5), 0.06)
for dt in np.arange(0.3, 6.4, 0.55): add(C['f08'] + dt, clique(0.07, 220), 0.12)
for dt in [1.1, 2.4, 2.5, 4.0]: add(C['f08'] + dt, estalo(), 0.15)
# f09: turbina desacelera, cinza derretendo, pátio parado
add(C['f09'], env(tom_cai(3.2, 900, 260), 0.05, 0.6), 0.2); add(C['f09'], env(agua(3.2, 0.25), 0.05, 0.8), 0.15)
add(C['f09'] + 2.0, env(crepita(1.3, 90), 0.1, 0.4), 0.25); add(C['f09'] + 5.55, thud(60, 0.5), 0.35)
# f10: telhado range e desaba; passos; água
add(C['f10'] + 0.4, env(tom_cai(0.8, 180, 120) * (1 + 0.5 * np.sin(np.linspace(0, 40, int(SR * 0.8)))), 0.1, 0.2), 0.2)
add(C['f10'] + 1.2, boom(1.8, 55), 0.6); add(C['f10'] + 1.25, env(crepita(0.9, 120), 0.01, 0.5), 0.3)
for dt in np.arange(2.6, 6.0, 0.6): add(C['f10'] + dt, clique(0.07, 160), 0.15)
add(C['f10'] + 4.2, env(agua(1.2, 0.2), 0.2, 0.6), 0.15)
# f11: interruptores e as luzes de cultivo acendendo
for i in range(7): add(C['f11'] + 2.9 + i * 0.07, clique(0.06, 900), 0.18)
add(C['f11'] + 3.0, env(np.sin(2 * np.pi * 100 * np.arange(int(SR * 3.4)) / SR) * 0.5, 0.2, 0.6), 0.06); add(C['f11'] + 4.1, shimmer(0.9, True), 0.15)
# f12: chuva lavando o céu, o sol voltando
add(C['f12'] + 1.2, env(chuva(3.4), 0.4, 1.0), 0.35); add(C['f12'] + 2.9, shimmer(2.2, True), 0.3)
# f13: manhã calma, passarinhos, brilho final
for dt in [0.6, 0.78, 2.2, 2.35, 4.6]: add(C['f13'] + dt, piu(3000 + 400 * (dt % 1)), 0.08)
add(C['f13'] + 3.0, shimmer(3.0, True), 0.22)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
