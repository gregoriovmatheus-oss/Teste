/*META {"imports": ["lowpoly", "cinema", "regen"], "css": "    [data-composition-id=\"f13\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f13\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f13\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f13\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f13\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 3.1, "ate": 6.65, "sai": false, "texto": "O <span class=\"y\">mapa</span> ainda<br>está guardado"}], "D0": 6.65} */
        const LP = LOWPOLY, CI = CINEMA, RG = REGEN;
        const st = LP.palco(canvas, { foco: 1.6, faixa: 0.35, desfoque: 24 });
        const { S, cam } = st;
        LP.luz(st, "noite"); st.hemi.intensity = 0.4; st.exposicao = 1.05;
        CI.cenario(S, "quarto"); CI.gobo(S, { pos: [-2.4, 2.2, 0.2], girar: Math.PI / 2 }); CI.luzPratica(S, "abajur", [-1.1, 0.5, -1.6], { forca: 0.8 });
        LP.bokeh(S, { n: 34, seed: 7, y: [0.8, 2.8], z: [-6, -3], cores: [0x7cc8ff, 0xfff0d0, 0x9fe0ff] });
        const p = LP.pessoa({ seed: 12, jaqueta: 0x34465e, camisa: 0x1e232c, pele: 0xc68e6e, cabelo: 0x2e1c12 });
        p.root.position.set(0, 0, 0.3); S.add(p.root);
        const esq = p.bracos[0];
        // o "mapa" por dentro da mão: pontos azuis nas falanges e no dorso, acendendo da base para as pontas
        const mapa = [];
        esq.dedos.forEach((d, i) => { [d, d.userData.f2].forEach((o, j) => { const s = RG.glowSprite(0x7cc8ff, 0.035, 0); s.position.set(0, -0.03, 0.012); o.add(s); mapa.push([s, 0.3 + i * 0.08 + j * 0.25]); }); });
        for (let i = 0; i < 5; i++) { const s = RG.glowSprite(0x9fd6ff, 0.04, 0); s.position.set((i - 2) * 0.016, -0.04 - (i % 2) * 0.02, 0.03); esq.pulso.add(s); mapa.push([s, 0.05 + i * 0.05]); }
        const halo = RG.glowSprite(0x7cc8ff, 0.3, 0); esq.pulso.add(halo); halo.position.set(0, -0.08, 0.02);
        const MAO = new THREE.Vector3(0.25, 1.5, 0.74), ROSTO = new THREE.Vector3(0, 1.64, 0.36), mw = new THREE.Vector3();
        function render(t) {
          p.reset();
          LP.alcancar(p, 0, MAO, 1, { polo: new THREE.Vector3(1, -0.7, -0.4), maoGira: 0.4 + 0.25 * ease.inOutSine(range(t, 0.4, 2.2)) });
          p.bracos[1].om.rotation.x = -0.12;
          // dedos se abrem e fecham devagar, testando a mão nova
          const fl = 0.5 + 0.5 * Math.sin(t * 1.6 - 1.2);
          esq.dedos.forEach((d, i) => { d.rotation.x = 0.15 + 0.55 * fl * range(t, 0.3 + i * 0.1, 1.2 + i * 0.1); if (d.userData.f2) d.userData.f2.rotation.x = 0.2 + 0.5 * fl; });
          LP.olharPara(p, MAO, lerp(0.85, 0.55, ease.inOutSine(range(t, 3.6, 5.2))));
          p.emocaoMix("calmo", "alegre", 0.35 + 0.3 * ease.inOutSine(range(t, 1.6, 3.2)));
          LP.vida(p, t, { seed: 12, balanco: 0.5, olhos: false });
          const m = ease.inOutSine(range(t, 2.9, 4.0)) * (1 - 0.6 * range(t, 5.6, 6.6));
          mapa.forEach(([s, d]) => (s.material.opacity = 0.9 * m * range(t, 2.9 + d, 3.3 + d)));
          halo.material.opacity = 0.35 * m;
          // câmera: começa na mão e recua até o retrato do começo (mesma imagem de f01, agora com a mão inteira)
          CI.trilho(cam, t, [[0, [0.36, 1.56, 1.55], [0.12, 1.5, 0.5]], [3.0, [0.26, 1.54, 2.1], [0.12, 1.4, 0.45]], [6.65, [0.16, 1.5, 2.75], [0.1, 1.3, 0.4]]], { mao: 1, seed: 3 });
          esq.pulso.updateMatrixWorld(true); halo.getWorldPosition(mw);
          CI.focoEntre(st, mw, ROSTO, ease.inOutSine(range(t, 1.4, 2.6)));
          CI.preenche(st, ROSTO, { forca: 0.55 });
          st.draw();
        }
