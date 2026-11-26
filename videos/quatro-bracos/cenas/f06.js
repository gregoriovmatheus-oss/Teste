/*META {"imports": ["lowpoly", "cinema", "quatro"], "rotulos": [], "D0": 5.5, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, Q4 = QUATRO;
        await Q4.prepara();
        const st = LP.palco(canvas, { foco: 0.8, faixa: 0.3, desfoque: 24, bloom: 0.8 });
        const { S, cam } = st;
        LP.luz(st, "interior"); st.exposicao = 1.1;
        CI.cenario(S, "laboratorio"); CI.clima(st, "neutro");
        LP.bokeh(S, { n: 30, seed: 9, y: [0.8, 2.6], z: [-6, -3], cores: [0x7cc8ff, 0xfff0d0, 0x9fe0ff] });
        const p = LP.pessoa({ seed: 31, feminina: true, roupa: "camiseta", camisa: 0x8a5a9a, pele: 0xd9a07e, cabelo: 0x2a1a10, cabeloTipo: "liso" });
        p.root.position.set(0, 0, 0.4); S.add(p.root);
        // 6º dedo (polidactilia): cópia do mindinho ao lado dele, com controle próprio
        const b = p.bracos[0], m = b.dedos[3], ud = m.userData; m.userData = {}; const d6 = m.clone(true); m.userData = ud; d6.userData.f2 = d6.children.find((c) => c.isGroup);
        d6.position.set(2.45 * 0.021 * b.s, -0.082, 0.004); d6.rotation.z = 2.6 * 0.06 * b.s; d6.scale.setScalar(0.92); b.pulso.add(d6); b.mao.scale.x *= 1.18;
        const halo = Q4.brilho(0xff8a4c, 0.12, "suave", 0); d6.add(halo); halo.position.y = -0.05;
        const MAO = new THREE.Vector3(0.3, 1.6, 0.72), R = new THREE.Vector3(0, 1.64, 0.42), mw = new THREE.Vector3();
        function render(t) {
          const sobe = ease.inOutCubic(range(t, 0.2, 1.3));
          LP.ator(p, t, { seed: 31, emocao: ["duvida", "alegre", range(t, 3.6, 4.4)], olharPara: MAO, olharK: 0.8 * sobe });
          LP.alcancar(p, 0, MAO, sobe, { polo: new THREE.Vector3(1, -0.7, -0.4), maoGira: 0.5 });
          // dedos parados; só o 6º se mexe sozinho em "mover o dedo extra" (3,8 s)
          b.dedos.forEach((d) => { d.rotation.x = 0.12; d.userData.f2.rotation.x = 0.1; });
          const mexe = range(t, 3.75, 4.0) * (1 - range(t, 5.2, 5.5)), w = Math.max(0, Math.sin(t * 9));
          d6.rotation.x = 0.12 + 1.25 * mexe * w; d6.userData.f2.rotation.x = 0.1 + 1.2 * mexe * w;
          halo.material.opacity = 0.9 * range(t, 2.7, 3.0); halo.scale.setScalar(0.08 + 0.03 * Math.sin(t * 5));
          CI.trilho(cam, t, [[0, [0.55, 1.68, 2.6], [0.1, 1.3, 0.5]], [2.5, [0.5, 1.66, 2.25], [0.16, 1.33, 0.6]], [5.5, [0.42, 1.64, 2.0], [0.2, 1.36, 0.65]]], { mao: 1, seed: 4 });
          b.pulso.updateMatrixWorld(true); d6.getWorldPosition(mw);
          CI.focoEntre(st, R, mw, ease.inOutSine(range(t, 1.2, 2.4))); CI.preenche(st, R, { forca: 1.2 });
          st.draw();
          const c = st.ctx;
          Q4.tag(c, "6º DEDO", mw, cam, range(t, 2.75, 3.05), { cor: Q4.LARANJA, dx: 190, dy: 60 });
          Q4.numero(c, "6", 540, 830, range(t, 2.7, 3.0) * (1 - range(t, 3.6, 3.85)), { tam: 150 });
          Q4.txt(c, "DEDOS", 540, 925, { tam: 28, cor: Q4.AZUL, a: range(t, 2.75, 3.05) * (1 - range(t, 3.6, 3.85)), esp: 0.32 });
          Q4.txt(c, "MOVIDO SOZINHO", 540, 900, { tam: 28, cor: Q4.LARANJA, a: range(t, 3.9, 4.2), esp: 0.32 });
        }
