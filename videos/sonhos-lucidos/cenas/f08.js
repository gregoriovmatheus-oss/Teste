/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 3.5, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { fundo: 0x1a0c30, foco: 6, faixa: 3, desfoque: 18, bloom: 1.2 });
const { S, cam } = st;
LP.luz(st, "noite"); st.exposicao = 1.15; st.hemi.color.set(0xd8b0ff); st.hemi.intensity = 0.8;
const ceu = SN.ilhaSonho(S, LP, CI, { seed: 11, nN: 0, topo: 0x1a0a40, horizonte: 0xc86aa8, orbes: 50 });
// cama gigante e brilhante sobre um mar de nuvens; a pessoa, pequenininha, anda até ela
for (let i = 0; i < 14; i++) { const r = mulberry32(70 + i), c = SN.nuvem(LP, { seed: 70 + i, n: 6, emis: 0.3, cor: [0xf2e0ff, 0xffd8f0][i % 2] }); c.position.set((r() - 0.5) * 18, -1.3, -r() * 16 + 4); c.scale.setScalar(1.5 + r() * 1.5); S.add(c); }
const C = SN.cama(LP, { coberta: 0xffb04a, lencol: 0xfff0f8, madeira: 0xffd8a0, brilha: 0.9 }); C.g.scale.setScalar(5); C.g.position.set(0, -0.2, -9); C.g.rotation.y = 0.35; S.add(C.g);
C.travesseiro.material = C.travesseiro.material.clone(); C.travesseiro.material.emissive = new THREE.Color(0xfff0e0); C.travesseiro.material.emissiveIntensity = 0.6;
const halo = SN.brilho(0xffc070, 10, "suave", 0.5); halo.position.set(0, 3.5, -14); S.add(halo);
const raios = SN.brilho(0xffe0a0, 9, "raios", 0.4); raios.position.set(0, 3.8, -14.2); S.add(raios);
const luzC = new THREE.PointLight(0xffc070, 12, 18, 1.4); luzC.position.set(0, 5, -5); S.add(luzC);
const p = SN.heroi(LP); S.add(p.root);
const v = new THREE.Vector3(), R = new THREE.Vector3();
function render(t) {
  const d = LP.ator(p, t, { seed: 7, andar: { vel: 0.8 }, emocao: ["surpresa", "alegre", range(t, 1.3, 2.0)], olharPara: v.set(0, 3, -8), olharK: 0.4 });
  p.root.position.set(0.35, 0, 1.4 - d * 0.4); p.root.rotation.y = Math.PI;
  ceu.update(t); raios.material.rotation = t * 0.15; halo.material.opacity = 0.5 + 0.08 * Math.sin(t * 2);
  C.coberta.material.emissiveIntensity = 0.8 + 0.25 * Math.sin(t * 2.5);
  CI.trilho(cam, t, [[0, [1.0, 1.4, 3.6], [0.2, 1.35, -1]], [1.8, [1.6, 2.2, 4.8], [0.1, 1.4, -4]], [3.5, [2.4, 3.6, 6.6], [0, 1.4, -7]]], { mao: 1, seed: 6 });
  p.root.getWorldPosition(R); R.y += 1.5; LP.focar(st, R);
  st.draw();
  const c = st.ctx;
  SN.txt(c, "O PROBLEMA", 540, 870, { tam: 30, cor: SN.LARANJA, a: range(t, 0.89, 1.1), esp: 0.36 });
  SN.titulo(c, "", ["e se ficasse", "*bom demais*?"], range(t, 1.84, 2.1), { y: 940, tam: 60 });
}
