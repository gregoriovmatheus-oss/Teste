/*META {"imports": ["encontros"], "rotulos": [], "D0": 5.43} */
const E = ENCONTROS;
await E.prepara();
const st = E.palcoDoc(T, canvas, { fov: 36 });
const S = st.scene, cam = st.cam;
// um mar de pedras iguais ("parece infinito") que afunda; sobra uma só, que brilha ("escasso")
const N = 900, r = mulberry32(17), geo = new THREE.DodecahedronGeometry(0.06, 0);
const m = new THREE.MeshStandardMaterial({ color: 0x6a7078, roughness: 0.8 });
const im = new THREE.InstancedMesh(geo, m, N); im.frustumCulled = false; S.add(im);
const P = []; for (let i = 0; i < N; i++) { const a = r() * 6.283, d = 0.35 + Math.sqrt(r()) * 6; P.push([Math.cos(a) * d, Math.sin(a) * d - 2, r() * 6.283, 0.7 + r() * 0.6]); }
const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ color: 0xffc08a, emissive: 0xff8a4c, emissiveIntensity: 0.2, roughness: 0.15, metalness: 0.3, flatShading: true }));
gema.scale.y = 1.35; S.add(gema);
const halo = E.brilho(0xff8a4c, 1.4, "suave", 0), raios = E.brilho(0xffc08a, 1.6, "raios", 0); S.add(halo, raios);
const o = new THREE.Object3D(), al = new THREE.Vector3();
function render(t) {
  const afunda = ease.inOutCubic(range(t, 3.6, 4.6));
  for (let i = 0; i < N; i++) { const [x, z, rot, s] = P[i]; o.position.set(x, 0.05 - afunda * 0.2 * (0.6 + s * 0.4), z); o.rotation.set(rot, rot * 2, 0); o.scale.setScalar(s * (1 - afunda * 0.9) + 0.001); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.instanceMatrix.needsUpdate = true;
  const sobe = ease.outBack(range(t, 3.95, 4.7)); gema.position.set(0, 0.08 + sobe * 0.45, 0); gema.rotation.y = t * 0.9;
  gema.material.emissiveIntensity = 0.2 + 1.6 * range(t, 4.0, 4.6);
  halo.position.copy(gema.position); raios.position.copy(gema.position); halo.material.opacity = range(t, 4.1, 4.6) * (0.9 + 0.1 * Math.sin(t * 5)); raios.material.opacity = 0.7 * range(t, 4.3, 4.8); raios.material.rotation = t * 0.3;
  // câmera: voo rasante sobre as pedras até parar diante da única que sobrou
  const e = ease.inOutSine(range(t, 0, 3.9)), f = ease.inOutCubic(range(t, 3.9, 5.43));
  cam.position.set(lerp(-2.2, -0.4, e) + f * 0.4, lerp(0.9, 0.55, e) - f * 0.05, lerp(-3.6, 1.6, e) + f * 0.1); al.set(lerp(-0.4, 0, e), lerp(0.0, 0.18, e) + f * 0.3, lerp(-6, 0, e)); cam.lookAt(al);
  st.bloom = 0.9; st.draw();
  const c = st.ctx;
  E.txt(c, "VIÉS DE ESCASSEZ", 540, 690, { tam: 30, cor: E.AZUL, a: range(t, 1.06, 1.35), esp: 0.3 });
  E.txt(c, "PARECE INFINITO → NÃO VALORIZA", 540, 985, { tam: 28, cor: "#c8d0da", a: range(t, 2.08, 2.35) * (1 - range(t, 3.7, 3.9)), esp: 0.14 });
  E.txt(c, "ESCASSO → VALORIZA", 540, 985, { tam: 34, cor: E.LARANJA, a: range(t, 4.47, 4.7), esp: 0.2 });
}
