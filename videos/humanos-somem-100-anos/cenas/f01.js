/*META {"imports": ["avenida", "terra"], "rotulos": [{"de": 0.0, "ate": 1.9, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se os humanos <span class=\"y\">sumissem?</span>"}], "D0": 5.49} */
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#46679E", "#F2B47A"], nevoa: [70, 320], corNevoa: "#e9b98c" });
        const S = st.scene, cam = st.cam;
        const av = AVENIDA.avenida(S);
        const povo = AVENIDA.gente(S, { n: 280, seed: 31, zona: [-50, 52], rua: 0.1 });
        const faixa = AVENIDA.gente(S, { n: 26, seed: 32, zona: [17, 20], rua: 1 });
        faixa.P.forEach((p, i) => { p.dx = i % 2 ? 1 : -1; p.dz = 0; p.x0 = p.x0 * 0.9; });
        const pombos = T.bando(S, { n: 18, seed: 33, cor: 0x55585e });
        // ---------- órbita: Terra real, luzes das cidades acendendo no fim da tarde ----------
        const ES = new THREE.Scene(); ES.background = new THREE.Color(0x000000);
        ES.add(TERRA.createCeu({ seed: 7, n: 5000, via: 0.55 }));
        const E = await TERRA.createTerra({ raio: 1 }); ES.add(E.group);
        E.sol.set(1, 0.2, -0.15); E.u.luzes.value = 1.1; E.u.atmo.value = 1.2;
        const cam2 = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.005, 2000);
        st.extraWarm = [{ renderer: st.renderer, scene: ES, camera: cam2 }];
        const T1 = 2.0;
        function render(t) {
          if (t < T1) {
            // mergulho lento e pesado até a cidade (fim de tarde, na linha do terminador)
            st.bloom = 0.8;
            E.aim(-46.6 - t * 1.5, -23.5);
            E.nuv.rotation.y = t * 0.004;
            const e = ease.inCubic(range(t, 0, T1));
            const d = lerp(6.2, 1.04, e);
            cam2.position.set(lerp(0.35, 0.02, e), lerp(0.25, 0.01, e), d);
            cam2.lookAt(0, 0, 0);
            cam2.rotateZ(lerp(0.12, 0, e));
            st.draw(ES, cam2, { cor: "#fff3e2", a: range(t, 1.6, T1) });
          } else {
            st.bloom = 0.45;
            const u = t - T1;
            av.carrosAndando(t, 3.25, 1.9);
            av.set({ farois: 0.6, sinal: 1, janelas: 0.35, luzRua: 0.5 }, t);
            // o evento, em câmera lenta: cada pessoa vira poeira de luz subindo
            povo.update(t, { modo: "some", t0: 3.1, dur: 0.55, anda: t < 3.1, bd: 1.6, sobe: 3.5, lento: 3 });
            faixa.update(t, { modo: "some", t0: 3.1, dur: 0.55, anda: t < 3.1, bd: 1.6, sobe: 3.5, lento: 3 });
            pombos.update(t, [6 + t * 3, 15 + t * 1.2, -4 - t * 3], [5, 1.5, 4], -0.6, 0.45);
            const ev = Math.sin(Math.PI * range(t, 3.05, 4.7));
            st.vel = ev * 0.6; st.velT = t;
            const e = ease.outCubic(range(u, 0, 5.49 - T1));
            cam.position.set(lerp(14, 3, e), lerp(70, 8.5, e), lerp(96, 50, e));
            cam.lookAt(0, lerp(0, 5, e), lerp(-10, -20, e));
            st.sol(0, 10, 70);
            st.draw(S, cam, u < 0.5 ? { cor: "#fff3e2", a: 1 - u / 0.5 } : null);
            // piscar de olhos: pálpebras fecham e abrem (2,72 a 3,05 s)
            const b = Math.sin(Math.PI * range(t, 2.72, 3.05));
            if (b > 0.01) {
              const c = st.ctx, hh = 960 * b;
              c.fillStyle = "#07060c";
              c.beginPath(); c.moveTo(0, 0); c.lineTo(1080, 0); c.lineTo(1080, hh - 60); c.quadraticCurveTo(540, hh + 90, 0, hh - 60); c.fill();
              c.beginPath(); c.moveTo(0, 1920); c.lineTo(1080, 1920); c.lineTo(1080, 1920 - hh + 60); c.quadraticCurveTo(540, 1920 - hh - 90, 0, 1920 - hh + 60); c.fill();
            }
          }
        }
