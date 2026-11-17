/*META {"imports": ["avenida"], "css": ".rot-t .selo{display:inline-block;font-family:\"Inter\",sans-serif;font-weight:800;font-size:112px;line-height:1.05;letter-spacing:0.01em;text-transform:uppercase;background:linear-gradient(180deg,#ffffff 35%,#9fd6ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.65))}.rot-t .sp{display:block;font-family:\"JetBrains Mono\",monospace;font-weight:500;font-size:28px;letter-spacing:0.34em;color:#7cc8ff;margin-bottom:12px;text-transform:uppercase}.rot-t .sl{display:block;width:380px;height:2px;margin:14px auto 0;background:linear-gradient(90deg,rgba(124,200,255,0),#7cc8ff,rgba(124,200,255,0))}#f04-r2{align-items:flex-end}#f04-r2-in{font-size:68px}", "rotulos": [{"de": 0, "ate": 7.57, "top": 580, "fixo": true, "pulso": 0.2, "texto": "<span class=\"sp\">TEMPO SEM HUMANOS</span><span class=\"selo\">DIAS</span><span class=\"sl\"></span>"}, {"de": 2.2, "ate": 7.57, "sai": false, "texto": "<span class=\"k\">NOVA YORK</span><br><span class=\"y num\">0</span> bombas"}], "D0": 7.57} */
        const st = T.createToyStage(canvas, { fov: 52, ceu: "#07090c", nevoa: [10, 75], corNevoa: "#141c20", luz: 0.4, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        st.hemi.color.setHex(0x6f8ea0); st.hemi.groundColor.setHex(0x1c1a18); st.hemi.intensity = 1.3;
        const W = 9, H = 5.2, Z0 = 24, Z1 = -110, LEN = Z0 - Z1, ZC = (Z0 + Z1) / 2;
        const box = (w, h, d, x, y, z, cor, r = 0.9) => { const m = T.mesh(new THREE.BoxGeometry(w, h, d), cor, S, r); m.position.set(x, y, z); return m; };
        box(W, 0.3, LEN, 0, -0.15, ZC, 0x3a3531);           // leito
        box(0.4, H, LEN, -W / 2 - 0.2, H / 2, ZC, 0x5b5852);  // paredes
        box(0.4, H, LEN, W / 2 + 0.2, H / 2, ZC, 0x55524c);
        box(W + 0.8, 0.4, LEN, 0, H + 0.2, ZC, 0x3f3d3a);     // teto
        // vigas de aço entre as linhas, dormentes e trilhos
        const rr = mulberry32(404);
        const nCol = Math.floor(LEN / 3.2);
        const col = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, H, 0.35), T.M(0x2b2f33, 0.6, { metalness: 0.5 }), nCol); S.add(col);
        const o = new THREE.Object3D();
        for (let i = 0; i < nCol; i++) { o.position.set(0, H / 2, Z0 - 2 - i * 3.2); o.updateMatrix(); col.setMatrixAt(i, o.matrix); }
        const nD = Math.floor(LEN / 0.9) * 2;
        const dorm = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.14, 0.28), T.M(0x3d2c22, 0.95), nD); S.add(dorm);
        for (let i = 0; i < nD; i++) { o.position.set(i % 2 ? 2.25 : -2.25, 0.07, Z0 - Math.floor(i / 2) * 0.9); o.updateMatrix(); dorm.setMatrixAt(i, o.matrix); }
        for (const x of [-3.0, -1.5, 1.5, 3.0]) box(0.12, 0.16, LEN, x, 0.2, ZC, 0x8d9096, 0.35).material.metalness = 0.8;
        // luzes de emergência (algumas falhando) com luz pontual de verdade em 3 delas
        const lamps = [];
        for (let i = 0; i < 14; i++) {
          const z = Z0 - 4 - i * 8, x = i % 2 ? W / 2 - 0.1 : -W / 2 + 0.1;
          const m = new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0xffb860, emissiveIntensity: 2 });
          const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.7), m); l.position.set(x, 4.2, z); S.add(l);
          const g = new THREE.Sprite(AVENIDA.glowMat(0xffb060)); g.scale.setScalar(2.4); g.position.set(x * 0.97, 4.2, z); S.add(g);
          lamps.push({ m, g, ph: rr() * 6, falha: rr() < 0.3 });
        }
        const PL = [[-3.5, 4, 4], [3.5, 4, -12], [-3.5, 4, -28]].map(([x, y, z]) => { const p = new THREE.PointLight(0xffb870, 60, 30, 1.4); p.position.set(x, y, z); S.add(p); return p; });
        // vagão parado na linha da direita
        const vag = new THREE.Group(); vag.position.set(2.25, 0.35, -26); S.add(vag);
        T.mesh(T.roundBox(3.0, 3.3, 18, 0.3), 0x9aa0a6, vag, 0.4).material.metalness = 0.6;
        const jan = new THREE.MeshStandardMaterial({ color: 0x1a2228, emissive: 0x6f8f9a, emissiveIntensity: 0.15, roughness: 0.1 });
        for (const s of [1, -1]) { const j = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 16), jan); j.position.set(s * 1.52, 2.2, 0); vag.add(j); }
        const frente = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.05), jan); frente.position.set(0, 2.3, 9.02); vag.add(frente);
        // bombas d'água na parede esquerda (luz verde → vermelha)
        const bombas = [];
        for (let i = 0; i < 5; i++) {
          const g = new THREE.Group(); g.position.set(-W / 2 + 0.6, 0.1, 14 - i * 5); S.add(g);
          const c = T.mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 14), 0x3e6f8a, g, 0.5); c.rotation.z = Math.PI / 2; c.position.y = 0.5;
          T.mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8), 0x55595e, g, 0.5).position.set(-0.2, 2.2, 0);
          const lm = new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0x3ddc6a, emissiveIntensity: 2.5 });
          const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), lm); l.position.set(0.1, 1.05, 0.3); g.add(l);
          const gs = new THREE.Sprite(AVENIDA.glowMat(0x3ddc6a)); gs.scale.setScalar(0.9); gs.position.copy(l.position); g.add(gs);
          bombas.push({ lm, gs, i });
        }
        // água: plano ondulado que sobe
        const wg = new THREE.PlaneGeometry(W, LEN, 18, 140); wg.rotateX(-Math.PI / 2);
        const wpos = wg.attributes.position, w0 = Float32Array.from(wpos.array);
        const agua = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x4f8a80, emissive: 0x0d2a2a, roughness: 0.05, metalness: 0.35, transparent: true, opacity: 0.88 }));
        agua.position.z = ZC; S.add(agua);
        // goteiras e jorros do teto e das paredes (Points)
        const vaz = [[-2.2, 6], [1.0, -4], [-3.8, -14], [3.6, 2], [0.4, -22], [-1.5, -34]];
        const NP = 900, pp = new Float32Array(NP * 3), pv = Array.from({ length: NP }, () => [Math.floor(rr() * vaz.length), rr(), (rr() - 0.5) * 0.35, (rr() - 0.5) * 0.35, 0.8 + rr() * 0.6]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
        const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xbfe4ea, size: 0.09, transparent: true, opacity: 0.8, depthWrite: false })); pts.frustumCulled = false; S.add(pts);
        const nivel = (t) => 0.08 + 0.45 * ease.inOutSine(range(t, 0.9, 3.0)) + 0.2 * range(t, 3.0, 6.1) + 2.3 * ease.inQuad(range(t, 6.1, 7.57));
        const rot = canvas.parentElement.querySelector("#f04-r2-in .num");
        function render(t) {
          const lv = nivel(t);
          for (let i = 0; i < wpos.count; i++) {
            const x = w0[i * 3], z = w0[i * 3 + 2];
            wpos.array[i * 3 + 1] = Math.sin(x * 1.3 + t * 2.1) * 0.03 + Math.sin(z * 0.7 - t * 2.7 + x) * 0.04 + (t > 6.1 ? Math.sin(z * 0.4 - t * 6) * 0.06 : 0);
          }
          wpos.needsUpdate = true; wg.computeVertexNormals();
          agua.position.y = lv;
          const forca = 1 + 2.5 * range(t, 6.1, 7.0);
          pv.forEach(([k, ph, dx, dz, sp], i) => {
            const [x, z] = vaz[k], u = (t * sp * forca * 0.9 + ph) % 1, y = H - u * (H - lv);
            pp[i * 3] = x + dx * u * 1.5; pp[i * 3 + 1] = y; pp[i * 3 + 2] = z + dz * u;
          });
          pg.attributes.position.needsUpdate = true;
          // contador: sobe até 700 e, sem energia, as bombas desligam (vai a 0)
          const n = t < 6.12 ? Math.round(700 * ease.outCubic(range(t, 2.94, 3.7))) : Math.round(700 * (1 - ease.inOutSine(range(t, 6.12, 6.9))));
          if (rot) { rot.textContent = String(n); rot.style.color = t > 6.12 ? "#FF6B5E" : ""; }
          const desl = t > 6.12;
          bombas.forEach((b) => { const off = t > 6.12 + b.i * 0.12; b.lm.emissive.setHex(off ? 0xff3b30 : 0x3ddc6a); b.gs.material.color.setHex(off ? 0xff3b30 : 0x3ddc6a); b.gs.material.opacity = 0.8; });
          lamps.forEach((l) => { const f = l.falha ? (Math.sin(t * 23 + l.ph) > 0.2 ? 1 : 0.1) : 1; l.m.emissiveIntensity = 2 * f; l.g.material.opacity = 0.55 * f; });
          PL.forEach((p, i) => { p.intensity = 60 * (desl && i === 2 ? (Math.sin(t * 30) > 0 ? 1 : 0.2) : 1); });
          const e = ease.inOutSine(range(t, 0, 7.57));
          const cy = Math.max(lerp(2.6, 1.6, e), lv + 0.55);
          cam.position.set(lerp(-1.8, -0.9, e), cy, lerp(18, -2, e));
          cam.lookAt(lerp(-0.6, 0.6, e), lerp(1.4, lv + 0.3, e), -40);
          cam.rotateZ(Math.sin(t * 0.6) * 0.02);
          st.draw();
        }
