/*META {"imports": ["pausa"], "rotulos": [{"de": 0.35, "ate": 2.71, "sai": false, "texto": "Quanto valeria <span class=\"y\">um segundo</span><br>da sua vida?"}], "D0": 2.71} */
        // f12 — a pergunta: um único segundo luminoso flutuando entre as gotas paradas, com o anel de 60 marcas
        //       e só uma acesa. Dolly lento com leve órbita.
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#03050a", "#0b1020"], nevoa: [4, 30], corNevoa: "#05070d", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.key.castShadow = false; st.hemi.intensity = 0.2;
        const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffe2c8 })); nucleo.position.set(0, 2.2, 0); S.add(nucleo);
        const h1 = PAUSA.glow(0xff9a5a, 2.6, S), h2 = PAUSA.glow(0xffe8d0, 1.2, S); h1.position.copy(nucleo.position); h2.position.copy(nucleo.position);
        const tick = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }), 60); S.add(tick);
        const o = new THREE.Object3D();
        for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; o.position.set(Math.sin(a) * 0.95, 2.2 + Math.cos(a) * 0.95, 0); o.rotation.set(0, 0, -a); o.scale.set(i % 5 ? 1 : 1.6, i % 5 ? 1 : 1.6, 1); o.updateMatrix(); tick.setMatrixAt(i, o.matrix); tick.setColorAt(i, new THREE.Color(i ? 0x3a5b7a : 0xff8a4c)); }
        const ch = PAUSA.chuva(S, { n: 2600, seed: 121, caixa: [-5, 5, 0, 5, -6, 4], tam: 0.6 }); ch.update(1.17, 1);
        function render(t) {
          const p = 0.5 + 0.5 * Math.sin(t * 3.2);
          h1.scale.setScalar(2.4 + 0.5 * p); h2.material.opacity = 0.7 + 0.3 * p;
          tick.rotation.z = 0; st.bloom = 1.0;
          const e = ease.inOutSine(range(t, 0, 2.71)), a = lerp(-0.35, 0.2, e);
          cam.position.set(Math.sin(a) * lerp(5.6, 3.4, e), lerp(2.6, 2.3, e), Math.cos(a) * lerp(5.6, 3.4, e));
          cam.lookAt(0, lerp(2.0, 2.2, e), 0);
          st.draw();
          const [x, y] = PAUSA.proj(nucleo.position, cam);
          PAUSA.texto(st.ctx, "1 s", x, y, { a: range(t, 0.2, 0.6), cor: "#2a1408", tam: 44, peso: 600, alinha: "center", esp: 0 });
        }
