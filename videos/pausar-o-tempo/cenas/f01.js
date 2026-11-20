/*META {"imports": ["pausa"], "rotulos": [{"de": 0.05, "ate": 2.15, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se você pudesse <span class=\"y\">pausar o tempo?</span>"}], "D0": 4.14} */
        // f01 — gancho: rua na chuva ao entardecer. Estalo de dedos (0,85 s): anel azul, a chuva desacelera em câmera lenta
        //       e vira contas de vidro paradas; a câmera passa pelo ombro do protagonista e atravessa as gotas congeladas.
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#1a2336", "#b0735a"], nevoa: [18, 150], corNevoa: "#4b4f60", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const R = PAUSA.ruaChuva(S, st);
        const AN = PAUSA.anel(S);
        // gota-herói (conta de vidro) por onde a câmera passa
        const heroi = new THREE.Mesh(PAUSA.SPH_L, new THREE.MeshStandardMaterial({ color: 0xdff0ff, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.55, envMapIntensity: 3 }));
        heroi.scale.setScalar(0.045); heroi.position.set(0.15, 1.5, 19.4); S.add(heroi);
        const hg = PAUSA.glow(0xcfe6ff, 0.35, S); hg.position.copy(heroi.position);
        const TS = 0.85;
        function render(t) {
          const tm = PAUSA.tMundo(t, TS, 0.32), k = ease.inOutSine(range(t, 0.95, 1.8));
          R.update(t, tm, { k });
          heroi.visible = hg.visible = t > 1.3;
          // protagonista levanta a mão e estala os dedos
          const br = lerp(0.05, 2.25, ease.outCubic(range(t, 0.15, 0.7))) - 0.15 * Math.sin(Math.PI * range(t, 0.8, 0.95));
          R.p.pose(tm, { braco: br, abre: -0.25 - 0.75 * range(t, 0.15, 0.7) });
          const fl = AN.update(t, TS, [0.92, 1.92, 24.95]);
          st.vel = Math.sin(Math.PI * range(t, TS, 1.9)) * 0.5; st.velT = t;
          st.bloom = 0.75 + 0.4 * fl;
          // câmera: sobre o ombro, depois atravessa as gotas paradas rumo à faixa congelada
          const e = ease.inOutSine(range(t, 0, 4.14)), e2 = ease.inOutCubic(range(t, 1.2, 4.14));
          cam.position.set(lerp(2.5, 0.35, e2), lerp(1.8, 1.55, e) + 0.12 * Math.sin(Math.PI * e2), lerp(30.8, 23.2, e) - e2 * 0.0);
          cam.lookAt(lerp(0.4, 0.2, e), lerp(1.75, 1.45, e), lerp(22, 12, e));
          st.sol(0, 20, 50);
          st.T = t + 0.2; // gancho: sem o dip de entrada no frame 0 (o vídeo começa já na chuva)
          st.draw(S, cam, fl > 0.01 ? { cor: "#dff1ff", a: fl * 0.35 } : null);
          // etiqueta na gota-herói: "chuva suspensa"
          const [hx, hy] = PAUSA.proj(heroi.position, cam);
          PAUSA.tag(st.ctx, hx, hy, 690, 560, [["CHUVA SUSPENSA", PAUSA.AZUL], ["0 m/s", "#fff"]], { a: PAUSA.vis(t, 2.35, 4.1, 0.3) });
        }
