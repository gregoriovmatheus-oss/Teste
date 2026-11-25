/*META {"imports": ["lowpoly", "cinema", "deserto"], "rotulos": [], "D0": 5.27, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, DS = DESERTO;
        await DS.prepara();
        const st = LP.palco(canvas, { fov: 32, foco: 1.6, faixa: 0.8, desfoque: 14, fundo: 0xcfe0e8, bloom: 0.8 });
        const { S, cam } = st; cam.far = 260; cam.updateProjectionMatrix();
        LP.luz(st, "dia"); st.U.nevoa.value = 0.012; st.exposicao = 1.1;
        CI.ceu(S, { topo: 0x4a88cc, horizonte: 0xf0e0b8, nuvens: 5, corNevoa: 0xffffff });
        st.fria.color.set(0xfff0d8); st.fria.intensity = 3.2; st.fria.position.set(2.5, 6, -1.5);
        Object.assign(st.fria.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); st.fria.shadow.camera.updateProjectionMatrix();
        st.quente.intensity = 1.2; st.hemi.intensity = 0.8;
        // oásis: chão verde no meio, areia ao longe; árvore grande de sombra; pomar em volta
        const DU = DS.dunas(S, LP.mat, { tam: 200, seg: 64, amp: 0.7, plano: 10, areia: 0xd8a862, verde: 0x5a8a34, centro: [0, -40] });
        DU.pintar((x, z) => (34 - Math.hypot(x, z + 6)) / 10);
        const ARV = CI.arvore(S, { pos: [0.6, 0, -1.6], alt: 6.5, cor: 0x3f7a34, seed: 3 });
        const FL = DS.floresta(S, LP.mat, { n: 90, pontos: (i, r) => { const a = r() * 6.283, d = 8 + r() * 22; return [Math.cos(a) * d, Math.sin(a) * d - 8]; }, seed: 6, h: DU.h, alt: [2.5, 4.5], cor: 0x3e7a30, detalhe: 0 });
        const frutaM = LP.mat(0xff8a1e, 0.45), mk = (x, y, z, s = 0.11) => { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), frutaM); f.scale.setScalar(s); f.position.set(x, y, z); ARV.add(f); return f; };
        for (let i = 0; i < 14; i++) mk(Math.sin(i * 2.3) * 1.3, 3.9 + Math.cos(i * 1.7) * 0.6, Math.cos(i * 2.9) * 1.2);
        const cesto = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.22, 10), LP.mat(0x9a6a34)); cesto.position.set(-0.75, 0.11, 0.25); S.add(cesto);
        for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1), frutaM); f.position.set(-0.75 + Math.sin(i) * 0.12, 0.25, 0.25 + Math.cos(i * 2) * 0.1); S.add(f); }
        const lenha = new THREE.Group(); lenha.position.set(-1.9, 0, -1.2); S.add(lenha);
        for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6), LP.mat(0x7a5434)); l.rotation.z = Math.PI / 2; l.position.set(0, 0.08 + Math.floor(i / 3) * 0.15, (i % 3) * 0.17 - 0.17 + (i > 2 ? 0.08 : 0)); lenha.add(l); }
        const AG = CI.agua(S, { tam: 3.2, seg: 10, cor: 0x2a7a9a, altura: 0.02, pos: [2.4, 0.06, 0.2] });
        // gente: mulher com a fruta (close), criança bebendo água, figurantes na sombra
        const p = LP.pessoa({ seed: 33, feminina: true, pele: 0x8a5a3c, cabelo: 0x1a1008, jaqueta: 0x2f8a7a, roupa: "camiseta", iris: 0x3a2414 });
        p.root.position.set(0, 0, 0.4); p.root.rotation.y = -0.25; S.add(p.root);
        const fruta = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1), frutaM);
        const cri = LP.figurante({ seed: 34, roupa: 0xe0b040, pele: 0x7a4a30, longo: false }); cri.root.scale.setScalar(0.62); cri.root.position.set(1.4, 0, 0.6); cri.root.rotation.y = -0.6; S.add(cri.root);
        const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.09, 8), LP.mat(0xcfe8ff, 0.1));
        const figs = [[-2.2, -2.4, 0.6, "sentado"], [-1.2, -3.2, 0.2, "sentado"], [2.8, -3.6, -0.8, "andar"], [3.6, -2.2, -1.4, "sentado"], [-3.4, -1.0, 1.0, "andar"], [1.2, -4.4, 0.3, "sentado"]].map(([x, z, ry, a], i) => {
          const f = LP.figurante({ seed: 50 + i, roupa: [0xc85a3a, 0x3a6ab0, 0xe8d8b0, 0x8a3a8a, 0x2f8a5a, 0xd8a030][i], pele: [0x8a5a3c, 0x6a4028, 0xb07c62, 0x9a6446, 0x5a3420, 0xa87050][i], longo: i % 2 === 0 });
          f.root.position.set(x, 0, z); f.root.rotation.y = ry; S.add(f.root); return [f, a, i]; });
        const alvo = new THREE.Vector3(), rosto = new THREE.Vector3(), boca = new THREE.Vector3(), mao = new THREE.Vector3(), sombraP = new THREE.Vector3(0.6, 4.2, -1.6);
        let preso = false;
        function render(t) {
          p.reset();
          p.root.updateMatrixWorld(true);
          if (!preso) { LP.segurar(p, 0, fruta, { pos: [0, -0.1, 0.05] }); preso = true; }
          // levanta a fruta perto do rosto e sorri; ri na palavra "água"
          p.cab.getWorldPosition(rosto);
          const lev = ease.inOutSine(range(t, 0.2, 1.4));
          mao.set(rosto.x + 0.18, rosto.y - lerp(0.75, 0.28, lev), rosto.z + 0.28);
          LP.alcancar(p, 0, mao, 1); LP.punho(p, 0.6, 0);
          LP.olharPara(p, mao, 0.4 * (1 - range(t, 2.6, 3.2)));
          p.emocaoMix("calmo", "alegre", ease.inOutSine(range(t, 0.3, 1.2)), [lerp(0.25, -0.05, range(t, 2.6, 3.2)), 0.05]);
          LP.vida(p, t, { seed: 33, olhos: false });
          // criança bebe
          cri.reset(); cri.root.updateMatrixWorld(true);
          if (!copo.parent || copo.parent === S) LP.segurar(cri, 0, copo, { pos: [0, -0.09, 0.04] });
          cri.cab.getWorldPosition(boca); boca.z += 0.12; boca.y -= 0.03 - 0.02 * Math.sin(t * 2);
          LP.alcancar(cri, 0, boca, ease.inOutSine(range(t, 2.7, 3.3)));
          cri.cab.rotation.x = -0.25 * range(t, 3.0, 3.4);
          LP.vida(cri, t, { seed: 34 });
          figs.forEach(([f, a, i]) => { f.reset(); if (a === "sentado") { LP.pose(f, "sentado", 1); f.root.position.y = -0.42; LP.gesticular(f, t, { seed: i, intens: 0.6 }); } else { const d = LP.andar(f, t + i, { vel: 0.7 }); f.root.position.x = [-3.4, 2.8][i === 2 ? 1 : 0] + (i === 2 ? -1 : 1) * 0.25 * ((d % 6) - 3) * 0.3; } LP.vida(f, t, { seed: 50 + i }); });
          CI.vento(ARV, t, { forca: 0.6 }); AG.update(t);
          // câmera: fruta + rosto → recua e sobe para o oásis inteiro (na "água" passa sobre o poço)
          const e = ease.inOutCubic(range(t, 1.0, 5.27));
          cam.position.set(lerp(0.55, 3.4, e), lerp(1.62, 3.3, e), lerp(1.75, 6.6, e));
          alvo.set(lerp(rosto.x + 0.08, 0.4, e), lerp(rosto.y - 0.32, 0.9, e), lerp(rosto.z, -1.6, e)); cam.lookAt(alvo);
          LP.camMao(cam, t, { intens: 0.7, seed: 6 });
          LP.focar(st, rosto); st.U.faixa.value = lerp(0.8, 6, e);
          st.draw();
          const c = st.ctx, fe = 1 - range(t, 4.35, 4.6);
          DS.etq(c, "SOMBRA", sombraP, cam, range(t, 1.6, 1.85) * fe, { dy: 0, dx: -200 });
          fruta.getWorldPosition(mao);
          DS.etq(c, "FRUTAS", mao, cam, range(t, 2.0, 2.25) * fe, { dy: 260, dx: 60 });
          DS.etq(c, "MADEIRA", lenha.position, cam, range(t, 2.45, 2.7) * fe, { dy: -60, dx: -40 });
          DS.etq(c, "ÁGUA", new THREE.Vector3(2.4, 0.1, 0.2), cam, range(t, 3.0, 3.25) * fe, { dy: -40, dx: 40 });
        }
