"""sfx-local.py: efeitos sintetizados localmente (sem API) para "E se o Sol apagasse por 7 dias?".
Whoosh em cada corte; queda grave quando o Sol apaga (f01); ronco da escuridão chegando (f04); tom da Lua apagando (f05);
"ping" do último reflexo de Júpiter (f06); estalos dos postes (f08); pios e coruja (f10); Sol reacendendo e luz chegando (f13).
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
I = {c['id']: c['inicio'] for c in v['cenas']}
def tom(f0, f1, d, dec, ruido=0.0):
    n = int(SR * d); k = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (k / d)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * dec)
    if ruido: y += lp(rng.standard_normal(n), 0.05) * np.exp(-k * dec) * ruido
    a = np.minimum(1, k / 0.01); return y * a
def swell(d, f0=60, f1=120):  # sobe devagar e corta
    n = int(SR * d); k = np.linspace(0, 1, n)
    y = np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * k) / SR) * k ** 2 + lp(rng.standard_normal(n), 0.03) * k ** 2 * 1.5
    return y / (np.abs(y).max() + 1e-9)
def rumble(d):
    n = int(SR * d); k = np.linspace(0, 1, n)
    y = lp(rng.standard_normal(n), 0.012) * np.sin(np.pi * k) ** 1.2
    return y / (np.abs(y).max() + 1e-9)
def clique():
    n = int(SR * 0.05); k = np.arange(n) / SR
    return (rng.standard_normal(n) * np.exp(-k * 160) * 0.6 + np.sin(2 * np.pi * 120 * k) * np.exp(-k * 40) * 0.5)
# f01: o Sol apaga (3,57 s): sobe, e cai num grave longo
add(I['f01'] + 2.6, swell(0.95, 80, 220), 0.35)
add(I['f01'] + 3.55, tom(90, 32, 2.2, 1.6, 1.2), 0.9)
# f04: a escuridão varre a cidade
add(I['f04'] + 0.3, rumble(2.4), 0.5)
# f05: a Lua apaga (tom descendo)
add(I['f05'] + 0.6, tom(520, 260, 1.2, 2.5), 0.18)
# f06: o último reflexo de Júpiter chega à Terra
add(I['f06'] + 4.5, tom(1400, 1350, 0.9, 5), 0.22)
# f08: postes acendendo (estalos em sequência)
for k in range(10): add(I['f08'] + 0.85 + k * 0.1, clique(), 0.28)
# f10: pios das aves e a coruja
for k, t0 in enumerate([0.6, 1.1, 1.5, 2.2]): add(I['f10'] + t0, tom(2600 + 300 * k, 3600 + 200 * k, 0.12, 18), 0.15)
for t0 in [3.35, 3.75]: add(I['f10'] + t0, tom(390, 360, 0.35, 5), 0.3)
# f13: o Sol reacende e a luz chega à Terra
add(I['f13'] + 0.1, swell(0.6, 70, 260), 0.45)
add(I['f13'] + 0.7, tom(120, 60, 1.5, 2.0, 0.8), 0.5)
add(I['f13'] + 3.45, swell(0.2, 300, 900), 0.25)
add(I['f13'] + 3.6, tom(880, 870, 1.8, 2.2), 0.2)
out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
