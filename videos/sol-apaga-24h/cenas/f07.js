/*META {"imports": ["solkit"], "rotulos": [{"de": 0.5, "ate": 1.8, "top": 690, "texto": "Não sai da <span class=\"y\">órbita</span>"}, {"de": 3.2, "ate": 4.55, "top": 690, "texto": "<span class=\"k\">APAGAR ≠ SUMIR</span><br>A massa <span class=\"y\">continua</span>"}, {"de": 4.65, "ate": 6.12, "top": 690, "texto": "E a <span class=\"y\">gravidade</span><br>também", "sai": false}], "D0": 6.12} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 55, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        cam.setViewOffset(1080, 1920, 0, 400, 1080, 1920);   // o diagrama fica na metade de cima; os rótulos, embaixo dele
        const stars = SK.ceuDoc(S, { seed: 71, via: 0.35 });
        const R = 6;
        const sol = SK.criaSol(S, { r: 1.2, pos: [0, 0, 0], halo: 5 });
        // malha do espaço-tempo afundada pela massa do Sol (que continua lá)
        const N = 31, SEG = 60, L = 30, pts = [];
        const yv = (x, z) => -1.4 - 2.6 / Math.sqrt((x * x + z * z) / 3 + 1);
        for (let i = 0; i < N; i++) {
          const a = -L / 2 + (i / (N - 1)) * L;
          for (let j = 0; j < SEG; j++) {
            const b0 = -L / 2 + (j / SEG) * L, b1 = -L / 2 + ((j + 1) / SEG) * L;
            pts.push(a, yv(a, b0), b0, a, yv(a, b1), b1, b0, yv(b0, a), a, b1, yv(b1, a), a);
          }
        }
        const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        const grade = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x4a86c8, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
        S.add(grade);
        const orb = new THREE.Mesh(new THREE.TorusGeometry(R, 0.025, 6, 160), new THREE.MeshBasicMaterial({ color: 0x9cc4f0, transparent: true, opacity: 0.8, toneMapped: false }));
        orb.rotation.x = Math.PI / 2; S.add(orb);
        const terra = await SK.terraDoc(S, { raio: 0.5, seg: 48 });
        st.bloom = 0.6;
        const tGlow = SK.brilho(0x7cc8ff, 2.2, "suave", 0.45); S.add(tGlow);
        const fant = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 20), new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0.35, toneMapped: false })); S.add(fant);
        const gSeta = SK.criaSeta(0x7cc8ff, { emis: 0.9 }), vSeta = SK.criaSeta(0xe8f4ff, { emis: 0.9 });
        S.add(gSeta.group, vSeta.group);
        const tan = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0.6, toneMapped: false })); S.add(tan);
        const v = new THREE.Vector3(), P = new THREE.Vector3(), Vt = new THREE.Vector3();
        const tag = (p, s, o) => { const [x, y, z] = SK.proj(p, cam); if (z < 1) SK.txt(st.ctx, s, x, y, o); return [x, y]; };
        function render(t) {
          sol.set(0, t);
          const th = 0.6 + t * 0.32;
          P.set(Math.cos(th) * R, 0, -Math.sin(th) * R);
          Vt.set(-Math.sin(th), 0, -Math.cos(th));
          terra.group.position.copy(P); terra.earth.rotation.y = t * 1.2; terra.set({ sol: P.clone().negate(), luz: 0, cidades: 1.5 }); tGlow.position.copy(P);
          const ga = range(t, 0.2, 0.6);
          gSeta.apontar(P.clone().addScaledVector(P, -0.5 / R), P.clone().multiplyScalar(1 - (0.5 + 2.4 * ga) / R), 0.07);
          gSeta.group.visible = ga > 0.01;
          vSeta.apontar(P.clone().addScaledVector(Vt, 0.55), P.clone().addScaledVector(Vt, 0.55 + 1.9 * ga), 0.06);
          vSeta.group.visible = ga > 0.01;
          // "fantasma": o que aconteceria só se o Sol SUMISSE (linha reta). Não é o caso.
          const fa = range(t, 0.7, 1.0) * (1 - range(t, 2.6, 3.0));
          const th0 = 0.6 + 0.7 * 0.32, P0 = new THREE.Vector3(Math.cos(th0) * R, 0, -Math.sin(th0) * R), V0 = new THREE.Vector3(-Math.sin(th0), 0, -Math.cos(th0));
          const fd = 6 * ease.outCubic(range(t, 0.7, 2.2));
          fant.position.copy(P0).addScaledVector(V0, fd); fant.material.opacity = 0.35 * fa; fant.visible = fa > 0.01;
          tan.position.copy(P0).addScaledVector(V0, 4.5); tan.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), V0); tan.scale.x = 9; tan.material.opacity = 0.6 * fa; tan.visible = fa > 0.01;
          // a malha "pulsa" quando falamos da massa e da gravidade
          grade.material.opacity = 0.35 + 0.35 * Math.exp(-Math.pow((t - 3.5) / 0.4, 2)) + 0.25 * Math.exp(-Math.pow((t - 5.0) / 0.4, 2));
          // órbita em grua: de rasante para mais alto, girando
          const e = ease.inOutSine(range(t, 0, 6.12));
          const a = lerp(0.2, 0.9, e), rc = lerp(15, 12, e);
          cam.position.set(Math.sin(a) * rc, lerp(15, 20, e), Math.cos(a) * rc);
          cam.lookAt(0, -0.5, 0);
          stars.set(1, t);
          st.draw();
          tag(v.copy(P).multiplyScalar(1 - 2.0 / R).add(new THREE.Vector3(0, 0.7, 0)), "GRAVIDADE", { tam: 30, cor: SK.AZUL, a: ga });
          tag(v.copy(P).addScaledVector(Vt, 2.0).add(new THREE.Vector3(0, 0.6, 0)), "VELOCIDADE", { tam: 26, cor: "#e8f4ff", a: ga });
          tag(v.set(0, 2.0, 0), "SOL APAGADO", { tam: 28, cor: "#9fb6d8" });
          tag(v.set(0, -0.2 - 2.2, 0), "MASSA: A MESMA", { tam: 30, cor: SK.AZUL, a: range(t, 3.25, 3.6) });
          const [fx, fy] = tag(v.copy(fant.position).add(new THREE.Vector3(0, 0.9, 0)), "SÓ SE O SOL SUMISSE", { tam: 26, cor: SK.LARANJA, a: fa });
          if (fa > 0.01) { const c = st.ctx; c.save(); c.globalAlpha = fa; c.strokeStyle = SK.LARANJA; c.lineWidth = 9; c.lineCap = "round"; const [x, y] = SK.proj(fant.position, cam); c.beginPath(); c.moveTo(x - 30, y - 30); c.lineTo(x + 30, y + 30); c.moveTo(x + 30, y - 30); c.lineTo(x - 30, y + 30); c.stroke(); c.restore(); }
        }
