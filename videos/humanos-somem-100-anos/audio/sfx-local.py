"""sfx-local.py: efeitos sintetizados localmente (sem API). Whoosh em cada corte, "puf" nas transformações de f01,
batida grave no carro de f02 e na colisão de f03. Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
for t0 in [2.2, 2.45, 2.6, 2.35, 2.75, 2.5, 2.9, 3.0]:
    add(t0 + 0.12, puf(), 0.5)
f02 = next(c for c in v['cenas'] if c['id'] == 'f02')['inicio']; K02 = (v['cenas'][1]['fim'] - f02) / 6.94
add(f02 + 4.0 * K02, thud(), 0.7)
f03 = next(c for c in v['cenas'] if c['id'] == 'f03')['inicio']
add(f03 + 2.7, thud(), 0.6)
out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
