/*META {"imports": ["pele"], "rotulos": [{"de": 2.05, "ate": 3.05, "top": 470, "texto": "Tudo <span class=\"y\">exposto</span>"}], "D0": 5.19} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#1a2442", "#e3905e"], nevoa: [30, 140], corNevoa: "#8a6a64", luz: 0.75 });
        const S = st.scene, cam = st.cam;
        st.rim.intensity = 1.4;
        const rua = T.rua({ len: 140, larg: 16, calc: 4, seed: 1010, hMin: 10, hMax: 26, arvores: true });
        rua.group.position.z = -40; S.add(rua.group);
        // multidão nas calçadas, todo mundo com alguma marca
        const R = mulberry32(1011), pos = [];
        for (let i = 0; i < 70; i++) { const s = R() < 0.5 ? 1 : -1; pos.push([s * (8.6 + R() * 2.8), 6 - R() * 70, R() < 0.5 ? 0 : Math.PI]); }
        const G = PELE.multidao(S, { pos, seed: 1012 });
        pos.forEach((p, i) => G.marca(i, 0.15 + 0.75 * Math.pow(R(), 1.6)));
        // político no palanque (genérico), vendedor na banca e outdoor
        const pal = new THREE.Mesh(T.roundBox(3.2, 1.0, 2.2, 0.08), T.M(0x2a3550, 0.6)); pal.position.set(-6.8, 0.4, -6); S.add(pal);
        const pult = new THREE.Mesh(T.roundBox(0.9, 1.15, 0.5, 0.05), T.M(0x6b5a48, 0.5)); pult.position.set(-6.8, 1.4, -5.2); S.add(pult);
        const pol = PELE.corpo({ cor: 0x1e2230, cor2: 0x1e2230, cabelo: 0x8a8076, pele: 0xe0a87e, esc: 12 });
        pol.group.position.set(-6.8, 0.9, -5.75); pol.group.rotation.y = 0.5; S.add(pol.group);
        const banca = new THREE.Group(); banca.position.set(6.6, 0.4, -14); banca.rotation.y = -0.6; S.add(banca);
        const tb = new THREE.Mesh(T.roundBox(3.4, 1.0, 1.4, 0.05), T.M(0x8a5a3a, 0.7)); banca.add(tb);
        const tol = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 1.9), T.M(0xd9583b, 0.8)); tol.position.y = 2.6; banca.add(tol);
        for (const s of [-1, 1]) { const pa = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), T.M(0x333333, 0.5)); pa.position.set(s * 1.75, 1.3, 0.8); banca.add(pa); }
        for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), T.M([0xd9583b, 0xf2b53a, 0x5f8a3c][i % 3], 0.6)); f.position.set(-1.3 + (i % 5) * 0.6, 1.15, -0.2 + Math.floor(i / 5) * 0.35); banca.add(f); }
        const vend = PELE.corpo({ cor: 0xf2b53a, cor2: 0x2c3550, cabelo: 0x2a1d16, pele: 0xa8714f, esc: 12 });
        vend.group.position.set(0, -0.4, -1.1); banca.add(vend.group);
        // outdoor: canvas com propaganda genérica e letra miúda
        const CW = 1024, CH = 600, cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; const g = cv.getContext("2d");
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
        const out = new THREE.Group(); out.position.set(-6.5, 0, -28); out.rotation.y = 0.35; S.add(out);
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.7), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55, roughness: 0.6 })); tela.position.y = 6.4; out.add(tela);
        const moldura = new THREE.Mesh(new THREE.BoxGeometry(8.3, 5.0, 0.2), T.M(0x22252b, 0.5)); moldura.position.set(0, 6.4, -0.12); out.add(moldura);
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 10), T.M(0x22252b, 0.5)); poste.position.y = 2.1; out.add(poste);
        const MS = Array.from({ length: 7 }, (_, i) => [80 + R() * 860, 60 + R() * 460, R() * 0.4, Math.floor(R() * 1e5)]);
        function outdoor(t) {
          const gr = g.createLinearGradient(0, 0, CW, CH); gr.addColorStop(0, "#2f6fb0"); gr.addColorStop(1, "#7cc8ff"); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
          g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "alphabetic";
          g.font = '800 120px Inter'; g.fillText("100% NATURAL*", 60, 210);
          g.font = '600 46px Inter'; g.fillText("O suco que muda sua vida.", 64, 300);
          g.fillStyle = "#f2b53a"; g.beginPath(); g.arc(860, 430, 110, 0, 6.283); g.fill(); g.fillStyle = "#1a2442"; g.font = '800 56px Inter'; g.textAlign = "center"; g.fillText("-50%", 860, 450);
          const kM = range(t, 1.34, 2.6), kL = range(t, 3.06, 3.6);
          g.textAlign = "left"; g.font = '600 20px "JetBrains Mono"'; g.fillStyle = kL > 0 ? `rgba(255,${Math.round(lerp(255, 138, kL))},${Math.round(lerp(255, 76, kL))},1)` : "rgba(255,255,255,0.75)";
          g.fillText("*contém 3% de fruta. resultados não garantidos.", 64, 560);
          if (kL > 0) { g.save(); g.globalAlpha = kL * 0.5; g.fillStyle = "#ff8a4c"; g.fillRect(56, 536, 640 * kL, 34); g.restore(); }
          MS.forEach(([x, y, d, s]) => { const k = ease.outCubic(range(kM, d, d + 0.6)); if (k > 0) { const sz = 260 * k; g.drawImage(PELE.mancha2D(s, 256), x - sz / 2, y - sz / 2, sz, sz); } });
          tex.needsUpdate = true;
        }
        function render(t) {
          S.updateMatrixWorld(true);
          G.update(t, { anda: 0.9 }); G.pele.u.uBri.value = 1.2;
          // marcas crescendo em quem fala: político (0,1 s), vendedor (0,7 s)
          const kp = ease.outCubic(range(t, 0.1, 1.2)), kv = ease.outCubic(range(t, 0.69, 1.8));
          pol.pele.marca(0, pol.PONTOS.peito, 0.9 * kp); pol.pele.marca(1, pol.PONTOS.rosto, 0.12 * kp); pol.pele.u.uBri.value = 1.5;
          vend.pele.marca(0, vend.PONTOS.maoE, 0.6 * kv); vend.pele.marca(1, vend.PONTOS.pescoco, 0.3 * kv); vend.pele.u.uBri.value = 1.5;
          pol.pose(t, { bracoE: [0.9 + 0.25 * Math.sin(t * 3), 0.5, 0.3], cabeca: [Math.sin(t) * 0.3, 0.05] });
          vend.pose(t, { bracoD: [0.7, 0.9, 0.2], fase: 0.3 });
          outdoor(t);
          // travelling pela rua ao entardecer, terminando colado na letra miúda do outdoor
          const e = ease.inOutSine(range(t, 0, 5.19)), f = ease.inOutCubic(range(t, 2.6, 4.6));
          cam.position.set(lerp(0.5, -2.6, e), lerp(4.6, 5.2, e), lerp(12, -14, e));
          const look = new THREE.Vector3(lerp(-0.8, 0, range(t, 0, 2.2)), 2.6, lerp(-14, -26, e));
          const fp = new THREE.Vector3(-1.0, -2.0, 0); tela.localToWorld(fp);
          look.lerp(fp, f); cam.lookAt(look);
          cam.fov = lerp(40, 22, f); cam.updateProjectionMatrix();
          st.sol(0, lerp(-5, -25, e), 30);
          st.bloom = 0.6;
          st.draw();
          const c = st.ctx, v = new THREE.Vector3();
          let [x, y] = PELE.proj(v.set(0, 1.9, 0).applyMatrix4(pol.group.matrixWorld), cam);
          PELE.tag(c, x, y, x + 120, y - 140, "POLÍTICO", { cor: PELE.LARANJA, a: PELE.fade(t, 0.1, 2.9, 0.3) });
          [x, y] = PELE.proj(v.set(0, 1.9, 0).applyMatrix4(vend.group.matrixWorld), cam);
          PELE.tag(c, x, y, x - 120, y - 120, "VENDEDOR", { cor: PELE.LARANJA, a: PELE.fade(t, 0.69, 2.9, 0.3) });
          [x, y] = PELE.proj(v.set(0, 8.6, 0).applyMatrix4(out.matrixWorld), cam);
          PELE.tag(c, x, y, x + 100, y - 120, "PROPAGANDA", { cor: PELE.LARANJA, a: PELE.fade(t, 1.34, 2.9, 0.3) });
          PELE.txt(c, "LETRA MIÚDA", 540, 600, { tam: 44, cor: PELE.LARANJA, a: range(t, 3.56, 3.9) });
        }
