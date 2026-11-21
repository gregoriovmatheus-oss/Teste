/*META {"imports": ["lowpoly"], "rotulos": [], "D0": 4.09} */
        const LP = LOWPOLY;
        const st = LP.palco(canvas, { foco: 2.4, faixa: 0.9, desfoque: 26 });
        const { S, cam } = st;
        const c = LP.corvo(); S.add(c.root); c.root.rotation.y = -1.45; c.root.scale.setScalar(0.55); c.root.position.y = 0.37;
        const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 9, 6), LP.mat(0x222428, 0.4)); fio.rotation.z = Math.PI / 2 - 0.05; S.add(fio);
        S.background = new THREE.Color(0x1a2333); LP.bokeh(S, { n: 50, seed: 7, y: [-2, 3], z: [-16, -6], cores: [0xffb35a, 0xffd28a, 0x7fb6ff] });
        function render(t) {
          const e = ease.inOutSine(range(t, 0, D));
          c.cab.rotation.set(0.05, lerp(0.1, 0.6, ease.outCubic(range(t, 0.8, 1.6))), 0.08);
          c.olhos.forEach((o) => o.olhar(-0.15, 0.05));
          cam.position.set(lerp(-1.3, -0.9, e), 0.85, lerp(2.5, 2.0, e)); cam.lookAt(0.0, 0.42, 0.0);
          st.draw();
        }
