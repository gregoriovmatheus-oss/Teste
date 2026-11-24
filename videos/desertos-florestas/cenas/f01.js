/*META {"imports": ["lowpoly", "cinema", "deserto"], "rotulos": [], "D0": 5.77, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, DS = DESERTO;
        await DS.prepara();
        const st = LP.palco(canvas, { fov: 30, foco: 1.1, faixa: 0.6, desfoque: 12, fundo: 0xe9cfa0, bloom: 0.9, raios: 0.5 });
        const { S, cam } = st; cam.far = 300; cam.updateProjectionMatrix();
        LP.luz(st, "dia"); st.U.nevoa.value = 0.018; st.U.corNevoa.value.set(0.93, 0.8, 0.62); st.exposicao = 1.05; st.U.split.value = 0.45;
        CI.ceu(S, { topo: 0x3a78c4, horizonte: 0xf4d9a8, nuvens: 0 });
        // sol alto à frente-esquerda: chave quente com sombra, céu azul de recorte
        st.fria.color.set(0xfff0d0); st.fria.intensity = 3.6; st.fria.position.set(-2.5, 5, 4);
        st.quente.color.set(0xffc890); st.quente.intensity = 0.9; st.rim.color.set(0xbfd8ff); st.rim.intensity = 2.2; st.rim2.color.set(0xffb070); st.rim2.intensity = 1.2;
        st.hemi.color.setHex(0xcfe0ff); st.hemi.groundColor.setHex(0xc89a5a); st.hemi.intensity = 0.75;
        const SOL = DS.brilho(0xfff0c8, 40, "suave", 0.95); SOL.position.set(-60, 70, 90); S.add(SOL);
        const DU = DS.dunas(S, LP.mat, { tam: 220, seg: 84, amp: 1.3, plano: 3, centro: [0, -60] });
        const y0 = DU.h(0, 0);
        const FL = DS.floresta(S, LP.mat, { n: 300, area: [[-70, 70], [-150, -22]], seed: 4, h: DU.h, alt: [2.2, 4.2], cor: 0x3a7a2e });
        const p = DS.viajante(LP); p.root.position.y = y0; S.add(p.root);
        const voltaAbas = DS.guardaAbas(p);
        const PO = LP.poeira(S, { n: 140, centro: [0, y0 + 0.6, -1], raio: [4, 0.6, 4], cor: 0xffd8a0, seed: 6, tam: 0.01 });
        // onda verde: nasce no horizonte à esquerda e corre até a duna
        const O = [-60, -150], dist = (x, z) => Math.hypot(x - O[0], z - O[1]);
        const frente = (t) => 175 * ease.inOutSine(range(t, 3.75, 5.75));
        const v3 = new THREE.Vector3(), rosto = new THREE.Vector3(), alvo = new THREE.Vector3(), hor = new THREE.Vector3(-14, 2.5, -60);
        const olhoA = new THREE.Vector3(9, y0 + 1.9, 30), olhoB = new THREE.Vector3(-18, y0 + 1.2, -40);
        let ultF = -1;
        function render(t) {
          st.T = Math.max(t, 0.17);   // frame 0 = miniatura: sem dip de entrada
          const F = frente(t);
          if (Math.abs(F - ultF) > 0.01 || ultF < 0) { DU.pintar((x, z) => (F - dist(x, z) + 6 * Math.sin(x * 0.4 + z * 0.3)) / 10); ultF = F; }
          FL.crescer((x, z, i, q) => LP.passa(clamp((F - dist(x, z) - 4 - 8 * q.v) / 9)));
          // corpo: parado na crista, peso no vento; em "de repente" (3,7 s) vira para trás
          const vira = ease.inOutCubic(range(t, 3.75, 4.6));
          p.reset(); voltaAbas();
          p.root.rotation.y = 0.25;
          p.root.updateMatrixWorld(true);
          LP.olharPara(p, olhoA, 0.8 * (1 - vira));
          LP.olharPara(p, olhoB, 0.95 * vira);
          p.bracos[1].om.rotation.x = -0.15; p.bracos[0].om.rotation.x = 0.1;
          const sur = range(t, 3.72, 4.0), aleg = range(t, 4.75, 5.3);
          const sol = { br: 0.24, by: 0.3, bo: [0.85, 0.35], ab: 0.4, ol: [0.2, 0.08], so: -0.12, su: 0.25 + 0.6 * range(t, 0, 3), pu: 0.7 };
          if (aleg > 0) p.emocaoMix("surpresa", "alegre", aleg, [-0.3, 0.02]);
          else p.emocaoMix(sol, "surpresa", sur, sur > 0 ? [-0.35, 0.0] : null);
          LP.vida(p, t, { seed: 21, balanco: 0.6, olhos: aleg === 0 && sur === 0 });
          PO.update(t * 2.2);
          // câmera: close 3/4 do rosto (miniatura) → empurra devagar → em "de repente" gira para trás do ombro e mostra o verde
          p.cab.getWorldPosition(rosto);
          const o = ease.inOutCubic(range(t, 3.8, 5.0)), push = ease.inOutSine(range(t, 0, 3.8));
          const ang = lerp(0.42 - 0.12 * push, 2.35, o), r = lerp(2.05 - 0.3 * push, 2.3, o) + 0.6 * Math.sin(Math.PI * o);
          cam.position.set(rosto.x + Math.sin(ang) * r, rosto.y + lerp(-0.05, 0.75, o), rosto.z + Math.cos(ang) * r);
          alvo.copy(rosto); alvo.y -= 0.3 * (1 - o);
          v3.copy(hor); alvo.lerp(v3, 0.85 * o);
          cam.lookAt(alvo);
          LP.camMao(cam, t, { intens: 0.8, seed: 2 });
          st.U.foco.value = lerp(cam.position.distanceTo(rosto), 45, ease.inOutCubic(range(t, 4.3, 5.0)));
          st.U.faixa.value = lerp(0.6, 30, range(t, 4.3, 5.0));
          st.sol(SOL.position, 0.45);
          st.draw();
          const c = st.ctx;
          DS.titulo(c, "UM EXPERIMENTO MENTAL", ["E se todos os *desertos*", "virassem *florestas*?"], 1 - range(t, 1.45, 1.85), { y: 820, tam: 72 });
          DS.etq(c, "SAARA · NORTE DA ÁFRICA", hor, cam, range(t, 1.9, 2.2) * (1 - range(t, 3.5, 3.75)), { dy: 0 });
        }
