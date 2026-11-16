/*META {"rotulos": [{"de": 0, "ate": 4.89, "top": 650, "fixo": true, "pulso": 2.85, "texto": "<span class=\"p\">E SE TODOS OS</span><br><span class=\"p\">HUMANOS VIRASSEM</span><br><span class=\"y\" style=\"font-size:130px\">ANIMAIS?</span>"}], "D0": 4.89} */
        const st = T.createToyStage(canvas, { fov: 52, nevoa: [40, 170] });
        const S = st.scene, cam = st.cam;
        const city = T.rua({ len: 200, seed: 11 });
        S.add(city.group);
        // pedestres: [x, z, camisa, calça, mulher, vira, fase, t0]
        const P = [
          [-1.2, 2, 0xd9583b, 0x3f5677, 0, "leao", 0.1, 2.2],
          [2.4, -1, 0x6fafa6, 0x5a4a6a, 1, "girafa", 0.5, 2.45],
          [-4.6, -3, 0xf2b53a, 0x3f5677, 0, "macaco", 0.3, 2.6],
          [5.2, 3.5, 0xe9a3a0, 0x2f3b52, 1, "passaro", 0.7, 2.35],
          [0.6, -6, 0x9fc9d9, 0x4a3a2a, 0, "macaco", 0.2, 2.75],
          [-6.4, 1.2, 0xe8896b, 0x3f5677, 1, "passaro", 0.9, 2.5],
          [3.8, -9, 0xf3e2c4, 0x5a4a6a, 0, "elefante", 0.4, 2.9],
          [-2.8, -11, 0xd98a4e, 0x2f3b52, 1, "coelho", 0.6, 3.0],
        ];
        const ppl = P.map(([x, z, c1, c2, mul, vira, fase, t0], i) => {
          const h = A.createAnimal("humano", { cor: c1, cor2: c2, mulher: !!mul, cabelo: [0x4a3226, 0x2a1d16, 0x8a5a3c][i % 3], fase });
          const opt = { fase, cor: [0x4f9bd9, 0xd9583b, 0xf2b53a][i % 3] };
          const a = A.createAnimal(vira, opt);
          A.face(h.group, 0, 1); A.face(a.group, 0, 1); h.group.userData.k = 1.3;
          S.add(h.group, a.group);
          const sc = { leao: 1.1, girafa: 1, macaco: 1.15, passaro: 1.8, elefante: 0.85, coelho: 1.6 }[vira];
          const b = T.createBurst(S, { seed: 100 + i, raio: 1.4, n: 22 });
          return { h, a, x, z, t0, vira, sc, b, fase };
        });
        function render(t) {
          for (const p of ppl) {
            const k = range(t, p.t0, p.t0 + 0.25);
            const zz = p.z + t * 1.1;
            p.h.group.position.set(p.x, 0, zz);
            p.h.update(t, { passo: 1.7 });
            p.h.group.visible = k < 1;
            p.h.group.scale.set(1.3 * (1 + k * 0.5), 1.3 * (1 - k * 0.85), 1.3 * (1 + k * 0.5));
            p.b.at(t, p.t0 + 0.12, p.x, 1.1, zz);
            const s = ease.outBack(range(t, p.t0 + 0.12, p.t0 + 0.55));
            p.a.group.visible = s > 0.001;
            p.a.group.scale.setScalar(1.2 * p.sc * Math.max(0.001, s));
            const ta = Math.max(0, t - p.t0);
            if (p.vira === "passaro") {
              p.a.group.position.set(p.x + ta * 0.6, 0.2 + ta * ta * 1.6, zz + ta * 1.2);
              p.a.update(t, { voa: 7 });
              p.a.group.rotation.z = -0.4 * range(ta, 0, 0.5);
            } else {
              p.a.group.position.set(p.x, 0, zz + ta * 0.4);
              p.a.update(t, { passo: p.vira === "elefante" ? 0.9 : p.vira === "girafa" ? 1.0 : 1.6, salto: p.vira === "coelho" ? 0.15 : 0 });
            }
          }
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(lerp(-1.5, 1, e), lerp(2.3, 2.6, e), lerp(9.5, 11.5, e) + t * 1.1);
          cam.lookAt(0, 3.6, -6 + t * 1.1);
          st.sol(0, t * 1.1, 30);
          st.draw();
        }
