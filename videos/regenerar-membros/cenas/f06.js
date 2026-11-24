/*META {"imports": ["lowpoly", "cinema", "regen"], "css": "    [data-composition-id=\"f06\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f06\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f06\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f06\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f06\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [], "D0": 6.07} */
        const LP = LOWPOLY, CI = CINEMA, RG = REGEN;
        const st = LP.palco(canvas, { foco: 1.8, faixa: 0.6, desfoque: 20 });
        const { S, cam } = st;
        LP.luz(st, "interior"); st.exposicao = 1.08;
        CI.cenario(S, "cozinha");
        // mesa, cadeira e calendário na parede
        const mesa = new THREE.Group(); S.add(mesa); mesa.position.set(0, 0, 0.62);
        const tampo = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.8), LP.mat(0x7a5236, 0.6)); tampo.position.y = 0.74; mesa.add(tampo);
        for (const [x, z] of [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]]) { const pe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), LP.mat(0x5a3a26)); pe.position.set(x, 0.36, z); mesa.add(pe); }
        const cad = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), LP.mat(0x4a3424)); cad.position.set(0, 0.47, 0.02); S.add(cad);
        const cal = document.createElement("canvas"); cal.width = 128; cal.height = 160; const cg = cal.getContext("2d"); const calT = new THREE.CanvasTexture(cal); calT.colorSpace = THREE.SRGBColorSpace;
        const calM = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshStandardMaterial({ map: calT, roughness: 0.8, emissive: 0xffffff, emissiveMap: calT, emissiveIntensity: 0.25 })); calM.position.set(0.75, 1.75, -2.94); S.add(calM);
        const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO"];
        let mesAt = -1;
        const desenhaCal = (i) => { if (i === mesAt) return; mesAt = i; cg.fillStyle = "#f4f0e8"; cg.fillRect(0, 0, 128, 160); cg.fillStyle = "#c8443c"; cg.fillRect(0, 0, 128, 44);
          cg.fillStyle = "#fff"; cg.font = "700 30px sans-serif"; cg.textAlign = "center"; cg.fillText(MESES[i], 64, 33); cg.fillStyle = "#555";
          for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) cg.fillRect(10 + c * 16, 56 + r * 20, 10, 10); calT.needsUpdate = true; };
        // pratos: o prato da vez e a pilha de pratos vazios que cresce
        const pm = LP.mat(0xf2efe8, 0.3), pratos = [];
        for (let i = 0; i < 9; i++) { const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.022, 14), pm); pr.position.set(0.42, 0.775 + i * 0.024, 0.5); mesa.parent.add(pr); pratos.push(pr); }
        const prato = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.025, 16), pm); prato.position.set(-0.08, 0.78, 0.5); S.add(prato);
        const comida = []; const rc = mulberry32(61);
        for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03 + rc() * 0.02, 0), LP.mat([0xd9a040, 0x6a9a3a, 0xb8503a][i % 3], 0.6)); c.position.set(-0.08 + (rc() - 0.5) * 0.14, 0.81, 0.5 + (rc() - 0.5) * 0.14); S.add(c); comida.push(c); }
        const garfo = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.006), LP.mat(0xc8ccd2, 0.25, { metalness: 0.8 }));
        const p = LP.pessoa({ seed: 21, roupa: "camiseta", camisa: 0x3a6a8a, jaqueta: 0x3a6a8a, pele: 0xa8704e, cabelo: 0x1e140c });
        p.root.position.set(0, 0, 0); S.add(p.root);
        LP.segurar(p, 1, garfo, { pos: [0, -0.1, 0.05] });
        // braço esquerdo em regeneração: antebraço crescendo sob a atadura, com brilho
        const esq = p.bracos[0];
        const atm = new THREE.MeshStandardMaterial({ map: RG.texAtadura(), color: 0xf6f4ee, roughness: 0.92, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0.2 });
        const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), atm); esq.cot.add(ponta);
        const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.062, 0.12, 10), atm); esq.cot.add(faixa);
        const halo = RG.glowSprite(0x7cc8ff, 0.25, 0.7); esq.cot.add(halo);
        const ROSTO = new THREE.Vector3(0, 1.22, 0.05), v = new THREE.Vector3();
        function render(t) {
          p.reset();
          LP.sentar(p, 1);
          // garfadas: prato → boca, ~1,3 s cada
          const ciclo = (t * 0.78) % 1, sobe = Math.sin(Math.PI * Math.min(1, ciclo / 0.7)) ** 1.4;
          const boca = LP.pontoCabeca(p, "boca", 1).add(new THREE.Vector3(-0.02, -0.03, 0.12));
          const pr = new THREE.Vector3(-0.08, 0.86, 0.48);
          LP.alcancar(p, 1, pr.lerp(boca, sobe), 1, { polo: new THREE.Vector3(-1, -0.6, -0.2), maoGira: -0.3 });
          // braço esquerdo apoiado na mesa
          LP.alcancar(p, 0, new THREE.Vector3(0.22, 0.86, 0.45), 1, { polo: new THREE.Vector3(1, -0.4, -0.5) });
          const cres = lerp(0.45, 0.85, ease.inOutSine(range(t, 0.3, 6.0)));
          esq.pulso.scale.setScalar(1e-3); esq.manga[1].scale.y = cres; esq.manga[1].position.y = -0.15 * cres;
          ponta.position.y = -0.3 * cres; faixa.position.y = -0.3 * cres + 0.05; halo.position.y = -0.3 * cres - 0.02;
          halo.material.opacity = 0.55 + 0.25 * Math.sin(t * 4);
          LP.olharPara(p, pr, 0.35 * (1 - sobe));
          p.emocaoMix("foco", "alegre", 0.35 + 0.3 * Math.sin(t * 0.8));
          LP.falar(p, t, { seed: 4, intens: 0.45 });
          LP.vida(p, t, { seed: 21, balanco: 0.3, olhos: false });
          // comida some do prato; pilha de pratos vazios cresce
          const pilha = Math.floor(range(t, 2.6, 6.0) * 9 + 0.001);
          pratos.forEach((x, i) => (x.visible = i < pilha));
          comida.forEach((c, i) => (c.visible = ((t * 0.78 + i * 0.11) % 1) < 0.75));
          // passagem dos meses: calendário vira e a luz da janela pisca dia/noite
          const mes = Math.min(7, Math.floor(range(t, 0.4, 2.4) * 7.99)); desenhaCal(mes);
          const dia = 0.5 + 0.5 * Math.cos(range(t, 0.4, 2.4) * Math.PI * 2 * 7);
          st.fria.intensity = lerp(3.0, lerp(0.6, 3.0, dia), range(t, 0.4, 0.6) * (1 - range(t, 2.2, 2.4)));
          // câmera: 3/4 de frente, dolly lento até o rosto e o prato
          CI.trilho(cam, t, [[0, [1.3, 1.6, 3.0], [0.05, 0.85, 0.25]], [3.0, [1.0, 1.5, 2.6], [0.05, 0.88, 0.3]], [6.07, [0.7, 1.42, 2.2], [0.0, 0.92, 0.3]]], { mao: 1, seed: 6 });
          LP.focar(st, ROSTO);
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          RG.frase(c, cam, calM.position, "MESES", ease.outCubic(range(t, 1.95, 2.25)) * vv, { cor: RG.AZUL, tam: 34, dy: 330, dx: 60 });
          pratos[0].getWorldPosition(v); v.y += 0.12;
          RG.frase(c, cam, v, "MUITA ENERGIA", ease.outCubic(range(t, 3.58, 3.85)) * vv, { cor: RG.LARANJA, tam: 34, dy: 60, dx: 40 });
          RG.frase(c, cam, v, "COMER COMO UM ATLETA", ease.outCubic(range(t, 5.35, 5.6)) * vv, { cor: RG.LARANJA, tam: 30, dy: 160, dx: -40 });
        }
