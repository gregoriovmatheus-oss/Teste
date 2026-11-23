"""sfx-local.py: efeitos sintetizados localmente (sem API) para "E se a Terra tivesse dois sóis?".
Whoosh em cada corte; brilho dos sóis (f01), drone espacial (f02/f03), chiado de evaporação (f04), tom fraco (f05),
órbita (f06), coração e relógio (f07), eclipse (f08), trovões e chuva (f09), fótons (f10), cortina e bipe (f11),
tambores (f12), grilos da noite (f13). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
def chuva(d, a=0.35):
    n = int(SR * d); x = lp(rng.standard_normal(n), a) - lp(rng.standard_normal(n), 0.02) * 0.5
    return x / (np.abs(x).max() + 1e-9)
def batida():
    return np.concatenate([thud(55, 0.18), np.zeros(int(SR * 0.05)), thud(48, 0.25) * 0.7])
def tique(f=2400):
    n = int(SR * 0.03); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 220)
def drone(d, f=55):
    n = int(SR * d); k = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * k) + 0.5 * np.sin(2 * np.pi * f * 1.5 * k + 1) + 0.3 * np.sin(2 * np.pi * f * 2.01 * k)
    return s * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * k)) / 1.8
def trovao(d=2.2):
    n = int(SR * d); k = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 0.03) * np.exp(-k * 1.6) + lp(rng.standard_normal(n), 0.2) * np.exp(-k * 9) * 0.6
    return x / (np.abs(x).max() + 1e-9)
# f01: acorda, janela, revelação dos dois sóis
add(C['f01'] + 0.7, clique(0.1, 300), 0.3)
add(C['f01'] + 1.7, shimmer(2.2, True), 0.4)
add(C['f01'] + 1.8, env(thud(40, 2.0), 0.3, 1.4), 0.4)
add(C['f01'] + 3.0, tique(1800), 0.15); add(C['f01'] + 4.6, tique(1300), 0.15)
# f02/f03: espaço (drone grave) e estrelas cintilando
add(C['f02'], env(drone(6.2, 50), 0.6, 0.8), 0.25)
add(C['f02'] + 2.9, shimmer(1.4, True), 0.25)
add(C['f03'], env(drone(5.6, 62), 0.4, 0.8), 0.2)
r = np.random.default_rng(5)
for dt in np.sort(r.uniform(0.6, 3.4, 16)):
    add(C['f03'] + dt, tique(2600 + r.uniform(0, 2000)), 0.06)
add(C['f03'] + 3.8, shimmer(1.6, False), 0.3)
# f04: segundo sol acende, energia e oceanos evaporando (chiado crescente)
add(C['f04'] + 0.4, shimmer(1.4, True), 0.35)
add(C['f04'] + 3.2, env(thud(45, 1.4), 0.2, 1.0), 0.4)
add(C['f04'] + 4.5, env(agua(1.9, 0.45), 1.2, 0.4), 0.3)
# f05: tom fraco da anã vermelha
n = int(SR * 3.2); k = np.arange(n) / SR
add(C['f05'] + 1.4, env(np.sin(2 * np.pi * 330 * k) * (0.6 + 0.4 * np.sin(2 * np.pi * 2 * k)), 0.6, 1.0), 0.08)
# f06: a Terra dá meia volta
add(C['f06'] + 2.7, whoosh(1.6), 0.35)
add(C['f06'] + 4.8, shimmer(1.2, True), 0.25)
# f07: insônia: relógio e coração acelerando
for i in range(12):
    add(C['f07'] + 0.2 + i * 0.5, tique(1500), 0.12)
for i in range(6):
    add(C['f07'] + 4.5 + i * 0.36, batida(), 0.45)
# f08: eclipse: grave que cresce e baque no alinhamento
add(C['f08'] + 2.6, env(drone(2.6, 45), 1.4, 0.3), 0.3)
add(C['f08'] + 5.1, thud(38, 1.4), 0.6)
add(C['f08'] + 5.1, shimmer(1.0, False), 0.25)
# f09: vento, trovões e chuva
add(C['f09'] + 3.6, env(agua(2.6, 0.08), 1.0, 0.3), 0.3)
add(C['f09'] + 5.05, trovao(1.2), 0.75); add(C['f09'] + 5.75, trovao(0.6), 0.6)
add(C['f09'] + 4.7, env(chuva(1.6), 0.4, 0.3), 0.35)
# f10: farfalhar e fótons vermelhos
add(C['f10'] + 0.2, env(agua(6.0, 0.3), 0.8, 0.8), 0.07)
add(C['f10'] + 3.0, shimmer(1.2, False), 0.2)
for i in range(14):
    add(C['f10'] + 4.75 + i * 0.12, tique(900 + i * 40), 0.08)
# f11: cortina fechando e bipe do relógio
add(C['f11'] + 0.85, env(agua(1.1, 0.35), 0.2, 0.4), 0.3)
add(C['f11'] + 1.95, clique(0.12, 140), 0.4)
add(C['f11'] + 2.34, tique(2000), 0.25); add(C['f11'] + 2.5, tique(2000), 0.25)
# f12: tambores e fogo
for i in range(8):
    add(C['f12'] + 0.15 + i * 0.6, thud(62 if i % 2 else 48, 0.4), 0.45)
add(C['f12'] + 2.4, whoosh(1.2), 0.3)
add(C['f12'], env(agua(5.0, 0.5), 0.4, 0.6), 0.06)
# f13: os sóis se põem, a noite chega (grilos)
add(C['f13'] + 0.1, shimmer(2.2, False), 0.25)
for i in range(40):
    add(C['f13'] + 2.0 + i * 0.09, tique(4200 + 300 * (i % 3)), 0.04 * (1 if i % 4 < 3 else 0))

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
