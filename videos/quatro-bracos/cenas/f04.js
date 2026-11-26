/*META {"imports": ["quatro"], "rotulos": [{"de": 1.45, "ate": 2.95, "texto": "o coração bombearia<br><span class=\"y\">mais sangue</span>"}, {"de": 3.05, "ate": 4.88, "texto": "e você comeria <span class=\"o\">mais</span><br>todos os dias"}], "D0": 4.88, "css": "__CSS__"} */
        const Q4 = QUATRO;
        await Q4.prepara();
        const st = Q4.palcoDoc(T, canvas, { fov: 34, ceu: "#0a0508", chao: 0x120c10 });
        const S = st.scene, cam = st.cam; st.rim.color.set(0xff6a4c);
        // coração estilizado (2 lóbulos + ponta), batendo
        const mc = new THREE.MeshStandardMaterial({ color: 0xb8222c, emissive: 0x5a0610, roughness: 0.35, metalness: 0.05, flatShading: true });
        const H = new THREE.Group(); H.position.set(0, 1.6, 0); S.add(H);
        [-1, 1].forEach((s) => { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 2), mc); l.position.set(s * 0.2, 0.12, 0); H.add(l); });
        const pt = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.62, 12), mc); pt.rotation.z = Math.PI; pt.position.y = -0.3; pt.scale.z = 0.65; H.add(pt);
        const ao = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.07, 6, 12, Math.PI), mc); ao.position.set(0.05, 0.42, 0); H.add(ao);
        const halo = Q4.brilho(0xff3a3a, 2.4, "suave", 0.4); H.add(halo);
        // sangue: partículas saindo do coração por 4 caminhos (2 azuis = braços de hoje, 2 laranja = braços novos)
        const N = 360, pos = new Float32Array(N * 3), cor = new Float32Array(N * 3), g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(cor, 3));
        const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: Q4.glowTex(), size: 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); pts.frustumCulled = false; S.add(pts);
        const DIR = [[1.6, 0.5], [-1.6, 0.5], [1.5, -0.35], [-1.5, -0.35]], r = mulberry32(5), PD = [];
        for (let i = 0; i < N; i++) PD.push([i % 4, r(), 0.25 + r() * 0.2, (r() - 0.5) * 0.12]);
        // pratos que aparecem em "comer mais"
        const pratos = [-0.9, 0, 0.9].map((x, i) => { const pg = new THREE.Group(); pg.position.set(x, 0.0, 0.9); S.add(pg);
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.05, 20), T.M(0xf2efe8, 0.35)); p.position.y = 0.03; pg.add(p);
          const rf = mulberry32(20 + i); for (let k = 0; k < 7; k++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + rf() * 0.05, 0), T.M([0xd9a23a, 0x5f8a3c, 0xb8442c, 0xe8d8b0][k % 4], 0.6));
            f.position.set((rf() - 0.5) * 0.35, 0.1, (rf() - 0.5) * 0.3); pg.add(f); }
          return pg; });
        const al = new THREE.Vector3();
        function render(t) {
          const fr = lerp(1.2, 1.9, range(t, 0.3, 2.0)), ph = (t * fr) % 1;
          const bat = Math.exp(-ph * 9) + 0.5 * Math.exp(-Math.max(0, ph - 0.18) * 11) * (ph > 0.18 ? 1 : 0);
          H.scale.setScalar(1 + 0.09 * bat); H.rotation.y = 0.25 * Math.sin(t * 0.6); halo.material.opacity = 0.3 + 0.5 * bat;
          const novos = range(t, 1.5, 2.1);
          PD.forEach((d, i) => { const [dx, dy] = DIR[d[0]], f = (d[1] + t * d[2] * 1.6) % 1, on = d[0] < 2 ? range(t, 0.2, 0.6) : novos;
            pos[i * 3] = dx * f + d[3]; pos[i * 3 + 1] = 1.6 + dy * f + Math.sin(f * 9 + d[1] * 6) * 0.04; pos[i * 3 + 2] = d[3] * 2;
            const c = d[0] < 2 ? [1.0, 0.18, 0.2] : [1.0, 0.45, 0.2], a = on * (1 - f) * (d[1] * 7 % 1 < on ? 1 : 0);
            cor[i * 3] = c[0] * a; cor[i * 3 + 1] = c[1] * a; cor[i * 3 + 2] = c[2] * a; });
          g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
          pratos.forEach((p, i) => p.scale.setScalar(Math.max(0.001, ease.outBack(range(t, 3.1 + i * 0.22, 3.6 + i * 0.22)))));
          // câmera: push-in no coração → tilt para baixo até os pratos
          const a = ease.inOutCubic(range(t, 2.7, 4.2)), e = range(t, 0, 4.88);
          cam.position.set(lerp(0.5, -0.3, e), lerp(1.9, 2.6, a), lerp(4.4, 3.6, e) + a * 0.6); al.set(0, lerp(1.0, 0.0, a), lerp(0, 0.6, a)); cam.lookAt(al);
          st.bloom = 0.75; st.draw();
          Q4.tag(st.ctx, "BRAÇOS NOVOS", new THREE.Vector3(1.2, 1.6 - 0.28, 0), cam, range(t, 2.0, 2.3) * (1 - range(t, 2.7, 2.9)), { cor: Q4.LARANJA, dy: -150, dx: -60 });
        }
