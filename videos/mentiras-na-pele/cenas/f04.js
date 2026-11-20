/*META {"imports": ["pele"], "rotulos": [{"de": 2.45, "ate": 5.5, "texto": "<span class=\"k\">UM ESTUDO · 1 DIA</span><br><span class=\"y\">60%</span> não mentiram<br>nenhuma vez"}, {"de": 6.0, "ate": 9.93, "texto": "<span class=\"y\">5%</span> das pessoas:<br><span class=\"y\">metade</span> das mentiras"}], "D0": 9.93} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#06080d", "#141b26"], nevoa: [18, 60], corNevoa: "#0b0f16", nuvens: 0, luz: 0.85 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 1.6; st.hemi.intensity = 0.45;
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x14171d, roughness: 0.4, metalness: 0.2 }));
        piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        // 100 pessoas numa grade 10 x 10
        const SP = 1.15, pos = [];
        for (let i = 0; i < 100; i++) pos.push([((i % 10) - 4.5) * SP, (Math.floor(i / 10) - 4.5) * SP, Math.PI * 0.0]);
        const G = PELE.multidao(S, { pos, seed: 404 });
        const R = mulberry32(405), ord = Array.from({ length: 100 }, (_, i) => i);
        for (let i = 99; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
        const tipo = new Array(100); ord.forEach((p, k) => (tipo[p] = k < 60 ? 0 : k < 65 ? 2 : 1)); // 0 = honesto, 1 = poucas, 2 = muitas
        // anel no chão de cada pessoa (azul = não mentiu; laranja = muitas)
        const anel = new THREE.InstancedMesh(new THREE.RingGeometry(0.34, 0.41, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false }), 100);
        const o = new THREE.Object3D(), cA = new THREE.Color(0x7cc8ff), cL = new THREE.Color(0xff8a4c), cN = new THREE.Color(0x000000), cc = new THREE.Color();
        pos.forEach((p, i) => { o.position.set(p[0], 0.01, p[1]); o.rotation.set(-Math.PI / 2, 0, 0); o.updateMatrix(); anel.setMatrixAt(i, o.matrix); anel.setColorAt(i, cN); });
        S.add(anel);
        // pilhas de mentiras: 35 pessoas x 2 = 70 fichas; 5 pessoas x 14 = 70 fichas (metade de todas)
        const NT = 140, ficha = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.11, 0.26), new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0xff7a3c, emissiveIntensity: 1.3, roughness: 0.4 }), NT);
        ficha.frustumCulled = false; S.add(ficha);
        const F = [];
        pos.forEach((p, i) => { const n = tipo[i] === 2 ? 14 : tipo[i] === 1 ? 2 : 0; for (let j = 0; j < n; j++) F.push({ x: p[0], z: p[1], j, i, d: tipo[i] }); });
        function render(t) {
          // começo: todo mundo com marcas médias ("a média engana"); 2,45 s: 60 limpos; 6,0 s: 5 cobertos
          const kL = range(t, 2.45, 3.3), kM = range(t, 6.0, 6.9);
          pos.forEach((p, i) => {
            const ty = tipo[i];
            G.marca(i, ty === 0 ? lerp(0.32, 0, kL) : ty === 1 ? lerp(0.32, 0.22, kM) : lerp(0.32, 1, kM));
            if (ty === 0) cc.copy(cN).lerp(cA, kL * (1 - 0.6 * range(t, 6.0, 6.6)));
            else if (ty === 2) cc.copy(cN).lerp(cL, kM);
            else cc.copy(cN);
            anel.setColorAt(i, cc);
          });
          anel.instanceColor.needsUpdate = true;
          G.pele.u.uBri.value = 1 + 0.6 * kM;
          G.update(t);
          // 7,66 s ("metade"): as mentiras empilham sobre quem mentiu
          const kF = range(t, 7.5, 9.2);
          F.forEach((f, k) => {
            const ap = ease.outBack(clamp(kF * 15 - f.j * 0.9 - (f.d === 1 ? 0.3 : 0)));
            o.position.set(f.x, 2.15 + f.j * 0.13, f.z); o.rotation.set(0, f.j * 0.3, 0); o.scale.setScalar(ap || 1e-4); o.updateMatrix(); ficha.setMatrixAt(k, o.matrix);
          });
          ficha.instanceMatrix.needsUpdate = true;
          // grua: de cima (a grade inteira) até um ângulo baixo, rente às pilhas
          const e = ease.inOutSine(range(t, 0, 9.93)), a = lerp(0.15, 0.75, e);
          const d = lerp(4, 13.5, e), h = lerp(17, 5.2, e);
          cam.position.set(Math.sin(a) * d, h, Math.cos(a) * d);
          cam.lookAt(0, lerp(0, 1.4, e), lerp(-0.5, -1.2, e));
          st.sol(0, 0, 10);
          st.bloom = 0.5 + 0.3 * kF;
          st.draw();
          const c = st.ctx;
          // barras de proporção: pessoas x mentiras
          const aB = range(t, 7.6, 8.0);
          if (aB > 0) {
            PELE.txt(c, "PESSOAS", 110, 1300, { tam: 22, cor: "#cfd8e2", al: "left", a: aB });
            PELE.txt(c, "MENTIRAS", 110, 1380, { tam: 22, cor: "#cfd8e2", al: "left", a: aB });
            const W = 560, x0 = 260, k = ease.outCubic(range(t, 7.7, 8.6));
            c.save(); c.globalAlpha = aB;
            c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(x0, 1290, W, 20); c.fillRect(x0, 1370, W, 20);
            c.fillStyle = "#ff8a4c"; c.fillRect(x0, 1290, W * 0.05 * k, 20); c.fillRect(x0, 1370, W * 0.5 * k, 20);
            c.restore();
            PELE.txt(c, "5%", x0 + W * 0.05 * k + 14, 1300, { tam: 24, cor: PELE.LARANJA, al: "left", a: aB });
            PELE.txt(c, "50%", x0 + W * 0.5 * k + 14, 1380, { tam: 24, cor: PELE.LARANJA, al: "left", a: aB });
          }
        }
