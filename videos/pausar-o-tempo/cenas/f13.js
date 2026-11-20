/*META {"imports": ["pausa"], "rotulos": [{"de": 4.45, "ate": 7.59, "sai": false, "texto": "Só você carrega<br><span class=\"y\">esse tempo</span>"}], "D0": 7.59} */
        // f13 — fechamento: o mesmo plano do gancho. Novo estalo (1,0 s): as contas de vidro voltam a ser chuva e todos voltam a andar.
        //       A câmera repete o avanço da abertura e depois contorna o protagonista (agora grisalho), parado no meio da multidão.
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#1a2336", "#b0735a"], nevoa: [18, 150], corNevoa: "#4b4f60", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const R = PAUSA.ruaChuva(S, st);
        const AN = PAUSA.anel(S);
        const TS = 1.0, TM = 1.17;
        const [px, , pz] = PAUSA.PROTA;
        R.p.setIdade(0.9);
        function render(t) {
          const tm = PAUSA.tVolta(t, TS, 0.7, TM), k = 1 - ease.inOutSine(range(t, TS, TS + 0.8));
          R.update(t, tm, { k });
          const br = lerp(0.05, 2.25, ease.outCubic(range(t, 0.25, 0.85))) * (1 - ease.inOutSine(range(t, 1.6, 2.4)));
          R.p.pose(t, { braco: br, abre: -0.25 - 0.75 * range(t, 0.25, 0.85) * (1 - range(t, 1.6, 2.4)) });
          const fl = AN.update(t, TS, [0.92, 1.92, 24.95]);
          st.vel = Math.sin(Math.PI * range(t, TS, TS + 1.0)) * 0.45; st.velT = t;
          st.bloom = 0.75 + 0.4 * fl;
          // 0–3,6 s: o mesmo avanço da abertura; 3,6 s em diante: contorna até ficar de frente para ele
          const e = ease.inOutSine(range(t, 0, 3.6)), e2 = ease.inOutCubic(range(t, 0.6, 3.6));
          const A1 = new THREE.Vector3(lerp(2.5, 1.9, e2), lerp(1.8, 1.7, e), lerp(30.8, 28.2, e));
          const ar = ease.inOutCubic(range(t, 3.2, 7.4)), ang = lerp(0.55, 2.75, ar), d = lerp(2.8, 2.3, ar);
          const A2 = new THREE.Vector3(px + Math.sin(ang) * d, lerp(1.7, 1.75, ar), pz + Math.cos(ang) * d);
          cam.position.lerpVectors(A1, A2, range(t, 3.2, 3.6) * 0 + ar);
          const L1 = new THREE.Vector3(lerp(0.4, 0.4, e), lerp(1.75, 1.65, e), lerp(22, 20, e)), L2 = new THREE.Vector3(px, 1.6, pz);
          cam.lookAt(new THREE.Vector3().lerpVectors(L1, L2, ease.inOutSine(range(t, 3.0, 5.0))));
          st.sol(0, 20, 50);
          st.draw(S, cam, fl > 0.01 ? { cor: "#dff1ff", a: fl * 0.35 } : null);
        }
