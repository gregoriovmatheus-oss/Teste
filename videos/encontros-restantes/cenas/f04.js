/*META {"imports": ["encontros"], "rotulos": [], "D0": 6.6} */
const E = ENCONTROS;
await E.prepara();
const st = E.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// 10 encontros por ano (coluna) × 20 anos (colunas) = 200 contas de luz
const C = 20, L = 10, N = C * L, P = 0.09, geo = new THREE.IcosahedronGeometry(0.034, 1);
const m = new THREE.MeshStandardMaterial({ color: 0xffd0a0, emissive: 0xff8a4c, emissiveIntensity: 0.9, roughness: 0.35 });
const im = new THREE.InstancedMesh(geo, m, N); im.frustumCulled = false; S.add(im);
const o = new THREE.Object3D(), x0 = -(C - 1) * P / 2, y0 = 0.35;
const halo = E.brilho(0xff8a4c, 4.5, "suave", 0); halo.position.set(0, 1.0, -0.4); S.add(halo);
const al = new THREE.Vector3(), cor = new THREE.Color(), quente = new THREE.Color(0xffd0a0), azul = new THREE.Color(0x9fd6ff);
for (let i = 0; i < N; i++) im.setColorAt(i, quente);
function render(t) {
  for (let i = 0; i < N; i++) { const cx = Math.floor(i / L), ly = i % L;
    // 1º ano: as 10 caem em "dez vezes"; os outros 19 anos entram em onda em "vinte anos"
    const t0 = cx === 0 ? 1.95 + ly * 0.05 : 3.6 + cx * 0.07 + ly * 0.012, k = ease.outBack(range(t, t0, t0 + 0.35));
    o.position.set(x0 + cx * P, y0 + ly * P + (1 - k) * 0.6, 0.03 * Math.sin(t * 2 + i)); o.scale.setScalar(Math.max(0.001, k)); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, cor.copy(quente).lerp(azul, cx === 0 ? 0 : 0.35 * range(t, 5.3, 5.8))); }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  halo.material.opacity = 0.35 * range(t, 5.3, 5.8);
  // câmera: rente à 1ª coluna, recua e sobe até ver as 200
  const e = ease.inOutCubic(range(t, 3.5, 6.2)), x0c = x0 + 0.02 * t;
  cam.position.set(lerp(x0c + 0.45, 0.1, e), lerp(1.05, 1.0, e), lerp(1.9 - 0.06 * t, 6.6, e)); al.set(lerp(x0c, 0, e), lerp(0.8, 0.22, e), 0); cam.lookAt(al);
  st.bloom = 0.85; st.draw();
  const c = st.ctx;
  E.txt(c, "VISITAS AOS PAIS", 540, 700, { tam: 28, cor: E.AZUL, a: range(t, 1.7, 2.0) * (1 - range(t, 3.3, 3.5)), esp: 0.3 });
  // a conta monta na hora em que é dita
  const kA = range(t, 1.99, 2.25), kB = range(t, 3.66, 3.9), kS = range(t, 3.35, 3.62), kC = range(t, 5.36, 5.6);
  E.numero(c, "10", lerp(540, 330, ease.inOutCubic(kS)), 950, kA, { tam: 84 }); E.txt(c, "POR ANO", lerp(540, 330, ease.inOutCubic(kS)), 1008, { tam: 22, cor: E.AZUL, a: kA, esp: 0.3 });
  E.txt(c, "×", 430, 950, { tam: 60, cor: "#fff", fonte: "inter", peso: 300, a: kB });
  E.numero(c, "20", 540, 950, kB, { tam: 84 }); E.txt(c, "ANOS", 540, 1008, { tam: 22, cor: E.AZUL, a: kB, esp: 0.3 });
  E.txt(c, "=", 650, 950, { tam: 60, cor: "#fff", fonte: "inter", peso: 300, a: kC });
  E.numero(c, "200", 775, 950, kC, { tam: 96, cor: "#ff8a4c" }); E.txt(c, "ENCONTROS", 775, 1008, { tam: 22, cor: E.LARANJA, a: kC, esp: 0.3 });
}
