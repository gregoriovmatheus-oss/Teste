/*META {"imports": ["avenida"], "css": ".rot-t .selo{display:inline-block;font-family:\"Inter\",sans-serif;font-weight:800;font-size:128px;line-height:1.05;letter-spacing:0.01em;text-transform:uppercase;background:linear-gradient(180deg,#ffffff 35%,#9fd6ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.65))}.rot-t .sp{display:block;font-family:\"JetBrains Mono\",monospace;font-weight:500;font-size:28px;letter-spacing:0.34em;color:#7cc8ff;margin-bottom:12px;text-transform:uppercase}.rot-t .sl{display:block;width:380px;height:2px;margin:14px auto 0;background:linear-gradient(90deg,rgba(124,200,255,0),#7cc8ff,rgba(124,200,255,0))}", "rotulos": [{"de": 0, "ate": 5.86, "top": 300, "fixo": true, "pulso": 0.2, "texto": "<span class=\"sp\">TEMPO SEM HUMANOS</span><span class=\"selo\">DÉCADAS</span><span class=\"sl\"></span>"}, {"de": 1.0, "ate": 2.6, "texto": "Aço <span class=\"y\">enferruja</span>"}, {"de": 4.15, "ate": 5.86, "texto": "<span class=\"k\">FERRUGEM</span><br>até <span class=\"y\">6×</span> o volume"}], "D0": 5.86} */
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#8EA2B8", "#E2D8C2"], nevoa: [30, 230], corNevoa: "#cfc7b4", luz: 0.85 });
        const S = st.scene, cam = st.cam;
        const av = AVENIDA.avenida(S);
        // ---- diagrama: corte de uma parede de concreto com vergalhões de aço ----
        const GS = new THREE.Scene();
        GS.background = T.gradTex("#1d2430", "#3a3f48"); GS.environment = S.environment;
        GS.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a3430, 1.2));
        const dl = new THREE.DirectionalLight(0xffe2c0, 2.6); dl.position.set(-6, 8, 10); GS.add(dl);
        const conc = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 3), new THREE.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.95, transparent: true, opacity: 0.42, depthWrite: false }));
        conc.position.y = 2.5; GS.add(conc);
        const corte = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.35 }));
        corte.position.set(0, 2.5, 1.505); GS.add(corte);
        const barras = [[-2.2, 1.3], [2.2, 1.3], [-2.2, 3.7], [2.2, 3.7]].map(([x, y]) => {
          const m = new THREE.MeshStandardMaterial({ color: 0x8c949c, roughness: 0.35, metalness: 0.85 });
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 20), m); b.rotation.x = Math.PI / 2; b.position.set(x, y, 0); GS.add(b);
          return { b, m, x, y };
        });
        // setas de pressão saindo de cada barra (a ferrugem empurra o concreto)
        const setaMat = new THREE.MeshBasicMaterial({ color: 0x7cc8ff });
        const setas = [];
        barras.forEach(({ x, y }) => { for (let k = 0; k < 6; k++) {
          const a = k / 6 * Math.PI * 2 + 0.3, g = new THREE.Group(); g.position.set(x, y, 1.55); g.rotation.z = a - Math.PI / 2; GS.add(g);
          const haste = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.02), setaMat); haste.position.y = 0.55; g.add(haste);
          const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 10), setaMat); ponta.position.y = 0.92; g.add(ponta);
          setas.push(g);
        } });
        // trincas crescendo na face do concreto a partir das barras
        const rr = mulberry32(707), TR = [];
        barras.forEach(({ x, y }) => { for (let c = 0; c < 3; c++) { let px = x, py = y, a = rr() * 6.28; const n = 7 + Math.floor(rr() * 5);
          for (let j = 0; j < n; j++) { a += (rr() - 0.5) * 0.9; const L = 0.25 + rr() * 0.3; const nx = px + Math.cos(a) * L, ny = py + Math.sin(a) * L; if (ny < 0.05 || ny > 4.95 || Math.abs(nx) > 3.95) break; TR.push({ x: (px + nx) / 2, y: (py + ny) / 2, L, a, k: j / n }); px = nx; py = ny; } } });
        const tri = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x1b1714 }), TR.length); GS.add(tri);
        const lasca = new THREE.Mesh(T.roundBox(1.6, 0.5, 1.4, 0.1), new THREE.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.95 })); GS.add(lasca);
        const cam2 = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.1, 200);
        const o = new THREE.Object3D();
        st.extraWarm = [{ renderer: st.renderer, scene: GS, camera: cam2 }];
        const aco = new THREE.Color(0x8c949c), oxi = new THREE.Color(0xc0581f);
        function render(t) {
          if (t < 2.62) {
            const fe = ease.inOutSine(range(t, 0.9, 2.5));
            av.set({ racha: 1, mato: 1, hera: 0.45, sujeira: 0.6, ferrugem: 0.25 + 0.75 * fe, floresta: 0.25, fenda: 0.2 }, t);
            const e = ease.inOutSine(range(t, 0, 2.62));
            cam.position.set(lerp(-5.5, -3.2, e), lerp(2.2, 3.4, e), lerp(16, 6, e));
            cam.lookAt(lerp(-2.4, -2.6, e), 0.8, lerp(6, -6, e));
            st.sol(-2, 0, 30);
            st.draw(S, cam, { cor: "#0b0a12", a: range(t, 2.35, 2.62) });
          } else {
            const u = t - 2.62;
            const inc = ease.inOutSine(range(t, 3.4, 4.6));     // "incha"
            const rac = ease.outCubic(range(t, 4.55, 5.5));      // "racha"
            barras.forEach(({ b, m }) => { const s = 1 + inc * 0.9; b.scale.set(s, 1, s); m.color.copy(aco).lerp(oxi, Math.min(1, inc * 1.3)); m.metalness = lerp(0.85, 0.1, inc); m.roughness = lerp(0.35, 1, inc); });
            setas.forEach((g, i) => { const k = ease.outBack(range(t, 3.6 + (i % 6) * 0.04, 4.2 + (i % 6) * 0.04)); g.scale.setScalar(Math.max(1e-3, k * (1 + 0.08 * Math.sin(t * 8 + i)))); });
            TR.forEach((p, i) => { const k = clamp((rac * 1.3 - p.k) / 0.2); o.position.set(p.x, p.y, 1.52); o.rotation.set(0, 0, p.a); o.scale.set(p.L * k + 1e-3, 0.05, 0.02); o.updateMatrix(); tri.setMatrixAt(i, o.matrix); });
            tri.instanceMatrix.needsUpdate = true;
            const sp = range(t, 5.25, 5.86);
            lasca.position.set(2.4 + sp * 0.8, 4.75 + sp * 1.2 - sp * sp * 3, 0.9 + sp * 2.2); lasca.rotation.set(sp * 1.5, 0, -sp * 2);
            const e = ease.inOutSine(range(u, 0, 3.24));
            cam2.position.set(lerp(-7, 4.5, e), lerp(5.5, 3.6, e), lerp(11, 9.5, e));
            cam2.lookAt(0, 2.5, 0);
            st.draw(GS, cam2, { cor: "#0b0a12", a: 1 - range(u, 0, 0.3) });
          }
        }
