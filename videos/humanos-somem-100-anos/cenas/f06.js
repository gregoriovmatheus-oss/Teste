/*META {"imports": ["avenida"], "rotulos": [{"de": 1.75, "ate": 3.1, "texto": "<span class=\"k\">CHERNOBYL</span><br>Sem <span class=\"y\">pessoas</span>"}, {"de": 3.17, "ate": 6.18, "texto": "<span class=\"k\">CHERNOBYL</span><br><span class=\"y\">7×</span> mais lobos"}], "D0": 6.18} */
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#7FA6C9", "#F5D3A0"], nevoa: [25, 190], corNevoa: "#d8c8aa", luz: 0.95 });
        const S = st.scene, cam = st.cam;
        const av = AVENIDA.avenida(S);
        const rr = mulberry32(606);
        // 1 lobo na frente; aos 3,2 s ("sete vezes") chegam mais 6 vindos do mato do estacionamento
        const lobos = Array.from({ length: 7 }, (_, i) => {
          const l = AVENIDA.fauna("lobo", { fase: rr(), cor: [0x847b70, 0x6f675d, 0x948a7c, 0x5f5850][i % 4] });
          l.group.scale.setScalar(1.15); S.add(l.group);
          l.o = { dx: (rr() - 0.5) * 4, dz: -1.5 - rr() * 5, t0: 3.17 + (i - 1) * 0.17, sx: -14 - rr() * 6 };
          return l;
        });
        const cervos = [[3.6, -14, 0.7], [5.4, -18, 2.3], [2.2, -21, -2.6]].map(([x, z, ry], i) => {
          const c = AVENIDA.fauna("cervo", { fase: i * 0.37, chifre: i !== 1 }); c.group.position.set(x, 0.4, z); c.group.rotation.y = ry; c.group.scale.setScalar(1.05); S.add(c.group); return c;
        });
        const aves = T.bando(S, { n: 14, seed: 607, cor: 0x3d4248 });
        function render(t) {
          av.set({ racha: 1, mato: 1, hera: 0.3, sujeira: 0.4, ferrugem: 0.25, floresta: 0.12, fenda: 0.1 }, t);
          const lz = -6 + t * 3.0, lx = -0.8 + Math.sin(t * 0.6) * 0.6;
          lobos.forEach((l, i) => {
            let x = lx + (i ? l.o.dx : 0), z = lz + (i ? l.o.dz : 0), dx = 0, dz = 1;
            if (i) { // chega correndo de lado e entra na matilha
              const k = ease.outCubic(range(t, l.o.t0, l.o.t0 + 1.3));
              x = lerp(l.o.sx, x, k); z = lerp(lz - 3 + l.o.dz, z, k); dx = (1 - k) * 2.2; dz = 1;
              l.group.visible = t > l.o.t0 - 0.05;
            }
            l.group.position.set(x, 0.12, z);
            l.group.rotation.y = Math.atan2(-dz, dx);
            l.update(t, { passo: i && t < l.o.t0 + 1.3 ? 3.2 : 2.2, cabeca: -0.1 });
          });
          cervos.forEach((c, i) => {
            const alerta = i === 0 ? ease.inOutSine(range(t, 2.4, 3.0)) : 0;
            c.update(t, { cabeca: lerp(-1.25, 0.1, alerta) + Math.sin(t * 1.7 + i) * 0.05, vira: alerta * 0.6 });
          });
          aves.update(t, [-10 + t * 5, 22, -10], [6, 2, 4], 0.3, 0.5);
          const e = ease.inOutSine(range(t, 0, 6.18));
          cam.position.set(lerp(4.0, -2.2, e), lerp(1.3, 2.1, e), lerp(23, 19.5, e));
          cam.lookAt(lerp(lx + 1.5, lx, e), lerp(1.4, 1.0, e), lz - 2);
          st.sol(0, lz, 40);
          st.draw();
        }
