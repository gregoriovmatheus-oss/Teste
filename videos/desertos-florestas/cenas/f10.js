/*META {"imports": ["deserto"], "rotulos": [{"de": 1.7, "ate": 3.0, "top": 600, "texto": "<span class=\"k\">A POEIRA TRAZ FÓSFORO</span><br>menos <span class=\"y\">nutrientes</span>"}, {"de": 3.1, "ate": 5.68, "top": 600, "texto": "salvar um lugar<br>pode <span class=\"o\">enfraquecer</span><br>outro"}], "D0": 5.68, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#26402a", "#7a9a6a"], nevoa: [6, 46], corNevoa: "#3a5236", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xfff0c8); st.key.intensity = 2.4; st.hemi.color.set(0x9fd0a0); st.hemi.intensity = 0.55; st.rim.color.set(0x9fe08a); st.sol(0, -8, 30);
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), T.M(0x3a2c1c, 0.95)); chao.rotation.x = -Math.PI / 2; S.add(chao);
        // floresta alta: troncos altos + copas em cima; folhas do chão
        const r = mulberry32(31), N = 70, tg = new THREE.CylinderGeometry(0.22, 0.35, 1, 7); tg.translate(0, 0.5, 0);
        const TR = new THREE.InstancedMesh(tg, T.M(0x5a4634, 0.9), N); S.add(TR);
        const m4 = new THREE.Matrix4(); const TP = [];
        for (let i = 0; i < N; i++) { let x = (r() - 0.5) * 34, z = -r() * 50 + 6; if (Math.abs(x) < 1.6) x += Math.sign(x || 1) * 2.2; const h = 9 + r() * 8; TP.push([x, z, h]);
          m4.makeScale(0.8 + r() * 0.8, h, 0.8 + r() * 0.8).setPosition(x, 0, z); TR.setMatrixAt(i, m4); }
        const FL = DS.floresta(S, T.M, { n: N, pontos: (i) => [TP[i][0], TP[i][1]], h: (x, z) => 0, seed: 32, alt: [14, 16], cor: 0x2f6a26, detalhe: 1 });
        FL.crescer((x, z, i) => TP[i][2] / 15 * 1.05);
        const BX = DS.floresta(S, T.M, { n: 120, area: [[-14, 14], [-40, 4]], seed: 33, alt: [0.8, 1.6], cor: 0x3c7a2c, tipo: "muda" });
        // pó dourado (fósforo) caindo pelos fachos de luz; para de cair em "Sem essa poeira"
        const NP = 900, pp = new Float32Array(NP * 3), gp = new THREE.BufferGeometry(); gp.setAttribute("position", new THREE.BufferAttribute(pp, 3));
        const pm = new THREE.PointsMaterial({ map: DS.glowTex("suave"), color: 0xffd27a, size: 0.16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
        const PD = []; for (let i = 0; i < NP; i++) PD.push([(r() - 0.5) * 14, -r() * 26 + 2, r(), 0.12 + r() * 0.2]);
        const pts = new THREE.Points(gp, pm); pts.frustumCulled = false; S.add(pts);
        const fachos = [[-3, -8], [2.5, -14], [-1, -22]].map(([x, z]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 18, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); b.position.set(x, 9, z); b.rotation.z = 0.2; S.add(b); return b; });
        const verde = new THREE.Color(), amarelo = new THREE.Color(0x8f8a3a), alvo = new THREE.Vector3();
        function render(t) {
          const cai = 1 - range(t, 0.2, 1.4);
          pm.opacity = 0.9 * (0.15 + 0.85 * cai);
          PD.forEach((d, i) => { const f = (d[2] + t * d[3]) % 1, on = f < cai + 0.02 || i % 9 === 0; pp[i * 3] = d[0] + 0.3 * Math.sin(t + i); pp[i * 3 + 1] = on ? lerp(16, 0.2, f) : -40; pp[i * 3 + 2] = d[1]; });
          gp.attributes.position.needsUpdate = true;
          fachos.forEach((b, i) => (b.material.opacity = 0.08 * (0.55 + 0.45 * cai)));
          // copas amarelando (perde nutrientes)
          const am = 0.7 * ease.inOutSine(range(t, 1.7, 3.4));
          FL.pintar((q, i, cc) => cc.lerp(amarelo, am * (0.6 + 0.4 * q.v)));
          BX.pintar((q, i, cc) => cc.lerp(amarelo, am));
          const e = ease.inOutSine(range(t, 0, 5.68));
          cam.position.set(lerp(0.2, -0.4, e), lerp(1.7, 2.8, e), lerp(7, -3, e));
          alvo.set(lerp(0, 0.5, e), lerp(3.2, 6.5, e), lerp(-10, -20, e)); cam.lookAt(alvo);
          st.bloom = 0.6;
          st.draw();
          DS.etq(st.ctx, "POEIRA DO SAARA", new THREE.Vector3(-2.5, 4, -6), cam, range(t, 0.15, 0.4) * (1 - range(t, 1.3, 1.5)), { cor: "#ffd27a", dy: 80 });
        }
