/*META {"imports": ["avenida"], "rotulos": [], "D0": 5.49} */
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#46679E", "#F2B47A"], nevoa: [70, 300], corNevoa: "#e9b98c" });
        const S = st.scene, cam = st.cam;
        const av = AVENIDA.avenida(S);
        const povo = AVENIDA.gente(S, { n: 280, seed: 31, zona: [-50, 52], rua: 0.1 });
        // faixa de pedestres cheia (atravessando)
        const faixa = AVENIDA.gente(S, { n: 26, seed: 32, zona: [17, 20], rua: 1 });
        faixa.P.forEach((p, i) => { p.dx = i % 2 ? 1 : -1; p.dz = 0; p.x0 = (p.x0 * 0.9); });
        const pombos = T.bando(S, { n: 18, seed: 33, cor: 0x55585e });
        function render(t) {
          av.carrosAndando(t, 3.15, 1.7);
          av.set({ farois: 0.25, sinal: 1 }, t);
          povo.update(t, { modo: "some", t0: 3.02, dur: 0.22, anda: true });
          faixa.update(t, { modo: "some", t0: 3.02, dur: 0.22, anda: true });
          pombos.update(t, [6 + t * 3, 15 + t * 1.2, -4 - t * 3], [5, 1.5, 4], -0.6, 0.45);
          const e = ease.inOutSine(range(t, 0, 5.49));
          cam.position.set(lerp(9, 3, e), lerp(26, 8.5, e), lerp(74, 50, e));
          cam.lookAt(lerp(0, 0, e), lerp(2, 5, e), lerp(-6, -20, e));
          st.sol(0, 10, 70);
          st.draw();
          // piscar de olhos: pálpebras fecham e abrem (2,72 a 3,08 s)
          const b = Math.sin(Math.PI * range(t, 2.72, 3.08));
          if (b > 0.01) {
            const c = st.ctx, hh = 960 * b;
            c.fillStyle = "#07060c";
            c.beginPath(); c.moveTo(0, 0); c.lineTo(1080, 0); c.lineTo(1080, hh - 60); c.quadraticCurveTo(540, hh + 90, 0, hh - 60); c.fill();
            c.beginPath(); c.moveTo(0, 1920); c.lineTo(1080, 1920); c.lineTo(1080, 1920 - hh + 60); c.quadraticCurveTo(540, 1920 - hh - 90, 0, 1920 - hh + 60); c.fill();
          }
        }
