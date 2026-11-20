/*META {"imports": ["copia"], "rotulos": [{"de": 1.9, "ate": 3.7, "texto": "<span class=\"k\">NEURÔNIOS DO CÓRTEX</span><br>Têm a sua <span class=\"y\">idade</span>"}, {"de": 3.75, "ate": 4.94, "texto": "Ficam a <span class=\"y\">vida inteira</span>"}], "D0": 4.94} */
        // Rede de neurônios dourados, fixos; em volta, as outras células piscam e se trocam o tempo todo.
        const st = T.createToyStage(canvas, { ceu: "#06050a", nevoa: [3, 14], corNevoa: "#06050a", fov: 46, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.bloom = 0.95;
        st.key.color.set(0xffe2b0); st.key.intensity = 1.4; st.hemi.intensity = 0.25; st.rim.color.set(0x7cc8ff); st.rim.intensity = 1.6;
        await COPIA.fontes();
        const ouro = new THREE.MeshStandardMaterial({ color: 0xffb84d, emissive: 0xc97a12, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.35 });
        const rr = mulberry32(707), V = (x, y, z) => new THREE.Vector3(x, y, z);
        const somas = [V(-0.4, 1.0, 0.6), V(1.3, 1.9, -0.8), V(-1.6, 2.4, -1.4), V(0.9, 0.1, -1.6), V(-1.2, -0.2, -0.6), V(2.0, 0.8, -2.6), V(-0.2, 3.0, -2.6), V(0.2, 1.6, -3.4), V(-2.3, 1.0, -2.8), V(1.6, 3.0, -1.9)];
        const somaG = new THREE.SphereGeometry(0.15, 16, 12), curvas = [];
        somas.forEach((p, i) => {
          const m = new THREE.Mesh(somaG, ouro); m.position.copy(p); m.scale.set(1, 1.35, 1); S.add(m);
          for (let d = 0; d < 5; d++) {
            const dir = V(rr() - 0.5, rr() - 0.3, rr() - 0.5).normalize(), L = 0.5 + rr() * 0.6;
            const c = new THREE.CatmullRomCurve3([p.clone(), p.clone().addScaledVector(dir, L * 0.4).add(V((rr() - 0.5) * 0.2, (rr() - 0.5) * 0.2, 0)), p.clone().addScaledVector(dir, L * 0.75).add(V((rr() - 0.5) * 0.3, 0, (rr() - 0.5) * 0.3)), p.clone().addScaledVector(dir, L)]);
            S.add(new THREE.Mesh(new THREE.TubeGeometry(c, 10, 0.018 * (1 - d * 0.08), 5), ouro));
          }
          // axônio até o vizinho
          const q = somas[(i + 3) % somas.length], mid = p.clone().lerp(q, 0.5).add(V((rr() - 0.5) * 0.8, (rr() - 0.5) * 0.8, (rr() - 0.5) * 0.8));
          const ax = new THREE.CatmullRomCurve3([p.clone(), mid, q.clone()]); curvas.push(ax);
          S.add(new THREE.Mesh(new THREE.TubeGeometry(ax, 24, 0.012, 5), ouro));
        });
        // impulsos correndo pelos axônios
        const NI = curvas.length * 3, ip = new Float32Array(NI * 3), ig = new THREE.BufferGeometry(); ig.setAttribute("position", new THREE.BufferAttribute(ip, 3));
        const imp = new THREE.Points(ig, new THREE.PointsMaterial({ size: 0.16, map: COPIA.glowTex("ponto"), color: 0xfff0c0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        imp.frustumCulled = false; S.add(imp);
        // as outras células: nascem e morrem o tempo todo (piscam)
        const NO = 2600, op = new Float32Array(NO * 3), oc = new Float32Array(NO * 3), og = new THREE.BufferGeometry(), OD = [];
        for (let i = 0; i < NO; i++) { op[i * 3] = (rr() - 0.5) * 7; op[i * 3 + 1] = -1 + rr() * 5; op[i * 3 + 2] = -5 + rr() * 6.5; OD.push([rr(), 0.8 + rr() * 1.6]); }
        og.setAttribute("position", new THREE.BufferAttribute(op, 3)); og.setAttribute("color", new THREE.BufferAttribute(oc, 3));
        const out = new THREE.Points(og, new THREE.PointsMaterial({ size: 0.07, map: COPIA.glowTex("ponto"), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        out.frustumCulled = false; S.add(out);
        const cz = new THREE.Color(0x6fa8e8);
        function render(t) {
          curvas.forEach((c, i) => { for (let k = 0; k < 3; k++) { const p = c.getPointAt(((t * 0.45 + i * 0.13 + k / 3) % 1)); ip.set([p.x, p.y, p.z], (i * 3 + k) * 3); } });
          ig.attributes.position.needsUpdate = true;
          for (let i = 0; i < NO; i++) { const [f, r] = OD[i], ph = (t * r + f) % 1, e = Math.sin(Math.PI * ph) ** 2 * 0.7; oc[i * 3] = cz.r * e; oc[i * 3 + 1] = cz.g * e; oc[i * 3 + 2] = cz.b * e; }
          og.attributes.color.needsUpdate = true;
          // dolly lento entrando na rede, com leve órbita
          const e = ease.inOutSine(range(t, 0, 4.94)), a = lerp(-0.35, 0.3, e);
          cam.position.set(Math.sin(a) * lerp(4.4, 3.0, e), lerp(1.7, 1.3, e), Math.cos(a) * lerp(4.4, 3.0, e) - 0.6);
          cam.lookAt(lerp(0.0, -0.3, e), lerp(1.4, 1.1, e), -1.2);
          st.sol(0, -1, 6);
          st.draw();
          const c = st.ctx, A2 = COPIA.vis(st);
          COPIA.tag(c, cam, somas[0], "NEURÔNIO DO CÓRTEX", { cor: COPIA.OURO, a: A2 * range(t, 0.53, 0.8) * (1 - range(t, 1.7, 1.9)), dx: 60, dy: -300, sub: "IDADE = A SUA" });
          const ano = Math.max(1, Math.round(80 * ease.inOutSine(range(t, 2.6, 4.6))));
          const ca = A2 * range(t, 2.5, 2.7);
          COPIA.txt(c, "ANOS DE VIDA", 540, 560, { tam: 24, cor: COPIA.OURO, a: ca });
          COPIA.txt(c, String(ano), 540, 612, { tam: 50, a: ca, esp: 0.04 });
        }
