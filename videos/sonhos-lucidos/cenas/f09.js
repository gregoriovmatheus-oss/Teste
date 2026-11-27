/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 5.07, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { foco: 1.6, faixa: 0.5, desfoque: 22, bloom: 1.0 });
const { S, cam } = st;
LP.luz(st, "interior"); st.exposicao = 1.15;
const Q = CI.cenario(S, "quarto"); st.sol(new THREE.Vector3(-2.94, 1.6, -0.8), 1.2);
// despertador tocando no criado-mudo; a pessoa se agarra ao travesseiro e não quer acordar
const cv = document.createElement("canvas"); cv.width = 128; cv.height = 64; const x = cv.getContext("2d");
x.fillStyle = "#0a0c10"; x.fillRect(0, 0, 128, 64); x.font = '700 44px "JetBrains Mono", monospace'; x.fillStyle = "#ff5a3a"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("07:00", 64, 34);
const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
const rel = new THREE.Group(); rel.position.set(-0.3, 0.56, -2.45); S.add(rel);
rel.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.08), LP.mat(0x2a2a30, 0.4)));
const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.09), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); tela.position.z = 0.041; rel.add(tela);
const luzR = new THREE.PointLight(0xff5a3a, 0.8, 1.5, 2); luzR.position.set(-0.3, 0.7, -2.2); S.add(luzR);
const p = SN.heroi(LP); S.add(p.root);
const brilhoCama = SN.brilho(0xffd090, 4.5, "suave", 0); brilhoCama.position.set(0.8, 0.9, -1.6); S.add(brilhoCama);
const R = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  const toca = t < 2.4 ? Math.sin(t * 60) : 0;
  rel.rotation.z = 0.06 * toca; rel.position.x = -0.3 + 0.004 * toca; luzR.intensity = t < 2.4 ? 0.6 + 0.5 * (Math.sin(t * 12) > 0) : 0.2;
  SN.deitado(LP, p, t, [0.8, 0.63, -0.72], { seed: 7, emocao: ["dormindo", "alegre", 0.3 * range(t, 2.6, 3.4)], ergue: 0.15 });
  R.copy(LP.pontoCabeca(p, "testa")).lerp(LP.pontoCabeca(p, "boca"), 0.5);
  LP.alcancar(p, 1, v.set(R.x + 0.05, R.y - 0.12, R.z - 0.18), 1, { polo: new THREE.Vector3(-1, 0, 0.3) });   // abraça o travesseiro
  const g = ease.inOutSine(range(t, 2.65, 3.8)); brilhoCama.material.opacity = 0.7 * g; st.quente.color.setRGB(1, lerp(0.69, 0.8, g), lerp(0.44, 0.55, g));
  st.exposicao = 1.15 - 0.1 * g; st.U.desf.value = 22 + 10 * g;
  const e = ease.inOutSine(range(t, 0, 2.5)), f = ease.inOutCubic(range(t, 2.6, 5.07)); cam.position.set(R.x + lerp(0.95, 0.8, e) + 0.9 * f, R.y + lerp(0.5, 0.42, e) + 0.9 * f, R.z + lerp(0.45, 0.35, e) + 1.0 * f); cam.lookAt(R.x, R.y - 0.16 - 0.25 * f, R.z + 0.4 * f); LP.camMao(cam, t, { seed: 4 });
  LP.focar(st, R);
  st.draw();
  const c = st.ctx;
  SN.txt(c, "DORMIR", 380, 975, { tam: 36, cor: "#ffd27a", a: range(t, 1.58, 1.8), esp: 0.3 });
  SN.txt(c, ">", 540, 975, { tam: 36, cor: "#fff", a: range(t, 1.8, 1.95), esp: 0 });
  SN.txt(c, "VIVER", 690, 975, { tam: 36, cor: "#9aa4b8", a: range(t, 2.09, 2.3), esp: 0.3 });
  SN.titulo(c, "", ["o *melhor lugar*", "do mundo"], range(t, 3.61, 3.9), { y: 760, tam: 60 });
}
