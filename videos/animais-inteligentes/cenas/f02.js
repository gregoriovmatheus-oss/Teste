/*META {"imports": ["mente"], "rotulos": [{"de": 0.9, "ate": 2.75, "texto": "<span class=\"k\">AMANHÃ</span><br>Todos os <span class=\"y\">animais</span>"}, {"de": 2.88, "ate": 4.82, "texto": "Tão inteligentes<br>quanto <span class=\"y\">nós</span>"}], "D0": 4.82} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#22325e", "#f2a066"], nevoa: [18, 120], corNevoa: "#d99a70", luz: 0.75, nuvens: 8 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.7;
        // savana ao amanhecer
        const chao = T.mesh(new THREE.PlaneGeometry(400, 400), 0xa58a52, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
        const rr = mulberry32(202);
        const capim = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.6, 3), T.M(0xb89a58, 0.9), 900); S.add(capim);
        { const o = new THREE.Object3D(); for (let i = 0; i < 900; i++) { o.position.set((rr() - 0.5) * 40, 0.25, (rr() - 0.5) * 40 - 2); o.rotation.set((rr() - 0.5) * 0.4, rr() * 3, (rr() - 0.5) * 0.4); o.scale.setScalar(0.6 + rr()); o.updateMatrix(); capim.setMatrixAt(i, o.matrix); } }
        for (const [x, z, s] of [[-9, -14, 1.6], [7, -18, 1.9], [16, -9, 1.3], [-18, -6, 1.5]]) { const a = T.arvore(s, 0x5d7a3a, 300 + x); a.scale.set(s * 1.6, s * 0.8, s * 1.6); a.position.set(x, 0, z); S.add(a); }
        const sol = MENTE.glow(0xffd6a0, 16, 0.9); sol.position.set(-8, 2, -70); S.add(sol);
        const solN = MENTE.glow(0xfff2d8, 5, 1); solN.position.set(-8, 2, -69); S.add(solN);
        // bichos dormindo (cabeça baixa) que acordam quando o pulso passa
        const B = [
          ["elefante", -3.2, -3, 0.5, 1.0], ["girafa", 3.5, -7, 2.3, 1.0], ["zebra", 5.2, -2.5, 2.8, 1.0], ["zebra", 6.6, -4.2, 2.5, 1.0],
          ["leao", 0.6, 1.2, 1.9, 0.9], ["macaco", -1.2, 3.2, 0.9, 0.9], ["coelho", 1.8, 4.2, 2.2, 1.0], ["passaro", -0.4, 3.9, 1.2, 1.1],
        ].map(([tp, x, z, ry, s], i) => {
          const a = A.createAnimal(tp, { fase: i * 0.13, cor: 0x3f6fa8 }); MENTE.leve(a.group);
          a.group.position.set(x, 0, z); a.group.rotation.y = ry; a.group.scale.setScalar(s); S.add(a.group);
          const g = MENTE.glow(0x7cc8ff, tp === "elefante" || tp === "girafa" ? 2.2 : 1.1, 0); S.add(g);
          return { a, g, d: Math.hypot(x, z), tp };
        });
        const aves = T.bando(S, { n: 22, seed: 205, cor: 0x2a2a30 });
        // pulso neural: anel azul que corre pelo chão a partir do centro
        const anel = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 96), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        anel.rotation.x = -Math.PI / 2; anel.position.y = 0.08; S.add(anel);
        const anel2 = anel.clone(); anel2.material = anel.material.clone(); S.add(anel2);
        const T0 = 2.35, VEL = 9;
        const hp = new THREE.Vector3();
        function render(t) {
          // céu clareando
          const dia = range(t, 0, 4.82);
          st.key.intensity = 3.2 * lerp(0.45, 0.95, dia); st.hemi.intensity = 0.55 * lerp(0.5, 1, dia);
          sol.position.y = lerp(0.5, 4, dia); solN.position.y = sol.position.y;
          const R = Math.max(0, (t - T0) * VEL);
          anel.scale.setScalar(Math.max(0.01, R)); anel.material.opacity = t > T0 ? 0.9 * (1 - range(R, 10, 40)) : 0;
          const R2 = Math.max(0, (t - T0 - 0.25) * VEL * 0.8);
          anel2.scale.setScalar(Math.max(0.01, R2)); anel2.material.opacity = t > T0 + 0.25 ? 0.5 * (1 - range(R2, 8, 30)) : 0;
          B.forEach(({ a, g, d, tp }, i) => {
            const k = ease.outCubic(range(t, T0 + d / VEL, T0 + d / VEL + 0.7));
            const dorm = 1 - k;
            if (tp === "girafa") a.update(t, { pescoco: dorm * 0.9, cabeca: dorm * -0.3 });
            else if (tp === "passaro") a.update(t, { cabeca: dorm * -0.5 });
            else a.update(t, { cabeca: dorm * -0.55 + k * 0.12, tromba: dorm * 0.6 });
            a.group.position.y = tp === "passaro" ? 0 : 0;
            if (a.head) { a.head.getWorldPosition(hp); g.position.copy(hp); }
            const fl = Math.sin(Math.PI * range(t, T0 + d / VEL, T0 + d / VEL + 0.9));
            g.material.opacity = fl * 0.95 + k * 0.18;
          });
          aves.update(t, [-14 + t * 4, 13 + t * 0.8, -34], [7, 2, 4], -0.3, 0.9);
          st.vel = Math.sin(Math.PI * range(t, T0, T0 + 1.0)) * 0.35; st.velT = t;
          // grua: rente ao capim → sobe e recua revelando a savana
          const e = ease.inOutSine(range(t, 0, 4.82));
          cam.position.set(lerp(2.2, -1.5, e), lerp(0.55, 4.2, e), lerp(8.5, 15, e));
          cam.lookAt(lerp(-0.3, 0.2, e), lerp(0.7, 1.4, e), lerp(0, -3, e));
          st.sol(0, -2, 22);
          st.draw();
        }
