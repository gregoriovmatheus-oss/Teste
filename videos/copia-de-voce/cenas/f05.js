/*META {"imports": ["copia"], "rotulos": [{"de": 0.9, "ate": 3.3, "texto": "<span class=\"k\">O NAVIO DE TESEU</span><br>Todas as <span class=\"y\">tábuas</span> trocadas"}, {"de": 3.35, "ate": 4.41, "texto": "Ainda é o <span class=\"y\">mesmo navio?</span>"}], "D0": 4.41} */
        // Navio grego no mar ao entardecer: cada tábua velha sai e uma nova entra; as velhas montam outro navio ao lado.
        const st = T.createToyStage(canvas, { ceu: ["#1a2848", "#e0956a"], nevoa: [14, 70], corNevoa: "#b98a78", fov: 50, nuvens: 6 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.6;
        await COPIA.fontes();
        const mar = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x0a1726, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.1 }));
        mar.rotation.x = -Math.PI / 2; mar.receiveShadow = true; S.add(mar);
        const solG = COPIA.brilho(0xff9e5e, 16, 0.85); solG.position.set(-30, 7, -70); S.add(solG);
        const reflexo = new THREE.Mesh(new THREE.PlaneGeometry(4, 60), new THREE.MeshBasicMaterial({ map: COPIA.glowTex(), color: 0xff9a5c, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        reflexo.rotation.x = -Math.PI / 2; reflexo.rotation.z = -0.4; reflexo.position.set(-14, 0.02, -36); S.add(reflexo);
        // casco: 2 lados x 6 fiadas x 10 tábuas
        const slots = [];
        for (const s of [-1, 1]) for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) {
          const x = (c - 4.5) * 0.6, hb = (x2) => 1.05 * Math.pow(Math.max(0.02, 1 - (x2 / 3.25) ** 2), 0.7) * (0.42 + 0.58 * Math.pow(r / 5, 0.6));
          const z = s * hb(x), dz = s * (hb(x + 0.01) - hb(x - 0.01)) / 0.02;
          const y = 0.15 + r * 0.2 + Math.pow(Math.abs(x) / 3, 2) * 0.5;
          slots.push({ x, y, z, ry: -Math.atan(dz), rx: s * (0.5 - r * 0.08) });
        }
        const N = slots.length;
        const geo = new THREE.BoxGeometry(0.62, 0.2, 0.06);
        const novo = new THREE.InstancedMesh(geo, T.M(0xc89a62, 0.75), N), velho = new THREE.InstancedMesh(geo, T.M(0x4a3a2c, 0.9), N);
        novo.castShadow = velho.castShadow = true; S.add(novo, velho);
        // ordem da troca (sorteio fixo)
        const rr = mulberry32(55), ordem = Array.from({ length: N }, (_, i) => [rr(), i]).sort((a, b) => a[0] - b[0]).map((p, k) => [p[1], k]);
        const tTroca = new Array(N); ordem.forEach(([i, k]) => (tTroca[i] = 0.75 + 2.6 * (k / N)));
        const navio2 = new THREE.Vector3(2.6, 0, -7.5);
        // mastro, vela, quilha e proa do navio 1 (o "novo")
        const n1 = new THREE.Group(); S.add(n1);
        const qm = T.M(0x3a2c20, 0.8);
        const quilha = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.16, 0.14), qm); quilha.position.y = 0.1; n1.add(quilha);
        const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 10), qm); mastro.position.set(0, 2.2, 0); mastro.castShadow = true; n1.add(mastro);
        const verga = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 8), qm); verga.rotation.x = Math.PI / 2; verga.position.set(0.05, 3.9, 0); n1.add(verga);
        const vg = new THREE.PlaneGeometry(2.8, 2.0, 8, 4); { const p = vg.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, 0.25 * (1 - (p.getX(i) / 1.4) ** 2) * (0.6 + 0.4 * (p.getY(i) + 1) / 2)); }
        vg.rotateY(Math.PI / 2); vg.computeVertexNormals();
        const vela = new THREE.Mesh(vg, new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.9, side: THREE.DoubleSide })); vela.position.set(0.1, 2.85, 0); vela.castShadow = true; n1.add(vela);
        const proa = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 16, Math.PI * 0.8), qm); proa.position.set(3.15, 1.25, 0); proa.rotation.z = -0.2; n1.add(proa);
        const popa = proa.clone(); popa.position.x = -3.15; popa.rotation.z = Math.PI + 0.2; n1.add(popa);
        const q2 = quilha.clone(); q2.position.copy(navio2).y = 0.1; S.add(q2);
        const O = new THREE.Object3D(), v = new THREE.Vector3();
        function plank(o, p, rx, ry, rz, s = 1) { o.position.copy(p); o.rotation.set(rx, ry, rz); o.scale.setScalar(s); o.updateMatrix(); return o.matrix; }
        let trocadas = 0;
        function render(t) {
          const bob = Math.sin(t * 1.1) * 0.04, bob2 = Math.sin(t * 1.1 + 1.3) * 0.04;
          n1.position.y = bob; n1.rotation.x = Math.sin(t * 0.9) * 0.015;
          trocadas = 0;
          slots.forEach((s, i) => {
            const t0 = tTroca[i], kOut = ease.inOutCubic(range(t, t0, t0 + 0.75)), kIn = ease.outCubic(range(t, t0 + 0.12, t0 + 0.5));
            if (t > t0 + 0.3) trocadas++;
            // tábua velha: sai do navio 1, arco no ar, encaixa no navio 2
            const p1 = v.set(s.x, s.y + bob, s.z), p2 = new THREE.Vector3(s.x + navio2.x, s.y + bob2, s.z + navio2.z);
            const pv = p1.clone().lerp(p2, kOut); pv.y += Math.sin(Math.PI * kOut) * 1.8;
            velho.setMatrixAt(i, plank(O, pv, s.rx + kOut * Math.PI * 2 * (1 - kOut), s.ry, Math.sin(Math.PI * kOut) * 0.6));
            // tábua nova: desce do alto e encaixa
            const pn = new THREE.Vector3(s.x, s.y + bob + (1 - kIn) * 2.2, s.z * (1 + (1 - kIn) * 0.6));
            novo.setMatrixAt(i, plank(O, pn, s.rx, s.ry, 0, kIn < 0.001 ? 0.0001 : 1));
          });
          novo.instanceMatrix.needsUpdate = true; velho.instanceMatrix.needsUpdate = true;
          // travelling lateral, baixo, com o sol atrás
          const e = ease.inOutSine(range(t, 0, 4.41));
          cam.position.set(lerp(-7.5, 1.5, e), lerp(3.4, 2.6, e), lerp(9.5, 11.0, e));
          cam.lookAt(lerp(0.2, 1.3, e), 0.6, lerp(-1.5, -3.2, e));
          st.sol(1, -2, 10);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          COPIA.txt(c, "TÁBUAS TROCADAS", 540, 560, { tam: 24, cor: COPIA.AZUL, a: a * range(t, 0.7, 0.9) });
          COPIA.txt(c, String(trocadas).padStart(3, "0") + " / " + N, 540, 610, { tam: 46, a: a * range(t, 0.7, 0.9), esp: 0.04, cor: trocadas === N ? COPIA.LARANJA : "#fff" });
          COPIA.tag(c, cam, v.set(navio2.x, 1.5, navio2.z), "TÁBUAS VELHAS", { cor: COPIA.LARANJA, a: a * range(t, 2.4, 2.7), dx: 60, dy: -200 });
        }
