"""sfx-local.py: efeitos sintetizados localmente (sem API) para "E se a Terra tivesse anéis?".
Whoosh em cada corte; vento (f01/f04/f13), brilho do anel, Saturno e pedras (f03), grilos (f05), nascer do sol (f06),
sombra (f07), vento frio (f08), pedras/jato/foguete (f09), bipes e alarme (f10), rebobinar e contador (f11), crateras (f12).
Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
def tique(f=2400):
    n = int(SR * 0.03); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 220)
def vento(d, a=0.04):  # vento grave e contínuo
    n = int(SR * d); x = lp(rng.standard_normal(n), a); k = np.linspace(0, 1, n)
    return x / (np.abs(x).max() + 1e-9) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.35 * k * d))
def grilo():  # trinado curto de grilo
    n = int(SR * 0.12); k = np.arange(n) / SR
    return np.sin(2 * np.pi * 4300 * k) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * k))) * np.sin(np.pi * k / k[-1])
def ronco(d):  # motor de foguete: grave + ruído
    n = int(SR * d); k = np.linspace(0, 1, n)
    x = lp(rng.standard_normal(n), 0.03) * 3 + np.sin(2 * np.pi * np.cumsum(38 + 6 * k) / SR) * 0.4
    return x / (np.abs(x).max() + 1e-9)
# f01: vento no campo; brilho subindo quando o arco aparece inteiro
add(C['f01'], env(vento(4.7), 0.05, 0.4), 0.25)
add(C['f01'] + 1.7, shimmer(2.6, True), 0.3)
# f02: o anel se forma (brilho varrendo); marcas do equador e da altitude
add(C['f02'] + 0.15, shimmer(2.4, True), 0.32)
add(C['f02'] + 2.72, tique(1800), 0.3)
add(C['f02'] + 3.7, clique(0.1, 900), 0.25)
# f03: Saturno (grave), a régua dos 280 mil km, corte para as pedras de perto
add(C['f03'] + 0.2, env(thud(34, 2.4), 0.5, 1.6), 0.35)
add(C['f03'] + 1.27, tique(1600), 0.3)
add(C['f03'] + 3.25, whoosh(0.5), 0.4)
add(C['f03'] + 3.3, env(agua(2.6, 0.06), 0.4, 0.6), 0.15)
add(C['f03'] + 4.25, clique(0.1, 700), 0.25)
# f04: vento; a latitude "viaja" até o equador
add(C['f04'], env(vento(5.5), 0.3, 0.5), 0.25)
add(C['f04'] + 2.9, shimmer(1.8, False), 0.25)
# f05: grilos à noite e o brilho do anel
for i in range(14):
    add(C['f05'] + 0.2 + i * 0.37 + 0.05 * (i % 3), grilo(), 0.06)
add(C['f05'] + 1.9, shimmer(1.6, True), 0.2)
# f06: nascer do sol — onda subindo, grave quando o sol aparece, pássaros
add(C['f06'], env(shimmer(4.5, True), 1.2, 0.8), 0.35)
add(C['f06'] + 0.95, env(thud(40, 3.0), 0.8, 1.8), 0.4)
for dt in (1.9, 2.05, 2.7, 2.82, 3.6):
    add(C['f06'] + dt, tique(3200 + 400 * (dt % 1)), 0.12)
# f07: a sombra cai (grave), o inverno chega
add(C['f07'] + 1.75, env(thud(36, 2.2), 0.3, 1.5), 0.4)
add(C['f07'] + 2.6, shimmer(1.4, False), 0.2)
# f08: vento frio e neve
add(C['f08'], env(agua(4.6, 0.35), 0.4, 0.6), 0.14)
add(C['f08'], env(vento(4.6, 0.02), 0.4, 0.6), 0.25)
# f09: pedrinhas batendo, jato do satélite, ronco do foguete
r = np.random.default_rng(5)
for dt in np.sort(r.uniform(0.2, 5.3, 16)):
    add(C['f09'] + dt, clique(0.08, 300 + r.uniform(0, 600)), 0.12)
add(C['f09'] + 3.15, env(agua(1.1, 0.5), 0.05, 0.4), 0.3)
add(C['f09'] + 0.6, env(ronco(4.8), 0.8, 0.8), 0.25)
# f10: bipes da estação, alarme quando a trajetória cruza o anel
for i in range(4):
    add(C['f10'] + 1.45 + i * 0.35, tique(1200), 0.18)
for i in range(3):
    add(C['f10'] + 5.1 + i * 0.3, tique(880 if i % 2 else 660), 0.3)
# f11: rebobinando no tempo; contador até 466
add(C['f11'] + 0.1, whoosh(2.2)[::-1].copy(), 0.4)
for dt in 5.6 + 1.25 * np.sqrt(np.linspace(0, 1, 18)):
    add(C['f11'] + dt, tique(2000), 0.1)
add(C['f11'] + 6.85, thud(44, 1.2), 0.35)
# f12: uma batida por cratera; brilho na linha do antigo equador
for i in range(21):
    add(C['f12'] + 0.3 + i * 0.075, tique(1500), 0.1)
add(C['f12'] + 3.2, shimmer(1.2, True), 0.22)
# f13: vento; o arco acende de novo
add(C['f13'], env(vento(6.4), 0.3, 1.2), 0.22)
add(C['f13'] + 1.75, shimmer(2.6, True), 0.32)
add(C['f13'] + 4.2, env(thud(42, 2.0), 0.4, 1.5), 0.25)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
