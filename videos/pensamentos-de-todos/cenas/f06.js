/*META {"imports": ["mente"], "rotulos": [{"de": 2.2, "ate": 3.95, "texto": "<span class=\"k\">MEMÓRIA DE TRABALHO</span><br>só <span class=\"y\">4</span> itens"}], "D0": 3.95} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#04060c", "#0b1222"], nevoa: [7, 26], corNevoa: "#060912", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.intensity = 1.4; st.hemi.intensity = 0.3;
        const R = mulberry32(606);
        // 4 slots de vidro com borda luminosa
        const SX = [-1.65, -0.55, 0.55, 1.65], SY = -1.6;
        const vidro = new THREE.MeshStandardMaterial({ color: 0x9fd6ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.12, depthWrite: false });
        const bordas = SX.map((x) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), vidro); m.position.set(x, SY, 0); S.add(m);
          const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, toneMapped: false })); e.position.copy(m.position); S.add(e);
          return { m, e };
        });
        // itens: 4 cabem; 5º, 6º e 7º chegam e quebram tudo
        const NOMES = ["CHAVE", "ALUGUEL", "PIZZA", "REFRÃO", "PROVA", "MÃE", "ÔNIBUS"];
        const TI = [1.45, 1.75, 2.05, 2.3, 2.85, 3.05, 3.2];
        const cubo = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.3 }), 7);
        cubo.frustumCulled = false; S.add(cubo);
        const o3 = new THREE.Object3D(), cc = new THREE.Color();
        // estilhaços quando transborda (3,3 s)
        const NE = 160, est = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.07), new THREE.MeshStandardMaterial({ color: 0xbfe4ff, emissive: 0xff8a4c, emissiveIntensity: 0.8, roughness: 0.2 }), NE);
        est.frustumCulled = false; S.add(est);
        const EV = Array.from({ length: NE }, (_, i) => [SX[i % 4] + (R() - 0.5) * 0.9, SY + (R() - 0.5) * 0.9, (R() - 0.5) * 0.9, (R() - 0.5) * 6, 1 + R() * 4, (R() - 0.5) * 5, R() * 6]);
        const TQ = 3.3, pos = [];
        function render(t) {
          const q = t - TQ;
          // slots surgem em "memória" e acendem
          bordas.forEach(({ m, e }, k) => {
            const ap = range(t, 0.3 + k * 0.12, 0.7 + k * 0.12), cheio = t > TI[k] + 0.3 ? 1 : 0;
            e.material.opacity = (q > 0 ? Math.max(0, 1 - q * 4) : 1) * ap * (0.5 + 0.5 * cheio);
            e.material.color.set(t > 2.9 ? 0xff8a4c : 0x7cc8ff);
            m.visible = q < 0.05; e.visible = q < 0.3;
            const tre = t > 2.9 && q < 0 ? Math.sin(t * 70 + k) * 0.03 * range(t, 2.9, 3.3) : 0;
            m.position.x = e.position.x = SX[k] + tre;
          });
          vidro.opacity = 0.12 * range(t, 0.3, 0.8);
          pos.length = 0;
          for (let i = 0; i < 7; i++) {
            const t0 = TI[i], k = ease.outCubic(range(t, t0 - 0.35, t0)), slot = i < 4;
            let x = slot ? SX[i] : lerp(-0.4, 0.4, (i - 4) / 2), y = lerp(SY + 3.4, slot ? SY : SY + 0.75, k), z = 0, s = t < t0 - 0.35 ? 1e-4 : 1;
            if (!slot && t > t0) y = SY + 0.75 + Math.sin(t * 20 + i) * 0.04;
            if (q > 0) { const e = ease.outCubic(range(q, 0, 0.6)); x += (x * 0.6 + (i - 3) * 0.3) * e * 3; y += e * (1.5 - i * 0.3); z += e * 2; s *= 1 - range(q, 0.3, 0.6); }
            o3.position.set(x, y, z); o3.rotation.set(t * 0.6 + i, t * 0.8 + i, 0); o3.scale.setScalar(s || 1e-4); o3.updateMatrix(); cubo.setMatrixAt(i, o3.matrix);
            cubo.setColorAt(i, cc.set(slot ? (t > 2.9 ? 0xffb08a : 0x7cc8ff) : 0xff8a4c));
            pos.push([x, y, z, s, i]);
          }
          cubo.instanceMatrix.needsUpdate = true; cubo.instanceColor.needsUpdate = true;
          EV.forEach(([x, y, z, vx, vy, vz, r], i) => {
            const qq = Math.max(0, q), s = q > 0 ? 1 - range(q, 0.4, 0.65) : 0;
            o3.position.set(x + vx * qq, y + vy * qq - 4.9 * qq * qq, z + vz * qq); o3.rotation.set(r + qq * 8, r * 2 + qq * 6, 0); o3.scale.setScalar(s || 1e-4); o3.updateMatrix(); est.setMatrixAt(i, o3.matrix);
          });
          est.instanceMatrix.needsUpdate = true;
          st.bloom = 0.8;
          st.vel = q > 0 ? Math.sin(Math.PI * range(q, 0, 0.6)) * 0.5 : 0; st.velT = t;
          // push-in com leve inclinação
          const e = ease.inOutSine(range(t, 0, 3.95));
          cam.position.set(lerp(1.4, -0.3, e), lerp(0.4, -0.6, e), lerp(9.0, 6.6, e));
          cam.lookAt(0, lerp(-0.6, -1.0, e), 0);
          cam.rotateZ(lerp(-0.05, 0.03, e));
          st.sol(0, 0, 6);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st);
          pos.forEach(([x, y, z, s, i]) => {
            if (s < 0.3) return;
            const [px, py] = MENTE.proj(new THREE.Vector3(x, y + 0.45, z), cam);
            MENTE.txt(c, NOMES[i], px, py - 10, { tam: 24, cor: i < 4 ? "#dff1ff" : MENTE.LARANJA, a: vv * Math.min(1, s), esp: 0.12 });
          });
          bordas.forEach((b, k) => { const [px, py] = MENTE.proj(new THREE.Vector3(SX[k], SY - 0.62, 0), cam); MENTE.txt(c, String(k + 1), px, py + 16, { tam: 26, cor: MENTE.AZUL, a: vv * range(t, 0.4, 0.8) * (q > 0 ? 0 : 1) }); });
        }
