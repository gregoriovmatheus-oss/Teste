/*META {"imports": ["mente"], "rotulos": [{"de": 1.9, "ate": 4.11, "texto": "Quase <span class=\"y\">ninguém</span><br>está pensando em você"}], "D0": 4.11} */
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#34507e", "#f3ad78"], nevoa: [60, 420], corNevoa: "#d9a088", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffc08a); st.key.intensity = 2.4; st.hemi.intensity = 0.6;
        const R = mulberry32(1201), H = 30;
        // cidade em grade, ao amanhecer
        const lst = [];
        for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) { if (Math.abs(i) < 1 && Math.abs(j) < 1) continue; if (R() < 0.15) continue; const x = i * 22 + (R() - 0.5) * 4, z = j * 22 + (R() - 0.5) * 4; let h = 8 + Math.pow(R(), 1.4) * 42; if (z > 0 && z < 100 && Math.abs(x) < 50) h = Math.min(h, 20); lst.push([x, z, 10 + R() * 8, 10 + R() * 8, h]); }
        const pr = MENTE.predios(S, lst, { seed: 1202, luz: 0.5 });
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), T.M(0x3a3a40, 0.9)); chao.rotation.x = -Math.PI / 2; S.add(chao);
        // nosso prédio e o telhado
        const nosso = new THREE.Mesh(new THREE.BoxGeometry(14, H, 14), T.M(0x8a8078, 0.85)); nosso.position.y = H / 2; nosso.receiveShadow = true; S.add(nosso);
        const mur = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 0.35), T.M(0x9a9088, 0.8)); mur.position.set(0, H + 0.25, 6.8); mur.castShadow = mur.receiveShadow = true; S.add(mur);
        const caixa = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 2.5), T.M(0x6f6862, 0.8)); caixa.position.set(-4, H + 1, -3); caixa.castShadow = true; S.add(caixa);
        const sol = MENTE.glowSprite(0xffd8a0, 140, 0.95); sol.position.set(-60, 45, 380); S.add(sol);
        // a pessoa sentada na mureta, olhando a cidade (+z)
        const g = new THREE.Group(); g.position.set(0, H + 0.1, 6.6); S.add(g);
        const p = MENTE.povo(g, [{ x: 0, z: 0, ry: 0, sent: 1, cor: 0x2f5c8a }], { seed: 1203 });
        // pensamentos da cidade lá embaixo: nenhum vem até aqui
        const NF = 36, src = Array.from({ length: NF }, () => new THREE.Vector3((R() - 0.5) * 260, 2 + R() * 30, 30 + R() * 200));
        const f = MENTE.fios(S, NF, { seed: 1204, alt: 12, np: 30, tam: 0.9, abre: 0.8, aneis: false });
        const FR = ["ALUGUEL", "O ALMOÇO", "ELA VAI LIGAR?", "O JOGO", "PRAZO", "MEU CABELO"];
        function render(t) {
          p.update(t, {});
          f.update(t, (i) => ({ p: src[i], a: 0.8, cor: i % 3 ? MENTE.COR.azul : MENTE.COR.laranja }));
          st.bloom = 0.7;
          // órbita lenta: de trás da pessoa até o lado, a cidade amanhecendo
          const e = ease.inOutSine(range(t, 0, 4.11)), a = lerp(Math.PI + 0.5, Math.PI + 1.25, e), r = lerp(5.5, 4.2, e);
          const C = new THREE.Vector3(0, H + 1.1, 6.6);
          cam.position.set(C.x + Math.sin(a) * r, C.y + lerp(1.6, 0.6, e), C.z + Math.cos(a) * r);
          cam.lookAt(lerp(0, 4, e), lerp(H - 5, H - 6, e), C.z + 30);
          st.sol(0, 6, 14, H);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st); MENTE.quadro();
          FR.forEach((s, k) => MENTE.frase(c, cam, src[k * 5].clone().add(new THREE.Vector3(0, 10, 0)), s, range(t, 0.4 + k * 0.25, 0.7 + k * 0.25) * vv * (1 - 0.5 * range(t, 1.9, 2.3)), { cor: k % 3 ? MENTE.AZUL : MENTE.LARANJA, tam: 24, linha: false }));
        }
