/*META {"imports": ["pausa"], "rotulos": [{"de": 2.2, "ate": 4.15, "texto": "<span class=\"k\">VIDA MÉDIA NO PLANETA</span><br><span class=\"y\">73 anos</span>"}], "D0": 6.3} */
        // f08 — 73 anos ≈ 26.700 dias: uma parede de pontos, 1 coluna = 1 ano (366 linhas). Os dias acendem em ordem
        //       enquanto a câmera recua do primeiro dia até revelar a vida inteira.
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#04060c", "#0b1120"], nevoa: null, nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.key.castShadow = false;
        const COL = 73, LIN = 366, N = 26700, sp = 0.12, G = PAUSA.pontos(S, N, { tam: 1, atenua: 3000 });
        const x0 = -(COL - 1) * sp / 2, y0 = -(LIN - 1) * sp / 2;
        for (let i = 0; i < N; i++) { const cx = Math.floor(i / LIN), ly = i % LIN; G.P.set([x0 + cx * sp, y0 + ly * sp, 0], i * 3); G.Z[i] = 0.075; }
        const ch = PAUSA.chuva(S, { n: 1600, seed: 88, caixa: [-30, 30, -30, 30, -40, 20], tam: 2 }); ch.update(1.17, 1); ch.mat.uniforms.uA.value = 0.35;
        function render(t) {
          const aceso = N * ease.inOutSine(range(t, 0.25, 5.56));
          for (let i = 0; i < N; i++) {
            const k = clamp(aceso - i), novo = Math.exp(-Math.max(0, aceso - i) / 120);
            G.C.set(k > 0 ? [lerp(1, 0.95, 1 - novo), lerp(0.93, 0.85, 1 - novo), lerp(0.8, 0.7, 1 - novo)] : [0.12, 0.2, 0.32], i * 3);
            G.A[i] = k > 0 ? 0.75 + 0.6 * novo : 0.5; G.Z[i] = 0.075 * (1 + novo * 0.6);
          }
          G.sync();
          st.bloom = 0.6;
          // recua do 1º dia (canto de baixo, à esquerda) até ver a parede inteira
          const e = ease.inOutCubic(range(t, 0, 6.3));
          const tx = lerp(x0 + 0.6, 0, e), ty = lerp(y0 + 1.2, 0, e);
          cam.position.set(tx + lerp(0.6, 6, e), ty + lerp(-0.4, -4, e), lerp(2.2, 66, e));
          cam.lookAt(tx, ty, 0);
          st.draw();
          const c = st.ctx;
          PAUSA.painel(c, 540, 1360, "DIAS DE VIDA", PAUSA.fmt(Math.min(26700, aceso)), { a: PAUSA.vis(t, 0.3, 6.3), cor: PAUSA.AZUL, tam: 84, sub: t > 4.1 ? "≈ 26.700 DIAS" : "1 PONTO = 1 DIA" });
          PAUSA.texto(c, "1 COLUNA = 1 ANO", 540, 1520, { a: PAUSA.vis(t, 2.4, 6.3) * 0.9, cor: "#cfe3f5", tam: 24, alinha: "center", esp: 0.3 });
        }
