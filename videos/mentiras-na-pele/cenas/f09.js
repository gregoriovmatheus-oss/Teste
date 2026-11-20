/*META {"imports": ["pele"], "rotulos": [{"de": 1.79, "ate": 3.0, "top": 470, "texto": "<span class=\"k\">LULA · CROMATÓFOROS</span><br>Muda de cor em <span class=\"y\">&lt; 0,5 s</span>"}, {"de": 3.2, "ate": 5.04, "top": 470, "texto": "Imagine essa pele<br><span class=\"y\">em nós</span>"}], "D0": 5.04} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#02101c", "#0a3550"], nevoa: [6, 40], corNevoa: "#06233a", nuvens: 0, luz: 0.8 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xbfe4ff); st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.2; st.hemi.color.set(0x7cc8ff); st.hemi.intensity = 0.6;
        // lula: manto, nadadeiras, cabeça, olhos e 10 braços (primitivas arredondadas, pele de cromatóforos)
        const mL = PELE.cromoMat({ cs: 0.075 });
        const lula = new THREE.Group(); S.add(lula);
        const prof = []; for (let i = 0; i <= 20; i++) { const k = i / 20; prof.push(new THREE.Vector2(Math.max(0.001, 0.42 * Math.sin(Math.PI * Math.pow(k, 0.7)) * (1 - 0.35 * k)), k * 2.6)); }
        const manto = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), mL); manto.rotation.z = -Math.PI / 2; manto.position.x = 0.1; lula.add(manto);
        for (const s of [1, -1]) { const nad = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), mL); nad.scale.set(0.55, 0.03, 0.42); nad.position.set(2.35, 0, s * 0.3); nad.rotation.y = s * 0.5; lula.add(nad); }
        const cab = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mL); cab.scale.set(0.42, 0.3, 0.3); cab.position.x = -0.15; lula.add(cab);
        for (const s of [1, -1]) {
          const o = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.1, metalness: 0.3 })); o.position.set(-0.15, 0.06, s * 0.27); lula.add(o);
          const b = PELE.brilho(0xffffff, 0.08, "suave", 0.8); b.position.set(-0.2, 0.12, s * 0.37); lula.add(b);
        }
        const bracos = [];
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2, L = i >= 8 ? 2.2 : 1.3;
          const p = new THREE.Group(); p.position.set(-0.45, Math.sin(a) * 0.12, Math.cos(a) * 0.12); lula.add(p);
          const m = new THREE.Mesh(PELE.capGeo(i >= 8 ? 0.03 : 0.05, L, 3, 8), mL); m.rotation.z = Math.PI / 2; p.add(m);
          bracos.push({ p, a, L });
        }
        // neve marinha + raios de luz
        const NP = 500, pp = new Float32Array(NP * 3), rr = mulberry32(909);
        for (let i = 0; i < NP; i++) { pp[i * 3] = (rr() - 0.5) * 20; pp[i * 3 + 1] = (rr() - 0.5) * 14; pp[i * 3 + 2] = (rr() - 0.5) * 14; }
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
        S.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xbfe4ff, size: 0.035, transparent: true, opacity: 0.6, depthWrite: false })));
        for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 30), new THREE.MeshBasicMaterial({ color: 0x9fd6ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false })); r.position.set(-4 + i * 2.8, 8, -6); r.rotation.z = 0.3; S.add(r); }
        // 2ª parte: o braço humano com a mesma pele (cromatóforos em ondas)
        const B = PELE.bracoClose({ pele: 0xe8c8b0 });
        B.gift.visible = false;
        const mH = PELE.cromoMat({ cs: 0.32, base: 0xe9cdb6, onda: 1 });
        B.group.traverse((o) => { if (o.isMesh && o.material === B.pele) o.material = mH; });
        B.group.scale.setScalar(0.1); B.group.position.set(0, -30, 0); S.add(B.group);
        const TC = 3.11;
        function render(t) {
          // 0,65 → 1,13 s: de pálida a escura em 0,48 s
          const k = range(t, 0.65, 1.13);
          mL.u.uExp.value = t < 2.3 ? lerp(0.12, 1, ease.inOutCubic(k)) : lerp(1, 0.4, range(t, 2.3, 2.9)) ;
          mL.u.uOnda.value = range(t, 2.3, 2.9) * 0.8; mL.u.uT.value = t;
          mH.u.uT.value = t;
          bracos.forEach((b, i) => { b.p.rotation.set(0, Math.sin(b.a) * 0.25 + Math.sin(t * 2 + i) * 0.12, Math.cos(b.a) * 0.25 + Math.sin(t * 2.3 + i * 1.7) * 0.15); });
          lula.position.set(-t * 0.25, Math.sin(t * 1.2) * 0.08, 0);
          lula.rotation.set(0.15, 0.25, Math.sin(t * 0.8) * 0.05);
          st.vel = 0.7 * Math.max(0, 1 - Math.abs(t - TC) / 0.22); st.velT = t;
          if (t < TC) {
            const e = ease.inOutSine(range(t, 0, TC)), a = lerp(0.9, 0.2, e), R = lerp(4.2, 3.2, e);
            cam.position.set(lula.position.x + 1 + Math.sin(a) * R, lerp(1.2, 0.5, e), Math.cos(a) * R);
            cam.lookAt(lula.position.x + 0.9, 0, 0);
          } else {
            const u = range(t, TC, 5.04), e = ease.outCubic(u);
            B.group.rotation.set(0.2, -0.3, 0.55);
            cam.position.set(lerp(-0.2, 0.3, e), -30 + lerp(1.2, 0.7, e), lerp(2.6, 1.9, e));
            cam.lookAt(0.1, -30.05, 0);
          }
          st.sol(t < TC ? 0 : 0, 0, 5, t < TC ? 0 : -30);
          st.bloom = 0.5;
          st.draw();
          const c = st.ctx, aT = PELE.fade(t, 0.55, 1.75, 0.15);
          PELE.pilula(c, 540, 1330, 360, 110, aT);
          PELE.txt(c, "MUDANÇA DE COR", 540, 1305, { tam: 22, cor: PELE.AZUL, a: aT });
          PELE.txt(c, (0.48 * k).toFixed(2).replace(".", ",") + " s", 540, 1352, { tam: 48, cor: k >= 1 ? PELE.LARANJA : "#fff", a: aT, esp: 0.04 });
        }
