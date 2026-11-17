/*META {"imports": ["lua"], "rotulos": [{"de": 0.6, "ate": 3.3, "texto": "As marés<br><span class=\"y\">continuam</span>"}, {"de": 3.6, "ate": 4.93, "sai": false, "texto": "<span class=\"k\">SÓ A MARÉ DO SOL</span><br><span class=\"y\">~1/3</span><br>da altura"}], "D0": 4.93} */
        // f05 — terra (dia, time-lapse): praia dividida por um quebra-mar. Esquerda: maré de sizígia (Lua + Sol). Direita: só a maré solar, ~1/3 da altura.
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#4F8FD0", "#F3D6A8"], nevoa: [70, 320], nuvens: 10, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.4;
        const hgt = (x, z) => -0.11 * z - 1.5 + 0.12 * Math.sin(x * 0.4 + z * 0.2) + 2 * smoothstep(-40, -90, z);
        LUA.terreno(S, hgt, { w: 160, d: 200, seg: 80, cor: 0xc9ad7c, rough: 1, cz: -40 });
        const AM = [1.25, 0.42], P = 2.5;
        const nivel = (lado, t) => AM[lado] * Math.sin((t / P) * 6.283 - 1.2);
        const aguaMat = new THREE.MeshStandardMaterial({ color: 0x17536e, roughness: 0.4, metalness: 0.05, transparent: true, opacity: 0.95 });
        const espuma = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, transparent: true, opacity: 0.75 });
        const lados = [-1, 1].map((sx) => {
          const ag = new THREE.Mesh(new THREE.PlaneGeometry(60, 140, 30, 30), aguaMat); ag.rotation.x = -Math.PI / 2; ag.position.set(sx * 30, 0, 10); S.add(ag);
          const es = new THREE.Mesh(new THREE.PlaneGeometry(60, 0.9), espuma); es.rotation.x = -Math.PI / 2; es.position.x = sx * 30; S.add(es);
          // régua de maré listrada + boia
          const regua = new THREE.Group(); regua.position.set(sx * 5, 0, -14); S.add(regua);
          for (let i = 0; i < 12; i++) { const sg = T.mesh(T.roundBox(0.32, 0.5, 0.32, 0.03), i % 2 ? 0xf3efe6 : 0xd9583b, regua, 0.6); sg.position.y = -2.4 + i * 0.5; }
          const boia = T.mesh(T.SPH, 0xff8a2a, S, 0.4); boia.scale.setScalar(0.32);
          // barquinho que encalha na maré baixa
          const barco = new THREE.Group(); barco.scale.setScalar(0.6); S.add(barco);
          const casco = T.mesh(T.roundBox(3.2, 0.8, 1.3, 0.35), sx < 0 ? 0xe6e1d6 : 0x3d6fa6, barco, 0.5);
          const cab = T.mesh(T.roundBox(1.1, 0.7, 0.9, 0.12), 0xf6f1e8, barco, 0.5); cab.position.set(-0.3, 0.75, 0);
          return { sx, ag, es, regua, boia, barco };
        });
        const muro = T.mesh(T.roundBox(0.7, 5, 52, 0.15), 0x8f8a80, S, 0.95); muro.position.set(0, -3.4, -24); muro.scale.z = 44 / 52;
        for (let i = 0; i < 0; i++) { const pd = T.mesh(T.SPH, 0x7d776e, S, 0.95); const r = mulberry32(50 + i); pd.scale.set(1 + r(), 0.7 + r() * 0.5, 1 + r()); pd.position.set((r() - 0.5) * 3, 1.6 + r() * 0.3, -40 + i * 5); }
        st.sol(0, -12, 50);
        const zLinha = (L) => -(L + 1.5) / 0.11;
        const tp = new THREE.Vector3();
        function render(t) {
          for (const l of lados) {
            const L = nivel(l.sx > 0 ? 1 : 0, t);
            l.ag.position.y = L;
            const zw = zLinha(L);
            l.es.position.set(l.sx * 30, L + 0.03, zw + Math.sin(t * 5) * 0.15);
            l.boia.position.set(l.sx * 5 + 0.45 * l.sx, L + 0.1, -14);
            const bx = l.sx * 2.8, bz = -10;
            const yb = Math.max(L - 0.15, hgt(bx, bz) + 0.05);
            l.barco.position.set(bx, yb + (yb > L - 0.2 ? 0 : Math.sin(t * 3) * 0.05), bz);
            l.barco.rotation.z = yb > L - 0.16 ? 0.08 * l.sx : Math.sin(t * 2.4) * 0.04;
            l.barco.rotation.y = 0.3 * l.sx;
          }
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(Math.sin(t * 0.4) * 0.5, lerp(5.2, 4.2, e), lerp(14, 10, e));
          cam.lookAt(0, lerp(0.6, 1.0, e), -24);
          st.draw();
          const c = st.ctx, fa = LUA.borda(t, D);
          LUA.tag(c, "LUA + SOL (SIZÍGIA)", 280, 260, { a: fa, tam: 30, borda: "rgba(124,200,255,0.95)" });
          LUA.tag(c, "SÓ O SOL", 700, 260, { a: fa, tam: 30, borda: "rgba(255,138,76,0.95)" });
          LUA.tag(c, "TIME-LAPSE · 12 H", 540, 345, { a: fa * 0.85, tam: 22, fundo: "rgba(8,10,20,0.4)" });
          // colchetes de amplitude ao lado de cada régua
          const ab = range(t, 2.3, 2.8) * fa;
          if (ab > 0) for (const l of lados) {
            const k = l.sx > 0 ? 1 : 0;
            const [x1, y1] = LUA.proj(tp.set(l.sx * 5 - 1.0 * l.sx, AM[k], -14), cam);
            const [, y2] = LUA.proj(tp.set(l.sx * 5 - 1.0 * l.sx, -AM[k], -14), cam);
            c.save(); c.globalAlpha = ab; c.strokeStyle = k ? "#ff8a4c" : "#7cc8ff"; c.lineWidth = 5;
            c.beginPath(); c.moveTo(x1 - 14, y1); c.lineTo(x1, y1); c.lineTo(x1, y2); c.lineTo(x1 - 14, y2); c.stroke(); c.restore();
            LUA.tag(c, k ? "1/3" : "1×", x1 - l.sx * 60, (y1 + y2) / 2, { a: ab, tam: 34, cor: k ? "#ff8a4c" : "#7cc8ff" });
          }
        }
