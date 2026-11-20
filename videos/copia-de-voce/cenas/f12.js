/*META {"imports": ["copia"], "rotulos": [{"de": 0.75, "ate": 2.15, "texto": "<span class=\"k\">FILÓSOFO · 1942–2017</span><br>Derek <span class=\"y\">Parfit</span>"}, {"de": 2.24, "ate": 4.5, "texto": "<span class=\"k\">IDENTIDADE ≠ O QUE IMPORTA</span><br>Identidade <span class=\"y\">não é</span> o essencial"}, {"de": 4.98, "ate": 7.23, "texto": "<span class=\"k\">O QUE IMPORTA</span><br>A <span class=\"y\">continuidade</span> da mente"}], "D0": 7.23} */
        // Só rótulo para Parfit. Um fio contínuo de mente vem do passado e atravessa as duas pessoas.
        const st = T.createToyStage(canvas, { ceu: "#03050b", nevoa: [8, 40], corNevoa: "#03050b", fov: 46, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        COPIA.estudio(st, { fundo: 0x03050b, raio: 40 }); st.bloom = 0.9;
        await COPIA.fontes();
        const sil = { cor: 0x1c2638, cor2: 0x141b28, cabelo: 0x0e131c };
        const EU = COPIA.pessoa({ ...sil, fase: 0.2 }), CO = COPIA.pessoa({ ...sil, fase: 0.2 });
        EU.emPe(-0.9, 0, -Math.PI / 2); CO.emPe(0.9, 0, -Math.PI / 2); S.add(EU.p, CO.p);
        EU.olhos(0); CO.olhos(0);
        const vidro = new THREE.MeshStandardMaterial({ color: 0x0c1220, roughness: 0.25, metalness: 0.6 });
        [EU, CO].forEach((h) => h.p.traverse((o) => { if (o.isMesh) o.material = vidro; }));
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        // o fio: do passado (fundo) até se dividir nas duas cabeças, e seguir adiante
        const tronco = new THREE.CatmullRomCurve3([V(0.3, 1.2, -34), V(-0.8, 2.2, -24), V(0.9, 1.0, -15), V(-0.4, 2.1, -7), V(0, 1.9, -2.2)]);
        const ramos = [-0.9, 0.9].map((x) => new THREE.CatmullRomCurve3([V(0, 1.9, -2.2), V(x * 0.6, 1.85, -1.0), V(x, 1.78, 0), V(x * 1.2, 1.9, 1.6), V(x * 1.6, 2.3, 4)]));
        const matF = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.85, toneMapped: false });
        S.add(new THREE.Mesh(new THREE.TubeGeometry(tronco, 120, 0.025, 6), matF));
        ramos.forEach((r) => S.add(new THREE.Mesh(new THREE.TubeGeometry(r, 40, 0.02, 6), matF)));
        const curvas = [tronco, ...ramos], NP = 260, pp = new Float32Array(NP * 3), pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
        const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.12, map: COPIA.glowTex("ponto"), color: 0xbfe6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        pts.frustumCulled = false; S.add(pts);
        const brilhos = [EU, CO].map(() => { const b = COPIA.brilho(0x7cc8ff, 0.9, 0); S.add(b); return b; });
        // memórias ao longo do fio (contas de luz que a câmera atravessa)
        for (let i = 0; i < 16; i++) { const b = COPIA.brilho(i % 4 ? 0x9fd6ff : 0xffd9a0, 0.9 + (i % 3) * 0.4, 0.8); b.position.copy(tronco.getPointAt(0.04 + i * 0.058)); S.add(b);
          const n = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); n.position.copy(b.position); S.add(n); }
        // poeira de fundo
        const rr = mulberry32(1212), NDust = 900, dp = new Float32Array(NDust * 3);
        for (let i = 0; i < NDust; i++) { dp[i * 3] = (rr() - 0.5) * 30; dp[i * 3 + 1] = rr() * 10; dp[i * 3 + 2] = -40 + rr() * 46; }
        const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
        S.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.05, color: 0x51708f, transparent: true, opacity: 0.6, depthWrite: false })));
        const v = new THREE.Vector3();
        function render(t) {
          EU.update(t, {}); CO.update(t, {});
          for (let i = 0; i < NP; i++) {
            const k = i % 3, c = curvas[k === 0 || i < 140 ? 0 : k], s = (i / NP * 7 + t * (c === tronco ? 0.08 : 0.25)) % 1;
            const p = c.getPointAt(s); pp[i * 3] = p.x; pp[i * 3 + 1] = p.y; pp[i * 3 + 2] = p.z;
          }
          pg.attributes.position.needsUpdate = true;
          [EU, CO].forEach((h, i) => { brilhos[i].position.copy(h.cabeca(0.04)); brilhos[i].material.opacity = 0.35 + 0.3 * range(t, 4.98, 5.8) + Math.sin(t * 3 + i) * 0.08; });
          // voo ao longo do fio, do passado até a frente dos dois
          const e = ease.inOutSine(range(t, 0, 6.6));
          const s = lerp(0.02, 0.98, e), p = tronco.getPointAt(Math.min(0.999, s));
          const fim = V(0.0, 1.7, 5.2);
          const k = ease.inOutCubic(range(t, 3.6, 7.23));
          cam.position.copy(p).add(V(2.6, 1.3, 4.5)).lerp(fim, k);
          const alvo = tronco.getPointAt(Math.min(1, s + 0.12)).lerp(V(0, 1.4, 0), k);
          cam.lookAt(alvo);
          st.sol(0, 0, 5);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          const ta = a * range(t, 5.6, 5.9);
          COPIA.tag(c, cam, EU.cabeca(0.04), "MENTE", { a: ta, dx: 70, dy: -200, sub: "CONTÍNUA" });
          COPIA.tag(c, cam, CO.cabeca(0.04), "MENTE", { a: ta, dx: -70, dy: -200, sub: "CONTÍNUA" });
        }
