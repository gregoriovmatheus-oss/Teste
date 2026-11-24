/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f02\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f02\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f02\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f02\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f02\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.1, "ate": 2.7, "texto": "Parece <span class=\"y\">ficção</span>"}, {"de": 2.9, "ate": 4.35, "texto": "<span class=\"k\">AMBYSTOMA MEXICANUM</span><br>o <span class=\"y\">axolote</span>"}], "D0": 6.87} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#02121a", "#0b4452"], nevoa: [1.5, 9], corNevoa: "#07303a", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.color.set(0x8fe0ff); st.hemi.intensity = 0.7; st.key.color.set(0xd8f4ff); st.key.intensity = 2.6; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.2; st.sol(0, 0, 3, 0);
        st.bloom = 0.55;
        // fundo do lago: cascalho, pedras e plantas
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 40, 40), T.M(0x4a4436, 0.95)); chao.rotation.x = -Math.PI / 2;
        { const p = chao.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.05 * Math.sin(p.getX(i) * 2.1) * Math.cos(p.getY(i) * 1.7)); chao.geometry.computeVertexNormals(); }
        S.add(chao);
        const R = mulberry32(21);
        for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + R() * 0.25, 1), T.M([0x5a554a, 0x3e3a34, 0x6a6458][i % 3], 0.9)); r.position.set((R() - 0.5) * 6, 0.02, -1 - R() * 5); r.scale.y = 0.6; S.add(r); }
        const plantas = [];
        for (let i = 0; i < 18; i++) { const h = 0.5 + R() * 1.2; const pl = new THREE.Mesh(new THREE.ConeGeometry(0.03, h, 5), T.M(0x2f6a3a, 0.7)); pl.geometry.translate(0, h / 2, 0); pl.position.set((R() - 0.5) * 5, 0, -0.8 - R() * 4); S.add(pl); plantas.push([pl, R() * 6]); }
        // partículas em suspensão
        const NP = 360, pp = new Float32Array(NP * 3), J = Array.from({ length: NP }, () => [(R() - 0.5) * 5, R() * 2.4, (R() - 0.5) * 5 - 1, R() * 6.28]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
        S.add(new THREE.Points(pg, new THREE.PointsMaterial({ map: RG.glowTex(), color: 0xbfefff, size: 0.025, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })));
        // raios de luz vindos da superfície
        const raios = [];
        for (let i = 0; i < 5; i++) { const g = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 6), new THREE.MeshBasicMaterial({ map: RG.glowTex(), color: 0x7fdfff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
          g.position.set(-1.5 + i * 0.8, 2.5, -2 - i * 0.4); g.rotation.z = 0.25; S.add(g); raios.push(g); }
        const ax = RG.axolote(); ax.g.position.set(0, 0.62, 0); ax.g.scale.setScalar(0.85); S.add(ax.g);
        const pata = ax.patas[0];
        const gPata = RG.glowSprite(0x7cc8ff, 0.35, 0); pata.cot.add(gPata); gPata.position.set(0, -0.06, 0);
        const cor = RG.glowSprite(0xff5a6a, 0.3, 0); ax.corpo.add(cor); cor.position.set(0, -0.03, 0.2);
        const cer = RG.glowSprite(0x7cc8ff, 0.3, 0); ax.cab.add(cer); cer.position.set(0, 0.05, -0.02);
        const v = new THREE.Vector3();
        function render(t) {
          for (let i = 0; i < NP; i++) { const [x, y, z, ph] = J[i]; pp[i * 3] = x + 0.1 * Math.sin(t * 0.4 + ph); pp[i * 3 + 1] = (y + t * 0.05) % 2.4; pp[i * 3 + 2] = z + 0.1 * Math.cos(t * 0.3 + ph); }
          pg.attributes.position.needsUpdate = true;
          plantas.forEach(([pl, ph]) => (pl.rotation.z = 0.08 * Math.sin(t * 0.9 + ph)));
          raios.forEach((g, i) => (g.material.opacity = 0.06 + 0.04 * Math.sin(t * 0.7 + i * 1.3)));
          ax.nadar(t, 0.6);
          ax.g.rotation.y = 0.15 * Math.sin(t * 0.3);
          // "regenera patas": a pata da frente cresce de um toco com brilho
          const pk = ease.outBack(range(t, 3.85, 4.7));
          pata.g.scale.setScalar(lerp(0.12, 1, pk));
          gPata.material.opacity = 0.9 * range(t, 3.6, 3.9) * (1 - range(t, 4.9, 5.6));
          cor.material.opacity = range(t, 4.7, 4.9) * (0.55 + 0.35 * Math.pow(Math.abs(Math.sin(t * 3.6)), 6));
          cer.material.opacity = 0.8 * range(t, 6.05, 6.3);
          // câmera: de frente para o sorriso → abre e gira para o lado (as patas aparecem) → aproxima do corpo
          const a = ease.inOutCubic(range(t, 0, 3.6)), b = ease.inOutSine(range(t, 3.6, 6.87));
          const ang = lerp(0.12, 0.95, a) + 0.15 * b, dist = lerp(1.6, 2.5, a) - 0.3 * b;
          cam.position.set(Math.sin(ang) * dist, lerp(0.78, 0.95, a), Math.cos(ang) * dist + 0.1);
          cam.lookAt(0, lerp(0.42, 0.3, a), lerp(0.4, 0.05, a));
          st.bloom = 0.55 + 0.25 * range(t, 3.8, 4.2);
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          pata.cot.updateMatrixWorld(true); gPata.getWorldPosition(v);
          RG.frase(c, cam, v, "PATAS", ease.outCubic(range(t, 4.35, 4.6)) * vv, { cor: RG.AZUL, dy: 260, dx: 60 });
          cor.getWorldPosition(v); RG.frase(c, cam, v, "CORAÇÃO", ease.outCubic(range(t, 4.72, 4.97)) * vv, { cor: "#ff8a9a", dy: 320, dx: -140 });
          cer.getWorldPosition(v); RG.frase(c, cam, v, "PARTE DO CÉREBRO", ease.outCubic(range(t, 6.1, 6.35)) * vv, { cor: RG.AZUL, dy: 380 });
        }
