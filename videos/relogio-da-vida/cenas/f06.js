/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 4.74} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 3.2, faixa: 1.0, desfoque: 22, bloom: 0.9, raios: 0.6 });
const { S, cam } = st;
LP.luz(st, "dramatica"); st.exposicao = 1.05;
const chao = new THREE.Mesh(new THREE.CircleGeometry(14, 40), LP.mat(0x1a1c22, 0.4)); chao.rotation.x = -Math.PI / 2; S.add(chao);
CI.ceu(S, { topo: 0x05070c, horizonte: 0x1a2030 });
// uma fileira de pessoas iguais sob a mesma "média"; a luz escolhe uma só e o relógio dela fica exato
const F = R.multidao(LP, S, [[-0.95, -0.45, 91, 0x4a5058], [-0.62, -0.95, 92, 0x5a4a44], [-0.32, -0.35, 93, 0x3e4a5a], [0.32, -0.4, 94, 0x52525a], [0.62, -0.95, 95, 0x4a4450], [0.95, -0.45, 96, 0x445048]]);
F.forEach((f) => (f.root.rotation.y = 0));
const eu = LP.pessoa({ seed: 77, feminina: true, roupa: "casaco", jaqueta: 0xb05a3a, pele: 0xc89070, cabelo: 0x2a1408, iris: 0x4a2c14 }); eu.root.position.set(0, 0, 0.15); S.add(eu.root);
const spot = new THREE.SpotLight(0xffe2c0, 0, 9, 0.32, 0.6, 1.2); spot.position.set(0, 4.5, 1.2); spot.target = eu.root; S.add(spot);
const h = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  R.andaMultidao(LP, F, t);
  const k = ease.inOutCubic(range(t, 2.2, 2.8));
  LP.ator(eu, t, { seed: 77, emocao: ["calmo", "surpresa", range(t, 2.4, 3.0)], olharPara: t > 3.2 ? cam.position : undefined, olharK: 0.6 });
  spot.intensity = 30 * k;
  eu.cab.getWorldPosition(h);
  const e = ease.inOutSine(range(t, 0, 4.74));
  R.mira(cam, v.set(lerp(0.3, 0.05, e), lerp(1.75, 1.6, e), lerp(5.2, 2.6, e)), h, lerp(720, 790, e)); LP.camMao(cam, t, { seed: 8 });
  LP.focar(st, h); CI.preenche(st, h, { forca: 0.6 + 1.0 * k });
  st.draw();
  const c = st.ctx;
  F.forEach((f, i) => R.relogio(c, 0, f, cam, range(t, 0.59 + i * 0.05, 0.85 + i * 0.05) * (1 - 0.75 * k), { linhas: ["76", ""], tam: 30, sobe: 0.28, cor: "#9aa4b0", numCor: "#c8d0da", ymin: 520 }));
  R.relogio(c, 23 * Y + 41 * 86400 + 25953 - t, eu, cam, range(t, 0.59, 0.85), { linhas: k < 0.5 || t < 3.62 ? ["76", ""] : null, rotulo: t < 3.62 ? "MÉDIA" : "SÓ ELA", tam: 48, sobe: 0.26, cor: t < 3.62 ? "#9aa4b0" : R.AZUL, glitch: range(t, 3.3, 3.62) * (1 - range(t, 3.62, 3.9)), t, pulso: LP.mola(t, 3.62, 1, 2.2, 5) });
  R.txt(c, "A MÉDIA", 540, 985, { tam: 34, cor: "#c8d0da", a: range(t, 0.59, 0.85) * (1 - range(t, 2.1, 2.3)), esp: 0.3 });
  R.txt(c, "NÃO É UMA PESSOA", 540, 985, { tam: 34, cor: "#fff", a: range(t, 2.33, 2.6) * (1 - range(t, 3.4, 3.6)), esp: 0.2 });
  R.txt(c, "O SEU PODER DIRIA", 540, 985, { tam: 34, cor: R.LARANJA, a: range(t, 3.62, 3.9), esp: 0.2 });
}
