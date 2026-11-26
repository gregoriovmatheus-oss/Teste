/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 5.21, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { foco: 2.1, faixa: 0.9, desfoque: 22, bloom: 0.55 });
const { S, cam } = st;
LP.luz(st, "interior"); st.exposicao = 1.12; st.quente.intensity = 2.0; st.quente.position.set(1.2, 2.2, 3.0); st.hemi.intensity = 0.8;
CI.cenario(S, "cozinha"); st.sol(new THREE.Vector3(-2.94, 1.6, -1.2), 1.0);
LP.bokeh(S, { n: 30, seed: 5, y: [0.8, 2.8], z: [-6, -3], cores: [0xffd08a, 0xff8a4c, 0x7cc8ff, 0xff6a9a] });
const poe = LP.poeira(S, { n: 120, centro: [0, 1.6, 0.3], raio: [0.9, 0.6, 0.5], cor: 0xffd89a });
const p = ID.heroi(LP, { camisa: 0x2f6f9a }); S.add(p.root);
const B = ID.bolo(LP); S.add(B.g); B.g.position.set(0, 1.24, 0.34); B.g.scale.setScalar(0.75);
const R = new THREE.Vector3(0, 1.62, 0.06), v = new THREE.Vector3();
function render(t) {
  if (t < 0.17) st.T = 0.17;  // quadro 0 = miniatura: sem o dip escuro de entrada
  // segura o bolo "25" sorrindo; em "parar ali" (2,3 s) surpresa; em "nunca mais envelheceria" volta a sorrir
  CI.trilho(cam, t, [[0, [0.5, 1.55, 2.25], [0, 1.19, 0.1]], [2.6, [0.3, 1.53, 2.1], [0, 1.19, 0.1]], [5.21, [0.08, 1.52, 1.9], [0, 1.2, 0.1]]], { mao: 1, seed: 3 });
  LP.ator(p, t, { seed: 12, emocao: t < 2.2 ? ["alegre", "alegre", 1] : t < 3.4 ? ["alegre", "surpresa", range(t, 2.25, 2.6)] : ["surpresa", "alegre", range(t, 3.5, 4.1)], olharPara: cam.position, olharK: 0.7 });
  p.root.updateMatrixWorld(true);
  LP.alcancar(p, 0, v.set(0.14, 1.23, 0.33), 1, { polo: new THREE.Vector3(1, -0.6, -0.4) });
  LP.alcancar(p, 1, v.set(-0.14, 1.23, 0.33), 1, { polo: new THREE.Vector3(-1, -0.6, -0.4) });
  B.g.position.y = 1.24 + 0.006 * Math.sin(t * 2.2); B.update(t);
  CI.focoEntre(st, R, B.vela.getWorldPosition(v), 0.35); CI.preenche(st, R, { forca: 1.5 }); poe.update(t);
  st.draw();
  const c = st.ctx;
  ID.titulo(c, "", ["E se você *parasse aos 25*?"], 1 - range(t, 1.9, 2.3), { y: 985, tam: 62 });
  ID.txt(c, "NUNCA MAIS ENVELHECER", 540, 975, { tam: 30, cor: ID.AZUL, a: range(t, 3.48, 3.8), esp: 0.3 });
}
