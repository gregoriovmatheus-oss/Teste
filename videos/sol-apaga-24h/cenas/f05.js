/*META {"imports": ["solkit"], "rotulos": [{"de": 1.45, "ate": 2.8, "top": 660, "texto": "Ela só <span class=\"y\">reflete</span><br>a luz do Sol"}, {"de": 2.9, "ate": 4.55, "top": 660, "texto": "As estrelas<br><span class=\"y\">continuam</span>", "sai": false}], "D0": 4.55} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 55, ceu: ["#02040b", "#0c1630"], nevoa: [80, 600], corNevoa: "#0a1226", nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environmentIntensity = 0.1; st.hemi.intensity = 0.12; st.hemi.color.setHex(0x6f86c0); st.rim.intensity = 0;
        st.key.intensity = 0.35; st.key.color.setHex(0x8fa8ff); st.key.castShadow = false;
        const cid = T.cidade({ n: 4, seed: 51, verde: 0.1, hMin: 8, hMax: 30 }); S.add(cid.group);
        const rr = mulberry32(52);
        cid.buildings.forEach((b) => { b.userData.win.emissiveIntensity = rr() < 0.6 ? 0.9 + rr() * 0.6 : 0; });
        const stars = SK.estrelas(S, { n: 3400, r: 900, seed: 53, tam: 3.6 });
        // Lua: textura de crateras, iluminada só pela luz do Sol (sem luz própria)
        const mc = document.createElement("canvas"); mc.width = 512; mc.height = 256;
        { const g = mc.getContext("2d"); g.fillStyle = "#b9b6ae"; g.fillRect(0, 0, 512, 256); const r = mulberry32(54);
          for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(70,70,75,0.35)"; g.beginPath(); g.ellipse(r() * 512, 60 + r() * 140, 30 + r() * 50, 20 + r() * 30, r() * 3, 0, 6.3); g.fill(); }
          for (let i = 0; i < 160; i++) { const x = r() * 512, y = r() * 256, R = 2 + Math.pow(r(), 2) * 16; g.strokeStyle = "rgba(240,238,230,0.45)"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, R, 0, 6.3); g.stroke(); g.fillStyle = "rgba(60,60,64,0.25)"; g.beginPath(); g.arc(x + R * 0.15, y + R * 0.15, R * 0.85, 0, 6.3); g.fill(); } }
        const mtex = new THREE.CanvasTexture(mc); mtex.colorSpace = THREE.SRGBColorSpace;
        const moonMat = new THREE.ShaderMaterial({
          uniforms: { map: { value: mtex }, uSun: { value: new THREE.Vector3(0.75, -0.35, 0.55).normalize() }, uL: { value: 1 } },
          vertexShader: `varying vec3 vN; varying vec2 vUv; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `uniform sampler2D map; uniform vec3 uSun; uniform float uL; varying vec3 vN; varying vec2 vUv;
            void main(){ vec3 tx = texture2D(map, vUv).rgb; float lam = smoothstep(-0.05, 0.35, dot(normalize(vN), uSun));
              vec3 c = tx * lam * 1.25 * uL + vec3(0.012, 0.016, 0.03); gl_FragColor = vec4(c, 1.0); }`,
        });
        const MD = new THREE.Vector3(0.18, 0.72, -1).normalize();
        const moon = new THREE.Mesh(new THREE.SphereGeometry(36, 48, 32), moonMat); moon.position.copy(MD).multiplyScalar(760); S.add(moon);
        const moonGlow = SK.brilho(0xcfd8ff, 230, "suave", 0.6); moonGlow.position.copy(moon.position); S.add(moonGlow);
        function render(t) {
          const L = 1 - ease.inOutSine(range(t, 0.6, 1.5));
          moonMat.uniforms.uL.value = L; moonGlow.material.opacity = 0.55 * L;
          stars.set(lerp(0.55, 1.15, range(t, 1.2, 3.4)), t);
          // panorâmica para cima: dos telhados até o céu
          const e = ease.inOutSine(range(t, 0, 4.55));
          cam.position.set(lerp(-6, 4, e), lerp(30, 36, e), lerp(70, 62, e));
          const pitch = lerp(0.02, 0.5, ease.inOutSine(range(t, 0, 3.0))), yaw = lerp(-0.12, 0.1, e);
          cam.lookAt(cam.position.x + Math.sin(yaw) * 10, cam.position.y + Math.tan(pitch) * 10, cam.position.z - Math.cos(yaw) * 10);
          st.draw();
          // a Lua continua lá, só não reflete mais nada: contorno tracejado
          const [x, y, z] = SK.proj(moon.position, cam);
          const a = range(t, 1.3, 1.8);
          if (z < 1 && a > 0) {
            const c = st.ctx, R = 36 / (760 * Math.tan(55 * Math.PI / 360)) * 960;
            c.save(); c.globalAlpha = a * 0.8; c.setLineDash([10, 12]); c.lineWidth = 3; c.strokeStyle = "#9fb6d8";
            c.beginPath(); c.arc(x, y, R * 1.06, 0, 6.3); c.stroke(); c.restore();
            SK.txt(c, "LUA (APAGADA)", x, y + R * 1.06 + 40, { tam: 30, cor: "#b8c8e6", a });
          }
        }
