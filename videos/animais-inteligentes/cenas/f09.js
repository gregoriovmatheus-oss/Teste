/*META {"imports": ["mente"], "rotulos": [], "D0": 8.07} */
        await MENTE.fontes();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#04070e", "#122036"], nevoa: [14, 40], corNevoa: "#0a1424", luz: 0.9, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.6;
        const pal = MENTE.palcoDiagrama(st, { y: 0, grade: true, poeira: 300 });
        st.key.intensity = 2.6; st.hemi.intensity = 0.5;
        // 100 blocos = toda a massa dos mamíferos (Bar-On 2018): 60 gado, 36 humanos, 4 selvagens
        const COR = [0xff8a4c, 0x7cc8ff, 0x7fd18a];
        const box = new THREE.BoxGeometry(0.88, 0.88, 0.88);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1, emissive: 0x000000 });
        const im = new THREE.InstancedMesh(box, mat, 100); im.castShadow = im.receiveShadow = true; S.add(im);
        const cel = [];
        for (let i = 0; i < 100; i++) {
          const row = Math.floor(i / 10), colN = i % 10, grp = i < 60 ? 0 : i < 96 ? 1 : 2;
          const t0 = grp === 0 ? 0.47 + (i / 60) * 2.6 : grp === 1 ? 3.85 + ((i - 60) / 36) * 1.2 : 7.35 + (i - 96) * 0.12;
          cel.push({ x: colN - 4.5, z: row - 4.5, grp, t0 });
          im.setColorAt(i, new THREE.Color(COR[grp]).multiplyScalar(0.85));
        }
        // figuras sobre cada grupo
        const vaca = MENTE.vaca(); MENTE.leve(vaca.group); vaca.group.scale.setScalar(1.3); vaca.group.position.set(-0.5, 0.9, -2); vaca.group.rotation.y = 0.5; S.add(vaca.group);
        const hum = A.createAnimal("humano", { cor: 0x2f5c8a, cor2: 0x2a2a30 }); MENTE.leve(hum.group); hum.group.scale.setScalar(1.2); hum.group.position.set(-2.5, 0.9, 2.5); hum.group.rotation.y = 0.6; S.add(hum.group);
        const ele = A.createAnimal("elefante", { fase: 0.2 }); MENTE.leve(ele.group); ele.group.scale.setScalar(0.32); ele.group.position.set(3.0, 0.9, 4.5); ele.group.rotation.y = 0.9; S.add(ele.group);
        const o = new THREE.Object3D();
        const anel = MENTE.glow(0x7fd18a, 3.5, 0); anel.position.set(3, 1.2, 4.5); S.add(anel);
        const vC = new THREE.Vector3();
        function render(t) {
          pal.update(t);
          cel.forEach((c, i) => {
            const k = ease.outCubic(range(t, c.t0, c.t0 + 0.45));
            o.position.set(c.x, 0.44 + (1 - k) * 6, c.z); o.scale.setScalar(Math.max(0.001, k)); o.rotation.set(0, (1 - k) * 1.2, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
          });
          im.instanceMatrix.needsUpdate = true;
          const vk = ease.outBack(range(t, 3.0, 3.5)), hk = ease.outBack(range(t, 4.9, 5.4)), ek = ease.outBack(range(t, 7.7, 8.0));
          vaca.group.scale.setScalar(1.3 * Math.max(0.001, vk)); hum.group.scale.setScalar(1.2 * Math.max(0.001, hk)); ele.group.scale.setScalar(0.32 * Math.max(0.001, ek));
          vaca.update(t, { cabeca: -0.3 }); hum.update(t, {}); ele.update(t, {});
          anel.material.opacity = Math.sin(Math.PI * range(t, 7.5, 8.07)) * 0.8;
          // órbita alta e lenta sobre o "mapa" de blocos
          const e = ease.inOutSine(range(t, 0, 8.07));
          const a = lerp(-0.45, 0.35, e), R = lerp(16, 14, e);
          cam.position.set(Math.sin(a) * R, lerp(10.5, 8.5, e), Math.cos(a) * R);
          cam.lookAt(lerp(0, 1.2, e), 0, lerp(0, 1.6, e));
          st.sol(0, 0, 9);
          st.draw();
          // números, no momento em que são ditos
          const c = st.ctx;
          MENTE.texto(c, { x: 540, y: 520, k: "MASSA DE TODOS OS MAMÍFEROS", a: range(t, 0.1, 0.5) });
          const g1 = range(t, 0.47, 0.8) * (1 - range(t, 3.6, 3.85));
          MENTE.texto(c, { x: 540, y: 715, v: Math.round(60 * ease.outCubic(range(t, 0.47, 3.1))) + "%", u: "gado", a: g1, tam: 170, grad: ["#ffffff", "#ffb08a"] });
          const g2 = range(t, 3.85, 4.2) * (1 - range(t, 5.5, 5.75));
          MENTE.texto(c, { x: 540, y: 715, v: Math.round(36 * ease.outCubic(range(t, 3.85, 5.05))) + "%", u: "humanos", a: g2, tam: 170 });
          const g3 = range(t, 5.75, 6.1);
          MENTE.texto(c, { x: 540, y: 715, v: t < 7.55 ? "?" : "4%", u: "animais selvagens", a: g3, tam: 170, grad: ["#ffffff", "#a8f0b4"] });
        }
