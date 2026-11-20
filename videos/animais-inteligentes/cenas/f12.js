/*META {"imports": ["mente"], "rotulos": [{"de": 0.95, "ate": 2.85, "texto": "<span class=\"k\">CÃES</span><br>Entendem <span class=\"y\">centenas</span><br>de palavras"}, {"de": 2.95, "ate": 4.85, "texto": "Do <span class=\"y\">nosso lado</span>?"}, {"de": 4.95, "ate": 5.9, "texto": "Ou <span class=\"y\">não</span>."}], "D0": 5.9} */
        await MENTE.fontes();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#46679E", "#F2B47A"], nevoa: [10, 70], corNevoa: "#e2b089", luz: 0.95, nuvens: 10 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.55;
        const chao = T.mesh(new THREE.PlaneGeometry(300, 300), 0x6f8a42, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
        const trilha = T.mesh(new THREE.PlaneGeometry(1.6, 80), 0xb59a72, S, 0.95); trilha.rotation.x = -Math.PI / 2; trilha.position.set(0.4, 0.01, -20); trilha.castShadow = false;
        const rr = mulberry32(121);
        for (let i = 0; i < 14; i++) { const a = T.arvore(1 + rr() * 0.8, 0x557a36, 400 + i); MENTE.leve(a); const s = i % 2 ? 1 : -1; a.position.set(s * (3 + rr() * 8), 0, -4 - i * 3.5); S.add(a); }
        const sol = MENTE.glow(0xffd09a, 14, 0.85); sol.position.set(-6, 3, -60); S.add(sol);
        const hum = A.createAnimal("humano", { cor: 0x3c5a7a, cor2: 0x3a3a3e, cabelo: 0x2a1d16 }); hum.group.position.set(-0.35, 0, 0); hum.group.rotation.y = -Math.PI / 2; S.add(hum.group);
        const dog = MENTE.cao(); dog.group.position.set(0.45, 0, 0.15); dog.group.rotation.y = -Math.PI / 2; S.add(dog.group);
        // palavras que o cão entende, flutuando em volta da cabeça
        const PAL = ["senta", "passear", "bola", "fica", "vem", "comida", "deita", "pega", "casa", "água", "carro", "não", "petisco", "banho", "nome"];
        const W = PAL.map((w, i) => ({ w, a: rr() * 6.28, r: 0.45 + rr() * 0.4, y: -0.1 + rr() * 0.6, t0: 1.46 + i * 0.07 }));
        const hp = new THREE.Vector3(), v = new THREE.Vector3();
        function render(t) {
          // 0-2,9: olha para a frente; 2,99: olha para a pessoa e abana o rabo; 4,97: vira a cabeça para longe, rabo baixa
          const olhaP = ease.inOutSine(range(t, 2.9, 3.4)), ouNao = ease.inOutSine(range(t, 4.95, 5.5));
          dog.update(t, { cabeca: lerp(0.05, 0.45, olhaP) * (1 - ouNao) + ouNao * -0.05, vira: lerp(0, -0.9, olhaP) * (1 - ouNao) + ouNao * 1.1, cauda: lerp(0.25, 0.7, olhaP) * (1 - ouNao) + 0.08 * ouNao, caudaBaixa: ouNao * 0.9, orelha: ouNao * 0.25 });
          hum.update(t, { cabeca: -0.35 });
          hum.head.rotation.y = 0.5 * olhaP;
          // câmera na altura do cão: de frente → arco para o lado → por trás, olhando o horizonte
          const e = ease.inOutSine(range(t, 0, 5.9));
          const a = lerp(1.1, -0.15, e), R = lerp(3.0, 3.3, e);
          cam.position.set(0.45 + Math.sin(a) * R, lerp(0.8, 1.1, e), 0.15 + Math.cos(a) * R);
          cam.lookAt(lerp(0.3, 0.1, e), lerp(0.7, 0.95, e), lerp(0.1, -0.6, e));
          st.sol(0, 0, 8);
          st.draw();
          dog.head.getWorldPosition(hp);
          const c = st.ctx; c.save(); c.textAlign = "center";
          W.forEach(({ w, a: an, r, y, t0 }, i) => {
            const al = range(t, t0, t0 + 0.3) * (1 - range(t, 2.6, 2.95));
            if (al <= 0) return;
            v.set(hp.x + Math.cos(an + t * 0.3) * r, hp.y + y + (t - t0) * 0.05, hp.z + Math.sin(an + t * 0.3) * r);
            const p = MENTE.proj(v, cam); if (p[2] > 1 || p[1] > 1030) return;
            c.globalAlpha = al * 0.9; c.font = (i % 3 ? '600 30px "JetBrains Mono"' : '800 40px "Inter"'); c.fillStyle = i % 4 ? "#ffffff" : "#9fd6ff";
            c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 14; c.fillText(w, p[0], p[1]);
          });
          c.restore();
        }
