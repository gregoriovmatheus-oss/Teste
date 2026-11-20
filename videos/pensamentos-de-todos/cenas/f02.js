/*META {"imports": ["mente"], "rotulos": [{"de": 1.2, "ate": 3.05, "texto": "<span class=\"k\">NO COMEÇO</span><br>Parece um <span class=\"y\">superpoder</span>"}], "D0": 5.11} */
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#05070d", "#0b0f18"], nevoa: [5, 22], corNevoa: "#0b0f18", nuvens: 0, exposicao: 0.95 });
        const S = st.scene, cam = st.cam;
        const v = MENTE.vagao(S, st, { len: 20 });
        const L = MENTE.lugaresVagao({ len: 20, seed: 21, sent: 0.7, emPe: 3 });
        // os três "lidos": sentados no banco de z = −1,18 perto de x = 0
        const alvo = [-0.62, 0, 0.62].map((x, k) => { L.push({ x, z: -1.18, ry: 0, sent: 1, cor: [0x2f5c8a, 0xd9a23a, 0x9b2f4f][k] }); return L.length - 1; });
        const p = MENTE.povo(S, L.filter((q, i) => !(q.z < 0 && q.sent && Math.abs(q.x) < 1.0 && !alvo.includes(i))), { seed: 22 });
        const LL = p.L, AL = LL.map((q, i) => i).filter((i) => LL[i].cor !== undefined);
        const f = MENTE.fios(S, LL.length, { seed: 23, alt: 0.8 });
        const cab = LL.map(() => new THREE.Vector3());
        const CH = [["QUER · FÉRIAS NA PRAIA", 3.77, MENTE.AZUL], ["TEME · SER DEMITIDO", 4.04, MENTE.LARANJA], ["ESCONDE · NÃO LEU O E-MAIL", 4.44, MENTE.AZUL]];
        function render(t) {
          v.update(t, 0.8);
          p.update(t, { olhaBaixo: 0.4 });
          f.update(t, (i) => {
            p.cabeca(i, t, cab[i]);
            const k = AL.indexOf(i), aa = k >= 0 ? 0.9 + 0.6 * range(t, CH[k][1] - 0.2, CH[k][1] + 0.2) : 0.45;
            return { p: cab[i], a: aa, cor: k === 1 && t > 3.9 ? MENTE.COR.laranja : MENTE.COR.azul, alt: k >= 0 ? 0.6 : 0.7 };
          });
          st.bloom = 0.7;
          // grua: do teto, em diagonal, descendo até a altura dos olhos de quem está em pé
          const e = ease.inOutSine(range(t, 0, 5.11));
          cam.position.set(lerp(3.2, -1.8, e), lerp(1.85, 1.6, e), 0.45);
          cam.lookAt(lerp(0.8, -0.2, e), lerp(1.0, 1.25, e), -1.15);
          st.sol(0, 0, 12, 2);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st); MENTE.quadro();
          CH.forEach(([s, t0, cor], k) => {
            const a = range(t, t0, t0 + 0.22) * vv;
            MENTE.frase(c, cam, cab[AL[k]].clone().add(new THREE.Vector3(0, 0.45, 0)), s, a, { cor, tam: 30, dy: -60 - k * 10 });
          });
        }
