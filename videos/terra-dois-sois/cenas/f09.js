/*META {"imports": ["doissois"], "rotulos": [{"de": 1.6, "ate": 2.75, "top": 620, "texto": "verões <span class=\"y\">mais longos</span>"}, {"de": 2.8, "ate": 4.4, "top": 620, "texto": "estações <span class=\"y\">fora do calendário</span>"}, {"de": 4.5, "ate": 6.24, "texto": "tempestades<br><span class=\"y\">mais fortes</span>"}], "D0": 6.24} */
        const DS = DOISSOIS;
        await DS.fontes();
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#5d8fcf", "#f6d8a0"], nevoa: [40, 240], corNevoa: "#e8d0a8", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        const ceuT = DS.ceuTex([[0, "#5d8fcf"], [1, "#f6d8a0"]]);
        const DIA = [new THREE.Color("#5d8fcf"), new THREE.Color("#f6d8a0")], TEMP = [new THREE.Color("#141a26"), new THREE.Color("#3a414c")];
        const cv = ceuT.image, cg = cv.getContext("2d"); S.background = ceuT;
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), T.M(0x9a9a52, 0.95)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        // trigo/capim: InstancedMesh de lâminas
        const NB = 2600, R = mulberry32(909);
        const lam = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.9, 3).translate(0, 0.45, 0), T.M(0xd8b860, 0.8), NB);
        const B = []; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
        for (let i = 0; i < NB; i++) { B.push([(R() - 0.5) * 34, -R() * 46 + 8, 0.7 + R() * 0.7, R() * 6.28]); lam.setColorAt(i, new THREE.Color().setHSL(0.12 + R() * 0.03, 0.55, 0.45 + R() * 0.15)); }
        S.add(lam);
        for (let i = 0; i < 5; i++) { const a = T.arvore(2.2, 0x4f7a32, 70 + i); a.position.set(-16 + i * 8, 0, -30 - (i % 2) * 8); S.add(a); }
        const casa = T.predio({ w: 5, d: 4, h: 4, cor: 0xb58a64, seed: 9 }); casa.position.set(9, 0, -22); S.add(casa);
        const SA = DS.estrela(S, { r: 6, tipo: "amarelo", halo: 6, pos: [-30, 70, -170] });
        const SV = DS.estrela(S, { r: 3.2, tipo: "vermelho", halo: 7, pos: [40, 52, -170] });
        // nuvens de tempestade entrando
        const nuv = new THREE.Group(); S.add(nuv);
        for (let i = 0; i < 9; i++) { const n = T.nuvem(500 + i, 0x5a606c); n.scale.setScalar(5 + (i % 3) * 2); n.position.set(-40 + i * 10, 24 + (i % 2) * 6, -60 - (i % 3) * 14); nuv.add(n); }
        // chuva (segmentos animados no shader)
        const NR = 2200, rp = new Float32Array(NR * 6), rs = new Float32Array(NR * 2);
        for (let i = 0; i < NR; i++) { const x = (R() - 0.5) * 30, y = R() * 20, z = -R() * 30 + 6; rp.set([x, y, z, x - 0.12, y - 0.9, z], i * 6); rs[i * 2] = rs[i * 2 + 1] = R(); }
        const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3)); rg.setAttribute("s", new THREE.BufferAttribute(rs, 1));
        const rm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uA: { value: 0 } },
          vertexShader: `attribute float s; uniform float uT; void main(){ vec3 p = position; p.y = mod(p.y - uT * 22.0 - s * 20.0, 20.0); p.x -= p.y * 0.12; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
          fragmentShader: `uniform float uA; void main(){ gl_FragColor = vec4(0.8, 0.85, 0.95, 0.45 * uA); }` });
        const chuva = new THREE.LineSegments(rg, rm); chuva.frustumCulled = false; S.add(chuva);
        const c0 = new THREE.Color(), c1 = new THREE.Color();
        let ult = -1;
        const raio = (c, t0, sd) => { const r = mulberry32(sd); let x = 300 + r() * 480, y = 120; c.save(); c.strokeStyle = "rgba(230,240,255,0.95)"; c.lineWidth = 5; c.shadowColor = "#bcd8ff"; c.shadowBlur = 30; c.beginPath(); c.moveTo(x, y);
          while (y < 640) { x += (r() - 0.5) * 90; y += 30 + r() * 50; c.lineTo(x, y); } c.stroke(); c.restore(); };
        function render(t) {
          const tp = ease.inOutSine(range(t, 4.3, 5.2));
          if (Math.abs(tp - ult) > 1e-3) { ult = tp; c0.lerpColors(DIA[0], TEMP[0], tp); c1.lerpColors(DIA[1], TEMP[1], tp);
            const gr = cg.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, "#" + c0.getHexString()); gr.addColorStop(1, "#" + c1.getHexString()); cg.fillStyle = gr; cg.fillRect(0, 0, cv.width, cv.height); ceuT.needsUpdate = true; S.fog.color.copy(c1); }
          SA.set(1 - tp, t); SV.set(1 - tp, t);
          nuv.position.set(lerp(-60, 0, ease.outCubic(range(t, 3.6, 5.4))), 0, 0); nuv.visible = t > 3.5;
          st.key.intensity = 3.2 * (1 - 0.8 * tp); st.hemi.intensity = 0.55 * (1 - 0.4 * tp);
          // vento: o capim verga mais na tempestade
          const vento = 0.12 + 0.5 * tp;
          for (let i = 0; i < NB; i++) { const b = B[i]; eu.set(0, b[3], Math.sin(t * (2 + tp * 4) + b[0] * 0.3 + b[1] * 0.2) * vento + vento * 0.6); q.setFromEuler(eu);
            sc.set(1, b[2], 1); ps.set(b[0], 0, b[1]); m4.compose(ps, q, sc); lam.setMatrixAt(i, m4); }
          lam.instanceMatrix.needsUpdate = true;
          rm.uniforms.uT.value = t; rm.uniforms.uA.value = range(t, 4.7, 5.2);
          const e = ease.inOutSine(range(t, 0, 6.24));
          cam.position.set(lerp(-3, 2, e), lerp(1.3, 2.4, e), lerp(6, 2, e));
          cam.lookAt(lerp(0, 2, e), lerp(3.4, 5.5, e), -30);
          st.sol(0, -4, 30);
          st.bloom = 0.55;
          const fl = Math.max(0, 1 - Math.abs(t - 5.05) / 0.12) + 0.7 * Math.max(0, 1 - Math.abs(t - 5.75) / 0.1);
          st.draw(S, cam, fl > 0 ? { cor: "#e8f0ff", a: fl * 0.55 } : null);
          const c = st.ctx;
          if (fl > 0.3) raio(c, t, t < 5.4 ? 11 : 12);
          // calendário: o verão (laranja) fica mais longo e depois escorrega pelos meses
          const ca = range(t, 1.65, 1.95) * (1 - range(t, 4.2, 4.45));
          if (ca > 0) {
            const M = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"], w = 66, x0 = 540 - 6 * w;
            const len = lerp(3, 5, ease.inOutSine(range(t, 1.7, 2.6))), ini = -1 + 3.5 * ease.inOutSine(range(t, 2.85, 3.9));
            DS.pilula(c, 540, 965, 12 * w + 30, 78, ca);
            c.save(); c.globalAlpha = ca * 0.85; c.fillStyle = DS.LARANJA;
            for (const off of [0, 12]) { const xa = x0 + (ini + off - 12) * w, xb = xa + len * w; c.fillRect(Math.max(x0, xa), 944, Math.max(0, Math.min(x0 + 12 * w, xb) - Math.max(x0, xa)), 42); }
            c.restore();
            M.forEach((m, i) => DS.txt(c, m, x0 + (i + 0.5) * w, 966, { tam: 19, cor: "#fff", a: ca, esp: 0.05 }));
          }
        }
