/*META {"imports": ["pele"], "rotulos": [], "D0": 4.56} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#2a3a5c", "#d89a70"], nevoa: [16, 80], corNevoa: "#6f5a5a", luz: 0.8 });
        const S = st.scene, cam = st.cam;
        const praca = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), T.M(0x9a8f82, 0.85)); praca.rotation.x = -Math.PI / 2; praca.receiveShadow = true; S.add(praca);
        const linha = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 40), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.6, toneMapped: false })); linha.rotation.x = -Math.PI / 2; linha.position.set(0, 0.01, -8); S.add(linha);
        for (let i = 0; i < 6; i++) { const b = T.predio({ w: 8, d: 8, h: 14 + (i * 7) % 12, seed: 1200 + i }); b.position.set(-22 + i * 9, 0, -26 - (i % 2) * 4); S.add(b); }
        // à esquerda: pele limpa, à vista; à direita: casacos, capuzes e marcas escapando
        const R = mulberry32(1212), pa = [], pb = [];
        for (let i = 0; i < 22; i++) pa.push([-1.2 - R() * 7, 2 - R() * 14, 0.4 + (R() - 0.5) * 0.8]);
        for (let i = 0; i < 22; i++) pb.push([1.2 + R() * 7, 2 - R() * 14, -0.4 + (R() - 0.5) * 0.8]);
        const Ah = PELE.multidao(S, { pos: pa, seed: 1213 });
        const Bc = PELE.multidao(S, { pos: pb, seed: 1214, casaco: true });
        pb.forEach((p, i) => Bc.marca(i, 0.55 + 0.4 * R()));
        const quente = PELE.brilho(0xffd6a0, 22, "suave", 0.18); quente.position.set(-5, 3, -6); S.add(quente);
        function render(t) {
          Ah.update(t); Bc.update(t); Bc.pele.u.uBri.value = 1.4;
          // dolly lateral: das pessoas honestas para as que se cobrem
          const e = ease.inOutSine(range(t, 1.9, 4.2));
          cam.position.set(lerp(-6.5, 6.0, e) + t * 0.15, lerp(2.4, 2.1, e), lerp(7.5, 6.5, e) - t * 0.2 + Math.sin(e * Math.PI) * 1.5);
          cam.lookAt(lerp(-4.2, 4.6, e), 1.2, -4);
          st.sol(lerp(-4, 4, e), -4, 14);
          st.bloom = 0.45;
          st.draw();
          const c = st.ctx;
          PELE.txt(c, "HONESTAS", 540, 600, { tam: 56, cor: PELE.AZUL, a: PELE.fade(t, 2.1, 3.0, 0.2), esp: 0.16 });
          PELE.txt(c, "COBERTAS", 540, 600, { tam: 56, cor: PELE.LARANJA, a: PELE.fade(t, 3.93, 9, 0.2), esp: 0.16 });
          PELE.txt(c, "PELE À VISTA", 540, 670, { tam: 26, cor: "#e8eef5", a: PELE.fade(t, 2.2, 3.0, 0.2) });
          PELE.txt(c, "MARCAS ESCONDIDAS", 540, 670, { tam: 26, cor: "#e8eef5", a: PELE.fade(t, 4.0, 9, 0.2) });
        }
