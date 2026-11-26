/*META {"imports": ["quatro"], "rotulos": [{"de": 3.0, "ate": 6.55, "texto": "<span class=\"k\">COSTAS</span><br>um <span class=\"y\">2º par</span> de escápulas"}], "D0": 6.55, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const Q4 = QUATRO;
        await Q4.prepara();
        const st = Q4.palcoDoc(T, canvas, { fov: 32 });
        const S = st.scene, cam = st.cam;
        const osso = T.M(0xe9e1cf, 0.55), novo = new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0xff6a2c, emissiveIntensity: 0.6, roughness: 0.4 });
        const E = new THREE.Group(); S.add(E);   // esqueleto estilizado visto de costas (frente = -z)
        // coluna: 22 vértebras numa curva em S
        const vy = (i) => 0.95 + i * 0.045, vz = (i) => -0.05 * Math.sin(i / 21 * Math.PI * 1.6);
        for (let i = 0; i < 22; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.075 - i * 0.0012, 0.032, 0.06), osso); v.position.set(0, vy(i), vz(i)); E.add(v);
          const pr = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 4), osso); pr.rotation.x = -Math.PI / 2 - 0.4; pr.position.set(0, vy(i), vz(i) - 0.05); E.add(pr); }
        const cranio = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 2), osso); cranio.scale.set(0.9, 1.05, 1.1); cranio.position.set(0, 2.05, 0.03); E.add(cranio);
        const pelve = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 6, 14, Math.PI), osso); pelve.rotation.set(Math.PI / 2 + 0.3, 0, 0); pelve.scale.set(1.2, 1, 0.8); pelve.position.set(0, 0.92, 0.02); E.add(pelve);
        // costelas
        for (let i = 0; i < 10; i++) { const r = 0.16 + 0.05 * Math.sin((i + 2) / 12 * Math.PI); const c = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 4, 20, Math.PI * 1.55), osso);
          c.rotation.set(Math.PI / 2 + 0.25, 0, -Math.PI * 0.27 + Math.PI); c.scale.set(1, 0.75, 1); c.position.set(0, 1.25 + i * 0.045, 0.1); E.add(c); }
        // clavículas e escápulas (par de cima = hoje; par de baixo = novo)
        const escap = (y, s, m) => { const g = new THREE.Shape(); g.moveTo(0, 0); g.lineTo(s * 0.13, 0.02); g.lineTo(s * 0.03, -0.17); g.lineTo(0, 0);
          const e = new THREE.Mesh(new THREE.ExtrudeGeometry(g, { depth: 0.012, bevelEnabled: false }), m); e.position.set(s * 0.06, y, -0.1); E.add(e); return e; };
        const umero = (y, s, m) => { const u = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.3, 6), m); u.position.set(s * 0.24, y - 0.16, -0.02); u.rotation.z = s * 0.18; E.add(u);
          const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.032, 1), m); c.position.set(s * 0.21, y - 0.01, -0.02); E.add(c); return [u, c]; };
        [1, -1].forEach((s) => { escap(1.72, s, osso); umero(1.72, s, osso);
          const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.17, 5), osso); cl.rotation.z = Math.PI / 2 - s * 0.15; cl.position.set(s * 0.1, 1.74, 0.07); E.add(cl); });
        const NOVOS = []; [1, -1].forEach((s) => { NOVOS.push(escap(1.5, s, novo), ...umero(1.5, s, novo)); });
        // músculos novos: feixes translúcidos da coluna até as escápulas novas
        const musc = new THREE.MeshStandardMaterial({ color: 0xd8503a, emissive: 0xff5a3a, emissiveIntensity: 0.4, transparent: true, opacity: 0.6, roughness: 0.5 });
        const FEIXES = []; [1, -1].forEach((s) => { for (let j = 0; j < 4; j++) { const a = new THREE.Vector3(0, 1.3 + j * 0.06, -0.08), b = new THREE.Vector3(s * 0.15, 1.42 + j * 0.03, -0.13);
          const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 1, 3, 6), musc); m.position.copy(a).lerp(b, 0.5); m.lookAt(b); m.rotateX(Math.PI / 2); m.userData.L = a.distanceTo(b); E.add(m); FEIXES.push(m); } });
        const halo = Q4.brilho(0xff8a4c, 1.2, "suave", 0); halo.position.set(0, 1.45, -0.2); S.add(halo);
        const al = new THREE.Vector3();
        function render(t) {
          const kn = ease.outBack(range(t, 3.1, 3.8));
          NOVOS.forEach((m) => m.scale.setScalar(Math.max(0.001, kn)));
          const km = ease.outCubic(range(t, 4.75, 5.4));
          FEIXES.forEach((m) => { m.scale.set(1, Math.max(0.001, km) * m.userData.L, 1); m.visible = km > 0.01; });
          halo.material.opacity = 0.7 * range(t, 3.1, 3.5) * (1 - 0.5 * range(t, 4.5, 6.5));
          // órbita lenta por trás, aproximando do ombro
          const e = ease.inOutSine(range(t, 0, 6.55)), a = lerp(2.6, 3.55, e), d = lerp(4.5, 4.0, e);
          cam.position.set(Math.sin(a) * d, lerp(1.6, 1.5, e), Math.cos(a) * d); al.set(0, lerp(0.92, 0.96, e), 0); cam.lookAt(al);
          st.bloom = 0.55; st.draw();
          const c = st.ctx;
          Q4.tag(c, "COLUNA", new THREE.Vector3(0, 1.15, -0.05), cam, range(t, 1.25, 1.5) * (1 - range(t, 2.9, 3.1)), { dx: -170, dy: -40 });
          Q4.tag(c, "OMBROS", new THREE.Vector3(0.21, 1.71, -0.02), cam, range(t, 2.0, 2.25) * (1 - range(t, 2.9, 3.1)), { dx: 120, dy: -60 });
          Q4.tag(c, "ESCÁPULAS NOVAS", new THREE.Vector3(-0.12, 1.45, -0.1), cam, range(t, 3.6, 3.9) * (1 - range(t, 4.6, 4.75)), { cor: Q4.LARANJA, dx: 0, dy: -120 });
          Q4.tag(c, "MÚSCULOS NOVOS", new THREE.Vector3(0.08, 1.4, -0.11), cam, range(t, 4.8, 5.05), { cor: Q4.LARANJA, dx: 0, dy: -120 });
        }
