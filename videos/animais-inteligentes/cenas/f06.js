/*META {"imports": ["mente"], "rotulos": [{"de": 0.8, "ate": 2.35, "texto": "<span class=\"k\">POLVO</span><br><span class=\"y\">500 milhões</span><br>de neurônios"}, {"de": 2.45, "ate": 4.35, "texto": "<span class=\"y\">2/3</span> nos braços"}, {"de": 4.45, "ate": 6.79, "texto": "Cada braço<br><span class=\"y\">pensa sozinho</span>"}], "D0": 6.79} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#0f4a66", "#020a12"], nevoa: [3, 20], corNevoa: "#062538", luz: 0.6, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.85;
        const mar = MENTE.mar(st, { fundo: 0, seed: 61, raios: 5, neve: 700 });
        st.key.intensity = 1.6;
        const P = A.createAnimal("polvo", { fase: 0.2 }); MENTE.leve(P.group); S.add(P.group);
        P.group.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xb4553c); m.material.roughness = 0.45; m.material.transparent = true; } });
        const pmats = []; P.group.traverse((m) => { if (m.isMesh) pmats.push(m.material); });
        // neurônios: 1/3 na cabeça (azul), 2/3 em aglomerados ao longo dos 8 braços (laranja). 1 ponto ≈ 0,5 mi
        const rr = mulberry32(62);
        const NH = 330, NA = 82, N = NH + NA * 8;
        const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), off = [];
        for (let i = 0; i < N; i++) {
          if (i < NH) { let x, y, z; do { x = rr() * 2 - 1; y = rr() * 2 - 1; z = rr() * 2 - 1; } while (x * x + y * y + z * z > 1); off.push([x * 0.32, y * 0.36 + 1.35, z * 0.32, -1, 0, rr()]); }
          else { const k = Math.floor((i - NH) / NA), s = Math.floor(rr() * 6); off.push([(rr() - 0.5) * 0.12, -rr() * 0.25, (rr() - 0.5) * 0.12, k, s, rr()]); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.07, map: MENTE.glowTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; S.add(pts);
        const v = new THREE.Vector3();
        const FR = [0.9, 1.7, 1.2, 2.3, 0.7, 1.9, 1.4, 2.6], PH = [0, 2.1, 4.2, 1.3, 3.7, 5.1, 0.6, 2.9];
        function render(t) {
          mar.update(t);
          P.update(t, {});
          // depois de 4,45 s cada braço se mexe no seu próprio ritmo (e acende quando "decide")
          const solto = ease.inOutSine(range(t, 4.3, 5.0));
          P.tents.forEach((segs, k) => segs.forEach((s, i) => {
            const prop = Math.sin(t * FR[k] * 2.2 - i * 0.8 + PH[k]) * (0.2 + i * 0.09);
            s.rotation.z = lerp(s.rotation.z, (i === 0 ? 0.9 + 0.3 * Math.sin(t * FR[k] + PH[k]) : -0.1) + prop, solto);
            s.rotation.x = solto * Math.sin(t * FR[k] * 1.3 + PH[k] + i) * 0.25;
          }));
          P.group.position.y = 0.05 + Math.sin(t * 1.1) * 0.04;
          P.group.rotation.y = t * 0.12;
          P.group.updateMatrixWorld(true);
          const vis = range(t, 0.85, 1.6), xr = range(t, 0.7, 1.4);
          pmats.forEach((m) => { m.opacity = 1 - 0.6 * xr; m.depthWrite = xr < 0.5; });
          const braco = range(t, 2.48, 3.0), cabeca = 1 - 0.6 * range(t, 2.48, 3.0);
          for (let i = 0; i < N; i++) {
            const [x, y, z, k, s, r] = off[i];
            let b;
            if (k < 0) { v.set(x, y, z).applyMatrix4(P.group.matrixWorld); b = vis * cabeca; col[i * 3] = 0.49 * b; col[i * 3 + 1] = 0.78 * b; col[i * 3 + 2] = b; }
            else {
              v.set(x, y, z).applyMatrix4(P.tents[k][s].matrixWorld);
              const pulso = solto * Math.max(0, Math.sin(t * FR[k] * 3 + PH[k])) ** 3;
              b = vis * (0.55 + 0.45 * braco + pulso * 1.2) * (0.7 + 0.3 * Math.sin(t * 8 + r * 20));
              const c1 = [0.49, 0.78, 1], c2 = [1, 0.54, 0.3];
              col[i * 3] = lerp(c1[0], c2[0], braco) * b; col[i * 3 + 1] = lerp(c1[1], c2[1], braco) * b; col[i * 3 + 2] = lerp(c1[2], c2[2], braco) * b;
            }
            pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
          }
          g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
          // órbita baixa, rente à areia
          const e = ease.inOutSine(range(t, 0, 6.79));
          const a = lerp(0.6, -0.5, e), R = lerp(6.4, 5.0, e);
          cam.position.set(Math.sin(a) * R, lerp(2.4, 1.5, e), Math.cos(a) * R);
          cam.lookAt(0, lerp(0.75, 0.6, e), 0);
          st.sol(0, 0, 5);
          st.draw();
        }
