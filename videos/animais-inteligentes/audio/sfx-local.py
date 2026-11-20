"""sfx-local.py: efeitos sintetizados localmente (sem API) para "animais inteligentes".
Whoosh em cada corte; arame (f01), pulso neural (f02), neurônios acendendo (f03), encaixe das peças (f04),
assobios dos golfinhos (f05), braços do polvo (f06), pedra riscada (f07), blocos (f09), galinhas (f10), respiros finais. Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
r = np.random.default_rng(3)
# f01: arame dobrando (estalinhos metálicos) e o cesto subindo
for dt in [1.3, 1.6, 1.9, 2.2]:
    add(C['f01'] + dt, clique(0.06, 2400 + r.uniform(0, 600)), 0.18)
add(C['f01'] + 3.0, clique(0.08, 1800), 0.25)
add(C['f01'] + 3.4, shimmer(1.2, True), 0.18)
# f02: o despertar: pulso neural (grave + brilho subindo)
add(C['f02'] + 2.35, thud(45, 1.4), 0.5)
add(C['f02'] + 2.35, shimmer(2.0, True), 0.35)
# f03: neurônios acendendo (chuva de cliques) e o cerebelo virando "anomalia"
for dt in np.sort(r.uniform(3.1, 4.4, 30)):
    add(C['f03'] + dt, clique(0.03, 2000 + r.uniform(0, 2500)), 0.06)
for dt in np.sort(r.uniform(5.0, 6.3, 16)):
    add(C['f03'] + dt, clique(0.03, 2000 + r.uniform(0, 2500)), 0.06)
add(C['f03'] + 7.1, thud(60, 0.9), 0.4)
# f04: cérebro do corvo (brilho) e as 3 peças se encaixando
add(C['f04'] + 1.0, shimmer(1.6, True), 0.2)
add(C['f04'] + 5.6, clique(0.1, 700), 0.45)
add(C['f04'] + 6.1, clique(0.1, 600), 0.45)
# f05: água e os dois assobios-assinatura
add(C['f05'], env(agua(5.0, 0.03), 0.4, 0.6), 0.12)
def assobio(d, f0, f1, mod):
    n = int(SR * d); k = np.linspace(0, 1, n)
    f = f0 + (f1 - f0) * k + 900 * np.sin(2 * np.pi * mod * k)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * k) ** 0.6 * 0.5
add(C['f05'] + 1.7, assobio(1.1, 6000, 9000, 2.5), 0.12)
add(C['f05'] + 3.0, assobio(1.0, 8500, 5500, 1.5), 0.1)
# f06: polvo: água grave e pulsos nos braços
add(C['f06'], env(agua(6.8, 0.02), 0.4, 0.6), 0.12)
add(C['f06'] + 2.48, shimmer(1.4, True), 0.22)
for i in range(8):
    add(C['f06'] + 4.6 + i * 0.25, clique(0.08, 300 + i * 60), 0.2)
# f07: riscando a pedra e a vila acendendo
for dt in np.arange(0.3, 3.3, 0.16):
    add(C['f07'] + dt + r.uniform(0, 0.05), estalo(), 0.08)
add(C['f07'] + 3.3, shimmer(1.0, True), 0.22)
# f08: cidade ao longe (rumor grave)
add(C['f08'], env(agua(4.2, 0.01), 0.8, 0.8), 0.2)
# f09: blocos caindo
for i in range(60):
    add(C['f09'] + 0.47 + i / 60 * 2.6 + 0.4, clique(0.05, 160), 0.1)
for i in range(36):
    add(C['f09'] + 3.85 + i / 36 * 1.2 + 0.4, clique(0.05, 220), 0.1)
for i in range(4):
    add(C['f09'] + 7.35 + i * 0.12 + 0.4, clique(0.08, 300), 0.3)
# f10: galinhas (cacarejo sintetizado) e o contador
def cacarejo():
    n = int(SR * 0.12); k = np.arange(n) / SR
    return np.sin(2 * np.pi * (700 + 500 * np.exp(-k * 30)) * k) * np.exp(-k * 25) * (1 + 0.5 * np.sin(2 * np.pi * 60 * k))
for dt in np.sort(r.uniform(0.1, 5.2, 18)):
    add(C['f10'] + dt, cacarejo(), 0.08)
add(C['f10'] + 3.3, thud(70, 0.5), 0.3)
# f11: chicotes entre os três lugares e o "direitos"
add(C['f11'] + 0.55, whoosh(0.4), 0.35)
add(C['f11'] + 1.2, whoosh(0.4), 0.35)
add(C['f11'] + 2.7, thud(55, 1.0), 0.4)
# f12: o cão hesita (respiro grave no "Ou não")
add(C['f12'] + 4.95, env(thud(40, 1.5), 0.05, 1.0), 0.4)
# f13: o corvo encara a câmera e respiro final
add(C['f13'] + 3.0, whoosh(0.8), 0.25)
add(C['f13'] + 3.3, env(thud(38, 3.5), 0.05, 2.5), 0.45)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
