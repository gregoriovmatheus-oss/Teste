/*META {"imports": ["lowpoly", "cinema", "quatro"], "rotulos": [{"de": 1.05, "ate": 4.58, "texto": "<span class=\"k\">POLVO</span><br><span class=\"y\">2/3</span> dos neurônios<br>nos braços"}], "D0": 4.58, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, Q4 = QUATRO;
        await Q4.prepara();
        const st = LP.palco(canvas, { fundo: 0x04182a, foco: 2.2, faixa: 0.9, desfoque: 18, bloom: 1.1, nevoa: 0.09, corNevoa: 0x06263e, raios: 0.6 });
        const { S, cam } = st;
        LP.luz(st, "noite"); st.U.nevoa.value = 0.09; st.U.corNevoa.value.set(0.02, 0.15, 0.25); st.exposicao = 1.15;
        st.fria.color.set(0x9fd8ff); st.fria.position.set(0.5, 6, 1); st.sol(new THREE.Vector3(0.6, 6, -2), 1.0);
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 20, 20), LP.mat(0x2a3a3a, 0.95)); chao.rotation.x = -Math.PI / 2; S.add(chao);
        for (let i = 0; i < 14; i++) { const r = LP.mulberry32(40 + i), pd = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + r() * 0.35, 0), LP.mat(0x3a4a48, 0.9)); pd.position.set((r() - 0.5) * 6, 0.05, -1 - r() * 5); S.add(pd); }
        const neve = LP.poeira(S, { n: 220, centro: [0, 1.2, -0.5], raio: [2.5, 1.4, 2.0], cor: 0xbfe8ff, tam: 0.006, seed: 3 });
        const o = LP.polvo(5, 0xc45a3c); o.root.position.set(0, 0.35, 0); o.root.scale.setScalar(1.25); S.add(o.root);
        // neurônios: 1 terço no "cérebro" (manto), 2 terços ao longo dos 8 braços
        const nr = []; o.bracos.forEach((g0, k) => { let seg = g0.children.find((c) => c.isGroup), j = 0;
          while (seg) { if (j > 0 && j < 8) { const s = Q4.brilho(0x7cc8ff, 0.09, "suave", 0); s.position.z = 0.09; seg.add(s); nr.push({ s, k, j }); } seg = seg.children.find((c) => c.isGroup); j++; } });
        const cer = Q4.brilho(0x7cc8ff, 0.7, "suave", 0); cer.position.set(0, 0.55, 0); o.root.add(cer);
        const al = new THREE.Vector3();
        function render(t) {
          Q4.ondaPolvo(o, t, { amp: 1.2 });
          o.root.position.y = 0.35 + 0.05 * Math.sin(t * 1.3); o.root.rotation.y = 0.5 * Math.sin(t * 0.3) - 0.2;
          o.olhos.forEach((q) => q.abrir(0.75 - 0.7 * Math.max(0, Math.sin(t * 2.3 - 2)) ** 30));
          const acende = range(t, 1.1, 2.0);
          cer.material.opacity = 0.35 + 0.5 * range(t, 0.6, 1.0);
          nr.forEach(({ s, k, j }) => { const on = range(acende * 9, k + j / 8, k + j / 8 + 1.5) * 0.5 + range(acende, 0.0, 1.0) * 0.5;
            s.material.opacity = on * (0.6 + 0.4 * Math.sin(t * 7 + k * 2 + j)); });
          const e = ease.inOutSine(range(t, 0, 4.58));
          cam.position.set(lerp(-2.9, 2.3, e), lerp(2.5, 2.2, e), lerp(5.2, 4.9, e)); al.set(0, lerp(-0.35, -0.25, e), 0); cam.lookAt(al);
          neve.update(t); LP.focar(st, o.root.position);
          st.draw();
          Q4.tag(st.ctx, "NEURÔNIOS", nr[22].s.getWorldPosition(al), cam, range(t, 2.0, 2.3), { dx: 120, dy: -120 });
        }
