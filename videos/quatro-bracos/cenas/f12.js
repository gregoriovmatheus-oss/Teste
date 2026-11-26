/*META {"imports": ["lowpoly", "cinema", "quatro"], "rotulos": [], "D0": 5.82, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, Q4 = QUATRO;
        await Q4.prepara();
        const st = LP.palco(canvas, { foco: 3, faixa: 1.4, desfoque: 18, bloom: 0.9, raios: 0.6 });
        const { S, cam } = st;
        LP.luz(st, "por-do-sol"); st.exposicao = 1.15;
        CI.cenario(S, "rua", { seed: 4 }); CI.ceu(S, { topo: 0x2a3a6a, horizonte: 0xffa86a });
        st.sol(new THREE.Vector3(0, 3, -30), 1.0);
        const p = Q4.heroi(LP, { roupa: "camiseta", camisa: 0x8a4a3a }); S.add(p.root);
        // caixa de compras levada pelos braços de baixo; café e celular nas mãos de cima
        const cx = new THREE.Group(); S.add(cx);
        const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.26), LP.mat(0xb08a5a, 0.9)); cx.add(caixa);
        [[0x5f8a3c, -0.1], [0xd9a23a, 0.06], [0xb8442c, 0.12]].forEach(([c, x], i) => { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), LP.mat(c, 0.6)); f.position.set(x, 0.14, (i - 1) * 0.06); cx.add(f); });
        const cafe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.12, 10), LP.mat(0xf2ede4, 0.5)); LP.segurar(p, 0, cafe, { pos: [0, -0.09, 0.05] });
        const cel = CI.luzPratica(S, "celular", [0, 0, 0], { forca: 0.6 }); LP.segurar(p, 1, cel.g, { pos: [0, -0.1, 0.04] }); cel.g.rotation.set(-0.5, 0, Math.PI / 2);
        const F = [0, 1, 2, 3].map((i) => { const f = LP.figurante({ seed: 40 + i, roupa: [0x3d5a80, 0x7a3b3b, 0x4a6b4a, 0x6b5a7a][i], pele: [0xb07c62, 0xd9a07e, 0x7a4e36, 0xe0b898][i] }); S.add(f.root); return f; });
        const v = new THREE.Vector3(), L = (x, y, z) => p.root.localToWorld(v.set(x, y, z)).clone();
        function render(t) {
          const d = LP.ator(p, t, { seed: 7, andar: { vel: 0.9 }, emocao: ["calmo", "alegre", range(t, 3.0, 4.0)] });
          p.root.position.set(0.4, 0, -2 + d * 0.55); p.root.rotation.y = 0;
          p.root.updateMatrixWorld(true); LP.olharPara(p, L(-0.36, 1.3, 0.42), 0.6 * (1 - range(t, 4.2, 4.8)));
          cx.position.copy(L(0, 0.98, 0.33)); cx.rotation.y = 0; cx.position.y += 0.01 * Math.sin(t * 7);
          Q4.baixo(p, LP, [0.21, 0.98, 0.3], [-0.21, 0.98, 0.3], 1, { gira: 0.3 });
          LP.alcancar(p, 0, L(0.5, 1.05 + 0.03 * Math.sin(t * 3.5), 0.2), 1, { polo: new THREE.Vector3(1, -0.4, -0.5) });
          LP.alcancar(p, 1, L(-0.36, 1.3, 0.42), 1, { polo: new THREE.Vector3(-1, -0.5, -0.4), maoGira: -0.5 });
          LP.punho(p, 0.7, 0); LP.punho(p, 0.6, 1); cel.update(t);
          F.forEach((f, i) => { f.reset(); const df = LP.andar(f, t + i * 0.7, { vel: 0.8 + i * 0.1 }); LP.vida(f, t, { seed: 40 + i, balanco: 0.3 });
            const dir = i % 2 ? 1 : -1; f.root.rotation.y = dir > 0 ? 0 : Math.PI; f.root.position.set(i % 2 ? -3.1 : 3.2, 0.11, -6 - i * 2.2 + dir * df * 0.5); });
          const rz = p.root.position.z;
          CI.trilho(cam, t, [[0, [1.6, 1.55, rz + 3.3], [0.35, 0.92, rz]], [5.82, [-0.7, 1.5, rz + 3.4], [0.4, 0.92, rz]]], { mao: 1, seed: 9 });
          LP.focar(st, v.set(0.4, 1.4, rz));
          st.draw();
          const c = st.ctx;
          Q4.tag(c, "SEGURAR", L(0.21, 0.98, 0.3), cam, range(t, 2.8, 3.05) * (1 - range(t, 3.2, 3.3)), { cor: Q4.LARANJA, dy: -330, dx: 60 });
          Q4.tag(c, "APOIAR", L(-0.21, 0.98, 0.3), cam, range(t, 3.27, 3.5) * (1 - range(t, 3.75, 3.85)), { cor: Q4.LARANJA, dy: -330, dx: -60 });
          Q4.tag(c, "CARREGAR", L(0, 1.05, 0.33), cam, range(t, 3.83, 4.1), { cor: Q4.LARANJA, dy: -330 });
          Q4.txt(c, "QUASE NO AUTOMÁTICO", 540, 1280, { tam: 26, cor: Q4.AZUL, a: range(t, 4.4, 4.7), esp: 0.3 });
        }
