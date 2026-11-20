/*META {"imports": ["pausa"], "rotulos": [], "D0": 8.09} */
        // f07 — o preço: o coração batendo (≈ 1,16 batida/s = 100 mil por dia) e, ao recuar, um corpo inteiro feito de células
        //       que se renovam o tempo todo (330 bilhões por dia). Ao redor, as gotas continuam paradas: só o seu corpo corre.
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#06070c", "#140c12"], nevoa: [3, 26], corNevoa: "#07060a", nuvens: 0, exposicao: 1.15 });
        const S = st.scene, cam = st.cam;
        st.key.castShadow = false; st.key.color.set(0xffd2c0); st.key.intensity = 2.2; st.hemi.intensity = 0.35; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.4;
        const C = PAUSA.coracao(); C.scale.setScalar(0.075); C.position.set(0.04, 1.33, 0.02); C.rotation.set(0.1, -0.5, -0.3); S.add(C);
        const hg = PAUSA.glow(0xff3a3a, 0.6, S); hg.position.copy(C.position);
        // corpo de células (pontos com membrana e núcleo), volume humanoide de elipsoides
        const rr = mulberry32(707), E = [[0, 1.72, 0, 0.12, 0.14, 0.12, 1], [0, 1.24, 0, 0.21, 0.34, 0.13, 4], [0, 0.92, 0, 0.18, 0.12, 0.12, 1],
          [0.09, 0.45, 0, 0.08, 0.42, 0.08, 1.5], [-0.09, 0.45, 0, 0.08, 0.42, 0.08, 1.5], [0.29, 1.12, 0, 0.06, 0.33, 0.06, 1], [-0.29, 1.12, 0, 0.06, 0.33, 0.06, 1]];
        const tot = E.reduce((s, e) => s + e[6], 0), NC = 3200, CE = PAUSA.pontos(S, NC, { tam: 1, atenua: 140, forma: 1 }), CB = [];
        for (let i = 0; i < NC; i++) {
          let q = rr() * tot, e = E[0]; for (const x of E) { q -= x[6]; if (q <= 0) { e = x; break; } }
          let x, y, z; do { x = rr() * 2 - 1; y = rr() * 2 - 1; z = rr() * 2 - 1; } while (x * x + y * y + z * z > 1);
          CB.push([e[0] + x * e[3], e[1] + y * e[4], e[2] + z * e[5], rr(), 0.35 + rr() * 0.5, rr()]);
        }
        const ch = PAUSA.chuva(S, { n: 900, seed: 77, caixa: [-3, 3, -0.5, 3.5, -3, 2.5], tam: 0.5 }); ch.update(1.17, 1);
        const cA = [1, 0.55, 0.45], cB = [0.49, 0.78, 1];
        function render(t) {
          const p = C.bate(t, 1.16); hg.material.opacity = 0.25 + 0.5 * p;
          const corpo = ease.inOutSine(range(t, 2.6, 4.0));
          for (let i = 0; i < NC; i++) { // cada célula morre e é substituída por uma nova (clarão)
            const [x, y, z, ph, f, mix] = CB[i], k = (ph + t * f) % 1, nova = Math.exp(-k * 18);
            CE.P.set([x, y, z], i * 3);
            const c = mix < 0.75 ? cA : cB; CE.C.set([lerp(c[0], 1, nova), lerp(c[1], 1, nova), lerp(c[2], 1, nova)], i * 3);
            CE.Z[i] = 0.017 * (0.6 + 0.4 * Math.min(1, k * 8)) * (1 + nova * 0.8); CE.A[i] = corpo * (k > 0.88 ? (1 - k) / 0.12 : 1) * 0.7;
          }
          CE.sync();
          st.bloom = 0.75;
          // câmera: macro do coração, recua e sobe revelando o corpo de células
          const e = ease.inOutCubic(range(t, 0.2, 6.2)), a = lerp(0.6, -0.35, ease.inOutSine(range(t, 0, 8.09)));
          const d = lerp(0.42, 3.6, e);
          cam.position.set(Math.sin(a) * d, lerp(1.36, 1.25, e), Math.cos(a) * d);
          cam.lookAt(0, lerp(1.33, 1.05, e), 0);
          st.sol(0, 0, 4);
          st.draw();
          const c = st.ctx;
          const bat = Math.round(100000 * ease.outCubic(range(t, 1.0, 1.62)));
          PAUSA.painel(c, 540, 1350, "BATIDAS POR DIA", PAUSA.fmt(bat), { a: PAUSA.vis(t, 1.0, 3.0), cor: "#ff7a7a", tam: 84, sub: "≈ 1,16 POR SEGUNDO" });
          const cel = Math.round(330 * ease.outCubic(range(t, 3.9, 4.65)));
          PAUSA.painel(c, 540, 1350, "CÉLULAS TROCADAS POR DIA", cel + " bilhões", { a: PAUSA.vis(t, 3.85, 6.35), cor: PAUSA.AZUL, tam: 84 });
          PAUSA.painel(c, 540, 1350, "MUNDO PARADO", "seu corpo, não", { a: PAUSA.vis(t, 6.45, 8.09), cor: PAUSA.LARANJA, tam: 72 });
        }
