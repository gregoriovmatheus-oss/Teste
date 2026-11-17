/*META {"imports": ["avenida"], "rotulos": [{"de": 1.2, "ate": 3.61, "texto": "<span class=\"k\">NUM INSTANTE</span><br><span class=\"y\">8 bilhões</span> de volta"}], "D0": 3.61} */
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#3E5E96", "#F0A86C"], nevoa: [40, 250], corNevoa: "#d2a882", luz: 0.9 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.55;
        const av = AVENIDA.avenida(S);
        const povo = AVENIDA.gente(S, { n: 320, seed: 1101, zona: [-40, 40], rua: 0.6 });
        const rr = mulberry32(1102);
        povo.P.forEach((p) => { const a = rr() * 6.28; p.dx = Math.cos(a); p.dz = Math.sin(a); });
        function render(t) {
          av.set({ racha: 1, mato: 1, hera: 1, sujeira: 0.9, ferrugem: 1, floresta: 1, fenda: 0.7 }, t);
          // num instante (0,72 s) oito bilhões reaparecem: onda de luz + gente surgindo
          povo.update(t, { modo: "surge", t0: 0.72, dur: 0.45, bd: 0.9, sobe: 2 });
          const fl = Math.max(0, 1 - (t - 0.72) / 0.5) * (t > 0.72 ? 1 : 0);
          st.vel = fl * 0.8;
          const e = ease.inOutSine(range(t, 0, 3.61));
          cam.position.set(lerp(6, 2.5, e), lerp(12, 6.5, e), lerp(56, 44, e));
          cam.lookAt(0, lerp(3, 2.5, e), lerp(-10, -14, e));
          st.sol(0, 10, 70);
          st.draw(S, cam, fl > 0 ? { cor: "#fff6e6", a: fl * 0.6 } : null);
        }
