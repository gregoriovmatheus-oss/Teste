/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 4.5} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 1.2, faixa: 0.4, desfoque: 26, bloom: 0.7 });
const { S, cam } = st;
LP.luz(st, "frio"); st.exposicao = 0.95; CI.clima(st, "hospital");
CI.cenario(S, "rua", { seed: 11 }); CI.ceu(S, { topo: 0x6a7a8e, horizonte: 0xc8d2dc });
// luz fria de fim de tarde nublado; o avô sentado no banco, você de pé olhando para ele
const banco = new THREE.Group(); S.add(banco); banco.position.set(-0.6, 0, -1.6);
[[1.5, 0.06, 0.42, 0, 0.46, 0], [1.5, 0.4, 0.05, 0, 0.75, -0.2], [0.06, 0.46, 0.4, -0.7, 0.23, 0], [0.06, 0.46, 0.4, 0.7, 0.23, 0]].forEach(([w, h, d, x, y, z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP.mat(x ? 0x2a2c30 : 0x6a4a34, 0.7)); b.position.set(x, y, z); banco.add(b); });
const av = E.avo(LP); av.root.position.set(-0.6, 0, -1.55); av.root.rotation.y = 0.35; S.add(av.root);
const eu = E.heroi(LP); eu.root.position.set(0.55, 0, 0.2); eu.root.rotation.y = Math.PI + 0.45; S.add(eu.root);
const cai = LP.poeira(S, { n: 90, centro: [0, 1.4, -0.6], raio: [1.6, 1.0, 1.2], cor: 0xdfe8f2, tam: 0.006, seed: 9 });
const v = new THREE.Vector3(), hEu = new THREE.Vector3(), hAv = new THREE.Vector3(), CORTE = 2.15;
function render(t) {
  av.root.updateMatrixWorld(true); av.cab.getWorldPosition(hAv);
  LP.ator(av, t, { seed: 44, pose: "sentado", emocao: ["calmo", "alegre", range(t, 2.6, 3.4)], olharPara: eu.cab.getWorldPosition(v), olharK: 0.6 });
  LP.ator(eu, t, { seed: 12, emocao: ["calmo", "triste", range(t, 0.6, 1.5)], olharPara: hAv, olharK: 0.8 });
  eu.cab.getWorldPosition(hEu); cai.update(t);
  if (t < CORTE) { CI.plano(st, hEu, t, t / CORTE, "close", { lado: -1, seed: 9 }); }
  else { const u = (t - CORTE) / (4.5 - CORTE);   // por cima do ombro dele, o avô
    cam.position.set(lerp(1.75, 1.55, u), lerp(1.45, 1.4, u), lerp(1.1, 0.75, u)); cam.lookAt(v.set(-0.5, 1.2, -1.55)); LP.camMao(cam, t, { seed: 3 }); LP.focar(st, hAv); }
  CI.preenche(st, t < CORTE ? hEu : hAv, { forca: 1.0, cor: 0xd8e6ff });
  st.draw();
  const c = st.ctx;
  E.txt(c, "HAVERIA DOR", 540, 985, { tam: 34, cor: "#dfe8f2", a: range(t, 1.27, 1.5) * (1 - range(t, 1.9, 2.1)), esp: 0.24 });
  // contagem regressiva até "um" (4,09 s)
  const n = 1 + 11 * (1 - ease.inOutCubic(range(t, 2.6, 4.09)));
  E.sobreCabeca(c, n, av, cam, range(t, 2.4, 2.65), { rotulo: "ENCONTROS", tam: 80, sobe: 0.32, cor: t > 4.0 ? E.LARANJA : E.AZUL, pulso: LP.mola(t, 4.09, 1, 2, 4) });
}
