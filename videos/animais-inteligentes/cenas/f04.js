/*META {"imports": ["mente"], "rotulos": [{"de": 0.25, "ate": 1.85, "texto": "<span class=\"k\">CORVOS</span><br>Cérebro <span class=\"y\">pequeno</span>"}, {"de": 2.1, "ate": 3.75, "texto": "Neurônios<br><span class=\"y\">apertados</span>"}, {"de": 4.55, "ate": 6.54, "texto": "<span class=\"k\">FERRAMENTA COMPOSTA</span><br><span class=\"y\">3</span> peças"}], "D0": 6.54} */
        const st = T.createToyStage(canvas, { fov: 32, ceu: ["#050912", "#16243a"], nevoa: [2, 9], corNevoa: "#0a1424", luz: 0.85, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.8;
        const pal = MENTE.palcoDiagrama(st, { y: 0, grade: true });
        st.key.intensity = 2.4; st.rim.intensity = 1.6; st.rim.color.set(0x7cc8ff);
        const poleiro = T.mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 12), 0x5b4532, S, 0.8); poleiro.rotation.x = Math.PI / 2; poleiro.position.set(0, 0.5, 0);
        const cv = MENTE.corvo(); cv.group.position.set(0, 0.52, 0); S.add(cv.group);
        // materiais próprios (o corvo vira holograma sem mexer no cache compartilhado)
        const mats = [];
        cv.group.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; mats.push(m.material); } });
        // cérebro do corvo dentro da cabeça: muitos pontos num volume minúsculo
        const C = MENTE.cerebro(cv.head, { tipo: "corvo", pontos: { cortex: 1500, cerebelo: 350 }, seed: 41, tam: 0.006 });
        C.group.scale.setScalar(0.27); C.group.position.set(-0.005, 0.005, 0);
        // três peças (tubos de diâmetros diferentes) que se encaixam
        const pecas = [[0.012, 0.22, 0xc8a66a], [0.009, 0.2, 0xb48d55], [0.006, 0.18, 0xd9bd86]].map(([r, l, c], i) => {
          const g = new THREE.Group(); S.add(g);
          const m = T.mesh(new THREE.CylinderGeometry(r, r, l, 14), c, g, 0.75); m.rotation.z = Math.PI / 2;
          const h = MENTE.glow(0x7cc8ff, 0.08, 0); g.add(h); h.position.x = -l / 2;
          g.userData = { l, r, h };
          return g;
        });
        const flash = MENTE.glow(0xffffff, 0.25, 0); S.add(flash);
        function render(t) {
          pal.update(t);
          const holo = Math.sin(Math.PI * range(t, 0.7, 3.9));
          mats.forEach((m) => { m.opacity = 1 - 0.85 * holo; m.depthWrite = holo < 0.5; });
          C.update(t, { fill: { cortex: ease.inOutSine(range(t, 1.0, 2.6)), cerebelo: ease.inOutSine(range(t, 1.0, 2.6)) }, brilho: { cortex: 1.4 * holo, cerebelo: 1.4 * holo }, casca: holo, pisca: 0.5 });
          C.group.visible = holo > 0.02;
          // peças: chegam flutuando, giram e se encaixam uma na outra (5,3-6,0 s)
          const chega = ease.outCubic(range(t, 3.85, 4.7));
          const enc = [ease.inOutCubic(range(t, 5.25, 5.65)), ease.inOutCubic(range(t, 5.75, 6.15))];
          const base = new THREE.Vector3(0.42, 0.62, 0.05);
          let x = base.x;
          pecas.forEach((g, i) => {
            const { l } = g.userData;
            const solto = new THREE.Vector3(base.x + (i - 1) * 0.06, base.y + 0.11 - i * 0.1, base.z + (i - 1) * 0.08);
            const junto = new THREE.Vector3(x, base.y, base.z);
            x += l * 0.82;
            const k = i === 0 ? 1 : enc[i - 1];
            g.position.lerpVectors(solto, junto, i === 0 ? ease.inOutCubic(range(t, 5.25, 5.65)) : k);
            g.position.y += (1 - chega) * 0.4;
            g.rotation.set(0, (1 - Math.max(k, enc[0])) * (0.6 - i * 0.5) + Math.sin(t * 1.3 + i) * 0.05 * (1 - k), (1 - chega) * 1.5);
            g.visible = t > 3.8;
            g.userData.h.material.opacity = Math.sin(Math.PI * range(t, 4.3 + i * 0.2, 5.0 + i * 0.2)) * 0.9;
          });
          const enc2 = Math.max(Math.sin(Math.PI * range(t, 5.6, 5.85)), Math.sin(Math.PI * range(t, 6.1, 6.35)));
          flash.position.set(base.x + 0.16, base.y, base.z); flash.material.opacity = enc2;
          // o corvo olha para as peças
          const olha = ease.inOutSine(range(t, 4.0, 4.8));
          cv.update(t, { cabeca: -0.25 * olha + 0.05, vira: olha * 0.1, inclina: Math.sin(t * 0.9) * 0.08 + olha * 0.25 });
          // câmera: macro na cabeça → recua e gira revelando as peças
          const e = ease.inOutSine(range(t, 0, 3.6)), b = ease.inOutCubic(range(t, 3.6, 5.2));
          const head = new THREE.Vector3(0.18, 0.92, 0);
          const p0 = new THREE.Vector3(0.2 + lerp(0.12, 0.0, e), 0.94, lerp(0.62, 0.42, e));
          const p1 = new THREE.Vector3(0.62, 0.9, 1.75);
          cam.position.lerpVectors(p0, p1, b);
          cam.position.x += Math.sin(t * 0.4) * 0.02;
          const l1 = new THREE.Vector3(0.5, 0.68, 0.05);
          cam.lookAt(new THREE.Vector3().lerpVectors(head, l1, b));
          st.sol(0, 0, 2, 0.5);
          st.draw();
        }
