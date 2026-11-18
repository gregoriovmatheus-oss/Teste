/*META {"imports": ["solkit"], "rotulos": [{"de": 0.6, "ate": 2.2, "top": 680, "texto": "Vivem de<br><span class=\"y\">luz solar</span>"}, {"de": 2.35, "ate": 5.2, "top": 680, "texto": "<span class=\"k\">BATERIAS</span><br>Cerca de <span class=\"y\">1 hora</span>"}, {"de": 5.4, "ate": 9.36, "top": 680, "texto": "GPS e satélites<br><span class=\"y\">caem</span>", "sai": false}], "D0": 9.36} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 42, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        st.bloom = 0.75;
        st.hemi.intensity = 0.35; st.hemi.color.setHex(0x8fa8e0);
        st.key.intensity = 2.2; st.key.color.setHex(0x9fb4e8); st.key.position.set(-6, 4, 8);
        const stars = SK.ceuDoc(S, { seed: 61, via: 0.35 });
        const terra = await SK.terraDoc(S, { raio: 3, seg: 96 });
        // painel solar: células azuis em grade (canvas)
        const pc = document.createElement("canvas"); pc.width = 256; pc.height = 96;
        { const g = pc.getContext("2d"); g.fillStyle = "#0b1a3a"; g.fillRect(0, 0, 256, 96);
          for (let x = 0; x < 16; x++) for (let y = 0; y < 6; y++) { g.fillStyle = (x + y) % 2 ? "#1f3f7a" : "#244a8c"; g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14); } }
        const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
        const painelMat = new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.25, metalness: 0.6, side: THREE.DoubleSide });
        const corpoMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.85 });
        const brancoMat = new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.5, metalness: 0.3 });
        const painelGeo = new THREE.BoxGeometry(2.6, 0.03, 0.9), corpoGeo = T.roundBox(0.9, 0.9, 1.2, 0.08);
        function satelite() {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(corpoGeo, corpoMat));
          for (const s of [1, -1]) {
            const braco = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), brancoMat); braco.rotation.z = Math.PI / 2; braco.position.x = s * 0.7; g.add(braco);
            const p = new THREE.Mesh(painelGeo, painelMat); p.position.x = s * 2.25; g.add(p);
          }
          const prato = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.22, 20, 1, true), brancoMat); prato.position.y = -0.6; g.add(prato);
          const luz = SK.brilho(0x6dff9a, 0.9, "suave", 1); luz.position.set(0.3, 0.55, 0.62); g.add(luz);
          // feixe de sinal apontando para a Terra (-y local)
          const feixe = new THREE.Mesh(new THREE.ConeGeometry(1.8, 8, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.12,
            blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
          feixe.position.y = -4.6; g.add(feixe);
          return { g, luz, feixe };
        }
        // constelação: órbitas em vários planos (GPS fica a ~20 mil km; aqui fora de escala)
        const rr = mulberry32(64), sats = [];
        for (let i = 0; i < 9; i++) {
          const s = satelite(); s.g.scale.setScalar(i === 0 ? 0.13 : 0.1);
          s.R = i === 0 ? 4.1 : 4.0 + rr() * 0.9; s.a0 = i === 0 ? 0.35 : rr() * 6.28; s.inc = i === 0 ? 0.25 : (rr() - 0.5) * 2.2; s.nod = rr() * 6.28; s.vel = 0.03 + rr() * 0.02;
          s.fim = 5.2 + rr() * 0.9; // cada bateria se esgota num instante um pouco diferente
          S.add(s.g); sats.push(s);
        }
        const v = new THREE.Vector3(), up = new THREE.Vector3(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
        const posSat = (s, t, out) => {
          const a = s.a0 + t * s.vel;
          out.set(Math.cos(a) * s.R, 0, Math.sin(a) * s.R).applyAxisAngle(new THREE.Vector3(1, 0, 0), s.inc).applyAxisAngle(Y, s.nod * (s === sats[0] ? 0 : 1));
          return out;
        };
        const verde = new THREE.Color(0x6dff9a), laranja = new THREE.Color(0xff8a4c);
        function render(t) {
          terra.set({ sol: new THREE.Vector3(1, 0, 0), luz: 0, cidades: 1.25, nuvens: 0.25 });
          terra.aim(-50 + t * 1.5, 20);
          const bat = 1 - range(t, 2.4, 5.3);
          sats.forEach((s, i) => {
            posSat(s, t, s.g.position);
            // corpo virado para a Terra (feixe -y aponta para o centro)
            up.copy(s.g.position).normalize(); q.setFromUnitVectors(Y, up); s.g.quaternion.copy(q);
            const vivo = t < s.fim;
            const fraco = vivo && bat < 0.25;
            s.luz.material.color.copy(fraco ? laranja : verde);
            s.luz.material.opacity = !vivo ? 0 : fraco ? (Math.sin(t * 22 + i) > 0 ? 1 : 0.15) : 1;
            const pulso = 0.5 + 0.5 * Math.sin(t * 5 - i);
            s.feixe.material.opacity = vivo ? (0.06 + 0.08 * pulso) * (fraco ? (Math.sin(t * 31 + i * 2) > -0.2 ? 1 : 0) : 1) : 0;
          });
          // câmera: começa colada no satélite principal e recua até ver a constelação toda
          const h = sats[0].g.position;
          const e = ease.inOutCubic(range(t, 0, 9.36));
          const n = v.copy(h).normalize();
          const perto = new THREE.Vector3().copy(h).addScaledVector(n, 0.5).add(new THREE.Vector3(0.5, 0.22, 0.75));
          const longe = new THREE.Vector3(2.5, 4.5, 12.5);
          cam.position.lerpVectors(perto, longe, e);
          const alvo = new THREE.Vector3().lerpVectors(h, new THREE.Vector3(0, 0.3, 0), ease.inOutSine(range(t, 1.5, 9.36)));
          cam.lookAt(alvo);
          stars.set(1, t);
          st.draw();
          const c = st.ctx;
          // bateria do satélite principal
          const [bx, by, bz] = SK.proj(h, cam);
          const a = range(t, 2.3, 2.6) * (1 - range(t, 5.5, 5.8));
          if (bz < 1 && a > 0) {
            const x = clamp(bx + 230, 300, 780), y = clamp(by + 330, 1300, 1600);
            SK.pilula(c, x, y, 440, 150, a);
            SK.txt(c, "BATERIA", x - 190, y - 34, { tam: 26, cor: SK.AZUL, al: "left", a });
            SK.txt(c, Math.round(bat * 100) + "%", x + 190, y - 34, { tam: 34, peso: 600, al: "right", cor: bat < 0.25 ? SK.LARANJA : "#fff", a });
            c.save(); c.globalAlpha = a; c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(x - 190, y + 6, 380, 14);
            c.fillStyle = bat < 0.25 ? SK.LARANJA : "#6dff9a"; c.fillRect(x - 190, y + 6, 380 * bat, 14); c.restore();
            SK.txt(c, "NO ESCURO: " + Math.round(60 * range(t, 2.4, 5.3)) + " MIN", x - 190, y + 46, { tam: 22, cor: "#cfd8ea", al: "left", a });
          }
          const aG = range(t, 6.1, 6.4);
          SK.pilula(c, 540, 1480, 520, 90, aG, "rgba(40,12,6,0.62)");
          SK.txt(c, "GPS · SEM SINAL", 540, 1480, { tam: 36, peso: 600, cor: SK.LARANJA, a: aG * (0.75 + 0.25 * Math.sin(t * 9)) });
        }
