/*META {"imports": ["solkit"], "rotulos": [{"de": 0.6, "ate": 2.0, "top": 680, "texto": "Relógio <span class=\"y\">interno</span>"}, {"de": 2.1, "ate": 3.25, "top": 680, "texto": "Aves aos <span class=\"y\">ninhos</span>"}, {"de": 3.35, "ate": 4.87, "top": 680, "texto": "Caçadores<br><span class=\"y\">noturnos</span>", "sai": false}], "D0": 4.87} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#040916", "#16243d"], nevoa: [18, 120], corNevoa: "#0e1829", nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environmentIntensity = 0.16; st.hemi.intensity = 0.3; st.hemi.color.setHex(0x7a93cc); st.rim.intensity = 0.6; st.rim.color.setHex(0x86a4e6);
        st.key.intensity = 0.55; st.key.color.setHex(0x9fb4ff);
        const stars = SK.estrelas(S, { n: 2400, r: 900, seed: 101 });
        const chao = T.mesh(new THREE.PlaneGeometry(400, 400), 0x22331c, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
        const rr = mulberry32(102);
        for (let i = 0; i < 26; i++) { const a = T.arvore(2.2 + rr() * 1.6, i % 2 ? 0x2f5a2a : 0x3d6a2c, 300 + i); const ang = rr() * 6.28, d = 14 + rr() * 50; a.position.set(Math.cos(ang) * d, 0, -Math.abs(Math.sin(ang)) * d - 6); S.add(a); }
        // árvore principal: tronco, galho com ninho, galho da coruja
        const tronco = T.mesh(new THREE.CylinderGeometry(0.45, 0.75, 11, 14), T.PAL.tronco, S, 0.9); tronco.position.set(0, 5.5, 0);
        const galho = T.mesh(new THREE.CylinderGeometry(0.14, 0.24, 4.6, 10), T.PAL.tronco, S, 0.9); galho.rotation.z = -1.15; galho.position.set(2.1, 6.4, 0.3);
        const galho2 = T.mesh(new THREE.CylinderGeometry(0.12, 0.22, 3.6, 10), T.PAL.tronco, S, 0.9); galho2.rotation.z = 1.2; galho2.position.set(-1.6, 8.2, 0.2);
        for (let i = 0; i < 6; i++) { const c = T.mesh(T.SPH, i % 2 ? 0x2f5a2a : 0x3d6a2c, S, 0.85); const s = 2.4 + rr() * 1.2; c.scale.set(s, s * 0.8, s); c.position.set((rr() - 0.5) * 4, 11.5 + rr() * 2, (rr() - 0.5) * 3 - 1); }
        const ninho = T.mesh(new THREE.TorusGeometry(0.55, 0.22, 8, 18), 0x7a5a36, S, 0.95); ninho.rotation.x = Math.PI / 2; ninho.position.set(3.7, 7.25, 0.3);
        const ninhoF = T.mesh(T.SPH, 0x5e4330, S, 0.95); ninhoF.scale.set(0.55, 0.18, 0.55); ninhoF.position.set(3.7, 7.1, 0.3);
        const NID = new THREE.Vector3(3.7, 7.25, 0.3);
        const aves = [0, 1, 2].map((i) => { const a = A.createAnimal("passaro", { cor: [0x4f9bd9, 0xd9583b, 0xe8b24a][i], fase: i * 0.3 }); a.group.scale.setScalar(1.6); S.add(a.group);
          a.p0 = new THREE.Vector3(-18 + i * 6, 15 + i * 2, -14 - i * 4); a.dest = NID.clone().add(new THREE.Vector3((i - 1) * 0.35, 0.05, (i - 1) * 0.15)); a.t1 = 1.9 + i * 0.35; return a; });
        const cor = SK.coruja(); cor.group.scale.setScalar(1.3); S.add(cor.group);
        const POUSO = new THREE.Vector3(-3.0, 8.95, 0.3);
        const morcegos = Array.from({ length: 11 }, (_, i) => { const m = SK.morcego(i + 1); m.group.scale.setScalar(1.4); S.add(m.group); m.o = [rr(), rr(), rr()]; return m; });
        const v = new THREE.Vector3(), q = new THREE.Vector3();
        function render(t) {
          aves.forEach((a, i) => {
            const u = range(t, 0.3 + i * 0.2, a.t1 + 0.6);
            const k = ease.inOutSine(u);
            v.lerpVectors(a.p0, a.dest, k); v.y += Math.sin(k * Math.PI) * 3;
            a.group.position.copy(v);
            q.subVectors(a.dest, a.p0); A.face(a.group, q.x, q.z);
            a.update(t, { voa: u < 1 ? 7 : 0 });
            if (u >= 1) a.group.rotation.y = -0.3 + i * 0.6;
          });
          // a coruja sai do galho e voa; morcegos atravessam o céu
          const cu = range(t, 3.3, 4.87);
          cor.group.position.set(POUSO.x - cu * 7, POUSO.y + Math.sin(cu * 3) * 0.8 + cu * 1.5, POUSO.z + cu * 9);
          cor.group.rotation.y = cu > 0 ? -2.0 : 0.6;
          cor.update(t, cu > 0 ? 3.2 : 0);
          morcegos.forEach((m, i) => {
            const [a, b, c] = m.o, u = t - 3.2 - a * 0.6;
            m.group.visible = u > 0;
            m.group.position.set(-14 + u * (7 + b * 4) + Math.sin(u * 5 + i) * 0.6, 10 + b * 5 + u * 1.2 + Math.sin(u * 7 + i) * 0.5, -6 - c * 8);
            m.group.rotation.set(0, 0, 0.15);
            m.update(t, 7 + b * 3);
          });
          // grua subindo junto ao tronco
          const e = ease.inOutSine(range(t, 0, 4.87));
          cam.position.set(lerp(5.5, 3.0, e), lerp(3.5, 8.8, e), lerp(16, 13, e));
          cam.lookAt(lerp(1.5, -0.5, e), lerp(7.5, 9.5, e), 0);
          st.sol(0, 0, 30);
          stars.set(1, t);
          st.draw();
        }
