/*META {"imports": ["avenida"], "rotulos": [{"de": 0.55, "ate": 2.4, "texto": "Prédios <span class=\"y\">rachados</span>"}, {"de": 2.95, "ate": 5.27, "texto": "Animais <span class=\"y\">sem medo</span><br>de nós"}], "D0": 5.27} */
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#3E5E96", "#F2A86A"], nevoa: [25, 200], corNevoa: "#d3a985", luz: 0.9 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.5;
        const av = AVENIDA.avenida(S);
        const olhar = [1.2, 13];
        const povo = AVENIDA.gente(S, { n: 160, seed: 1201, zona: [18, 44], rua: 0.75 });
        povo.P.forEach((p) => { if (Math.hypot(p.x0 - olhar[0], p.z0 - olhar[1]) < 7) p.z0 += 8; });
        // heróis (animals.js) bem perto da câmera, olhando o cervo
        const herois = [[-1.6, 22.5, 0xb83a2e, 0x2c3550], [0.6, 23.4, 0x2f5c8a, 0x3a3a3e], [2.6, 22.2, 0xe8e2d4, 0x6b5a48]].map(([x, z, c1, c2], i) => {
          const h = A.createAnimal("humano", { cor: c1, cor2: c2, fase: i * 0.3, mulher: i === 1 }); h.group.position.set(x, 0.12, z); h.group.scale.setScalar(1.05);
          A.face(h.group, olhar[0] - x, olhar[1] - z); S.add(h.group); return h;
        });
        const cervos = [[1.2, 13, 1.7, true], [-2.4, 9.5, 0.9, false], [4.5, 8, 2.6, false]].map(([x, z, ry, ch], i) => { const c = AVENIDA.fauna("cervo", { fase: i * 0.4, chifre: ch }); c.group.position.set(x, 0.12, z); c.group.rotation.y = ry; S.add(c.group); return c; });
        const lobos = [[-6.2, 4, 0.4], [-7.4, 2.2, -0.3]].map(([x, z, ry], i) => { const l = AVENIDA.fauna("lobo", { fase: i * 0.5 }); l.group.position.set(x, 0.12, z); l.group.rotation.y = ry; S.add(l.group); return l; });
        function render(t) {
          av.set({ racha: 1, mato: 1, hera: 1, sujeira: 0.9, ferrugem: 1, floresta: 1, fenda: lerp(0.7, 1, range(t, 0.6, 1.6)) }, t);
          povo.update(t, { olha: olhar });
          herois.forEach((h, i) => h.update(t, { cabeca: Math.sin(t * 0.8 + i) * 0.06 }));
          // o cervo vem até as pessoas, sem medo
          const c0 = cervos[0], k = ease.inOutSine(range(t, 1.2, 4.4));
          c0.group.position.set(lerp(1.2, 0.8, k), 0.12, lerp(13, 18.5, k)); c0.group.rotation.y = -Math.PI / 2 + 0.15;
          c0.update(t, { passo: k > 0 && k < 1 ? 1.1 : 0, cabeca: k >= 1 ? -0.5 + Math.sin(t * 2) * 0.05 : 0.05 });
          cervos.slice(1).forEach((c, i) => c.update(t, { cabeca: -1.1 + Math.sin(t + i) * 0.1 }));
          lobos.forEach((l, i) => l.update(t, { cabeca: Math.sin(t * 0.7 + i) * 0.2, vira: Math.sin(t * 0.5 + i) * 0.4 }));
          // grua: de trás das pessoas até o lado, na altura dos olhos
          const e = ease.inOutSine(range(t, 0, 5.27)), a = lerp(-0.25, 0.75, e), R = lerp(11, 9, e);
          cam.position.set(1 + Math.sin(a) * R, lerp(2.6, 3.4, e), 18 + Math.cos(a) * R);
          cam.lookAt(lerp(0.6, 0.8, e), lerp(1.6, 1.4, e), lerp(14, 18, e));
          st.sol(0, 15, 40);
          st.draw();
        }
