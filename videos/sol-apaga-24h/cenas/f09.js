/*META {"imports": ["solkit"], "rotulos": [{"de": 0.8, "ate": 1.85, "top": 700, "texto": "Para em <span class=\"y\">segundos</span>"}, {"de": 2.3, "ate": 5.2, "top": 700, "texto": "<span class=\"k\">COMO TODA NOITE</span><br>Gasta o <span class=\"y\">amido</span>", "sai": false}], "D0": 5.2} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#1d2f16", "#070b06"], nevoa: null, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        st.key.castShadow = false;
        // folha: plano subdividido com textura (nervuras) e recorte por alfa, curvado
        const lc = document.createElement("canvas"); lc.width = 512; lc.height = 840;
        { const g = lc.getContext("2d");
          g.beginPath(); g.moveTo(256, 820); g.bezierCurveTo(470, 640, 500, 230, 256, 20); g.bezierCurveTo(12, 230, 42, 640, 256, 820); g.closePath();
          const gr = g.createLinearGradient(0, 0, 512, 840); gr.addColorStop(0, "#5f9a3a"); gr.addColorStop(1, "#2f6a24"); g.fillStyle = gr; g.fill();
          g.save(); g.clip();
          const r = mulberry32(91);
          for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${40 + r() * 50},${90 + r() * 60},${30 + r() * 30},0.18)`; g.beginPath(); g.arc(r() * 512, r() * 840, 6 + r() * 26, 0, 6.3); g.fill(); }
          g.strokeStyle = "rgba(200,230,150,0.75)"; g.lineWidth = 9; g.beginPath(); g.moveTo(256, 830); g.quadraticCurveTo(262, 420, 256, 30); g.stroke();
          g.lineWidth = 4;
          for (let k = 0; k < 9; k++) { const y = 760 - k * 82; for (const s of [1, -1]) { g.beginPath(); g.moveTo(258, y); g.quadraticCurveTo(256 + s * 90, y - 40, 256 + s * (200 - k * 12), y - 130); g.stroke(); } }
          g.restore(); }
        const ltex = new THREE.CanvasTexture(lc); ltex.colorSpace = THREE.SRGBColorSpace;
        const lgeo = new THREE.PlaneGeometry(7, 11.5, 30, 50);
        { const p = lgeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -0.09 * x * x + 0.35 * Math.sin(y * 0.35)); } lgeo.computeVertexNormals(); }
        const folha = new THREE.Mesh(lgeo, new THREE.MeshStandardMaterial({ map: ltex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 }));
        folha.rotation.set(-0.35, 0.25, -0.5); S.add(folha);
        const caule = T.mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 10), 0x4d7a2c, null); caule.position.set(0, -8.3, 0); folha.add(caule);
        // bokeh de fundo (luz entre as folhas) que se apaga
        const rb = mulberry32(92);
        const bokeh = Array.from({ length: 22 }, () => { const b = SK.brilho(rb() < 0.5 ? 0xfff0b0 : 0xb8e08a, 3 + rb() * 5, "disco", 0.5); b.position.set((rb() - 0.5) * 34, (rb() - 0.5) * 50, -26 - rb() * 10); b.ph = rb() * 6; S.add(b); return b; });
        // CO2 entrando e O2 saindo (InstancedMesh)
        const NC = 70;
        const co2 = new THREE.InstancedMesh(T.SPH, new THREE.MeshStandardMaterial({ color: 0xaab4c0, roughness: 0.4, transparent: true }), NC);
        const o2 = new THREE.InstancedMesh(T.SPH, new THREE.MeshStandardMaterial({ color: 0x8fdcff, emissive: 0x4fb8ff, emissiveIntensity: 0.5, roughness: 0.2, transparent: true }), NC);
        S.add(co2, o2); co2.frustumCulled = o2.frustumCulled = false;
        const rp = mulberry32(93), pd = Array.from({ length: NC }, () => [(rp() - 0.5) * 6, (rp() - 0.5) * 9, rp(), 0.08 + rp() * 0.08]);
        // grãos de amido na folha
        const NA = 46;
        const amido = new THREE.InstancedMesh(T.SPH, new THREE.MeshStandardMaterial({ color: 0xf4f0e2, emissive: 0xfff3c8, emissiveIntensity: 0.25, roughness: 0.4 }), NA);
        folha.add(amido);
        const ra = mulberry32(94), ad = Array.from({ length: NA }, () => { const y = (ra() - 0.5) * 8, w = 2.6 * Math.cos(y / 6.5); const x = (ra() - 0.5) * 2 * w; return [x, y, -0.09 * x * x + 0.35 * Math.sin(y * 0.35) + 0.08, 0.1 + ra() * 0.09]; });
        const o3 = new THREE.Object3D(), v = new THREE.Vector3(), W = new THREE.Vector3();
        const sunC = new THREE.Color(0xffd9a0), nightC = new THREE.Color(0x5a74b8);
        // tempo "congelado" das moléculas: param quando a luz acaba
        const te = (t) => t < 1.0 ? t : 1.0 + 0.12 * (1 - Math.exp(-(t - 1.0) / 0.12));
        function render(t) {
          folha.rotation.z = -0.5 + Math.sin(t * 0.8) * 0.03; folha.updateMatrixWorld();
          const L = 1 - ease.inOutSine(range(t, 0.15, 1.1));
          st.key.color.lerpColors(nightC, sunC, L); st.key.intensity = lerp(0.6, 3.4, L);
          st.hemi.intensity = lerp(0.18, 0.55, L); S.environmentIntensity = lerp(0.15, 1, L); st.rim.intensity = lerp(0.4, 1.1, L);
          bokeh.forEach((b) => { b.material.opacity = (0.15 + 0.4 * L) * (0.8 + 0.2 * Math.sin(t * 2 + b.ph)); });
          const tt = te(t), fade = 1 - range(t, 1.1, 1.9);
          co2.material.opacity = o2.material.opacity = fade;
          pd.forEach(([x, y, ph, s], i) => {
            const u = (tt * 0.7 + ph) % 1;
            v.set(x * (1.6 - 0.6 * u), y * (1.3 - 0.3 * u), lerp(7, 0.3, u));
            W.copy(v).applyMatrix4(folha.matrixWorld);
            o3.position.copy(W); o3.scale.setScalar(s * fade * (u < 0.1 ? u / 0.1 : 1)); o3.updateMatrix(); co2.setMatrixAt(i, o3.matrix);
            const u2 = (tt * 0.6 + ph * 1.7) % 1;
            v.set(x * 0.8, y * 0.8, lerp(0.3, 6.5, u2)); W.copy(v).applyMatrix4(folha.matrixWorld);
            o3.position.copy(W); o3.scale.setScalar(s * 1.3 * fade * (u2 > 0.85 ? (1 - u2) / 0.15 : 1)); o3.updateMatrix(); o2.setMatrixAt(i, o3.matrix);
          });
          co2.instanceMatrix.needsUpdate = o2.instanceMatrix.needsUpdate = true;
          // o amido vai sendo consumido (respiração da planta à noite)
          const gasto = range(t, 2.0, 5.2);
          amido.material.emissiveIntensity = 0.25 + 0.5 * Math.max(0, Math.sin(t * 6)) * gasto;
          ad.forEach(([x, y, z, s], i) => { o3.position.set(x, y, z); const k = 1 - 0.45 * gasto * (0.6 + 0.4 * Math.sin(i)); o3.scale.set(s * k * 1.3, s * k, s * k * 0.6); o3.updateMatrix(); amido.setMatrixAt(i, o3.matrix); });
          amido.instanceMatrix.needsUpdate = true;
          const e = ease.inOutSine(range(t, 0, 5.2));
          cam.position.set(lerp(-3, 2.5, e), lerp(1.5, 0.5, e), lerp(19, 14, e));
          cam.lookAt(0, 0.3, 0);
          st.draw();
          const c = st.ctx;
          // medidores
          const bar = (y, rot, val, cor, a) => {
            SK.pilula(c, 540, y, 760, 96, a);
            SK.txt(c, rot, 200, y - 18, { tam: 30, al: "left", a });
            SK.txt(c, Math.round(val * 100) + "%", 880, y - 18, { tam: 34, al: "right", fonte: "mono", peso: 600, esp: 0.02, a });
            c.save(); c.globalAlpha = a; c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(200, y + 12, 680, 16); c.fillStyle = cor; c.fillRect(200, y + 12, 680 * val, 16); c.restore();
          };
          bar(290, "FOTOSSÍNTESE", L, L > 0.5 ? "#7dd35a" : "#ff6a5a", range(t, 0.05, 0.35));
          bar(410, "RESERVA DE AMIDO", 1 - 0.35 * gasto, "#f4e6b8", range(t, 1.9, 2.3));
          const [ax, ay] = SK.proj(v.set(1.6, 1.0, 0.3).applyMatrix4(folha.matrixWorld), cam);
          SK.txt(c, "GRÃOS DE AMIDO", ax + 60, ay - 150, { tam: 28, cor: "#f4e6b8", a: range(t, 2.4, 2.8) });
          const [cx, cy] = SK.proj(v.set(-2.5, 3, 5).applyMatrix4(folha.matrixWorld), cam);
          SK.txt(c, "CO₂ ENTRA  ·  O₂ SAI", cx + 120, cy - 40, { tam: 30, cor: "#cfe9ff", a: range(t, 0.1, 0.3) * fade });
        }
