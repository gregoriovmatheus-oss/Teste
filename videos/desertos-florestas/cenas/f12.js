/*META {"imports": ["lowpoly", "cinema", "deserto"], "rotulos": [{"de": 4.3, "ate": 6.46, "top": 600, "texto": "<span class=\"k\">SAHEL · ~8.000 KM</span><br>Grande <span class=\"y\">Muralha Verde</span>"}], "D0": 6.46, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, DS = DESERTO;
        await DS.prepara();
        const st = LP.palco(canvas, { fov: 32, foco: 1.4, faixa: 0.6, desfoque: 14, fundo: 0xe8d0a0, bloom: 0.8, raios: 0.4 });
        const { S, cam } = st; cam.far = 320; cam.updateProjectionMatrix();
        LP.luz(st, "dia"); st.U.nevoa.value = 0.01; st.U.corNevoa.value.set(0.92, 0.82, 0.66); st.exposicao = 1.08;
        CI.ceu(S, { topo: 0x3f7cc0, horizonte: 0xf2d8a8, nuvens: 3 });
        st.fria.color.set(0xffeccc); st.fria.intensity = 3.4; st.fria.position.set(3, 5, 3);
        const SOL = DS.brilho(0xfff0c8, 40, "suave", 0.9); SOL.position.set(80, 60, -120); S.add(SOL);
        // deserto ao norte (-z), faixa de árvores em z ≈ -2, Sahel ao sul; a faixa cresce de oeste para leste
        const DU = DS.dunas(S, LP.mat, { tam: 260, seg: 64, amp: 0.6, plano: 4, areia: 0xdcaa68, verde: 0x4a7a2c, centro: [0, -60] });
        const FX = (t) => lerp(-130, 140, ease.inOutSine(range(t, 1.9, 5.6)));
        const FL = DS.floresta(S, LP.mat, { n: 330, pontos: (i, r) => [lerp(-130, 130, r()), -2 - r() * 9 + 1.2 * Math.sin(i)], seed: 9, h: DU.h, alt: [1.6, 3.0], cor: 0x2f6a28 });
        // trabalhadores plantando
        const p = LP.pessoa({ seed: 41, pele: 0x5a3422, cabelo: 0x120a06, jaqueta: 0x3a6aa8, roupa: "camiseta", barba: 0x1a1008, bone: 0xd8c8a0, iris: 0x2a1a0c });
        p.root.position.set(0, DU.h(0, 3), 3); p.root.rotation.y = Math.PI + 0.3; S.add(p.root);
        const muda = new THREE.Group(); const mt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.35, 5), LP.mat(0x6a4a2a)); mt.position.y = 0.17; muda.add(mt);
        const mf = LP.contorno(new THREE.Mesh(LP.facetado(1, () => {}, 4, 0.3), LP.mat(0x4a9a34)), 0.03); mf.scale.set(0.14, 0.16, 0.14); mf.position.y = 0.36; muda.add(mf);
        muda.position.set(0.05, DU.h(0.05, 2.4), 2.4); S.add(muda);
        const cova = new THREE.Mesh(new THREE.CircleGeometry(0.22, 10), LP.mat(0x8a5a30)); cova.rotation.x = -Math.PI / 2; cova.position.set(0.05, DU.h(0.05, 2.4) + 0.02, 2.4); S.add(cova);
        const figs = [-3, -1.6, 1.8, 3.4, 5.2].map((x, i) => { const f = LP.figurante({ seed: 60 + i, roupa: [0xd86a3a, 0xe8d8b0, 0x2f8a5a, 0xa83a3a, 0x6a5aa8][i], pele: [0x5a3422, 0x6a4028, 0x4a2a1a, 0x7a4a30, 0x5a3420][i], longo: i % 2 === 1 });
          f.root.position.set(x, DU.h(x, 2.2 + (i % 2)), 2.2 + (i % 2)); f.root.rotation.y = Math.PI + (i % 2 ? -0.3 : 0.3); S.add(f.root);
          const pa = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 4), LP.mat(0x7a5a3a)); return [f, pa, i]; });
        const alvo = new THREE.Vector3(), rosto = new THREE.Vector3(), mao = new THREE.Vector3(), belt = new THREE.Vector3(18, 2, -3);
        let preso = false, ultF = 1e9;
        function render(t) {
          const F = FX(t);
          if (Math.abs(F - ultF) > 0.3) { DU.pintar((x, z) => Math.max(clamp((F - x) / 6) * clamp(1 - Math.abs(z + 5) / 9), 0.28 * clamp((z - 4) / 10))); ultF = F; }
          FL.crescer((x, z, i, q) => LP.passa(clamp((F - x - 4 * q.v) / 8)));
          // ajoelha, firma a muda com as duas mãos e olha a faixa crescendo
          p.reset(); LP.pose(p, "sentado", 1); p.quadril.position.y = 0.42; p.coluna.rotation.x = 0.45; p.pernas.forEach((l) => { l.q.rotation.x = -1.2; l.j.rotation.x = 2.1; });
          p.root.updateMatrixWorld(true);
          mao.set(muda.position.x, muda.position.y + 0.22, muda.position.z);
          LP.alcancar(p, 0, mao.clone().add(new THREE.Vector3(0.05, 0, 0)), 1); LP.alcancar(p, 1, mao.clone().add(new THREE.Vector3(-0.05, -0.05, 0)), 1);
          const olha = range(t, 2.0, 2.8);
          LP.olharPara(p, mao, 0.6 * (1 - olha)); LP.olharPara(p, belt, 0.7 * olha);
          p.emocaoMix("foco", "alegre", range(t, 2.6, 3.4));
          LP.vida(p, t, { seed: 41, olhos: false, balanco: 0.3 });
          muda.scale.setScalar(1 + 0.25 * range(t, 1.2, 2.2));
          figs.forEach(([f, pa, i]) => { f.reset(); if (!preso) LP.segurar(f, 0, pa, { pos: [0, -0.08, 0.02] });
            const cav = Math.max(0, Math.sin(t * 2.6 + i * 1.3)); f.coluna.rotation.x = 0.35 + 0.35 * cav; f.bracos.forEach((b) => { b.om.rotation.x = -0.9 + 0.5 * cav; b.cot.rotation.x = -0.5; }); LP.vida(f, t, { seed: 60 + i }); });
          preso = true;
          // câmera: mãos e muda → grua alta: deserto de um lado, faixa verde até o horizonte
          p.cab.getWorldPosition(rosto);
          const e = ease.inOutCubic(range(t, 1.7, 5.4));
          cam.position.set(lerp(0.9, -14, e), lerp(rosto.y + 0.15, 24, e), lerp(4.3, 22, e));
          alvo.set(lerp(0.1, 10, e), lerp(rosto.y - 0.45, 0, e), lerp(2.5, -10, e)); cam.lookAt(alvo);
          LP.camMao(cam, t, { intens: 0.7, seed: 12 });
          st.U.foco.value = lerp(cam.position.distanceTo(rosto), 30, e); st.U.faixa.value = lerp(0.7, 40, e);
          st.sol(SOL.position, 0.4);
          st.draw();
          const c = st.ctx;
          DS.etq(c, "CINTURÃO VERDE NA BORDA", new THREE.Vector3(Math.min(F - 10, 20), 2, -4), cam, range(t, 2.9, 3.2) * (1 - range(t, 4.05, 4.25)), { dy: -80, cor: "#8fe08a" });
          DS.etq(c, "SAARA", new THREE.Vector3(-10, 1, -60), cam, range(t, 3.4, 3.7) * (1 - range(t, 4.05, 4.25)), { dy: 40, cor: DS.LARANJA });
        }
