/*META {"imports": ["pausa"], "rotulos": [], "D0": 5.06} */
        // f10 — envelhecer sozinho: três amigos congelados no meio da risada, em volta do protagonista.
        //       Ele envelhece diante deles (cabelo grisalho, costas curvadas). Órbita que fecha até o rosto dele.
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#1a2336", "#b0735a"], nevoa: [14, 140], corNevoa: "#4b4f60", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const R = PAUSA.ruaChuva(S, st, { n: 80 });
        const TM = 1.17; R.update(0, TM, { k: 1 });
        const [px, , pz] = PAUSA.PROTA;
        const P = R.p; P.group.position.set(px, 0, pz); P.group.rotation.y = Math.PI / 2 + 1.2;
        const AM = [[0x5a2d3c, 0x2a2c30, 0x1a1210, true, 0.6, 1.5, -0.35], [0x2f5c8a, 0x3a3328, 0x6b4a2a, false, -1.5, 0.2, 0.3], [0xc7b08e, 0x1e2228, 0x2a2018, true, 0.4, -1.4, 0.15]].map(([c1, c2, cab, mul, dx, dz, inc], i) => {
          const a = PAUSA.pessoa({ cor: c1, cor2: c2, cabelo: cab, mulher: mul, fase: i * 0.3 });
          a.group.position.set(px + dx, 0, pz + dz); a.group.rotation.y = Math.atan2(-(pz - (pz + dz)), px - (px + dx)); S.add(a.group);
          a.pose(0.37 + i * 0.21, { cabeca: 0.35, inclina: inc * 0.3, braco: 0.9 + i * 0.4, braco2: 0.3 }); // risada congelada
          return a;
        });
        function render(t) {
          const idade = ease.inOutSine(range(t, 1.8, 4.6));
          P.setIdade(idade); P.pose(t, { cabeca: -0.05 });
          st.bloom = 0.7;
          const e = ease.inOutSine(range(t, 0, 5.06)), push = ease.inOutCubic(range(t, 2.6, 5.06));
          const a = lerp(-2.9, -1.7, e), d = lerp(5.8, 1.9, push);
          const hy = lerp(1.7, 1.66 - 0.12 * idade, push);
          cam.position.set(px + Math.sin(a) * d, lerp(2.3, 1.72, push), pz + Math.cos(a) * d);
          cam.lookAt(px, lerp(1.25, hy, push), pz);
          st.sol(0, 20, 50);
          st.draw();
          const c = st.ctx;
          AM.forEach((m, i) => {
            const [x, y, ok] = PAUSA.proj(new THREE.Vector3(m.group.position.x, 2.05, m.group.position.z), cam);
            if (ok) PAUSA.tag(c, x, y, x + (x < 540 ? 70 : -70), y - 120 - i * 40, [["AMIGO", PAUSA.AZUL], ["+0 s", "#fff"]], { a: PAUSA.vis(t, 0.5 + i * 0.15, 2.5), tam: 34 });
          });
          const [qx, qy] = PAUSA.proj(new THREE.Vector3(px, 2.0, pz), cam);
          PAUSA.tag(c, qx, qy, qx < 540 ? qx + 200 : qx - 200, qy - 160, [["VOCÊ", PAUSA.LARANJA], ["+1 ano", "#fff"]], { a: PAUSA.vis(t, 2.0, 2.95), cor: PAUSA.LARANJA });
          const [rx, ry] = PAUSA.proj(P.head.localToWorld(new THREE.Vector3(0.12, 0.17, 0)), cam);
          PAUSA.tag(c, rx, ry, rx < 540 ? 760 : 320, 560, [["UMA RUGA NOVA", PAUSA.LARANJA], ["ninguém viu", "#fff"]], { a: PAUSA.vis(t, 3.1, 5.06), cor: PAUSA.LARANJA });
        }
