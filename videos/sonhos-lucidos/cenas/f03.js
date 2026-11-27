/*META {"imports": ["sonho"], "rotulos": [], "D0": 5.96, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const SN = SONHO;
await SN.prepara();
const st = SN.palcoDoc(T, canvas, { fov: 34, ceu: "#07051a", chao: 0x0e0c1c });
const S = st.scene, cam = st.cam;
// anel de 100 pessoas (100 peças); em "metade" 55 acendem (meta-análise: ~55% já tiveram ao menos um sonho lúcido)
const N = 100, RA = 1.25, CY = 2.05, geo = new THREE.BoxGeometry(0.06, 0.2, 0.06);
const m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.0, roughness: 0.35, metalness: 0.1 });
const im = new THREE.InstancedMesh(geo, m, N); S.add(im); im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
const o = new THREE.Object3D(), cor = new THREE.Color(), apag = new THREE.Color(0x2a3350), ac1 = new THREE.Color(0x7cc8ff), ac2 = new THREE.Color(0xc89aff);
const lu = SN.lua(0xd8c8ff, 0.32); lu.position.set(0, CY, 0); S.add(lu);
const hal = SN.brilho(0x9a7aff, 4.5, "suave", 0.0); hal.position.set(0, CY, -0.3); S.add(hal);
const est = new THREE.BufferGeometry(), rr = mulberry32(5), ep = []; for (let i = 0; i < 400; i++) ep.push((rr() - 0.5) * 30, rr() * 14, -6 - rr() * 14);
est.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3)); S.add(new THREE.Points(est, new THREE.PointsMaterial({ color: 0xcfc0ff, size: 0.05 })));
st.key.position.set(2, 5, 6); st.rim.color.set(0x9a7aff);
const al = new THREE.Vector3();
function render(t) {
  const fill = ease.inOutCubic(range(t, 3.32, 4.3)) * 55;
  for (let i = 0; i < N; i++) { const a = Math.PI / 2 - (i / N) * 6.283, ap = ease.outBack(range(t, 0.2 + i * 0.012, 0.6 + i * 0.012)), on = Math.min(1, Math.max(0, fill - i));
    o.position.set(Math.cos(a) * RA, CY + Math.sin(a) * RA, 0.03 * Math.sin(t * 2 + i * 0.3)); o.rotation.set(0, 0, a - Math.PI / 2); o.scale.set(1, Math.max(0.001, ap) * (1 + 0.5 * on), 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    cor.copy(apag).lerp(i % 2 ? ac1 : ac2, on).multiplyScalar(1 + 1.8 * on); im.setColorAt(i, cor); }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  m.emissiveIntensity = 0.0; lu.scale.setScalar(1 + 0.05 * Math.sin(t * 2)); hal.material.opacity = 0.45 * range(t, 3.32, 4.3);
  const e = ease.inOutSine(range(t, 0, 5.96));
  cam.position.set(lerp(-0.7, 0.5, e), lerp(1.2, 1.0, e), lerp(6.4, 7.4, e)); al.set(0, lerp(1.35, 1.25, e), 0); cam.lookAt(al); cam.rotation.z += 0.02 * Math.sin(t * 0.7);
  st.bloom = 0.9; st.draw();
  const c = st.ctx;
  SN.txt(c, "SONHO LÚCIDO", 540, 760, { tam: 30, cor: SN.AZUL, a: range(t, 1.91, 2.1) * (1 - range(t, 3.1, 3.3)), esp: 0.34 });
  SN.titulo(c, "", ["saber que *está sonhando*"], range(t, 2.25, 2.5) * (1 - range(t, 3.1, 3.3)), { y: 850, tam: 58 });
  SN.numero(c, "≈ " + Math.round(fill) + "%", 540, 840, range(t, 3.32, 3.5), { tam: 150 });
  SN.txt(c, "METADE DAS PESSOAS", 540, 945, { tam: 30, cor: SN.LARANJA, a: range(t, 3.72, 3.95), esp: 0.26 });
  SN.txt(c, "JÁ TEVE PELO MENOS UM", 540, 995, { tam: 26, cor: "#fff", a: range(t, 4.41, 4.65), esp: 0.24 });
}
