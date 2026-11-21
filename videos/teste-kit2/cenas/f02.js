/*META {"imports": ["lowpoly"], "rotulos": [], "D0": 3.8} */
        const LP = LOWPOLY;
        const st = LP.palco(canvas, { foco: 2.6, faixa: 0.9, desfoque: 26 });
        const { S, cam } = st;
        const m = LP.pessoa({ seed: 12, longo: true, barba: false, pele: 0xc89478, cabelo: 0x2a1810, jaqueta: 0x3d6a8a, camisa: 0xe8e2d6, iris: 0x3a5a3a });
        const v = LP.pessoa({ seed: 15, barba: 0xb8b8b8, pele: 0x9a6a52, cabelo: 0xc8c8c8, jaqueta: 0x6a4a3a, camisa: 0x8a8a7a });
        m.root.position.set(-0.2, 0, 0.35); m.root.rotation.y = 0.35; m.root.scale.setScalar(0.94); m.emocao("triste", [0.2, -0.1]);
        v.root.position.set(0.24, 0, -0.45); v.root.rotation.y = -0.35; v.emocao("foco", [-0.3, 0]); S.add(m.root, v.root);
        const vag = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 0.1), LP.mat(0x8a96a6, 0.7)); vag.position.set(0, 1.5, -1.6); S.add(vag);
        for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6e0).multiplyScalar(2) })); l.position.set(-3 + i * 1.6, 2.9, -0.6); S.add(l); }
        st.hemi.intensity = 0.8; S.background = new THREE.Color(0x202630);
        const tags = [["“SERÁ QUE ELE SABE?”", -0.42, 1.45, 0.35, 0.6], ["“MAIS DUAS PARADAS”", 0.5, 1.62, -0.45, 1.3]];
        const v3 = new THREE.Vector3();
        function render(t) {
          const e = ease.inOutSine(range(t, 0, D));
          cam.position.set(lerp(-0.1, 0.2, e), 1.66, lerp(2.9, 2.6, e)); cam.lookAt(0.05, 1.42, 0);
          st.draw();
          for (const [txt, x, y, z, t0] of tags) LP.etiqueta(st.ctx, txt, v3.set(x, y, z), cam, range(t, t0, t0 + 0.3));
        }
