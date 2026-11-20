/*META {"imports": ["mente"], "rotulos": [{"de": 0.0, "ate": 1.85, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se você ouvisse os <span class=\"y\">pensamentos</span> de todos?"}], "D0": 5.27} */
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#05070d", "#0b0f18"], nevoa: [6, 24], corNevoa: "#0b0f18", nuvens: 0, exposicao: 0.9 });
        const S = st.scene, cam = st.cam;
        const v = MENTE.vagao(S, st, { len: 20 });
        const L = MENTE.lugaresVagao({ len: 20, seed: 11, sent: 0.62, emPe: 7 });
        const p = MENTE.povo(S, L, { seed: 12 });
        const f = MENTE.fios(S, L.length, { seed: 13, alt: 0.75 });
        const cab = L.map(() => new THREE.Vector3());
        // fragmentos fixados em passageiros perto da câmera (escolhidos pela posição)
        const ord = L.map((q, i) => [i, q.x]).filter(([i, x]) => x > -5 && x < 0.8).sort((a, b) => b[1] - a[1]).map((a) => a[0]);
        const FR = [["ESQUECI A CHAVE", 2.3], ["ELE ME ODEIA?", 2.75], ["PIZZA", 3.1], ["FALTAM 3 ESTAÇÕES", 3.45], ["E SE DER ERRADO?", 3.8], ["QUE FOME", 4.15], ["SERÁ QUE ELA VIU?", 4.4]];
        function render(t) {
          v.update(t, 1);
          p.update(t, { olhaBaixo: 0.6 });
          // o evento em câmera lenta: em "escuta tudo" (1,9 s) os fios explodem das cabeças
          const ev = ease.outCubic(range(t, 1.85, 2.6)), base = 0.18 + 0.82 * ev, pens = range(t, 4.1, 4.6);
          f.update(t * (1 - 0.6 * Math.sin(Math.PI * range(t, 1.85, 3.0))), (i) => {
            p.cabeca(i, t, cab[i]);
            const dist = Math.abs(L[i].x - 2);
            return { p: cab[i], a: base * (0.6 + 0.4 * Math.sin(i * 1.7 + t)) * (dist < 9 ? 1 : 0.5), cor: i % 4 === 0 && pens < 1 ? MENTE.COR.laranja : MENTE.COR.azul, tumulto: ev * 0.4 };
          });
          st.vel = Math.sin(Math.PI * range(t, 1.85, 2.9)) * 0.55; st.velT = t;
          st.bloom = 0.45 + ev * 0.4;
          // dolly lento e pesado pelo corredor, um pouco abaixo dos olhos
          const e = ease.inOutSine(range(t, 0, 5.27));
          cam.position.set(lerp(7.2, 2.4, e), lerp(1.25, 1.45, e) + Math.sin(t * 1.3) * 0.02, lerp(0.35, -0.1, e));
          cam.lookAt(lerp(1, -4, e), lerp(1.5, 1.4, e), lerp(-0.25, 0.2, e));
          st.sol(0, 0, 14, 2);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st); MENTE.quadro();
          FR.forEach(([s, t0], k) => {
            const i = ord[k % ord.length]; if (i === undefined) return;
            const a = range(t, t0, t0 + 0.25) * vv;
            MENTE.frase(c, cam, cab[i].clone().add(new THREE.Vector3(0, 0.55, 0)), s, a, { cor: k % 3 === 1 ? MENTE.LARANJA : MENTE.AZUL, tam: 30 });
          });
        }
