/*META {"imports": ["mente"], "rotulos": [{"de": 0.2, "ate": 1.7, "texto": "<span class=\"k\">A PERGUNTA</span><br>Uma pergunta <span class=\"y\">difícil</span>"}, {"de": 1.8, "ate": 4.22, "texto": "Por que os humanos<br><span class=\"y\">mandam no planeta?</span>"}], "D0": 4.22} */
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#0e1330", "#c8704c"], nevoa: [30, 260], corNevoa: "#6a4a58", luz: 0.6, nuvens: 10 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.9;
        st.key.color.set(0xff9a68);
        // colina em primeiro plano + cidade lá embaixo acendendo
        const morro = T.mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), 0x3d4a2c, S, 0.95); morro.scale.set(9, 2.2, 7); morro.position.set(0, -1.6, 2);
        const rr = mulberry32(81);
        const capim = new THREE.InstancedMesh(new THREE.ConeGeometry(0.04, 0.4, 3), T.M(0x55603a, 0.9), 500); S.add(capim);
        { const o = new THREE.Object3D(); for (let i = 0; i < 500; i++) { const a = rr() * 6.28, d = Math.sqrt(rr()) * 4; const x = Math.cos(a) * d, z = 2 + Math.sin(a) * d * 0.9; const y = -1.6 + 2.2 * Math.sqrt(Math.max(0, 1 - (x / 9) ** 2 - ((z - 2) / 7) ** 2)); o.position.set(x, y + 0.12, z); o.rotation.set((rr() - 0.5) * 0.5, 0, (rr() - 0.5) * 0.5); o.scale.setScalar(0.6 + rr()); o.updateMatrix(); capim.setMatrixAt(i, o.matrix); } }
        const baixada = T.mesh(new THREE.PlaneGeometry(600, 600), 0x2a2a2c, S, 0.95); baixada.rotation.x = -Math.PI / 2; baixada.position.y = -6; baixada.castShadow = false;
        const sky = MENTE.skyline(S, { n: 220, seed: 82, cx: 0, cz: -120, raio: 50, hMin: 2, hMax: 26 }); sky.mesh.position.y = -6;
        const solp = MENTE.glow(0xffb070, 30, 0.8); solp.position.set(40, 2, -160); S.add(solp);
        // o macaco sentado no topo, olhando a cidade
        const mc = A.createAnimal("macaco", { fase: 0.3 }); mc.group.position.set(0.2, 0.6, 2.2); A.face(mc.group, 0, -1); S.add(mc.group);
        mc.legs.forEach((l) => { l.rotation.z = 1.35; }); mc.group.position.y = 0.12;
        const luzesC = [];
        for (let i = 0; i < 60; i++) { const l = MENTE.glow(rr() < 0.7 ? 0xffc27a : 0xcfe2ff, 1.2 + rr() * 2, 0); l.position.set((rr() - 0.5) * 80, -5 + rr() * 6, -120 + (rr() - 0.5) * 70); S.add(l); luzesC.push([l, rr()]); }
        function render(t) {
          mc.update(t, { cabeca: 0.06 + Math.sin(t * 0.7) * 0.03 });
          mc.legs.forEach((l) => { l.rotation.z = 1.35; });
          mc.body.position.y = 0;
          mc.arms.forEach((a, i) => { a.rotation.z = 0.5; a.rotation.x = (i ? 1 : -1) * 0.25; });
          // a cidade acende enquanto ele olha
          sky.win.emissiveIntensity = lerp(0.4, 1.6, range(t, 0.3, 3.0));
          luzesC.forEach(([l, r]) => { l.material.opacity = range(t, 0.3 + r * 2.4, 0.6 + r * 2.4) * 0.6; });
          // por cima do ombro → grua subindo e girando
          const e = ease.inOutSine(range(t, 0, 4.22));
          const a = lerp(-0.35, 0.3, e), R = lerp(3.6, 5.2, e);
          cam.position.set(0.2 + Math.sin(a) * R, lerp(1.8, 3.0, e), 2.2 + Math.cos(a) * R);
          cam.lookAt(lerp(0.1, -1.5, e), lerp(0.9, -1.5, e), lerp(-2, -40, e));
          st.sol(0, 2, 6);
          st.draw();
        }
