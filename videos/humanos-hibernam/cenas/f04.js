/*META {"imports": ["hiber"], "rotulos": [{"de": 1.91, "ate": 3.15, "texto": "<span class=\"k\">METABOLISMO</span><br>Cai para <span class=\"y\">¼</span> do normal"}, {"de": 3.22, "ate": 5.63, "texto": "Quase <span class=\"y\">nenhuma</span><br>energia gasta"}], "D0": 5.63} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#05070d", "#0d1320"], nevoa: [8, 26], corNevoa: "#0a0f1a", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xdfe9ff); st.key.intensity = 1.8; st.hemi.intensity = 0.3; st.rim.color.set(0x7cc8ff);
        const piso = new THREE.Mesh(new THREE.CircleGeometry(12, 48), T.M(0x141a24, 0.35, { metalness: 0.3 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        const mesa = new THREE.Mesh(T.roundBox(2.4, 0.5, 0.9, 0.12), T.M(0x2a3240, 0.4, { metalness: 0.4 })); S.add(mesa);
        const h = A.createAnimal("humano", { cor: 0x8a9ab0, cor2: 0x3c4c62 }); h.group.rotation.z = -Math.PI / 2; h.group.position.set(-0.95, 0.72, 0); S.add(h.group);
        h.arms.forEach((a) => (a.rotation.z = 0.05));
        // medidor em arco (270°) atrás da pessoa
        const N = 54, seg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.26, 0.04), new THREE.MeshBasicMaterial({ toneMapped: false }), N);
        const o3 = new THREE.Object3D(), RG = 1.5, CY = 2.9;
        for (let i = 0; i < N; i++) { const an = THREE.MathUtils.degToRad(225 - 270 * i / (N - 1)); o3.position.set(Math.cos(an) * RG, CY + Math.sin(an) * RG, -1.2); o3.rotation.set(0, 0, an - Math.PI / 2); o3.updateMatrix(); seg.setMatrixAt(i, o3.matrix); seg.setColorAt(i, new THREE.Color(0x10161f)); }
        S.add(seg);
        // calor saindo do corpo (partículas laranja subindo)
        const NP = 260, P = new Float32Array(NP * 3), RR = mulberry32(44), J = Array.from({ length: NP }, () => [(RR() - 0.5) * 1.9, (RR() - 0.5) * 0.5, RR(), 0.5 + RR()]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(P, 3));
        const pm = new THREE.PointsMaterial({ map: HIBER.glowTex(), color: 0xff8a4c, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
        S.add(new THREE.Points(pg, pm));
        const cA = new THREE.Color(0x7cc8ff), cB = new THREE.Color(0xff8a4c), cOff = new THREE.Color(0x10161f), cc = new THREE.Color();
        const pctF = (t) => lerp(1, 0.25, ease.inOutCubic(range(t, 1.41, 2.46)));
        function render(t) {
          const pct = pctF(t), lit = Math.round(pct * N), k = range(t, 1.41, 2.46);
          cc.copy(cA).lerp(cB, k);
          for (let i = 0; i < N; i++) seg.setColorAt(i, i < lit ? cc : cOff);
          seg.instanceColor.needsUpdate = true;
          for (let i = 0; i < NP; i++) { const [x, z, o, v] = J[i], uu = ((t * 0.35 * v * (0.3 + pct) + o) % 1); P[i * 3] = x; P[i * 3 + 1] = 0.85 + uu * 1.4; P[i * 3 + 2] = z + Math.sin(t + i) * 0.05; }
          pg.attributes.position.needsUpdate = true; pm.opacity = 0.2 + 0.8 * pct;
          // grua descendo e girando devagar
          const e = ease.inOutSine(range(t, 0, 5.63)), a = lerp(-0.35, 0.3, e);
          cam.position.set(Math.sin(a) * 6.4, lerp(3.4, 2.3, e), Math.cos(a) * 6.4);
          cam.lookAt(0, lerp(2.0, 1.6, e), -0.6);
          st.bloom = 0.6; st.sol(0, 0, 6);
          st.draw();
          const c = st.ctx, vv = HIBER.vis(st), [x, y] = HIBER.proj(new THREE.Vector3(0, CY, -1.2), cam);
          HIBER.txt(c, "METABOLISMO", x, y - 70, { tam: 22, cor: HIBER.AZUL, a: vv * range(t, 0.6, 1.0), esp: 0.3 });
          HIBER.txt(c, Math.round(pct * 100) + "%", x, y + 10, { tam: 96, cor: k > 0.5 ? HIBER.LARANJA : "#fff", a: vv * range(t, 0.6, 1.0), esp: 0 });
        }
