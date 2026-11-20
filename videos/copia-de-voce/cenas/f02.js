/*META {"imports": ["copia"], "rotulos": [{"de": 0.8, "ate": 1.85, "texto": "<span class=\"k\">MESMO ROSTO</span><br>Mesmas <span class=\"y\">memórias</span>"}, {"de": 1.92, "ate": 3.5, "texto": "A mesma <span class=\"y\">senha</span>"}, {"de": 3.6, "ate": 5.44, "texto": "Ela acredita ser <span class=\"y\">você</span>"}], "D0": 5.44} */
        // Fios de memória idênticos saem das duas cabeças; os dois celulares abrem com a mesma senha.
        const st = T.createToyStage(canvas, { ceu: "#081120", nevoa: [6, 22], fov: 46, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        COPIA.amanhecer(st); st.bloom = 0.75;
        await COPIA.fontes();
        const Q = COPIA.quarto(S);
        const EU = COPIA.pessoa({ fase: 0.1 }), CO = COPIA.pessoa({ fase: 0.6 });
        EU.deitar(-0.47, 0.9); CO.deitar(0.47, 0.9); S.add(EU.p, CO.p);
        // os celulares saem do criado-mudo e ficam sobre o edredom, ao lado de cada mão
        Q.celA.group.position.set(-0.14, 1.125, 0.36); Q.celA.group.rotation.y = 0.12;
        Q.celB.group.position.set(0.14, 1.125, 0.36); Q.celB.group.rotation.y = 0.12;
        const F = COPIA.fios(S, { n: 16, k: 44, seed: 21, alt: 2.0 });
        const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
        const P = [[0, v3(1.25, 2.2, 0.75), v3(0, 1.1, -0.7)], [1.75, v3(0.55, 3.5, 1.0), v3(0, 2.0, -0.75)],
          [2.15, v3(0.0, 1.9, 0.95), v3(0, 1.08, 0.5)], [3.35, v3(0.02, 1.82, 0.9), v3(0, 1.08, 0.52)], [5.44, v3(-0.3, 3.9, 1.75), v3(0, 1.4, -0.55)]];
        function camPath(t) {
          let i = 0; while (i < P.length - 2 && t > P[i + 1][0]) i++;
          const [t0, a0, b0] = P[i], [t1, a1, b1] = P[i + 1], e = ease.inOutCubic(range(t, t0, t1));
          return [a0.clone().lerp(a1, e), b0.clone().lerp(b1, e)];
        }
        function render(t) {
          EU.olhos(1); CO.olhos(0); EU.olha(0.9, 0); CO.olha(-0.15, 0);
          EU.update(t, {}); CO.update(t, {});
          // a senha: 4 dígitos entre "mesma" e "senha", desbloqueia em "celular"
          const k = t < 1.92 ? 0 : t < 2.85 ? 1 + Math.min(3, Math.floor((t - 1.92) / 0.18)) : 5;
          Q.celA.tela(k); Q.celB.tela(k);
          F.update(t, { A: EU.cabeca(0.1), B: CO.cabeca(0.1), div: 0, a: range(t, 0.5, 1.1) * (t > 1.9 && t < 3.4 ? 0.5 : 1) });
          const [p, l] = camPath(t);
          cam.position.copy(p); cam.lookAt(l);
          st.sol(0, 0, 4);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          const r1 = range(t, 0.1, 0.4) * (1 - range(t, 0.75, 0.95));
          COPIA.tag(c, cam, EU.cabeca(0.04, 0.2), "ROSTO A", { a: a * r1, dx: -120, dy: -130 });
          COPIA.tag(c, cam, CO.cabeca(0.04, 0.2), "ROSTO B", { a: a * r1, dx: 120, dy: -130 });
          const r2 = range(t, 2.85, 3.0) * (1 - range(t, 3.3, 3.45));
          COPIA.tag(c, cam, Q.celA.group.position.clone().add(v3(0, 0.02, -0.12)), "4816", { a: a * r2, dx: -150, dy: -260 });
          COPIA.tag(c, cam, Q.celB.group.position.clone().add(v3(0, 0.02, -0.12)), "4816", { a: a * r2, dx: 150, dy: -260 });
          const r3 = range(t, 3.7, 4.0);
          COPIA.tag(c, cam, CO.cabeca(0.3), "\"EU SOU EU\"", { cor: COPIA.LARANJA, a: a * r3, dx: 150, dy: -170 });
          COPIA.tag(c, cam, EU.cabeca(0.3), "\"EU SOU EU\"", { a: a * r3, dx: -150, dy: -170 });
        }
