/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 7.85, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { foco: 2.1, faixa: 0.9, desfoque: 22, bloom: 0.55 });
const { S, cam } = st;
LP.luz(st, "interior"); st.exposicao = 1.12; st.quente.intensity = 2.0; st.quente.position.set(1.2, 2.2, 3.0); st.hemi.intensity = 0.8;
CI.cenario(S, "cozinha"); st.sol(new THREE.Vector3(-2.94, 1.6, -1.2), 1.0);
LP.bokeh(S, { n: 30, seed: 5, y: [0.8, 2.8], z: [-6, -3], cores: [0xffd08a, 0xff8a4c, 0x7cc8ff, 0xff6a9a] });
const poe = LP.poeira(S, { n: 60, centro: [0, 1.6, 0.3], raio: [0.9, 0.6, 0.5], cor: 0xffd89a });
const p = ID.heroi(LP, { camisa: 0x2f6f9a }); S.add(p.root);
const B = ID.bolo(LP); S.add(B.g); B.g.position.set(0, 1.24, 0.34); B.g.scale.setScalar(0.75);
const R = new THREE.Vector3(0, 1.62, 0.06), v = new THREE.Vector3();
function render(t) {
  // mesma imagem da f01: abre mais largo e termina no enquadramento do quadro 0
  CI.trilho(cam, t, [[0, [-0.6, 1.6, 3.2], [0, 1.25, 0.1]], [4.5, [0.3, 1.56, 2.4], [0, 1.2, 0.1]], [7.85, [0.5, 1.55, 2.25], [0, 1.19, 0.1]]], { mao: 1, seed: 3 });
  LP.ator(p, t, { seed: 12, emocao: t < 1.3 ? "alegre" : t < 4.2 ? ["alegre", "duvida", range(t, 1.39, 1.9)] : ["duvida", "alegre", range(t, 4.3, 5.0)], olharPara: cam.position, olharK: 0.7 });
  p.root.updateMatrixWorld(true);
  LP.alcancar(p, 0, v.set(0.14, 1.23, 0.33), 1, { polo: new THREE.Vector3(1, -0.6, -0.4) });
  LP.alcancar(p, 1, v.set(-0.14, 1.23, 0.33), 1, { polo: new THREE.Vector3(-1, -0.6, -0.4) });
  B.g.position.y = 1.24 + 0.006 * Math.sin(t * 2.2); B.update(t);
  CI.focoEntre(st, R, B.vela.getWorldPosition(v), 0.35); CI.preenche(st, R, { forca: 1.5 }); poe.update(t);
  st.draw();
  const c = st.ctx;
  ID.txt(c, "25 PARA SEMPRE", 540, 975, { tam: 32, cor: ID.AZUL, a: range(t, 0.35, 0.6) * (1 - range(t, 2.6, 2.8)), esp: 0.3 });
  ID.txt(c, "QUANTO TEMPO VOCÊ TEM?", 540, 975, { tam: 30, cor: "#fff", a: range(t, 2.87, 3.1) * (1 - range(t, 4.1, 4.3)), esp: 0.2 });
  ID.titulo(c, "", ["O que *fazer com ele*?"], range(t, 5.2, 5.6), { y: 985, tam: 62 });
}
