/*META {"imports": ["lowpoly", "cinema", "regen"], "css": "    [data-composition-id=\"f07\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f07\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f07\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f07\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f07\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.1, "ate": 1.65, "texto": "Hospitais <span class=\"y\">mudariam</span>"}, {"de": 4.95, "ate": 6.86, "sai": false, "texto": "Ninguém ficaria<br>sem <span class=\"y\">perna</span>"}], "D0": 6.86} */
        const LP = LOWPOLY, CI = CINEMA, RG = REGEN;
        const st = LP.palco(canvas, { foco: 2.2, faixa: 0.8, desfoque: 18 });
        const { S, cam } = st;
        LP.luz(st, "dia"); st.hemi.intensity = 0.6; st.exposicao = 1.05;
        CI.cenario(S, "hospital"); CI.clima(st, "hospital");
        // paciente sentado na beira da cama; a perna direita (abaixo do joelho) cresce dentro do curativo-guia
        const p = LP.pessoa({ seed: 27, roupa: "pijama", jaqueta: 0x8fb0c8, pele: 0x9a6648, cabelo: 0x1a120c, barba: false });
        p.root.position.set(0.5, 0.33, -0.42); S.add(p.root);
        const perna = p.pernas[1];
        const tg = RG.texGuia(); tg.map.repeat.set(2, 2); tg.emissiveMap.repeat.set(2, 2);
        const gm = new THREE.MeshStandardMaterial({ map: tg.map, emissiveMap: tg.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.85, flatShading: true });
        const cur = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.07, 0.44, 12), gm); cur.position.y = -0.2; perna.j.add(cur);
        const brilho = RG.glowSprite(0x7cc8ff, 0.35, 0.6); perna.j.add(brilho); brilho.position.y = -0.42;
        // médica examina o curativo
        const m = LP.pessoa({ seed: 33, feminina: true, roupa: "jaleco", oculos: true, pele: 0xd9a07e, cabelo: 0x3a2214 });
        m.root.position.set(1.25, 0, 0.25); m.root.rotation.y = -Math.PI / 2 - 0.35; S.add(m.root);
        // prótese antiga no canto (some: não seria mais necessária)
        const pm = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.8, transparent: true });
        const prot = new THREE.Group(); prot.position.set(-0.55, 0, 0.05); S.add(prot);
        const ha = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), pm); ha.position.y = 0.33; prot.add(ha);
        const so = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5, transparent: true })); so.position.y = 0.66; prot.add(so);
        const pz = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.24), pm); pz.position.set(0, 0.04, 0.05); prot.add(pz);
        const v = new THREE.Vector3(), RP = new THREE.Vector3(0.5, 1.55, -0.38), RM = new THREE.Vector3(1.2, 1.6, 0.25);
        function render(t) {
          p.reset(); m.reset();
          LP.sentar(p, 1);
          p.pernas.forEach((l, i) => (l.j.rotation.x += 0.1 * Math.sin(t * 1.3 + i)));
          const k = lerp(0.3, 1, ease.inOutSine(range(t, 2.6, 6.6)));
          perna.j.scale.set(1, k, 1); perna.pe.scale.set(range(k, 0.75, 1) || 1e-3, (range(k, 0.75, 1) || 1e-3) / k, range(k, 0.75, 1) || 1e-3);
          gm.emissiveIntensity = 0.6 + 0.5 * Math.sin(t * 3) ** 2; brilho.material.opacity = 0.35 + 0.3 * Math.sin(t * 3) ** 2;
          p.root.updateMatrixWorld(true); cur.getWorldPosition(v);
          LP.olharPara(p, v, 0.6 * (1 - ease.inOutSine(range(t, 4.8, 5.6))));
          p.emocaoMix("surpresa", "alegre", ease.inOutSine(range(t, 3.5, 5.4)));
          LP.vida(p, t, { seed: 27, balanco: 0.3, olhos: false });
          // médica se inclina, toca o curativo e depois sorri para o paciente
          m.coluna.rotation.x = 0.35 * ease.inOutSine(range(t, 0.6, 2.0)) * (1 - ease.inOutSine(range(t, 4.6, 5.6)));
          LP.alcancar(m, 0, v.clone().add(new THREE.Vector3(0.09, 0.05, 0.0)), ease.inOutSine(range(t, 1.0, 2.2)) * (1 - ease.inOutSine(range(t, 4.6, 5.4))), { maoGira: 0.3 });
          LP.olharPara(m, t < 4.9 ? v : RP, 0.8);
          m.emocaoMix("foco", "alegre", ease.inOutSine(range(t, 4.8, 5.6)));
          LP.vida(m, t, { seed: 33, balanco: 0.3, olhos: false });
          // prótese desaparece
          const pf = 1 - ease.inOutSine(range(t, 2.7, 3.6)); pm.opacity = pf; so.material.opacity = pf; prot.visible = pf > 0.01;
          // câmera: sala aberta → desce até o curativo → grua de volta aos dois rostos
          CI.trilho(cam, t, [[0, [0.05, 1.75, 2.4], [0.6, 1.15, -0.3]], [2.2, [0.3, 1.2, 1.4], [0.45, 0.55, -0.1]], [4.3, [0.65, 0.95, 1.1], [0.45, 0.45, -0.05]], [5.4, [0.95, 1.55, 2.8], [0.7, 1.1, -0.3]], [6.86, [1.05, 1.6, 3.1], [0.7, 1.1, -0.3]]], { mao: 1, seed: 7 });
          cur.getWorldPosition(v);
          CI.focoEntre(st, RP, v, ease.inOutSine(range(t, 1.6, 2.4)) * (1 - ease.inOutSine(range(t, 4.7, 5.6))));
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          RG.frase(c, cam, v, "CURATIVO-GUIA", ease.outCubic(range(t, 2.8, 3.1)) * (1 - range(t, 4.6, 4.85)) * vv, { cor: RG.AZUL, tam: 32, dy: -160, dx: 160 });
          prot.localToWorld(v.set(0, 0.6, 0));
          RG.frase(c, cam, v, "PRÓTESE", ease.outCubic(range(t, 2.25, 2.5)) * (1 - range(t, 3.4, 3.7)) * vv, { cor: RG.LARANJA, tam: 32, dy: 40, dx: -40 });
        }
