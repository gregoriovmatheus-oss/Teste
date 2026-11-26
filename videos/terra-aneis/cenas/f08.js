/*META {"imports": ["lowpoly", "cinema", "aneis"], "rotulos": [{"de": 0.4, "ate": 1.85, "top": 520, "texto": "<span class=\"k\">MENOS LUZ</span><br>invernos <span class=\"y\">mais frios</span>"}, {"de": 2.0, "ate": 4.62, "top": 520, "texto": "plantas e animais<br><span class=\"y\">se adaptando</span>"}], "D0": 4.62, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, AN = ANEIS;
        await AN.prepara();
        const st = LP.palco(canvas, { fov: 34, foco: 1.4, faixa: 0.8, desfoque: 10, fundo: 0x8a98a8, bloom: 0.8 });
        const { S, cam } = st;
        LP.luz(st, "frio"); CI.clima(st, "hospital"); st.U.nevoa.value = 0.03; st.exposicao = 0.95;
        CI.ceu(S, { topo: 0x4a5a70, horizonte: 0xa8b4c0, seed: 4 });
        // inverno no Brasil: o Sol fica ao norte, atrás do anel → vemos a face escura do anel, uma faixa cinza cortando o céu
        const C = AN.ceuAnel(S, { lat: -23, br: 1.2, op: 0.8, amb: 0.12, cor: 0xd8dce4, sombraA: 0.9 });
        C.u.uL.value.copy(C.dirSol(15, 30));
        AN.chao(S, LP, { cor: 0xd8e0ea, morro: 0xaab4c4, seed: 9, tufos: 400, raioTufo: 6, corTufo: 0x7a7458 });
        const arv = [CI.arvore(S, { pos: [-1.6, 0, -1.4], alt: 2.6, cor: 0xe8eef4, seed: 3 }), CI.arvore(S, { pos: [2.4, 0, -3.2], alt: 3.2, cor: 0xdfe6ee, seed: 5 })];
        const cao = CI.cachorro({ seed: 21, cor: 0x7a5434, corB: 0xe8d8c0 }); cao.root.position.set(0.75, 0, 0.35); cao.root.rotation.y = -0.6; S.add(cao.root);
        const p = LP.pessoa({ seed: 41, roupa: "casaco", cachecol: true, pele: 0x9a6a4a, cabelo: 0x1c120a, jaqueta: 0x6a2e24, camisa: 0x3a3a44 });
        S.add(p.root); p.root.rotation.y = 0.35;
        const NV = AN.neve(S, { n: 900, area: [9, 5, 9], centro: [0, 0, -1], vel: 0.6, tam: 0.05 });
        st.fria.position.copy(AN.dir(15, 30)).multiplyScalar(6); st.fria.color.set(0xd0dcf0); st.fria.intensity = 1.4;
        const rosto = new THREE.Vector3(), corpo = new THREE.Vector3();
        AN.semNaN(S);
        function render(t) {
          NV.update(t);
          cao.andar(t * 0.15, 0.3); cao.cab.rotation.y = 0.3 * Math.sin(t * 1.3);
          LP.ator(p, t, { seed: 41, pose: [["encolhido", 0.55]], tremer: 0.35, emocao: ["triste", "nervoso", range(t, 0.6, 1.6) * 0.6], olhar: [0.1, 0.25] });
          p.cab.getWorldPosition(rosto); p.root.getWorldPosition(corpo); corpo.y = 1.0;
          // close tremendo de frio → corte para o plano aberto: árvore congelada, o cão na neve
          if (t < 1.95) { CINEMA.plano(st, rosto, t, t / 1.95, "medio", { lado: -1, seed: 4 }); cam.rotateX(-0.1); }
          else { const k = ease.inOutSine(range(t, 1.95, 4.62)); cam.position.set(lerp(2.6, 2.2, k), lerp(1.2, 1.5, k), lerp(4.6, 4.0, k)); cam.lookAt(0.1, lerp(2.05, 2.15, k), -0.6); LP.camMao(cam, t, { seed: 6 }); st.U.foco.value = cam.position.distanceTo(corpo); st.U.faixa.value = 4; }
          st.draw();
        }
