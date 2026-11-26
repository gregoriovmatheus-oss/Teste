/*META {"imports": ["quatro"], "rotulos": [{"de": 1.9, "ate": 3.3, "texto": "<span class=\"k\">CADA BRAÇO</span><br>≈ <span class=\"y\">5%</span> do corpo"}, {"de": 5.25, "ate": 7.24, "texto": "<span class=\"o\">+10%</span> o dia inteiro"}], "D0": 7.24, "css": "__CSS__"} */
        const Q4 = QUATRO;
        await Q4.prepara();
        const st = Q4.palcoDoc(T, canvas, { fov: 34 });
        const S = st.scene, cam = st.cam;
        // 4 barras de vidro (5% cada): 2 azuis (os braços de hoje) e 2 laranja (o par novo)
        const X = [-1.5, -0.5, 0.5, 1.5], H = 1.3, barras = X.map((x, i) => {
          const nova = i === 0 || i === 3, cor = nova ? 0xff8a4c : 0x7cc8ff;
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1, 0.62), new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.88 }));
          m.position.set(x, 0, 0); m.castShadow = true; S.add(m);
          const base = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 0.74), T.M(0x1c2230, 0.4)); base.position.set(x, 0.02, 0); S.add(base);
          const halo = Q4.brilho(cor, 2.2, "suave", 0); halo.position.set(x, 0.2, 0.4); S.add(halo);
          return { m, nova, halo };
        });
        // linha "100% do corpo" ao fundo, para escala
        const ref = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.015, 0.015), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.35 })); ref.position.set(0, H + 0.02, -0.4); S.add(ref);
        const al = new THREE.Vector3();
        function render(t) {
          barras.forEach((b, i) => {
            const k = b.nova ? ease.outBack(range(t, 3.55 + (i === 3 ? 0.18 : 0), 4.3 + (i === 3 ? 0.18 : 0))) : ease.outCubic(range(t, 0.35 + i * 0.12, 1.4 + i * 0.12));
            const h = Math.max(0.001, H * k); b.m.scale.y = h; b.m.position.y = h / 2 + 0.04;
            const pulso = b.nova ? range(t, 5.3, 5.55) * (1 - range(t, 6.2, 7.0)) : 0;
            b.m.material.emissiveIntensity = 0.35 + 1.1 * pulso; b.halo.material.opacity = 0.9 * pulso; b.halo.position.y = h * 0.6;
          });
          // câmera: grua baixa → sobe e gira devagar
          const e = ease.inOutSine(range(t, 0, 7.24));
          cam.position.set(lerp(-1.6, 1.8, e), lerp(0.9, 1.9, e), lerp(6.4, 6.0, e)); al.set(lerp(-0.2, 0.15, e), -0.55, 0); cam.lookAt(al);
          st.bloom = 0.6; st.draw();
          const c = st.ctx;
          barras.forEach((b, i) => { const a = b.nova ? range(t, 4.1, 4.4) : range(t, 1.95, 2.2);
            Q4.tag(c, "5%", new THREE.Vector3(X[i], b.m.scale.y + 0.1, 0), cam, a, { cor: b.nova ? Q4.LARANJA : Q4.AZUL, dy: -60 }); });
          Q4.txt(c, "HOJE · 2 BRAÇOS", 540, 1290, { tam: 24, cor: Q4.AZUL, a: range(t, 1.0, 1.3) * (1 - range(t, 3.4, 3.6)), esp: 0.3 });
          Q4.txt(c, "COM MAIS DOIS · 4 BRAÇOS", 540, 1290, { tam: 24, cor: Q4.LARANJA, a: range(t, 3.7, 4.0), esp: 0.3 });
        }
