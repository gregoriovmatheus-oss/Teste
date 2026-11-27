/*META {"imports": ["sonho"], "rotulos": [], "D0": 5.12, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const SN = SONHO;
await SN.prepara();
const st = SN.palcoDoc(T, canvas, { fov: 34, ceu: "#05071a", chao: 0x0b0e1c });
const S = st.scene, cam = st.cam;
// hipnograma de 1 noite (8 h): ciclos de ~90 min; os trechos REM (laranja) ficam mais longos perto da manhã
const NIV = { A: 0, R: -0.22, 1: -0.42, 2: -0.66, 3: -0.95 };
const SEQ = [["A", 0.2], ["1", 0.2], ["2", 0.4], ["3", 0.7], ["2", 0.3], ["R", 0.25], ["2", 0.4], ["3", 0.5], ["2", 0.3], ["R", 0.45], ["1", 0.15], ["2", 0.6], ["3", 0.2], ["2", 0.3], ["R", 0.6], ["2", 0.6], ["R", 0.8], ["1", 0.2], ["A", 0.2]];
const TOT = SEQ.reduce((a, s) => a + s[1], 0), W = 3.2, G = new THREE.Group(); G.position.set(0, 1.9, 0); S.add(G);
const mN = new THREE.MeshStandardMaterial({ color: 0x9fd6ff, emissive: 0x7cc8ff, emissiveIntensity: 0.7, roughness: 0.3 });
const mR = new THREE.MeshStandardMaterial({ color: 0xffb08a, emissive: 0xff8a4c, emissiveIntensity: 0.6, roughness: 0.3 });
const peca = []; let x = -W / 2, yAnt = null;
SEQ.forEach(([n, d]) => { const w = (d / TOT) * W, y = NIV[n], R = n === "R";
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, R ? 0.07 : 0.035, R ? 0.07 : 0.035), R ? mR : mN); b.position.set(x + w / 2, y, 0); G.add(b); peca.push([b, x + w / 2, R]);
  if (yAnt !== null) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.02, Math.abs(y - yAnt), 0.02), mN); v.position.set(x, (y + yAnt) / 2, 0); G.add(v); peca.push([v, x, false]); }
  yAnt = y; x += w; });
const grade = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.3, 1.25), new THREE.MeshBasicMaterial({ color: 0x0e1830, transparent: true, opacity: 0.6 })); grade.position.set(0, -0.47, -0.05); G.add(grade);
// cérebro acima do gráfico, acende em "cérebro"
const B = SN.cerebro(S, { n: 1300, seed: 3, tam: 0.07 }); B.group.position.set(0, 3.55, 0); B.group.scale.setScalar(0.95);
const al = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  const rev = range(t, 0.25, 1.6) * W - W / 2;
  peca.forEach(([b, px, R]) => { const k = Math.min(1, Math.max(0, (rev - px) / 0.15 + 1)); b.scale.set(1, Math.max(0.001, k), 1); b.visible = k > 0.01; });
  const rk = range(t, 1.38, 1.7); mR.emissiveIntensity = 0.6 + 1.8 * rk * (0.85 + 0.15 * Math.sin(t * 9));
  const at = range(t, 2.18, 2.8), ac = range(t, 2.96, 4.3);
  B.update(t, { fill: Math.max(0.15, at), ativo: 0.25 + 0.7 * ac, mix: ac * 0.7, casca: 0.4 + 0.8 * at }); B.group.rotation.y = -0.5 + t * 0.35;
  const e = ease.inOutCubic(range(t, 1.5, 2.6));
  cam.position.set(lerp(-0.9, 0.7, e) + 0.15 * Math.sin(t * 0.5), lerp(2.0, 3.2, e), lerp(4.6, 4.3, e) - 0.15 * t);
  al.set(lerp(-0.1, 0.1, e), lerp(1.45, 3.05, e), 0); cam.lookAt(al);
  st.bloom = 0.9; st.draw();
  const c = st.ctx;
  SN.tag(c, "SONO REM", peca[16 * 2 - 1][0].getWorldPosition(v), cam, range(t, 1.38, 1.6) * (1 - range(t, 2.0, 2.2)), { cor: SN.LARANJA, dy: 200 });
  SN.txt(c, "UMA NOITE DE SONO", 540, 690, { tam: 26, cor: SN.AZUL, a: range(t, 0.35, 0.6) * (1 - range(t, 1.3, 1.5)), esp: 0.3 });
  SN.txt(c, "CÉREBRO NO REM", 540, 870, { tam: 30, cor: SN.AZUL, a: range(t, 2.18, 2.4), esp: 0.3 });
  SN.titulo(c, "", ["quase tão ativo", "quanto *acordado*"], range(t, 2.96, 3.25), { y: 950, tam: 56 });
}
