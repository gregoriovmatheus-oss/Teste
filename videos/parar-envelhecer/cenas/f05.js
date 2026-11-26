/*META {"imports": ["idade"], "rotulos": [], "D0": 4.37, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const ID = IDADE;
await ID.prepara();
const st = ID.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// risco constante (linha laranja reta) e 10 séculos acendendo até a média de mil anos
const linha = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.015, 0.015), new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0 })); linha.position.set(0, 1.12, 0); S.add(linha);
const sec = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), new THREE.MeshStandardMaterial({ color: 0x7cc8ff, emissive: 0x7cc8ff, emissiveIntensity: 0.2, roughness: 0.2, transparent: true, opacity: 0.85 }));
  m.position.set(-0.72 + i * 0.16, 0, 0); S.add(m); return m; });
const al = new THREE.Vector3();
function render(t) {
  linha.material.opacity = range(t, 0.6, 1.0); linha.scale.x = Math.max(0.001, ease.outCubic(range(t, 0.6, 1.4)));
  const anos = 1000 * ease.inOutSine(range(t, 1.73, 3.59));
  sec.forEach((m, i) => { const k = Math.min(1, Math.max(0, anos / 100 - i)), h = 0.03 + 0.95 * ease.outBack(k); m.scale.y = h; m.position.y = h / 2 + 0.02;
    m.material.emissiveIntensity = 0.2 + 0.9 * k * (1 - 0.6 * range(t, 3.7, 4.2)); });
  const e = ease.inOutSine(range(t, 0, 4.37));
  cam.position.set(lerp(-2.2, 1.8, e), lerp(1.9, 1.7, e), lerp(9.0, 8.6, e)); al.set(lerp(-0.15, 0.15, e), -0.45, 0); cam.lookAt(al);
  st.bloom = 0.7; st.draw();
  const c = st.ctx;
  ID.tag(c, "RISCO NUNCA SOBE", linha.position, cam, range(t, 0.93, 1.2) * (1 - range(t, 2.6, 2.9)), { cor: ID.LARANJA, dy: -120 });
  ID.txt(c, "EXPECTATIVA MÉDIA", 540, 965, { tam: 28, cor: ID.AZUL, a: range(t, 2.9, 3.1), esp: 0.32 });
  ID.numero(c, Math.round(anos).toLocaleString("pt-BR") + " anos", 540, 850, range(t, 1.73, 1.9), { tam: anos >= 999 ? 120 : 110 });
}
