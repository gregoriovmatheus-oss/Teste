/*META {"imports": ["mente"], "rotulos": [{"de": 0.5, "ate": 3.1, "texto": "Talvez não seja<br>um <span class=\"y\">defeito</span>"}, {"de": 3.35, "ate": 7.25, "texto": "É o que nos permite<br><span class=\"y\">viver juntos</span>"}], "D0": 7.25} */
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#05070d", "#0b0f18"], nevoa: [6, 24], corNevoa: "#0b0f18", nuvens: 0, exposicao: 0.9 });
        const S = st.scene, cam = st.cam;
        const v = MENTE.vagao(S, st, { len: 20 });
        const L = MENTE.lugaresVagao({ len: 20, seed: 11, sent: 0.62, emPe: 7 });
        const p = MENTE.povo(S, L, { seed: 12 });
        const f = MENTE.fios(S, L.length, { seed: 13, alt: 0.75 });
        const cab = L.map(() => new THREE.Vector3()), R = mulberry32(1301), OFF = L.map(() => R());
        let tv = 0;
        function render(t) {
          // o trem desacelera; os fios se apagam um a um
          v.update(t * 0.85 - t * t * 0.05, 1);
          p.update(t, { olhaBaixo: 0.6 });
          f.update(t, (i) => { p.cabeca(i, t, cab[i]); const ap = 1 - range(t, 0.5 + OFF[i] * 4.8, 0.9 + OFF[i] * 4.8); return { p: cab[i], a: 0.9 * ap, cor: MENTE.COR.azul }; });
          st.bloom = 0.55;
          // dolly ao contrário do começo: recuando pelo corredor
          const e = ease.inOutSine(range(t, 0, 7.25));
          cam.position.set(lerp(2.2, 7.6, e), lerp(1.45, 1.6, e), lerp(-0.1, 0.25, e));
          cam.lookAt(lerp(-4, 0, e), lerp(1.4, 1.3, e), lerp(0.2, -0.1, e));
          st.sol(0, 0, 14, 2);
          const fim = range(t, 6.4, 7.25);
          st.draw(S, cam, fim > 0 ? { cor: "#05070d", a: fim * 0.75 } : null);
        }
