/*META {"imports": ["doissois"], "rotulos": [{"de": 1.25, "ate": 2.6, "top": 600, "texto": "<span class=\"y\">2</span> sóis, <span class=\"y\">2</span> sombras"}, {"de": 4.8, "ate": 6.07, "texto": "eclipse <span class=\"y\">duplo</span>"}], "D0": 6.07} */
        const DS = DOISSOIS;
        await DS.fontes();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#4f74ad", "#f2c28e"], nevoa: [30, 260], corNevoa: "#e9b98c", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        // praça de pedra clara ao entardecer, poucas pedras
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), T.M(0xa8906e, 0.9)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        const R = mulberry32(808);
        for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + R() * 1.2, 0), T.M(0x9a8268, 0.9)); const a = R() * 6.28, d = 9 + R() * 30;
          r.position.set(Math.cos(a) * d, 0.1, Math.sin(a) * d - 8); r.scale.y = 0.5 + R() * 0.4; r.castShadow = true; S.add(r); }
        const h = A.createAnimal("humano", { cor: 0x2f4f6f, cor2: 0x2a2a30 }); A.face(h.group, 0, 1); S.add(h.group);
        h.group.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        // segunda sombra (sol vermelho) por projeção planar
        const sMat = new THREE.MeshBasicMaterial({ color: 0x3a2a40, transparent: true, opacity: 0.34, depthWrite: false });
        const h2 = A.createAnimal("humano", {}); A.face(h2.group, 0, 1); DS.barato(h2.group, sMat);
        const somb = new THREE.Group(); somb.matrixAutoUpdate = false; somb.add(h2.group); S.add(somb);
        // céu: sol amarelo e sol vermelho (que vai passar na frente do amarelo)
        const L1 = new THREE.Vector3(-0.42, 0.5, -1).normalize(), L2a = new THREE.Vector3(0.5, 0.36, -1).normalize(), L2 = new THREE.Vector3();
        const SA = DS.estrela(S, { r: 5.5, tipo: "amarelo", halo: 7 }); SA.group.position.copy(L1).multiplyScalar(150);
        const SV = DS.estrela(S, { r: 3.0, tipo: "vermelho", halo: 7 });
        st.sol(0, 0, 8);
        st.key.color.set(0xffe2b0); st.key.position.copy(L1).multiplyScalar(30); st.key.target.position.set(0, 0, 0);
        st.rim.color.set(0xff5a3a); st.rim.target.position.set(0, 0, 0); st.hemi.intensity = 0.45;
        const alvo = new THREE.Vector3(), olho = new THREE.Vector3();
        function render(t) {
          h.update(t, {}); h2.update(t, {});
          // o sol vermelho desliza até cobrir o amarelo (eclipse em ~5,1 s); as duas sombras viram uma
          const k = ease.inOutSine(range(t, 1.9, 5.15));
          L2.copy(L2a).lerp(L1, k).normalize();
          SV.group.position.copy(L2).multiplyScalar(118);
          const ecl = Math.max(0, 1 - SV.group.position.clone().normalize().distanceTo(L1) / 0.06);
          SA.set(1 - 0.35 * ecl, t); SV.set(1, t * 1.2);
          st.key.intensity = 2.3 * (1 - 0.5 * ecl); st.rim.intensity = 1.6;
          st.rim.position.copy(L2).multiplyScalar(30);
          somb.matrix.copy(DS.sombraPlanar(L2)); sMat.opacity = 0.34 * (1 - ecl);
          // câmera: de frente, baixa, com as sombras vindo em direção à lente -> sobe até os sóis
          const e = ease.inOutSine(range(t, 0, 2.9)), u = ease.inOutCubic(range(t, 2.9, 4.9));
          olho.set(lerp(2.6, 1.2, e), lerp(3.4, 2.4, e) - u * 1.2, lerp(8.5, 7.0, e) + u * 1.5); cam.position.copy(olho);
          alvo.set(lerp(0, 0, e), lerp(0.3, 0.9, e), lerp(1.8, 0.5, e)).lerp(SA.group.position.clone().lerp(SV.group.position, 0.5).add(new THREE.Vector3(0, -38, 0)), u);
          cam.lookAt(alvo);
          st.bloom = 0.55 + 0.35 * u;
          st.draw(S, cam, ecl > 0 ? { cor: "#1a0c14", a: ecl * 0.25 } : null);
        }
