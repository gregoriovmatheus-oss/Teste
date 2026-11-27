/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 6.42} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 3.6, faixa: 1.4, desfoque: 14, bloom: 0.9, raios: 0.6 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.1;
CI.ceu(S, { topo: 0x2a3466, horizonte: 0xffa070 });
st.sol(new THREE.Vector3(3, 1.5, -30), 1.0);
// tela dividida por uma parede: à esquerda, décadas pela frente no sofá, na luz da TV; à direita, poucas horas no pôr do sol
const cx = (w, h, d, c, x, y, z, r = 0.8) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP.mat(c, r)); m.position.set(x, y, z); S.add(m); return m; };
cx(0.04, 3.2, 8, 0x0a0a0c, 0, 1.6, -2.5);                     // a divisória (vista de topo = linha)
cx(3, 3.2, 0.1, 0x3a4250, -1.5, 1.6, -1.6); cx(3, 0.1, 6, 0x4a4a52, -1.5, -0.05, -0.5, 0.6);   // sala cinza
cx(1.0, 0.42, 0.55, 0x4a5a6a, -0.42, 0.21, -0.9); cx(1.0, 0.45, 0.12, 0x4a5a6a, -0.42, 0.62, -1.15);   // sofá
const tv = CI.luzPratica(S, "tv", [-1.3, 0.9, 0.8], { forca: 1.0 }); tv.g.rotation.y = 2.6;
cx(3, 0.1, 6, 0x6a5a3a, 1.5, -0.05, -0.5, 0.9);                // gramado ao pôr do sol
LP.bokeh(S, { n: 24, seed: 5, x: [0.4, 6], y: [0.5, 3], z: [-14, -6], cores: [0xffc07a, 0xff8a4c, 0xfff0d0] });
const PA = LP.pessoa({ seed: 83, roupa: "camiseta", camisa: 0x6a7a8a, pele: 0xd9a07e, cabelo: 0x3a2a1a, barba: false }); PA.root.position.set(-0.42, 0, -0.75); S.add(PA.root);
const PB = LP.pessoa({ seed: 37, feminina: true, roupa: "casaco", jaqueta: 0xd86a3a, pele: 0x8a5a3e, cabelo: 0x140c08, iris: 0x2a180c }); PB.root.position.set(0.42, 0, -0.75); S.add(PB.root);
const poe = LP.poeira(S, { n: 50, centro: [0.6, 1.6, -0.6], raio: [0.6, 0.8, 0.6], cor: 0xffd8a0 });
const hA = new THREE.Vector3(), hB = new THREE.Vector3(), al = new THREE.Vector3();
function render(t) {
  LP.ator(PA, t, { seed: 83, pose: "sentado", emocao: t < 2.6 ? "sono" : ["sono", "bocejo", range(t, 2.6, 3.0) * (1 - range(t, 3.6, 4.0))], olhar: [0, -0.1] });
  LP.ator(PB, t, { seed: 37, pose: t > 4.5 ? [["comemorar", ease.outBack(range(t, 4.6, 5.2))]] : undefined, emocao: ["calmo", "alegre", range(t, 3.9, 4.6)], olharPara: t > 4.6 ? st.cam.position : undefined, olharK: 0.4, gestos: t < 4.5 ? { intens: 0.4 } : undefined });
  tv.update(t); poe.update(t);
  PA.cab.getWorldPosition(hA); PB.cab.getWorldPosition(hB);
  const e = ease.inOutSine(range(t, 0, 6.42));
  cam.position.set(0, lerp(1.35, 1.45, e), lerp(4.3, 3.7, e)); al.set(0, lerp(1.0, 1.08, e), -0.75); cam.lookAt(al); LP.camMao(cam, t, { seed: 17, intens: 0.5 });
  LP.focar(st, hB);
  st.draw();
  const c = st.ctx;
  c.save(); c.globalAlpha = 0.85; c.fillStyle = "#ffffff"; c.fillRect(538, 560, 4, 1030 - 560); c.restore();
  R.relogio(c, 52 * Y + 8e6 - t, PA, cam, range(t, 0.98, 1.25), { tam: 40, sobe: 0.24, cor: "#9aa4b0", numCor: "#c8d0da", ymin: 470, pulso: 0 });
  R.relogio(c, 5 * 3600 + 12 * 60 + 40 - t * 30, PB, cam, range(t, 3.89, 4.15), { tam: 40, sobe: 0.24, cor: R.LARANJA, ymin: 470, pulso: LP.mola(t, 4.15, 1, 2.2, 5) });
  R.txt(c, "DÉCADAS", 270, 960, { tam: 34, cor: "#c8d0da", a: range(t, 0.98, 1.25), esp: 0.24 });
  R.txt(c, "DESPERDIÇADAS", 270, 1005, { tam: 22, cor: "#9aa4b0", a: range(t, 2.07, 2.3), esp: 0.24 });
  R.txt(c, "HORAS", 810, 960, { tam: 34, cor: R.LARANJA, a: range(t, 3.89, 4.15), esp: 0.24 });
  R.txt(c, "O DIA MAIS INTENSO", 810, 1005, { tam: 22, cor: "#ffd0b0", a: range(t, 5.29, 5.5), esp: 0.16 });
}
