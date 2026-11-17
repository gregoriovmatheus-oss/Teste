/*META {"imports": ["solkit"], "rotulos": [{"de": 0.8, "ate": 2.55, "top": 660, "texto": "Mais de <span class=\"y\">1 hora</span><br>depois"}, {"de": 2.6, "ate": 5.07, "top": 660, "texto": "A luz vai<br><span class=\"y\">e volta</span>", "sai": false}], "D0": 5.07} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 40, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        const stars = SK.ceuDoc(S, { seed: 61, via: 0.35 });
        const RE = 2, RJ = 10.4;   // Terra a 1 UA, Júpiter a 5,2 UA (proporção real)
        const sol = SK.criaSol(S, { r: 0.55, pos: [0, 0, 0], halo: 6 });
        // plano do diagrama: órbitas, frente da última luz e região ainda iluminada
        const pm = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uR: { value: 0 }, uRE: { value: RE }, uRJ: { value: RJ } },
          vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `uniform float uR; uniform float uRE; uniform float uRJ; varying vec2 vP;
            void main(){ float d = length(vP);
              float orb = exp(-pow((d - uRE) / 0.035, 2.0)) + exp(-pow((d - uRJ) / 0.05, 2.0));
              float ring = exp(-pow((d - uR) / 0.09, 2.0)) * step(0.01, uR);
              float lit = smoothstep(uR - 0.02, uR + 0.6, d) * exp(-d * 0.09) * step(0.01, uR);
              vec3 c = vec3(0.35, 0.5, 0.8) * orb * 0.55 + vec3(1.0, 0.85, 0.55) * ring * 1.5 + vec3(1.0, 0.72, 0.4) * lit * 0.07;
              gl_FragColor = vec4(c, 1.0); }`,
        });
        const plano = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), pm); plano.rotation.x = -Math.PI / 2; S.add(plano);
        const terra = await SK.terraDoc(S, { raio: 0.3, seg: 48, pos: [RE, 0, 0] });
        st.bloom = 0.6;
        const jc = document.createElement("canvas"); jc.width = 256; jc.height = 128;
        { const g = jc.getContext("2d"), r = mulberry32(62); for (let y = 0; y < 128; y += 4) { const k = 0.5 + 0.5 * Math.sin(y * 0.21 + r()); g.fillStyle = `rgb(${200 + k * 40},${150 + k * 50},${110 + k * 40})`; g.fillRect(0, y, 256, 4); }
          g.fillStyle = "#b5573a"; g.beginPath(); g.ellipse(170, 80, 18, 9, 0, 0, 6.3); g.fill(); }
        const jt = new THREE.CanvasTexture(jc); jt.colorSpace = THREE.SRGBColorSpace;
        const jm = new THREE.MeshBasicMaterial({ map: jt, toneMapped: false });
        const jup = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 24), jm); jup.position.set(RJ, 0, 0); S.add(jup);
        const jGlow = SK.brilho(0xffd9a8, 3.2, "suave", 0.6); jGlow.position.copy(jup.position); S.add(jGlow);
        const reflexo = SK.brilho(0xfff0d0, 1.6, "suave", 1); S.add(reflexo);
        const v = new THREE.Vector3();
        const tag = (p, s, o) => { const [x, y, z] = SK.proj(p, cam); if (z < 1) SK.txt(st.ctx, s, x, y, o); };
        // minutos depois de o Sol apagar: 0 -> 43 (até Júpiter) -> 78 (reflexo de volta à Terra)
        const minutos = (t) => t < 2.5 ? 43 * range(t, 0.15, 2.5) : 43 + 35 * ease.inOutSine(range(t, 2.55, 4.5));
        function render(t) {
          sol.set(0, t);
          const m = minutos(t);
          pm.uniforms.uR.value = (m / 43) * RJ;
          const terraLuz = m < 8.3 ? 1 : 0, jLuz = (t < 2.5) ? 1 : 0.18;
          terra.set({ sol: new THREE.Vector3(-1, 0, 0), luz: terraLuz > 0.5 ? 1 : 0, cidades: 1.2 }); jm.color.setScalar(jLuz); jGlow.material.opacity = 0.6 * jLuz;
          terra.earth.rotation.y = t * 0.5; jup.rotation.y = t * 0.8;
          // último reflexo saindo de Júpiter em direção à Terra
          const q = range(t, 2.55, 4.5);
          reflexo.visible = t > 2.5 && q < 1;
          reflexo.position.set(lerp(RJ, RE, ease.inOutSine(q)), 0, 0);
          reflexo.scale.setScalar(1.6 + 0.3 * Math.sin(t * 18));
          // câmera de cima, com o Sol no topo; grua descendo e leve giro
          const e = ease.inOutSine(range(t, 0, 5.07));
          cam.up.set(-1, 0, lerp(-0.12, 0.12, e)).normalize();
          cam.position.set(lerp(10.2, 9.4, e), lerp(52, 48, e), lerp(6, 3, e));
          cam.lookAt(9.6, 0, 0);
          stars.set(1, t);
          st.draw();
          const c = st.ctx;
          // relógio do tempo da luz
          // tempo da luz preso à frente que viaja (o HUD do topo é do documentário)
          const ms = m < 60 ? "T+ " + Math.round(m) + " MIN" : "T+ 1 H " + String(Math.round(m - 60)).padStart(2, "0") + " MIN";
          if (t < 2.5) tag(v.set(Math.min(pm.uniforms.uR.value, RJ), 0, -1.2), ms, { tam: 30, cor: SK.AZUL, a: range(t, 0.2, 0.4) });
          else tag(v.copy(reflexo.position).add(new THREE.Vector3(0, 0, -1.2)), ms, { tam: 30, cor: SK.LARANJA, a: 1 - range(t, 4.6, 4.8) });
          tag(v.set(RJ, 0, 2.6), "43 MIN", { tam: 26, cor: SK.AZUL, a: range(t, 2.4, 2.6) });
          tag(v.set(-0.2, 0, 1.3), "SOL", { tam: 28, cor: "#9fb6d8" });
          tag(v.set(RE, 0, 1.0), "TERRA", { tam: 30 });
          tag(v.set(RJ, 0, 1.6), "JÚPITER", { tam: 32, cor: "#FFD9A8" });
          const na = range(t, 2.6, 2.9) * (1 - range(t, 4.4, 4.5));
          tag(v.set(RJ, 0, -1.9), "JÁ APAGOU, MAS A TERRA", { tam: 26, cor: "#cfd8ea", a: na });
          tag(v.set(RJ + 0.45, 0, -1.9), "AINDA VÊ O BRILHO", { tam: 26, cor: "#cfd8ea", a: na });
          tag(v.set(RJ, 0, -1.9), "SUMIU DO CÉU", { tam: 34, cor: SK.AZUL, a: range(t, 4.5, 4.7) });
        }
