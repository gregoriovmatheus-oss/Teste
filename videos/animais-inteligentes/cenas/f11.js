/*META {"imports": ["mente"], "rotulos": [{"de": 2.0, "ate": 4.25, "texto": "Uma questão<br>de <span class=\"y\">direitos</span>"}], "D0": 4.25} */
        await MENTE.fontes();
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#3a4f7a", "#e8b07c"], nevoa: [14, 80], corNevoa: "#caa07e", luz: 0.9, nuvens: 8 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.6;
        const chao = T.mesh(new THREE.PlaneGeometry(300, 300), 0x7c7a55, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
        // 1) fazenda: celeiro + cerca + vaca
        const F = new THREE.Group(); F.position.set(0, 0, -3); S.add(F);
        T.mesh(new THREE.BoxGeometry(4, 3, 3), 0x9a3a2c, F, 0.85).position.set(-1, 1.5, -2.5);
        { const tg = new THREE.CylinderGeometry(2.3, 2.3, 4.1, 3); const tt = T.mesh(tg, 0x4a3a34, F, 0.8); tt.rotation.set(0, 0, Math.PI / 2); tt.scale.set(1, 1, 0.68); tt.position.set(-1, 3.55, -2.5); }
        for (let i = 0; i < 9; i++) T.mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), 0xd8cfbd, F, 0.9).position.set(-3 + i * 0.75, 0.55, 1.2);
        for (const y of [0.45, 0.9]) T.mesh(new THREE.BoxGeometry(6.2, 0.1, 0.06), 0xd8cfbd, F, 0.9).position.set(0, y, 1.2);
        const vaca = MENTE.vaca({ fase: 0.3 }); MENTE.leve(vaca.group); vaca.group.position.set(0.3, 0, -0.2); vaca.group.rotation.y = -0.3; F.add(vaca.group);
        // 2) zoológico: jaula de barras + leão
        const Z = new THREE.Group(); Z.position.set(9, 0, -3); S.add(Z);
        T.mesh(new THREE.BoxGeometry(5, 0.2, 3.4), 0x8d877c, Z, 0.9).position.set(0, 0.1, -0.5);
        const barras = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), T.M(0x3a3d42, 0.35, { metalness: 0.8 }), 26); Z.add(barras);
        { const o = new THREE.Object3D(); for (let i = 0; i < 26; i++) { o.position.set(-2.5 + i * 0.2, 1.6, 1.2); o.updateMatrix(); barras.setMatrixAt(i, o.matrix); } }
        T.mesh(new THREE.BoxGeometry(5.2, 0.15, 0.15), 0x3a3d42, Z, 0.4).position.set(0, 3.1, 1.2);
        const leao = A.createAnimal("leao", { fase: 0.4 }); MENTE.leve(leao.group); leao.group.position.set(0, 0.2, -0.3); leao.group.rotation.y = 0.5; Z.add(leao.group);
        // 3) aquário: tanque de vidro + golfinho
        const Q = new THREE.Group(); Q.position.set(18, 0, -3); S.add(Q);
        T.mesh(new THREE.BoxGeometry(5.6, 0.6, 3.2), 0x30343a, Q, 0.5).position.set(0, 0.3, -0.4);
        const agua = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3, 3), new THREE.MeshStandardMaterial({ color: 0x3aa0c8, roughness: 0.05, transparent: true, opacity: 0.45, depthWrite: false })); agua.position.set(0, 2.1, -0.4); Q.add(agua);
        const golf = A.createAnimal("golfinho", { fase: 0.1 }); MENTE.leve(golf.group); golf.group.position.set(0, 2.0, -0.4); Q.add(golf.group);
        const moldura = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.45, 3.05, 3.05)), new THREE.LineBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0 })); moldura.position.copy(agua.position); Q.add(moldura);
        const brilhoQ = MENTE.glow(0xff8a4c, 9, 0); brilhoQ.position.set(0, 2.1, -0.4); Q.add(brilhoQ);
        const nomes = [[F, "FAZENDA", 0.1, [0.3, 2.6, 0]], [Z, "ZOOLÓGICO", 0.64, [0, 3.6, 1.2]], [Q, "AQUÁRIO", 1.44, [0, 4.0, -0.4]]];
        // travelling lateral com chicotes entre os três lugares
        const KX = [[0, -0.6], [0.45, 0.3], [0.8, 8.4], [1.2, 9.2], [1.6, 17.4], [4.25, 18.3]];
        const camX = (t) => { for (let i = 1; i < KX.length; i++) if (t <= KX[i][0]) { const [a, x] = KX[i - 1], [b, y] = KX[i]; return lerp(x, y, ease.inOutSine(range(t, a, b))); } return KX[KX.length - 1][1]; };
        const v = new THREE.Vector3();
        function render(t) {
          const x = camX(t), dx = (camX(t + 0.05) - x) / 0.05;
          st.vel = clamp(Math.abs(dx) / 30) * 0.8; st.velT = t;
          // os bichos viram a cabeça para nós ("com outros olhos")
          vaca.update(t, { vira: -0.9 * range(t, 0.0, 0.5), cabeca: 0.1 });
          leao.update(t, { cabeca: 0.15 * range(t, 0.7, 1.2) });
          leao.head.rotation.y = 0.7 * ease.inOutSine(range(t, 0.7, 1.3));
          golf.group.position.x = Math.sin(t * 0.9) * 1.6; golf.group.rotation.y = Math.cos(t * 0.9) > 0 ? 0 : Math.PI; golf.update(t, { nada: 1.2 });
          const dir = range(t, 2.6, 3.5);
          moldura.material.opacity = dir; brilhoQ.material.opacity = dir * 0.35;
          const push = ease.inOutSine(range(t, 1.8, 4.25));
          cam.position.set(x, lerp(2.0, 2.4, push), lerp(7.5, 5.2, push));
          cam.lookAt(x + 0.3, lerp(1.6, 2.0, push), -3);
          st.sol(x, -3, 10);
          st.draw();
          nomes.forEach(([g, n, t0, p]) => {
            v.set(...p).applyMatrix4(g.matrixWorld); const q = MENTE.proj(v, cam);
            MENTE.texto(st.ctx, { x: q[0], y: Math.max(620, Math.min(900, q[1])), k: n, a: range(t, t0, t0 + 0.2) * (1 - range(t, 1.8, 2.0)) * (q[2] < 1 ? 1 : 0), tam: 60 });
          });
        }
