/*META {"imports": ["pele"], "rotulos": [{"de": 0.1, "ate": 2.0, "texto": "Quantas <span class=\"y\">marcas</span><br>você teria?"}, {"de": 4.45, "ate": 6.49, "texto": "<span class=\"k\">ESTUDOS COM DIÁRIOS</span><br><span class=\"y\">1 a 2</span> mentiras<br>por dia"}], "D0": 6.49} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#0b0a0c", "#1d1714"], nevoa: null, nuvens: 0, luz: 0.9 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.4; st.rim.color.set(0x9fc8ff);
        // mesa de madeira escura + calendário de papel com as marcas do mês (textura de canvas redesenhada por quadro)
        const mesa = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), T.M(0x3a2618, 0.6)); mesa.rotation.x = -Math.PI / 2; mesa.receiveShadow = true; S.add(mesa);
        const CW = 1024, CH = 860, cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
        const g = cv.getContext("2d"), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        const BW = 7, BH = BW * CH / CW;
        const base = new THREE.Mesh(T.roundBox(BW + 0.3, 0.12, BH + 0.3, 0.05), T.M(0x22262c, 0.7)); S.add(base); base.receiveShadow = base.castShadow = true;
        const folha = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.06 }));
        folha.rotation.x = -Math.PI / 2; folha.position.y = 0.125; folha.receiveShadow = true; S.add(folha);
        const caneta = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 12), T.M(0x1d2a44, 0.3, { metalness: 0.4 })); caneta.rotation.set(Math.PI / 2, 0, 0.6); caneta.position.set(4.3, 0.07, 1.2); caneta.castShadow = true; S.add(caneta);
        const R = mulberry32(303), DIAS = Array.from({ length: 30 }, (_, i) => ({ n: R() < 0.5 ? 1 : 2, s: [Math.floor(R() * 1e5), Math.floor(R() * 1e5)], o: [R(), R(), R(), R()] }));
        const T0 = 2.0, T1 = 6.2; // os dias do mês passam
        const tile = (i) => { const k = i + 2, c = k % 7, r = Math.floor(k / 7); return [16 + c * 142, 120 + r * 144]; };
        function desenha(t) {
          g.fillStyle = "#d9cfbf"; g.fillRect(0, 0, CW, CH);
          g.fillStyle = "#1f2a3a"; g.font = '600 38px "JetBrains Mono"'; g.textAlign = "left"; g.textBaseline = "middle";
          g.fillText("MÊS · DIÁRIO DE MENTIRAS", 24, 46);
          g.font = '600 24px "JetBrains Mono"'; g.fillStyle = "#6a7480";
          ["D", "S", "T", "Q", "Q", "S", "S"].forEach((d, c) => g.fillText(d, 30 + c * 142, 98));
          let tot = 0;
          DIAS.forEach((d, i) => {
            const [x, y] = tile(i), td = lerp(T0, T1, i / 30);
            g.strokeStyle = "rgba(30,40,55,0.25)"; g.lineWidth = 2; g.strokeRect(x, y, 136, 138);
            g.fillStyle = "#3a4656"; g.font = '600 24px "JetBrains Mono"'; g.fillText(String(i + 1), x + 10, y + 22);
            for (let j = 0; j < d.n; j++) {
              const k = ease.outBack(range(t, td + j * 0.06, td + j * 0.06 + 0.3));
              if (k <= 0) continue;
              tot++;
              const sz = 78 * k, cx = x + 44 + d.o[j * 2] * 48, cy = y + 60 + d.o[j * 2 + 1] * 44;
              g.drawImage(PELE.mancha2D(d.s[j], 128), cx - sz / 2, cy - sz / 2, sz, sz);
            }
          });
          tex.needsUpdate = true;
          return tot;
        }
        function render(t) {
          const tot = desenha(t);
          // grua: do alto, quase em planta, descendo e girando sobre o mês que se enche de marcas
          const e = ease.inOutSine(range(t, 0, 6.49));
          const a = lerp(-0.35, 0.3, e), h = lerp(11.5, 6.2, e), d = lerp(2.2, 5.6, e);
          cam.position.set(Math.sin(a) * d, h, Math.cos(a) * d);
          cam.lookAt(lerp(0, 0.4, e), 0, lerp(0.6, 0.2, e));
          cam.rotateZ(lerp(0.2, 0.05, e));
          st.sol(0, 0, 8);
          st.bloom = 0.4;
          st.draw();
          const c = st.ctx, a2 = range(t, 1.9, 2.3);
          PELE.veu(c, Math.max(PELE.fade(t, 0.0, 2.1, 0.3), PELE.fade(t, 4.35, 9, 0.3)) * 0.9);
          PELE.pilula(c, 540, 1330, 520, 120, a2);
          PELE.txt(c, "MARCAS NO MÊS", 540, 1300, { tam: 24, cor: PELE.AZUL, a: a2 });
          PELE.txt(c, String(tot), 540, 1352, { tam: 54, cor: tot ? PELE.LARANJA : "#fff", a: a2, esp: 0.04 });
        }
