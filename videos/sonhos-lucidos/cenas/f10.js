/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 4.84, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { foco: 1.4, faixa: 0.5, desfoque: 20, bloom: 0.9 });
const { S, cam } = st;
LP.luz(st, "dia"); st.exposicao = 1.05;
const Q = CI.cenario(S, "quarto"); st.sol(new THREE.Vector3(-2.94, 1.6, -0.8), 0.9);
// acordou sentado na beira da cama; o quarto tremula e ondula como se ainda fosse sonho
const p = SN.heroi(LP); S.add(p.root); p.root.position.set(0.2, 0, -1.4); p.root.rotation.y = -Math.PI / 2;
const R = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  const on = range(t, 1.7, 2.4) * (1 - 0.6 * range(t, 4.2, 4.84)), w = Math.sin(t * 5.5);
  LP.ator(p, t, { seed: 7, pose: [["sentado", 1], ["pensativo", range(t, 3.3, 3.9)]], emocao: t < 1.6 ? ["sono", "duvida", range(t, 0.6, 1.4)] : ["duvida", "surpresa", range(t, 2.2, 2.7) * (1 - range(t, 3.4, 4.0))], olharPara: v.set(-1.5, 1.9 + 0.3 * Math.sin(t), -1.4 + Math.sin(t * 0.8)), olharK: range(t, 1.0, 1.6) });
  Q.g.scale.set(1 + 0.012 * on * w, 1 + 0.018 * on * Math.sin(t * 4.3 + 1), 1); Q.g.rotation.z = 0.012 * on * Math.sin(t * 3.1); Q.g.position.y = 0.02 * on * Math.sin(t * 6);
  st.U.barril.value = 0.12 + 0.3 * on * (0.5 + 0.5 * w); st.U.ca.value = 0.6 + 2.2 * on; st.U.sat.value = 0.92 - 0.3 * on;
  p.root.updateMatrixWorld(true); R.copy(LP.pontoCabeca(p, "testa")).lerp(LP.pontoCabeca(p, "boca"), 0.5);
  const e = ease.inOutSine(range(t, 0, 4.84)); cam.position.set(R.x - lerp(1.9, 1.45, e), R.y + lerp(0.1, 0.04, e), R.z + lerp(0.6, 0.35, e)); cam.lookAt(R.x, R.y - 0.36, R.z); LP.camMao(cam, t, { seed: 5 }); LP.focar(st, R);
  st.draw();
  const c = st.ctx;
  SN.txt(c, "DEPOIS DE ACORDAR", 540, 700, { tam: 28, cor: SN.AZUL, a: range(t, 0.27, 0.5) * (1 - range(t, 2.4, 2.6)), esp: 0.3 });
  SN.titulo(c, "", ["*aconteceu*?"], range(t, 2.66, 2.9), { y: 880, tam: 70 });
  SN.txt(c, "OU FOI SÓ NA SUA CABEÇA?", 540, 975, { tam: 30, cor: SN.LARANJA, a: range(t, 3.62, 3.85), esp: 0.2 });
}
