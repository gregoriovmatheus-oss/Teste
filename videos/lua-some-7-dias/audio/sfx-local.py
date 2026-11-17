"""sfx-local.py: efeitos sintetizados localmente (sem API) para "E se a Lua desaparecesse por 7 dias?".
Whoosh em cada corte; brilho invertido quando a Lua some (f01); grave na cortina de escuridão (f03); ondas no time-lapse (f05);
borbulhas na desova (f06); arrancada dos leões (f07); brilho quando a Lua volta e ondas da maré (f10); anel do eclipse (f12).
Saída: assets/audio/sfx.wav (mono 48 kHz)."""
import json, numpy as np, wave
SR = 48000
v = json.load(open('video.json')); DUR = v['duracao']
out = np.zeros(int(SR * (DUR + 1)))
rng = np.random.default_rng(7)
def lp(x, a):  # passa-baixa de 1 polo
    y = np.empty_like(x); acc = 0.0
    for i, s in enumerate(x): acc += a * (s - acc); y[i] = acc
    return y
def add(t, sig, g):
    i = int(t * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i] * g
def whoosh(d=0.55):
    n = int(SR * d); x = rng.standard_normal(n); k = np.linspace(0, 1, n)
    a = 0.02 + 0.25 * np.sin(np.pi * k) ** 2  # filtro abre e fecha
    y = np.empty(n); acc = 0.0; b2 = 0.0
    for i in range(n): acc += a[i] * (x[i] - acc); b2 += a[i] * (acc - b2); y[i] = acc - b2 * 0.6
    env = np.sin(np.pi * k) ** 1.5 * np.where(k < 0.65, 1, 1)
    return y * env / (np.abs(y).max() + 1e-9)
def puf():
    n = int(SR * 0.22); k = np.arange(n) / SR
    f = 380 * np.exp(-k * 14) + 90
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 22)
    nz = lp(rng.standard_normal(n), 0.15) * np.exp(-k * 35) * 0.8
    return (tone + nz) / 1.6
def thud():
    n = int(SR * 0.6); k = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-k * 5) + 38) / SR) * np.exp(-k * 7)
    nz = lp(rng.standard_normal(n), 0.06) * np.exp(-k * 12)
    return (tone + nz * 1.5) / 2
for c in v['cenas'][1:]:
    add(c['inicio'] - 0.38, whoosh(), 0.55)
def ini(i): return next(c for c in v['cenas'] if c['id'] == i)['inicio']
def brilho(d=1.2, rev=False):  # cintilação aguda (sinos sintéticos)
    n = int(SR * d); k = np.arange(n) / SR; y = np.zeros(n)
    for f in [1320, 1760, 2217, 2640, 3520]:
        y += np.sin(2 * np.pi * f * k + f) * np.exp(-k * (3 + f / 900))
    y /= 5
    return y[::-1] * np.linspace(0, 1, n) ** 2 if rev else y
def swell(d=1.4):  # grave que cresce
    n = int(SR * d); k = np.linspace(0, 1, n)
    return lp(rng.standard_normal(n), 0.02) * 6 * np.sin(np.pi * k) ** 2 + np.sin(2 * np.pi * 48 * np.arange(n) / SR) * np.sin(np.pi * k) * 0.5
def onda(d=1.6):  # mar: ruído filtrado com envelope
    n = int(SR * d); k = np.linspace(0, 1, n)
    return lp(rng.standard_normal(n), 0.08) * 2.2 * np.sin(np.pi * k) ** 1.5
def bolhas(d=1.5, nb=26):
    n = int(SR * d); y = np.zeros(n)
    for _ in range(nb):
        i = int(rng.uniform(0, n - SR * 0.08)); m = int(SR * 0.06); kk = np.arange(m) / SR
        f = rng.uniform(500, 1400) * (1 + kk * 8)
        y[i:i + m] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kk * 60)
    return y / 3
add(ini('f01') + 2.95, brilho(0.35, rev=True), 0.5)   # Lua some (3,28 s)
add(ini('f01') + 3.28, thud(), 0.35)
add(ini('f03') + 2.0, swell(1.2), 0.5)                 # cortina de escuridão
for k in range(2): add(ini('f05') + 0.3 + k * 2.5, onda(1.8), 0.35)
add(ini('f06') + 3.3, bolhas(1.6, 40), 0.4)           # desova sincronizada
for k in range(5): add(ini('f06') + 5.0 + k * 0.33, bolhas(0.3, 4), 0.35)  # desova fora de hora
add(ini('f07') + 5.0, thud(), 0.55)                    # leões arrancam
add(ini('f10') + 1.05, brilho(1.4), 0.45)              # Lua reaparece
add(ini('f10') + 2.9, onda(1.9), 0.45)                 # maré volta
add(ini('f12') + 2.4, brilho(1.6), 0.35)               # anel do eclipse
out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
