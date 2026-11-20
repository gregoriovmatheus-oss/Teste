/*META {"imports": ["pausa"], "rotulos": [], "D0": 5.43} */
        // f02 — o mundo parado: pedestres congelados no meio do passo, pombos parados no ar, gotas suspensas.
        //       Só o protagonista anda entre eles. Relógio do mundo travado x relógio do corpo correndo.
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#1a2336", "#b0735a"], nevoa: [16, 140], corNevoa: "#4b4f60", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const R = PAUSA.ruaChuva(S, st);
        const TM = 1.17; // tempo do mundo congelado (o mesmo em todas as cenas da rua)
        R.update(0, TM, { k: 1 });
        const aura = PAUSA.glow(0xff8a4c, 2.6, S);
        function render(t) {
          const z = PAUSA.PROTA[2] - 0.95 * t;
          R.p.group.position.set(PAUSA.PROTA[0], 0, z);
          R.p.pose(t, { passo: 1.45 });
          aura.position.set(PAUSA.PROTA[0], 1.1, z); aura.material.opacity = 0.35 * PAUSA.vis(t, 1.3, 5.43, 0.4);
          st.bloom = 0.7;
          // câmera baixa à frente dele, em órbita lenta da esquerda para a direita, recuando junto
          const e = ease.inOutSine(range(t, 0, 5.43)), a = lerp(-0.75, 0.55, e);
          cam.position.set(PAUSA.PROTA[0] + Math.sin(a) * lerp(5.2, 4.2, e), lerp(0.9, 1.35, e), z - Math.cos(a) * lerp(5.2, 4.2, e));
          cam.lookAt(PAUSA.PROTA[0], lerp(1.35, 1.2, e), z);
          st.sol(0, 20, 50);
          st.draw();
          const c = st.ctx;
          const [px, py] = PAUSA.proj(new THREE.Vector3(PAUSA.PROTA[0], 2.05, z), cam);
          PAUSA.tag(c, px, py, px < 540 ? px + 180 : px - 180, py - 150, [["SÓ VOCÊ", PAUSA.LARANJA], ["1×", "#fff"]], { a: PAUSA.vis(t, 1.39, 2.6), cor: PAUSA.LARANJA });
          // dois relógios: o do mundo travado, o do seu corpo correndo
          const v2 = PAUSA.vis(t, 2.55, 5.43, 0.3), s = Math.max(0, t - 2.88) * 1.0;
          PAUSA.painel(c, 290, 1360, "MUNDO", "18:42:07", { a: v2, cor: PAUSA.AZUL, tam: 64, sub: "PARADO" });
          const ss = 7 + s, txt = "18:42:" + String(Math.floor(ss)).padStart(2, "0") + "." + Math.floor((ss % 1) * 10);
          PAUSA.painel(c, 790, 1360, "SEU CORPO", txt, { a: v2, cor: PAUSA.LARANJA, tam: 64, sub: "CONTANDO" });
        }
