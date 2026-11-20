/*META {"imports": ["copia"], "rotulos": [{"de": 0.1, "ate": 1.75, "texto": "Com a cópia, seria <span class=\"y\">igual</span>"}, {"de": 1.81, "ate": 3.3, "texto": "<span class=\"k\">DIA 1</span><br>O primeiro <span class=\"y\">café</span>"}, {"de": 4.4, "ate": 5.86, "texto": "Pessoas <span class=\"y\">diferentes</span>"}], "D0": 5.86} */
        // Cozinha na luz dourada da manhã: duas xícaras; uma recebe açúcar, a outra não. Os fios de memória começam a se separar.
        const st = T.createToyStage(canvas, { ceu: "#1a1410", nevoa: [6, 24], corNevoa: "#1a1410", fov: 46, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.bloom = 0.65;
        st.key.color.set(0xffc98a); st.key.intensity = 3.0; st.rim.color.set(0xffa868); st.hemi.color.set(0xd9b48a); st.hemi.intensity = 0.6;
        await COPIA.fontes();
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), T.M(0x6b5240, 0.6)); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        const parede = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), T.M(0xd8cbb4, 0.9)); parede.position.set(0, 3, -2.2); parede.receiveShadow = true; S.add(parede);
        const jan = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false })); jan.position.set(-1.9, 2.2, -2.19); S.add(jan);
        for (const x of [-1.9]) { const b = T.mesh(T.roundBox(0.06, 1.55, 0.05, 0.02), 0xf0e8dc, S, 0.6); b.position.set(x, 1.45, -2.17); }
        const balcao = T.mesh(T.roundBox(4.5, 0.9, 0.7, 0.05), 0x7a5a42, S, 0.6); balcao.position.set(0, 0, -1.8);
        const mesa = T.mesh(T.roundBox(1.4, 0.06, 0.8, 0.03), 0x9a7454, S, 0.5); mesa.position.set(0, 0.92, 0);
        for (const [x, z] of [[-0.62, -0.32], [0.62, -0.32], [-0.62, 0.32], [0.62, 0.32]]) { const p = T.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.92, 8), 0x3a2c20, S); p.position.set(x, 0.46, z); }
        const xic = (x) => {
          const g = new THREE.Group(); g.position.set(x, 0.98, 0.05); S.add(g);
          T.mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.15, 20, 1, true), 0xf2efe8, g, 0.3).position.y = 0.075;
          T.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16), 0xf2efe8, g, 0.3).position.y = 0.005;
          const cafe = T.mesh(new THREE.CircleGeometry(0.07, 20), 0x3a2014, g, 0.2); cafe.rotation.x = -Math.PI / 2; cafe.position.y = 0.13;
          const asa = T.mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12), 0xf2efe8, g, 0.3); asa.position.set(x < 0 ? -0.085 : 0.085, 0.08, 0);
          T.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 24), 0xf2efe8, g, 0.3);
          return g;
        };
        const xA = xic(-0.3), xB = xic(0.3);
        const cubos = [0, 1].map((k) => { const m = T.mesh(T.roundBox(0.04, 0.04, 0.04, 0.008), 0xfbf8f2, S, 0.6); return m; });
        const pote = T.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16), 0xc9d8e8, S, 0.3); pote.position.set(-0.52, 0.95, -0.22);
        // vapor
        const NV = 120, vp = new Float32Array(NV * 2 * 3), vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.BufferAttribute(vp, 3));
        const vap = new THREE.Points(vg, new THREE.PointsMaterial({ size: 0.05, map: COPIA.glowTex(), color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false, toneMapped: false }));
        vap.frustumCulled = false; S.add(vap);
        const EU = COPIA.pessoa({ fase: 0.1 }), CO = COPIA.pessoa({ fase: 0.1 });
        EU.emPe(-0.95, 0.05, 0); CO.emPe(0.95, 0.05, Math.PI); S.add(EU.p, CO.p); EU.olhos(1); CO.olhos(1);
        const F = COPIA.fios(S, { n: 14, k: 40, seed: 21, alt: 1.6, tam: 0.06 });
        const rr = mulberry32(1010), VP = Array.from({ length: NV * 2 }, () => [rr(), (rr() - 0.5) * 0.06, (rr() - 0.5) * 0.06, rr() * 6]);
        const v = new THREE.Vector3();
        function render(t) {
          EU.update(t, {}); CO.update(t, {});
          EU.arms[0].rotation.z = 0.75; CO.arms[0].rotation.z = 0.75; EU.arms[1].rotation.z = 0.75; CO.arms[1].rotation.z = 0.75;
          EU.olha(0, lerp(0, -0.35, range(t, 1.8, 2.4))); CO.olha(0, lerp(0, -0.35, range(t, 1.8, 2.4)));
          // dois cubos de açúcar caem só na xícara da esquerda
          cubos.forEach((m, k) => {
            const t0 = 2.55 + k * 0.28, q = range(t, t0, t0 + 0.38);
            m.position.set(lerp(-0.5, -0.3, ease.outCubic(range(t, t0 - 0.3, t0))), q < 1 ? 1.45 - q * q * 0.38 : 1.0, 0.05);
            m.rotation.set(q * 3, q * 2, 0); m.visible = t > t0 - 0.3 && q < 1;
          });
          for (let i = 0; i < NV * 2; i++) { const [f, dx, dz, ph] = VP[i], s = (t * 0.35 + f) % 1, x0 = i < NV ? -0.3 : 0.3;
            vp[i * 3] = x0 + dx + Math.sin(s * 6 + ph) * 0.03 * (1 + s * 3); vp[i * 3 + 1] = 1.12 + s * 0.6; vp[i * 3 + 2] = 0.05 + dz; }
          vg.attributes.position.needsUpdate = true;
          const div = ease.inOutSine(range(t, 3.3, 5.86));
          F.update(t, { A: EU.cabeca(0.3), B: CO.cabeca(0.3), div, a: range(t, 0.2, 0.7) });
          // dolly: rente às xícaras, sobe até as duas cabeças e os fios separando
          const e1 = ease.inOutCubic(range(t, 0, 3.4)), e2 = ease.inOutCubic(range(t, 3.4, 5.86));
          const p = v.set(lerp(-0.6, -0.15, e1), lerp(1.75, 1.3, e1), lerp(2.6, 1.6, e1));
          p.lerp(new THREE.Vector3(0.1, 2.3, 4.6), e2);
          cam.position.copy(p);
          cam.lookAt(lerp(0, 0, e1), lerp(1.3, 1.03, e1) + e2 * 0.9, 0);
          st.sol(-1, 0, 4);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          COPIA.tag(c, cam, xA.position.clone().add(v.set(0, 0.15, 0)), "COM AÇÚCAR", { cor: COPIA.LARANJA, a: a * range(t, 2.6, 2.85) * (1 - range(t, 4.2, 4.4)), dx: -120, dy: -260 });
          COPIA.tag(c, cam, xB.position.clone().add(v.set(0, 0.15, 0)), "SEM AÇÚCAR", { a: a * range(t, 2.9, 3.15) * (1 - range(t, 4.2, 4.4)), dx: 120, dy: -260 });
          if (div > 0.05) COPIA.txt(c, "MEMÓRIAS EM COMUM " + (100 - div * 0.4).toFixed(1) + "%", 540, 560, { tam: 26, cor: div > 0.3 ? COPIA.LARANJA : COPIA.AZUL, a: a * range(t, 3.4, 3.7) });
        }
