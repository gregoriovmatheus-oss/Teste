/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 5.97, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { foco: 1.4, faixa: 0.6, desfoque: 20, bloom: 0.9 });
const { S, cam } = st;
LP.luz(st, "frio"); st.exposicao = 1.15; st.hemi.intensity = 0.7;
const H = CI.cenario(S, "hospital"); CI.clima(st, "hospital");
const trav = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.35), LP.mat(0xf4f8fa, 0.9)); trav.position.set(0.5, 0.9, -2.2); S.add(trav);
const p = ID.heroi(LP, { roupa: "pijama", camisa: 0x8ab0c8 }); p.root.position.set(0.5, 0.92, -0.45); S.add(p.root);
const R = new THREE.Vector3(0.5, 1.02, -2.3);
function render(t) {
  LP.ator(p, t, { seed: 12, pose: "deitado", emocao: ["nervoso", "medo", range(t, 1.2, 1.8)], olhar: t > 2 ? [0.4, 0.2] : null });
  p.root.position.set(0.5, 0.92, -0.45); p.root.rotation.set(-Math.PI / 2, 0, 0);
  CI.trilho(cam, t, [[0, [2.0, 2.1, 0.4], [0.4, 0.95, -1.7]], [2.0, [1.5, 1.9, -0.8], [0.5, 0.95, -2.25]], [5.97, [1.2, 1.78, -1.45], [0.5, 0.95, -2.35]]], { mao: 1, seed: 6 }); cam.rotateX(-0.15);
  LP.focar(st, R);
  st.draw();
  ID.lista(st.ctx, [["ACIDENTES", 2.07, null], ["INFECÇÕES", 2.67, null], ["ALGUNS CÂNCERES", 3.82, null]], t, 540, 700, { w: 560 });
  ID.txt(st.ctx, "AINDA EXISTIRIAM", 540, 925, { tam: 30, cor: ID.LARANJA, a: range(t, 4.4, 4.7), esp: 0.3 });
}
