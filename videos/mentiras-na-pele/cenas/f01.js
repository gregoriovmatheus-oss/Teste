/*META {"imports": ["pele"], "rotulos": [{"de": 0.0, "ate": 2.05, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se cada mentira aparecesse <span class=\"y\">na sua pele?</span>"}], "D0": 4.39} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 30, ceu: ["#0d0909", "#2a1a13"], nevoa: null, nuvens: 0, luz: 0.8, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 1.6; st.hemi.intensity = 0.35;
        // sala à noite: parede escura ao fundo, abajur e luzes de festa desfocadas (bokeh)
        const parede = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), T.M(0x2a1d17, 0.95)); parede.position.set(0, 0, -90); S.add(parede);
        PELE.bokeh(S, { n: 30, seed: 11, centro: [-8, 6, -60], area: [90, 70, 20], tam: [5, 13], op: 0.32 });
        const ab = PELE.brilho(0xffb066, 60, "suave", 0.55); ab.position.set(-34, 22, -70); S.add(ab);
        // braço segurando o presente, na diagonal do quadro vertical
        const B = PELE.bracoClose({ pele: 0xd39a72, manga: 0x4d5b6c, papel: 0x8a1f2c });
        B.group.rotation.set(0.25, -0.35, 0.62); B.group.position.set(1.5, -2.5, 0); S.add(B.group);
        const O = B.PULSO;
        const flash = PELE.brilho(0xff8a4c, 4, "suave", 0); S.add(flash);
        // faíscas da marca em câmera lenta (Points determinísticos)
        const NF = 60, fp = new Float32Array(NF * 3), rr = mulberry32(101), FV = Array.from({ length: NF }, () => [rr() - 0.5, rr() * 0.8 + 0.3, rr() - 0.5, rr()]);
        const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fp, 3));
        const fm = new THREE.PointsMaterial({ color: 0xffa36a, size: 0.12, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
        const faisca = new THREE.Points(fg, fm); faisca.frustumCulled = false; B.group.add(faisca);
        const vO = new THREE.Vector3();
        function render(t) {
          // a mentira (2,6 s): a mancha nasce no pulso e se espalha em tempo real
          const k = range(t, 2.55, 4.39);
          const r = k <= 0 ? 0 : 0.2 + 2.2 * ease.outQuad(k) + 2.4 * k * k;
          B.pele.marca(0, O, r);
          B.pele.u.uBri.value = 0.6 + 0.9 * Math.sin(Math.PI * range(t, 2.55, 3.6)) + 0.5 * k;
          B.update(t);
          vO.set(...O); B.group.localToWorld(vO);
          flash.position.copy(vO); flash.material.opacity = 0.9 * Math.sin(Math.PI * range(t, 2.5, 3.5)); flash.scale.setScalar(3 + 6 * range(t, 2.5, 3.5));
          const fk = range(t, 2.6, 4.39);
          for (let i = 0; i < NF; i++) { const v = FV[i], e = ((fk * 1.3 + v[3]) % 1); fp[i * 3] = O[0] + v[0] * 3 * e; fp[i * 3 + 1] = O[1] + 0.3 + v[1] * 3.5 * e; fp[i * 3 + 2] = O[2] + v[2] * 3 * e; }
          fg.attributes.position.needsUpdate = true; fm.opacity = fk > 0 ? 0.8 * (1 - range(t, 4.0, 4.39) * 0.5) : 0;
          // dolly-in lento e pesado, com leve órbita (câmera lenta no evento)
          const e = ease.inOutSine(range(t, 0, 4.39));
          const a = lerp(-0.22, 0.08, e), R = lerp(26, 18, ease.outCubic(range(t, 0, 4.39)));
          cam.position.set(vO.x + Math.sin(a) * R, vO.y + lerp(7.5, 4.2, e), vO.z + Math.cos(a) * R);
          cam.lookAt(lerp(vO.x - 2.5, vO.x - 0.4, e), lerp(vO.y + 1.6, vO.y + 0.2, e), vO.z);
          st.sol(0, 0, 18);
          st.bloom = 0.55 + 0.3 * k;
          st.draw();
          const c = st.ctx;
          const q = PELE.fade(t, 0.62, 2.45, 0.25);
          PELE.txt(c, "“Adorei o presente.”", 470, 560, { fonte: "inter", peso: 300, italico: true, tam: 58, a: q, cor: "#fff4e8" });
          const [px, py] = PELE.proj(vO, cam);
          PELE.tag(c, px, py, 560, 600, "MENTIRA Nº 1", { cor: PELE.LARANJA, a: range(t, 3.0, 3.4) });
        }
