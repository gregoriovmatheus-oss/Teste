/*META {"imports": ["lowpoly", "cinema", "regen"], "css": "    [data-composition-id=\"f01\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f01\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f01\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f01\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f01\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.0, "ate": 2.42, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se você pudesse <span class=\"y\">regenerar</span> a mão?"}], "D0": 5.39} */
        const LP = LOWPOLY, CI = CINEMA, RG = REGEN;
        const st = LP.palco(canvas, { foco: 1.6, faixa: 0.35, desfoque: 24 });
        const { S, cam } = st;
        LP.luz(st, "noite"); st.hemi.intensity = 0.4; st.exposicao = 1.05;
        const Q = CI.cenario(S, "quarto"); CI.gobo(S, { pos: [-2.4, 2.2, 0.2], girar: Math.PI / 2 }); const ab = CI.luzPratica(S, "abajur", [-1.1, 0.5, -1.6], { forca: 0.8 });
        LP.bokeh(S, { n: 34, seed: 7, y: [0.8, 2.8], z: [-6, -3], cores: [0x7cc8ff, 0xfff0d0, 0x9fe0ff] });
        const p = LP.pessoa({ seed: 12, jaqueta: 0x34465e, camisa: 0x1e232c, pele: 0xc68e6e, cabelo: 0x2e1c12 });
        p.root.position.set(0, 0, 0.3); S.add(p.root);
        const esq = p.bracos[0];
        // atadura no fim do antebraço (a mão perdida fica sugerida: coto enfaixado, sem ferida à mostra)
        const atm = new THREE.MeshStandardMaterial({ map: RG.texAtadura(), color: 0xf6f4ee, roughness: 0.92, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0.22 });
        const at = new THREE.Group(); esq.cot.add(at); at.position.y = -0.22;
        const atC = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.064, 0.17, 10), atm); at.add(atC);
        const atP = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), atm); atP.position.y = -0.085; at.add(atP);
        // brilho de regeneração no punho
        const halo = RG.glowSprite(0x7cc8ff, 0.32, 0); esq.cot.add(halo); halo.position.y = -0.33;
        const luzR = new THREE.PointLight(0x7cc8ff, 0, 1.6, 1.8); esq.cot.add(luzR); luzR.position.set(0, -0.33, 0.05);
        const fa = Array.from({ length: 14 }, (_, i) => { const s = RG.glowSprite(0xbfe8ff, 0.03, 0); esq.cot.add(s); return s; });
        const MAO = new THREE.Vector3(0.25, 1.5, 0.74), ROSTO = new THREE.Vector3(0, 1.64, 0.36), mw = new THREE.Vector3();
        function render(t) {
          p.reset();
          LP.alcancar(p, 0, MAO, 1, { polo: new THREE.Vector3(1, -0.7, -0.4), maoGira: 0.4 });
          p.bracos[1].om.rotation.x = -0.12;
          LP.olharPara(p, MAO, 0.85);
          // a mão volta: palma primeiro, depois os dedos, um a um
          const k1 = ease.outCubic(range(t, 2.75, 4.1));
          esq.pulso.scale.setScalar(Math.max(1e-3, k1));
          esq.dedos.forEach((d, i) => d.scale.setScalar(Math.max(1e-3, ease.outBack(range(t, 3.2 + i * 0.14, 4.4 + i * 0.14)))));
          const solta = ease.inOutCubic(range(t, 2.45, 3.1));
          atP.scale.setScalar(Math.max(1e-3, 1 - solta)); at.scale.y = 1 - 0.45 * solta; at.position.y = -0.22 + 0.04 * solta;
          // expressão: aflito → surpresa → começa a sorrir
          const sur = ease.inOutSine(range(t, 2.7, 3.5)), sor = ease.inOutSine(range(t, 4.5, 5.3));
          if (sor > 0) p.emocaoMix("surpresa", "alegre", sor * 0.55); else p.emocaoMix("nervoso", "surpresa", sur);
          LP.vida(p, t, { seed: 12, balanco: 0.5, olhos: false });
          // brilho: pulso fraco desde o quadro 0 (miniatura), cresce quando a mão nasce
          const gl = 0.3 + 0.12 * Math.sin(t * 5) + 0.9 * ease.inOutSine(range(t, 2.5, 3.6)) - 0.45 * range(t, 4.6, 5.39);
          halo.material.opacity = Math.min(1, gl); halo.scale.setScalar(0.14 + 0.1 * gl); luzR.intensity = 0.9 * gl;
          fa.forEach((s, i) => { const a = i * 0.45 + t * (1.4 + (i % 3) * 0.4), r = 0.05 + 0.03 * Math.sin(t * 2 + i); s.position.set(Math.cos(a) * r, -0.33 - 0.06 * Math.sin(a * 0.7 + i), Math.sin(a) * r); s.material.opacity = Math.min(1, gl) * 0.85; });
          // câmera: retrato no quadro 0 → aproxima devagar → foco passa do rosto para a mão
          CI.trilho(cam, t, [[0, [0.16, 1.5, 2.75], [0.1, 1.3, 0.4]], [2.4, [0.22, 1.52, 2.45], [0.12, 1.34, 0.45]], [5.39, [0.32, 1.56, 1.95], [0.13, 1.42, 0.48]]], { mao: 1, seed: 3 });
          esq.cot.updateMatrixWorld(true); halo.getWorldPosition(mw);
          CI.focoEntre(st, ROSTO, mw, ease.inOutSine(range(t, 2.6, 3.4)) * (1 - 0.7 * range(t, 4.6, 5.3)));
          CI.preenche(st, ROSTO, { forca: 0.55 });
          st.T = Math.max(st.T, 0.18);
          st.draw();
          RG.quadro();
          RG.frase(st.ctx, cam, mw, "SEMANAS DEPOIS", ease.outCubic(range(t, 2.45, 2.75)) * (1 - range(t, 4.3, 4.6)), { cor: RG.AZUL, tam: 28, dy: 260, dx: 120 });
        }
