/*META {"imports": ["mente"], "rotulos": [], "D0": 5.4} */
        await MENTE.fontes();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#4f6c9a", "#f0c48c"], nevoa: [10, 75], corNevoa: "#d9b58e", luz: 0.95, nuvens: 10 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.5;
        const chao = T.mesh(new THREE.PlaneGeometry(400, 400), 0x8f7a52, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
        // perto: galinhas instanciadas; longe: um "mar" de pontos até o horizonte
        const G = MENTE.galinhas(S, { n: 130, seed: 101, area: [-6, 6, -6, 6] });
        const rr = mulberry32(102), NF = 9000, fp = new Float32Array(NF * 3);
        for (let i = 0; i < NF; i++) { const a = rr() * 6.28, d = 6 + Math.pow(rr(), 0.6) * 90; fp[i * 3] = Math.cos(a) * d; fp[i * 3 + 1] = 0.22; fp[i * 3 + 2] = Math.sin(a) * d; }
        const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fp, 3));
        const far = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xf2ebdd, size: 0.42, map: MENTE.glowTex(), transparent: true, alphaTest: 0.05, depthWrite: false })); S.add(far);
        // uma pessoa e as "suas" 3 galinhas
        const hum = A.createAnimal("humano", { cor: 0x8a3a2e, cor2: 0x2c3550 }); hum.group.position.set(0.4, 0, 0.6); hum.group.rotation.y = -1.2; S.add(hum.group);
        G.D.forEach((d) => { if (Math.hypot(d.x - 0.4, d.z - 0.6) < 0.9) d.x += 1.6; });
        const tres = [[-0.3, 1.4], [0.9, 1.5], [1.3, 0.9]].map(([x, z], i) => { const d = G.D[i]; d.x = x; d.z = z; d.ry = 2.4 + i; return d; });
        const aneis = tres.map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.31, 40), new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = 0.03; S.add(m); return m; });
        function render(t) {
          G.update(t);
          hum.update(t, { cabeca: -0.25 });
          aneis.forEach((m, i) => { m.position.x = tres[i].x; m.position.z = tres[i].z; m.material.opacity = range(t, 3.3 + i * 0.25, 3.5 + i * 0.25) * 0.95; });
          // grua: rente às galinhas → sobe revelando o mar de galinhas até o horizonte → volta a descer na pessoa
          const up = ease.inOutSine(range(t, 0, 2.9)), dn = ease.inOutCubic(range(t, 2.9, 4.2));
          const a = lerp(-0.8, 0.7, range(t, 0, 5.4));
          const R = lerp(lerp(5.5, 12, up), 5.2, dn), y = lerp(lerp(0.95, 9.5, up), 3.4, dn);
          cam.position.set(0.4 + Math.sin(a) * R, y, 0.6 + Math.cos(a) * R);
          cam.lookAt(0.4, lerp(lerp(0.4, 0, up), 0.6, dn), lerp(lerp(0.6, -14, up), 0.6, dn));
          st.sol(0, 0, 14);
          st.draw();
          const c = st.ctx;
          const n = 25 * ease.outCubic(range(t, 1.31, 2.4));
          const a1 = range(t, 1.2, 1.5) * (1 - range(t, 3.0, 3.25));
          MENTE.texto(c, { x: 540, y: 620, k: "GALINHAS NO MUNDO", v: Math.round(n) + " bi" + (t > 2.2 ? "+" : ""), a: a1, tam: 170 });
          const a2 = range(t, 3.27, 3.6);
          MENTE.texto(c, { x: 540, y: 620, k: "POR PESSOA", v: "3+", u: "galinhas para cada humano", a: a2, tam: 170, corK: "#ff8a4c", grad: ["#ffffff", "#ffb08a"] });
        }
