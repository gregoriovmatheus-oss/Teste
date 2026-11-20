/*META {"imports": ["mente"], "rotulos": [{"de": 1.3, "ate": 2.9, "texto": "<span class=\"k\">GOLFINHOS</span><br>Já têm <span class=\"y\">nomes</span>"}, {"de": 3.0, "ate": 5.04, "texto": "<span class=\"k\">ASSOBIO-ASSINATURA</span><br>Lembrado por<br><span class=\"y\">20+ anos</span>"}], "D0": 5.04} */
        await MENTE.fontes();
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#2c8cb8", "#03141f"], nevoa: [4, 30], corNevoa: "#0b4460", luz: 0.8, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.75;
        const mar = MENTE.mar(st, { fundo: -4, seed: 51 });
        const D1 = A.createAnimal("golfinho", { fase: 0.1 }), D2 = A.createAnimal("golfinho", { fase: 0.6 });
        [D1, D2].forEach((d) => { MENTE.leve(d.group); S.add(d.group); });
        // assobio-assinatura: cadeia de pontos com um contorno de frequência próprio (sobe-desce-sobe)
        const NP = 260, wp = new Float32Array(NP * 3), wc = new Float32Array(NP * 3);
        const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.BufferAttribute(wp, 3)); wg.setAttribute("color", new THREE.BufferAttribute(wc, 3));
        const onda = new THREE.Points(wg, new THREE.PointsMaterial({ size: 0.2, map: MENTE.glowTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); onda.frustumCulled = false; S.add(onda);
        const NP2 = 200, wp2 = new Float32Array(NP2 * 3), wc2 = new Float32Array(NP2 * 3);
        const wg2 = new THREE.BufferGeometry(); wg2.setAttribute("position", new THREE.BufferAttribute(wp2, 3)); wg2.setAttribute("color", new THREE.BufferAttribute(wc2, 3));
        const onda2 = new THREE.Points(wg2, onda.material); onda2.frustumCulled = false; S.add(onda2);
        // anéis de som saindo da cabeça
        const aneis = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 48), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); S.add(m); return m; });
        const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), q = new THREE.Vector3();
        const assin = (u) => 0.25 * Math.sin(u * Math.PI * 2 * (2 + 3 * u)) * (0.6 + 0.4 * Math.sin(u * 9)); // contorno único
        const assin2 = (u) => 0.2 * Math.sin(u * Math.PI * 2 * (5 - 2 * u)) * Math.cos(u * 4);
        function render(t) {
          mar.update(t);
          const x0 = -1 + t * 0.9;
          D1.group.position.set(x0 + Math.sin(t * 0.8) * 0.1, 0.3 + Math.sin(t * 1.6) * 0.12, 0); D1.group.rotation.z = Math.cos(t * 1.6) * 0.12;
          D2.group.position.set(x0 + 3.0, -0.2 + Math.sin(t * 1.6 + 1) * 0.12, -1.6); D2.group.rotation.set(0, Math.PI - 0.15, Math.cos(t * 1.6 + 1) * 0.12);
          D1.update(t, { nada: 1.4 }); D2.update(t, { nada: 1.3 });
          // focinho de D1 → D2
          D1.group.updateMatrixWorld(true); D2.group.updateMatrixWorld(true);
          p1.set(1.3, 0, 0).applyMatrix4(D1.group.matrixWorld);
          p2.set(1.3, 0, 0).applyMatrix4(D2.group.matrixWorld);
          // assobio de D1 (1,7-3,2 s) viaja até D2
          const viaja = range(t, 1.7, 2.9);
          for (let i = 0; i < NP; i++) {
            const u = i / (NP - 1), vis = clamp((viaja * 1.25 - u) / 0.1) * (1 - range(t, 3.4, 4.0));
            q.lerpVectors(p1, p2, u);
            q.y += assin(u) * (1 + 0.15 * Math.sin(t * 9 + u * 30)); q.z += Math.sin(u * 20 - t * 8) * 0.03;
            wp[i * 3] = q.x; wp[i * 3 + 1] = q.y; wp[i * 3 + 2] = q.z;
            const hot = Math.exp(-((u - viaja * 1.2) ** 2) / 0.004);
            wc[i * 3] = (0.49 + hot) * vis; wc[i * 3 + 1] = (0.78 + hot * 0.3) * vis; wc[i * 3 + 2] = vis;
          }
          wg.attributes.position.needsUpdate = true; wg.attributes.color.needsUpdate = true;
          // resposta de D2 com OUTRA assinatura (3,0-4,2 s), em laranja-claro
          const volta = range(t, 3.0, 4.1);
          for (let i = 0; i < NP2; i++) {
            const u = i / (NP2 - 1), vis = clamp((volta * 1.25 - u) / 0.1) * (1 - range(t, 4.7, 5.04));
            q.lerpVectors(p2, p1, u); q.y += assin2(u) - 0.15; q.z += Math.cos(u * 18 - t * 8) * 0.03;
            wp2[i * 3] = q.x; wp2[i * 3 + 1] = q.y; wp2[i * 3 + 2] = q.z;
            wc2[i * 3] = vis; wc2[i * 3 + 1] = 0.6 * vis; wc2[i * 3 + 2] = 0.35 * vis;
          }
          wg2.attributes.position.needsUpdate = true; wg2.attributes.color.needsUpdate = true;
          aneis.forEach((m, i) => {
            const k = range(t, 1.6 + i * 0.25, 2.6 + i * 0.25);
            m.position.copy(p1); m.rotation.y = Math.PI / 2; m.scale.setScalar(0.1 + k * 1.4); m.material.opacity = k > 0 && k < 1 ? (1 - k) * 0.8 : 0;
          });
          // travelling lateral acompanhando os dois
          const e = ease.inOutSine(range(t, 0, 5.04));
          cam.position.set(x0 + lerp(0.2, 1.8, e), lerp(0.9, 0.2, e), lerp(5.2, 4.4, e));
          cam.lookAt(x0 + lerp(0.8, 1.6, e), lerp(0.1, 0.0, e), -0.7);
          st.sol(x0, 0, 8, -2);
          st.draw();
          // marcador "20+" no golfinho que respondeu (lembra o nome)
          const pp = MENTE.proj(p2, cam);
          MENTE.chamada(st.ctx, [pp[0], pp[1]], [pp[0], pp[1] + 150], range(t, 4.2, 4.5) * 0.9, "rgba(255,180,130,0.9)");
        }
