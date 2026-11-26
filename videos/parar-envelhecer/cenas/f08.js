/*META {"imports": ["idade"], "rotulos": [], "D0": 4.9, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const ID = IDADE;
await ID.prepara();
const st = ID.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// curva da população (exponencial, azul) e o ramo laranja que achata com menos filhos
const W = 3.2, f1 = (x) => 0.05 + 0.06 * (Math.exp(3.2 * x) - 1), f2 = (x) => x < 0.45 ? f1(x) : f1(0.45) + 0.55 * (1 - Math.exp(-(x - 0.45) * 5));
const tubo = (f, cor, x0 = 0) => { const pts = []; for (let i = 0; i <= 60; i++) { const x = x0 + (1 - x0) * i / 60; pts.push(new THREE.Vector3(-W / 2 + x * W, f(x), 0)); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.03, 6), m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.9 })); S.add(m); return m; };
const A = tubo(f1, 0x7cc8ff), B = tubo(f2, 0xff8a4c, 0.45);
const eixo = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.01), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.35 })); m.position.set(x, y, -0.02); S.add(m); };
eixo(W + 0.2, 0.012, 0, 0.02); eixo(0.012, 2.4, -W / 2, 1.2); for (let i = 1; i < 6; i++) eixo(W, 0.004, 0, i * 0.4);
const ponta = ID.brilho(0x9fd6ff, 0.5, "suave", 1), pontaB = ID.brilho(0xff8a4c, 0.5, "suave", 0); S.add(ponta, pontaB);
const al = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  const ka = ease.inOutSine(range(t, 0.25, 2.3)), kb = ease.outCubic(range(t, 2.9, 4.4));
  A.geometry.setDrawRange(0, Math.floor(120 * ka) * 36); B.geometry.setDrawRange(0, Math.floor(120 * kb) * 36);
  ponta.position.set(-W / 2 + ka * W, f1(Math.max(0.001, ka)), 0); const xb = 0.45 + 0.55 * kb; pontaB.position.set(-W / 2 + xb * W, f2(xb), 0); pontaB.material.opacity = range(t, 2.9, 3.1);
  A.material.opacity = 1; A.material.transparent = true; A.material.opacity = 1 - 0.6 * range(t, 3.6, 4.2);
  const e = ease.inOutSine(range(t, 0, 4.9));
  cam.position.set(lerp(-1.4, 1.0, e), lerp(1.3, 1.5, e), lerp(5.6, 6.2, e)); al.set(lerp(-0.4, 0.2, e), lerp(0.9, 1.1, e) - 0.55, 0); cam.lookAt(al);
  st.bloom = 0.8; st.draw();
  const c = st.ctx;
  ID.tag(c, "POPULAÇÃO", ponta.position, cam, range(t, 0.3, 0.55) * (1 - range(t, 2.6, 2.8)), { dy: 120, dx: -120 });
  ID.txt(c, "MUITO RÁPIDO", 540, 690, { tam: 30, cor: ID.AZUL, a: range(t, 1.46, 1.7) * (1 - range(t, 2.7, 2.9)), esp: 0.3 });
  ID.tag(c, "BEM MENOS FILHOS", pontaB.position, cam, range(t, 3.6, 3.85), { cor: ID.LARANJA, dy: 140, dx: -60 });
}
