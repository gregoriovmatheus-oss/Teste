/*META {"imports": ["lowpoly", "cinema", "quatro"], "rotulos": [], "D0": 5.02, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, Q4 = QUATRO;
        await Q4.prepara();
        const st = LP.palco(canvas, { foco: 2.4, faixa: 1.0, desfoque: 18, bloom: 0.8 });
        const { S, cam } = st;
        LP.luz(st, "interior"); st.exposicao = 1.12;
        CI.cenario(S, "cozinha"); st.sol(new THREE.Vector3(-2.94, 1.6, -1.2), 1.0);
        const box = (w, h, d, c, x, y, z, r = 0.7) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP.mat(c, r)); m.position.set(x, y, z); S.add(m); return m; };
        box(1.9, 0.9, 0.62, 0x3a4250, 0, 0.45, 0.62); box(1.96, 0.05, 0.68, 0xe8e4dc, 0, 0.925, 0.62, 0.3);   // ilha
        // panela (direita), notebook (centro), vapor
        const pan = new THREE.Group(); pan.position.set(0.48, 0.95, 0.55); S.add(pan);
        const pc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.09, 16, 1, true), LP.mat(0x2a2a2e, 0.35, { side: THREE.DoubleSide })); pc.position.y = 0.045; pan.add(pc);
        const sopa = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), LP.mat(0xd9802a, 0.4)); sopa.rotation.x = -Math.PI / 2; sopa.position.y = 0.06; pan.add(sopa);
        const vap = CI.fumaca(S, { pos: [0.48, 1.02, 0.55], cor: 0xffffff, opac: 0.22, tam: 0.12, largura: 0.12, sobe: 0.6 });
        box(0.34, 0.02, 0.24, 0x2a2c32, -0.02, 0.96, 0.52, 0.3);
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.18), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8ab8ff).multiplyScalar(1.4) })); tela.position.set(-0.02, 1.04, 0.65); tela.rotation.x = -0.9; tela.rotation.y = Math.PI; S.add(tela);
        const tampa = box(0.34, 0.2, 0.012, 0x2a2c32, -0.02, 1.04, 0.656, 0.3); tampa.rotation.x = 0.9;
        const p = Q4.heroi(LP, { camisa: 0x3e6a8a }); S.add(p.root);
        const colher = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 5), LP.mat(0x8a6040)); colher.rotation.x = 1.2;
        const cel = CI.luzPratica(S, "celular", [0, 0, 0], { forca: 0.8 });
        LP.segurar(p, 0, colher, { pos: [0, -0.09, 0.08] }); LP.segurar(p, 1, cel.g, { pos: [0, -0.1, 0.04] }); cel.g.rotation.set(-0.4, 0, Math.PI / 2);
        const R = new THREE.Vector3(0, 1.66, 0), PAN = new THREE.Vector3(0.48, 1.0, 0.55), TEL = new THREE.Vector3(-0.02, 1.0, 0.62), v = new THREE.Vector3();
        function render(t) {
          const olho = t < 1.95 ? PAN : t < 2.7 ? TEL : t < 3.9 ? new THREE.Vector3(-0.52, 1.35, 0.42) : new THREE.Vector3(0.8, 1.6, 3);
          LP.ator(p, t, { seed: 7, emocao: ["foco", "alegre", range(t, 3.9, 4.4)], olharPara: olho, olharK: 0.85 });
          const k = ease.inOutCubic(range(t, 0.0, 0.6)), a = t * 5.5;
          LP.alcancar(p, 0, v.set(0.46 + 0.05 * Math.cos(a), 1.1, 0.5 + 0.05 * Math.sin(a)), 1, { polo: new THREE.Vector3(1, -0.3, -0.5) });
          LP.alcancar(p, 1, v.set(-0.5, 1.32 + 0.02 * Math.sin(t * 2), 0.38), 1, { polo: new THREE.Vector3(-1, -0.5, -0.3), maoGira: -0.6 });
          const tec = (i) => 0.012 * Math.max(0, Math.sin(t * 17 + i * 2.1));
          Q4.baixo(p, LP, [0.11, 0.99 + tec(0), 0.5], [-0.15, 0.99 + tec(1), 0.5], k, { gira: 0.2 });
          LP.punho(p, 0.7, 0); LP.punho(p, 0.6, 1);
          vap.update(t); cel.update(t);
          CI.trilho(cam, t, [[0, [0.55, 2.1, 3.9], [0, 1.08, 0.3]], [5.02, [-0.45, 2.05, 3.6], [0, 1.1, 0.3]]], { mao: 1, seed: 3 }); LP.focar(st, R);
          CI.preenche(st, R, { forca: 1.4 });
          st.draw();
          const c = st.ctx;
          Q4.tag(c, "COZINHAR", PAN, cam, range(t, 1.35, 1.6), { dx: 60, dy: -260 });
          Q4.tag(c, "DIGITAR", TEL, cam, range(t, 1.95, 2.2), { dx: 0, dy: -330 });
          Q4.tag(c, "CELULAR", cel.g.getWorldPosition(v), cam, range(t, 2.7, 2.95), { dx: -40, dy: -220 });
        }
