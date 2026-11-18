/*META {"imports": ["solkit"], "rotulos": [{"de": 0.2, "ate": 1.9, "top": 700, "texto": "E o <span class=\"y\">frio</span>?"}, {"de": 2.7, "ate": 4.8, "top": 700, "texto": "O oceano<br><span class=\"y\">segura parte</span>"}, {"de": 4.95, "ate": 7.38, "top": 700, "texto": "<span class=\"k\">EM 7 DIAS</span><br>Perto de <span class=\"y\">zero</span>", "sai": false}], "D0": 7.38} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 58, ceu: ["#050a16", "#13213a"], nevoa: null, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        cam.setViewOffset(1080, 1920, 0, 380, 1080, 1920);
        S.environmentIntensity = 0.35; st.hemi.intensity = 0.4; st.hemi.color.setHex(0xa8bce6); st.key.intensity = 1.6; st.key.color.setHex(0xc8d6ff); st.rim.intensity = 0.8; st.rim.color.setHex(0x8fb0ff);
        const stars = SK.estrelas(S, { n: 1800, r: 900, seed: 111 });
        // maquete: metade continente, metade oceano
        const baseT = T.mesh(T.roundBox(9, 2.2, 9, 0.3), 0x6b5236, S, 0.9); baseT.position.set(-4.6, -1.2, 0);
        const topoMat = new THREE.MeshStandardMaterial({ color: 0x7f8a45, roughness: 0.9 });
        const topo = new THREE.Mesh(T.roundBox(9, 0.5, 9, 0.2), topoMat); topo.position.set(-4.6, 0.8, 0); topo.receiveShadow = true; S.add(topo);
        const rr = mulberry32(112);
        const morros = [];
        for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(T.SPH, topoMat); const s = 0.8 + rr() * 1.3; m.scale.set(s, s * (0.5 + rr() * 0.6), s); m.position.set(-4.6 + (rr() - 0.5) * 6.5, 1.1, (rr() - 0.5) * 6.5); m.castShadow = true; S.add(m); morros.push(m); }
        for (let i = 0; i < 9; i++) { const a = T.arvore(0.45 + rr() * 0.2, 0x3d6a2c, 120 + i); a.position.set(-4.6 + (rr() - 0.5) * 7, 1.05, (rr() - 0.5) * 7); S.add(a); }
        const baseO = T.mesh(T.roundBox(9, 2.2, 9, 0.3), 0x0f2f52, S, 0.6); baseO.position.set(4.6, -1.2, 0);
        const agua = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 8.8, 40, 40), new THREE.MeshStandardMaterial({ color: 0x2a6fa8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }));
        agua.rotation.x = -Math.PI / 2; agua.position.set(4.6, 0.85, 0); S.add(agua);
        const ap = agua.geometry.attributes.position, a0 = Float32Array.from(ap.array);
        // termômetros
        function termometro(x) {
          const g = new THREE.Group(); g.position.set(x, 1.0, 2.2); S.add(g);
          const vidro = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05 }));
          vidro.position.y = 3.6; g.add(vidro);
          const tampa = new THREE.Mesh(T.SPH, vidro.material); tampa.scale.setScalar(0.36); tampa.position.y = 6.6; g.add(tampa);
          const lm = new THREE.MeshStandardMaterial({ color: 0xff5a3d, emissive: 0xff5a3d, emissiveIntensity: 0.6, roughness: 0.3 });
          const bulbo = new THREE.Mesh(T.SPH, lm); bulbo.scale.setScalar(0.62); bulbo.position.y = 0.6; g.add(bulbo);
          const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 14), lm); g.add(liq);
          const zero = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 24), new THREE.MeshBasicMaterial({ color: 0x9fd6ff, toneMapped: false })); zero.rotation.x = Math.PI / 2; g.add(zero);
          const Z = 1.1 + 5.2 * 0.22; zero.position.y = Z;
          function nivel(f, cor) { const h = 5.2 * f; liq.scale.y = h; liq.position.y = 1.1 + h / 2; lm.color.copy(cor); lm.emissive.copy(cor); }
          return { g, nivel, zeroY: Z };
        }
        const tT = termometro(-4.6), tO = termometro(4.6);
        // calor subindo (Points)
        const NH = 160, hp = new Float32Array(NH * 3), hd = Array.from({ length: NH }, (_, i) => [i < NH / 2 ? -4.6 : 4.6, (rr() - 0.5) * 8, (rr() - 0.5) * 8, rr()]);
        const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.BufferAttribute(hp, 3));
        const hc = new Float32Array(NH); hg.setAttribute("aA", new THREE.BufferAttribute(hc, 1));
        const hm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          vertexShader: `attribute float aA; varying float vA; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 260.0 / -mv.z; }`,
          fragmentShader: `varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d,d)*18.0) * vA; if (a < 0.003) discard; gl_FragColor = vec4(vec3(1.0,0.55,0.25)*a, 1.0); }` });
        const heat = new THREE.Points(hg, hm); heat.frustumCulled = false; S.add(heat);
        const quente = new THREE.Color(0xff5a3d), frio = new THREE.Color(0x5fb0ff), cT = new THREE.Color(), cO = new THREE.Color();
        const verde = new THREE.Color(0x7f8a45), gelado = new THREE.Color(0x6f8796);
        const v = new THREE.Vector3();
        const tag = (p, s, o) => { const [x, y, z] = SK.proj(p, cam); if (z < 1) SK.txt(st.ctx, s, x, y, o); };
        function render(t) {
          // 0 -> 7 dias sem Sol; continente passa de 0 °C, oceano segura acima
          const h = range(t, 0.9, 5.4);
          const fT = lerp(0.85, 0.12, ease.outCubic(h)), fO = lerp(0.85, 0.6, h);
          cT.lerpColors(quente, frio, ease.outCubic(h) * 0.85); cO.lerpColors(quente, frio, h * 0.18);
          tT.nivel(fT, cT); tO.nivel(fO, cO);
          topoMat.color.lerpColors(verde, gelado, ease.outCubic(h) * 1.0);
          for (let i = 0; i < ap.count; i++) ap.setZ(i, 0.06 * Math.sin(a0[i * 3] * 1.7 + t * 2.2) * Math.cos(a0[i * 3 + 1] * 1.3 + t * 1.6));
          ap.needsUpdate = true; agua.geometry.computeVertexNormals();
          hd.forEach(([x0, x, z, ph], i) => {
            const u = (t * 0.35 + ph) % 1, terraP = i < NH / 2;
            hp.set([x0 + x + Math.sin(u * 6 + ph * 9) * 0.3, 1.2 + u * 5, z], i * 3);
            hc[i] = Math.sin(u * Math.PI) * 0.35 * (terraP ? 1 - ease.outCubic(h) * 0.95 : 1 - h * 0.25);
          });
          hg.attributes.position.needsUpdate = true; hg.attributes.aA.needsUpdate = true;
          const e = ease.inOutSine(range(t, 0, 7.38));
          const a = lerp(-0.45, 0.4, e);
          cam.position.set(Math.sin(a) * 30, lerp(11, 14, e), Math.cos(a) * 30);
          cam.lookAt(0, 3.0, 0);
          st.sol(0, 0, 18);
          stars.set(0.7, t);
          st.draw();
          const c = st.ctx;
          tag(v.set(-4.6, -2.9, 4.6), "CONTINENTE", { tam: 32, a: 1 - range(t, 2.4, 2.7) });
          tag(v.set(4.6, -2.9, 4.6), "OCEANO", { tam: 32, a: 1 - range(t, 2.4, 2.7) });
          tag(v.set(-4.6, -3.7, 4.6), "ESFRIA RÁPIDO", { tam: 26, cor: "#9fd6ff", a: range(t, 1.6, 2.0) * (1 - range(t, 2.4, 2.7)) });
          tag(v.set(4.6, -3.7, 4.6), "SEGURA O CALOR", { tam: 26, cor: SK.AZUL, a: range(t, 1.9, 2.2) * (1 - range(t, 2.4, 2.7)) });
          for (const tm of [tT, tO]) tag(v.set(tm.g.position.x + 1.1, 1.0 + tm.zeroY, 2.2), "0 °C", { tam: 26, cor: "#9fd6ff", al: "left" });
        }
