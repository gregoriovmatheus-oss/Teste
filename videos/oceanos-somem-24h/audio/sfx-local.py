"""sfx-local.py: efeitos sintetizados localmente (sem API) para "oceanos somem 24 h".
Whoosh em cada corte + efeitos nas ações visíveis: água recuando (f01), ralo gigante (f02), descida (f04),
costura das dorsais (f05), Everest descendo (f06), vapor das fontes (f07), peixes se debatendo (f08),
tique do relógio acelerando (f09), evaporação parando (f10), chuva (f11), água voltando (f12), fundo vazio (f13).
Saída: assets/audio/sfx.wav (mono 48 kHz)."""
import json, numpy as np, wave
SR = 48000
v = json.load(open('video.json')); DUR = v['duracao']
out = np.zeros(int(SR * (DUR + 1)))
rng = np.random.default_rng(7)
I = {c['id']: c['inicio'] for c in v['cenas']}
def lp(x, a):  # passa-baixa de 1 polo
    y = np.empty_like(x); acc = 0.0
    for i, s in enumerate(x): acc += a * (s - acc); y[i] = acc
    return y
def add(t, sig, g):
    i = int(t * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i] * g
def env(n, ataque=0.1, queda=0.3):
    k = np.linspace(0, 1, n); return np.clip(k / ataque, 0, 1) * np.clip((1 - k) / queda, 0, 1)
def whoosh(d=0.55):
    n = int(SR * d); x = rng.standard_normal(n); k = np.linspace(0, 1, n)
    a = 0.02 + 0.25 * np.sin(np.pi * k) ** 2
    y = np.empty(n); acc = 0.0; b2 = 0.0
    for i in range(n): acc += a[i] * (x[i] - acc); b2 += a[i] * (acc - b2); y[i] = acc - b2 * 0.6
    return y * np.sin(np.pi * k) ** 1.5 / (np.abs(y).max() + 1e-9)
def ruido(d, a, at=0.1, q=0.3):  # ruído filtrado com envelope
    n = int(SR * d); y = lp(rng.standard_normal(n), a); return y / (np.abs(y).max() + 1e-9) * env(n, at, q)
def thud(f0=70, d=0.6):
    n = int(SR * d); k = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(f0 * np.exp(-k * 5) + f0 * 0.55) / SR) * np.exp(-k * 7)
    return (tone + lp(rng.standard_normal(n), 0.06) * np.exp(-k * 12) * 1.5) / 2
def tom(f0, f1, d, g=1.0):
    n = int(SR * d); k = np.linspace(0, 1, n)
    return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * k) / SR) * env(n, 0.05, 0.6) * g
def tique():
    n = int(SR * 0.03); k = np.arange(n) / SR; return np.sin(2 * np.pi * 2400 * k) * np.exp(-k * 260)
def tapa():
    n = int(SR * 0.09); k = np.arange(n) / SR; return lp(rng.standard_normal(n), 0.35) * np.exp(-k * 60)
for c in v['cenas'][1:]:
    add(c['inicio'] - 0.38, whoosh(), 0.55)
# f01: ondas e a água recuando (rugido crescente)
for t0 in (0.2, 1.6): add(t0, ruido(1.4, 0.08, 0.3, 0.6), 0.35)
add(I['f01'] + 2.8, ruido(2.6, 0.03, 0.5, 0.25), 0.8)
add(I['f01'] + 2.85, tom(90, 45, 2.4, 0.5), 0.6)
# f02: ralo gigante
add(I['f02'] + 0.1, ruido(4.3, 0.012, 0.3, 0.4), 0.9)
# f04: descida de 3.700 m (vento)
add(I['f04'] + 0.05, ruido(3.2, 0.05, 0.4, 0.4), 0.5)
# f05: as dorsais acendem
add(I['f05'] + 2.7, thud(55, 1.2), 0.7)
add(I['f05'] + 2.75, tom(110, 220, 1.8, 0.3), 0.4)
# f06: Everest desce na fossa
add(I['f06'] + 2.95, ruido(0.9, 0.05, 0.8, 0.1), 0.5)
add(I['f06'] + 3.85, thud(60, 0.9), 0.85)
# f07: vapor a 400 °C (chiado agudo)
n = int(SR * 4.9); x = rng.standard_normal(n); add(I['f07'] + 0.2, (x - lp(x, 0.3)) * env(n, 0.15, 0.3) * 0.5, 0.35)
# f08: peixes se debatendo
r = np.random.default_rng(3)
for k in range(16): add(I['f08'] + 0.4 + k * 0.33 + r.random() * 0.15, tapa(), 0.35)
# f09: tique do relógio acelerando
t = I['f09'] + 0.3; dt = 0.32
while t < I['f10'] - 0.3: add(t, tique(), 0.25); t += dt; dt = max(0.07, dt * 0.9)
# f10: a evaporação para (queda de tom)
add(I['f10'] + 5.83, tom(330, 70, 1.0, 0.6), 0.6)
# f11: chuva
add(I['f11'] + 0.05, ruido(5.6, 0.5, 0.15, 0.4) * 0.6, 0.45)
# f12: a água volta
add(I['f12'] + 0.3, ruido(2.4, 0.02, 0.6, 0.2), 0.95)
add(I['f12'] + 2.55, thud(50, 1.0), 0.6)
# f13: fundo vazio (zumbido grave) + batida final
add(I['f13'] + 0.1, tom(55, 52, 7.5, 0.5), 0.5)
add(I['f13'] + 4.74, thud(45, 1.6), 0.8)
out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
