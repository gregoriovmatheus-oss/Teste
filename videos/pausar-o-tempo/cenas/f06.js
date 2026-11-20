/*META {"imports": ["pausa"], "rotulos": [{"de": 0.95, "ate": 3.5, "texto": "<span class=\"k\">POR MÁGICA</span><br>Você ainda <span class=\"y\">vê e respira</span>"}, {"de": 3.65, "ate": 5.31, "sai": false, "texto": "Aí começa <span class=\"y\">o preço</span>"}], "D0": 5.31} */
        // f06 — "por mágica": do escuro total, faíscas azuis giram em volta do protagonista e a rua congelada volta a aparecer.
        //       Ele respira fundo (vapor). Grua: do nível da poça até o alto, olhando a multidão parada lá de cima.
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#1a2336", "#b0735a"], nevoa: [16, 140], corNevoa: "#4b4f60", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const R = PAUSA.ruaChuva(S, st);
        const TM = 1.17; R.update(0, TM, { k: 1 });
        const [px, , pz] = PAUSA.PROTA;
        const NF = 420, F = PAUSA.pontos(S, NF, { tam: 1, atenua: 200 }), rr = mulberry32(606), FB = Array.from({ length: NF }, () => [rr() * 6.28, 0.5 + rr() * 2.4, rr() * 3.2, 0.5 + rr()]);
        const NV = 60, V = PAUSA.pontos(S, NV, { tam: 1, atenua: 220, aditivo: true }), VB = Array.from({ length: NV }, () => [rr() - 0.5, rr() - 0.5, rr() - 0.5, rr()]);
        function render(t) {
          R.p.group.position.set(px, 0, pz); R.p.group.rotation.y = Math.PI / 2 + 0.4;
          const resp = Math.sin(Math.PI * range(t, 1.9, 3.1));
          R.p.pose(t, { respira: resp, cabeca: 0.15 * resp });
          const luz = ease.inOutSine(range(t, 0.5, 2.3));
          for (let i = 0; i < NF; i++) { // faíscas em espiral, abrindo enquanto a luz volta
            const [a0, r0, y0, v] = FB[i], a = a0 + t * v * 1.6, r = r0 * (0.4 + 0.9 * luz), y = (y0 + t * 0.5 * v) % 3.4;
            F.P.set([px + Math.cos(a) * r, y, pz + Math.sin(a) * r], i * 3); F.C.set([0.49, 0.78, 1], i * 3); F.Z[i] = 0.09; F.A[i] = (0.4 + 0.6 * Math.sin(t * 7 + a0 * 5) ** 2) * (1 - range(t, 3.2, 4.6));
          }
          F.sync();
          for (let i = 0; i < NV; i++) { // vapor da respiração saindo da boca
            const [dx, dy, dz, k] = VB[i], u = range(t, 2.8 + k * 0.4, 4.2 + k * 0.4);
            V.P.set([px + 0.25 + dx * 0.4 * u + 0.5 * u, 1.75 + dy * 0.3 * u + 0.15 * u, pz - 0.3 + dz * 0.4 * u - 0.6 * u], i * 3); V.C.set([0.8, 0.88, 0.95], i * 3); V.Z[i] = 0.25 + u * 0.4; V.A[i] = 0.18 * Math.sin(Math.PI * u);
          }
          V.sync();
          st.bloom = 0.8;
          const e = ease.inOutCubic(range(t, 0, 5.31));
          const a = lerp(2.4, 3.6, e), d = lerp(3.2, 8.5, e);
          cam.position.set(px + Math.sin(a) * d, lerp(0.35, 6.2, e), pz + Math.cos(a) * d);
          cam.lookAt(px, lerp(1.6, 0.8, e), pz);
          st.sol(0, 20, 50);
          st.draw(S, cam, { cor: "#000000", a: 1 - luz });
        }
