/*META {"imports": ["solkit"], "rotulos": [{"de": 2.5, "ate": 4.95, "top": 660, "texto": "<span class=\"k\">DISTÂNCIA SOL → TERRA</span><br><span class=\"y\">150 milhões</span> de km", "sai": false}], "D0": 4.95} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 50, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        st.bloom = 0.8;
        const stars = SK.ceuDoc(S, { seed: 31 });
        const SX = -60;
        const sol = SK.criaSol(S, { r: 4, pos: [SX, 0, 0], halo: 8 });
        const terra = await SK.terraDoc(S);
        const feixe = SK.criaFeixe(S, { raio: 3.4 });
        const frente = SK.brilho(0xfff0d0, 16, "suave", 1); S.add(frente);
        const anel = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.035, 8, 96), new THREE.MeshBasicMaterial({ color: 0xfff2d0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        anel.rotation.y = Math.PI / 2; S.add(anel);
        const rr = mulberry32(32), NS = 110;
        const stk = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.045, 0.045), new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), NS);
        stk.frustumCulled = false; S.add(stk);
        const sd = Array.from({ length: NS }, () => { const a = rr() * 6.283, r = Math.sqrt(rr()) * 3.2; return [rr() * 60, Math.cos(a) * r, Math.sin(a) * r, 0.8 + rr() * 2.4]; });
        // régua de distância (Sol -> Terra)
        const regua = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x8fb4e0, toneMapped: false }));
        regua.scale.x = (SX + 4) * -1 - 1.2; regua.position.set((SX + 4 - 1.2) / 2, -5.5, 0); S.add(regua);
        const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), regua.material, 16);
        const o3 = new THREE.Object3D(), X0 = SX + 4, X1 = -1.2;
        for (let i = 0; i <= 15; i++) { o3.position.set(lerp(X0, X1, i / 15), -5.5, 0); o3.scale.y = i % 5 ? 0.6 : 1.4; o3.updateMatrix(); ticks.setMatrixAt(i, o3.matrix); }
        S.add(ticks);
        const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), SUNDIR = new THREE.Vector3(-1, 0, 0);
        const tag = (p, s, o) => { const [x, y, z] = SK.proj(p, cam); if (z < 1 && x > 40 && x < 1040 && y > 180 && y < 1320) SK.txt(st.ctx, s, x, y, o); };
        function render(t) {
          sol.set(0.0, t);
          // a luz anda com velocidade constante: 150 milhões de km em 8 min 20 s
          const p = range(t, 0.25, 4.3), xf = lerp(X0, -1.05, p);
          const apaga = range(t, 4.3, 4.6);
          terra.set({ sol: SUNDIR, luz: 1 - apaga, cidades: 0.8, rotY: 1.6 + t * 0.05 });
          frente.position.set(xf, 0, 0); frente.material.opacity = 1 - apaga;
          anel.position.set(xf, 0, 0); anel.material.opacity = 0.55 * (1 - apaga);
          anel.scale.setScalar(1 + 0.04 * Math.sin(t * 20));
          feixe.de(new THREE.Vector3(xf, 0, 0), new THREE.Vector3(-0.2, 0, 0), 3.4, 1 - apaga);
          let k = 0;
          for (const [off, y, z, L] of sd) {
            const x = xf + off;
            const vis = x < -0.9 && apaga < 1;
            o3.position.set(Math.min(x, -0.9) - L / 2, y, z); o3.scale.set(vis ? L : 0.001, 1, 1); o3.rotation.set(0, 0, 0); o3.updateMatrix();
            stk.setMatrixAt(k++, o3.matrix);
          }
          stk.instanceMatrix.needsUpdate = true;
          // câmera persegue a frente de luz
          const e = ease.inOutSine(p);
          cam.position.set(xf - lerp(7, 9, e), lerp(3.4, 2.2, e), lerp(9, 7, e));
          cam.up.set(0, 1, 0);
          cam.lookAt(Math.min(xf + 16, 0), -0.6, 0);
          stars.set(1, t);
          st.draw();
          const c = st.ctx;
          tag(v.set(xf, 6.2, 0), "ÚLTIMA LUZ", { tam: 34, cor: "#FFE2A8", a: 1 - apaga });
          tag(v.set(xf, 8.6, 0), SK.mmss(p * 500), { tam: 64, fonte: "mono", peso: 600, esp: 0.02, a: range(t, 0.3, 0.6) });
          tag(v.set(SX, 6, 0), "SOL APAGADO", { tam: 30, cor: "#9fb6d8" });
          tag(v.set(0, -1.9, 0), "TERRA", { tam: 34, a: range(t, 1.5, 2.2) });
          for (const [i, s] of [[0, "0"], [5, "50"], [10, "100"], [15, "150 mi km"]]) tag(v.set(lerp(X0, X1, i / 15), -6.6, 0), s, { tam: 26, cor: "#9fc0ea" });
        }
