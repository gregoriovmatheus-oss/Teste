/*META {"imports": ["copia"], "rotulos": [{"de": 0.15, "ate": 2.2, "texto": "Você já é um pouco <span class=\"y\">assim</span>"}, {"de": 4.12, "ate": 4.95, "texto": "<span class=\"k\">GLÓBULO VERMELHO</span><br>Vive uns <span class=\"y\">120 dias</span>"}, {"de": 5.12, "ate": 7.05, "texto": "<span class=\"k\">PELE</span><br>Renova em <span class=\"y\">semanas</span>"}], "D0": 7.05} */
        // Dentro de um vaso: hemácias nascem, correm e morrem (120 dias). Depois a pele: camadas sobem e descamam.
        const st = T.createToyStage(canvas, { ceu: "#1a0306", nevoa: [1.5, 20], corNevoa: "#2a0609", fov: 50, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.bloom = 0.6;
        st.key.color.set(0xffd0c0); st.hemi.color.set(0xff8a80); st.hemi.intensity = 0.9;
        await COPIA.fontes();
        const luz = new THREE.PointLight(0xffb0a0, 6, 12, 1.5); S.add(luz);
        // vaso
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 70, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a1c26, roughness: 0.45, emissive: 0x3a0408, side: THREE.BackSide }));
        tubo.rotation.x = Math.PI / 2; tubo.position.z = -25; S.add(tubo);
        // hemácia bicôncava (torno)
        const prof = [];
        for (let i = 0; i <= 6; i++) { const r = i / 6, h = Math.sqrt(Math.max(0, 1 - r * r)) * (0.207 + 2.003 * r * r - 1.123 * r ** 4) * 0.5; prof.push(new THREE.Vector2(Math.max(0.001, r), h)); }
        for (let i = 6; i >= 0; i--) { const p = prof[i]; prof.push(new THREE.Vector2(p.x, -p.y - 0.001)); }
        const hg = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p.x * 0.42, p.y * 0.42)), 22);
        const hm = new THREE.MeshStandardMaterial({ color: 0xc8222c, roughness: 0.35, emissive: 0x3a0306 });
        const NH = 34, hem = new THREE.InstancedMesh(hg, hm, NH); hem.frustumCulled = false; S.add(hem);
        const rr = mulberry32(606), H = Array.from({ length: NH }, () => ({ z: rr() * 34, a: rr() * 6.283, r: 0.6 + rr() * 0.7, rx: rr() * 6, ry: rr() * 6, w: 0.5 + rr(), fase: rr(), v: 2.2 + rr() * 1.2 }));
        const destaque = new THREE.Mesh(hg, hm); S.add(destaque);
        // pele: blocos de células em camadas (longe do vaso)
        const PX = 60, NC = 7, NL = 4, NP = NC * NC * NL;
        const pele = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 9, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), NP); pele.frustumCulled = false; S.add(pele);
        const O = new THREE.Object3D(), c1 = new THREE.Color(0xe0707e), c2 = new THREE.Color(0xd9c7a8), cc = new THREE.Color();
        const derme = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 4.2), T.M(0xa8414a, 0.7)); derme.position.set(PX, -0.32, 0); S.add(derme);
        const ruido = Array.from({ length: NP }, () => [rr() - 0.5, rr() - 0.5, rr()]);
        const v = new THREE.Vector3();
        function render(t) {
          const naPele = t > 5.0;
          hem.visible = destaque.visible = tubo.visible = !naPele; pele.visible = derme.visible = naPele;
          S.fog.color.set(naPele ? 0x120a10 : 0x2a0609); S.background = S.fog.color;
          if (!naPele) {
            const camZ = 4 - t * 1.1;
            H.forEach((h, i) => {
              const z = camZ - 28 + ((h.z + t * h.v) % 34);
              const vida = (t * 0.22 + h.fase) % 1, s = Math.min(1, vida / 0.08, (1 - vida) / 0.1);
              O.position.set(Math.cos(h.a + t * 0.2) * h.r, Math.sin(h.a + t * 0.2) * h.r, z);
              O.rotation.set(h.rx + t * h.w, h.ry + t * 0.6, 0); O.scale.setScalar(Math.max(0.0001, s)); O.updateMatrix(); hem.setMatrixAt(i, O.matrix);
            });
            hem.instanceMatrix.needsUpdate = true;
            // a hemácia em destaque envelhece até 120 dias e se desfaz
            const morre = ease.inCubic(range(t, 4.45, 4.95));
            destaque.position.set(-0.3 + Math.sin(t * 0.8) * 0.05, 0.25 + Math.cos(t * 0.6) * 0.04, camZ - 3.2);
            destaque.rotation.set(1.1 + t * 0.25, 0.4 + t * 0.15, 0); destaque.scale.setScalar(1.0 * (1 - morre) + 0.0001);
            cam.position.set(Math.sin(t * 0.5) * 0.12, Math.cos(t * 0.4) * 0.08, camZ); cam.lookAt(Math.sin(t * 0.3) * 0.2, 0, camZ - 6);
            luz.position.set(0.4, 0.6, camZ - 1);
            st.vel = range(t, 4.6, 5.0); st.velT = t;
          } else {
            const u = t - 5.0;
            for (let l = 0, i = 0; l < NL; l++) for (let a = 0; a < NC; a++) for (let b = 0; b < NC; b++, i++) {
              const L = (l + u * 1.6 + ruido[i][2] * 0.3) % NL, k = L / (NL - 1);
              const solta = range(L, 3.3, 4);
              O.position.set(PX + (a - 3) * 0.55 + ruido[i][0] * 0.1 + (l % 2) * 0.27, 0.12 + L * 0.32 + solta * 1.2, (b - 3) * 0.55 + ruido[i][1] * 0.1);
              O.rotation.set(solta * 1.4 * ruido[i][0], 0, solta * 1.4 * ruido[i][1]);
              const s = 1 - solta;
              O.scale.set(0.27 * (1 + k * 0.3) * s + 0.0001, 0.17 * (1 - k * 0.55) * s + 0.0001, 0.27 * (1 + k * 0.3) * s + 0.0001); O.updateMatrix();
              pele.setMatrixAt(i, O.matrix); cc.copy(c1).lerp(c2, k); pele.setColorAt(i, cc);
            }
            pele.instanceMatrix.needsUpdate = true; pele.instanceColor.needsUpdate = true;
            const e = ease.outCubic(range(u, 0, 2.05)), ang = lerp(0.9, 0.35, e);
            cam.position.set(PX + Math.sin(ang) * lerp(5.5, 4.6, e), lerp(3.6, 2.4, e), Math.cos(ang) * lerp(5.5, 4.6, e)); cam.lookAt(PX, 0.9, 0);
            st.sol(PX, 0, 5); st.vel = 1 - range(u, 0, 0.25);
          }
          st.draw(S, cam, t > 4.85 && t < 5.25 ? { cor: "#ffd9d0", a: Math.sin(Math.PI * range(t, 4.85, 5.25)) * 0.7 } : null);
          const c = st.ctx, a = COPIA.vis(st);
          if (!naPele) {
            const dia = Math.round(120 * range(t, 2.29, 4.22));
            COPIA.tag(c, cam, destaque.position, "HEMÁCIA", { a: a * range(t, 2.29, 2.55) * (1 - range(t, 4.6, 4.8)), dx: 170, dy: -260, sub: "DIA " + String(dia).padStart(3, "0") + " / 120", cor: dia >= 120 ? COPIA.LARANJA : COPIA.AZUL });
          } else {
            const u = t - 5.0, sem = 1 + Math.floor(range(u, 0.5, 1.9) * 3.99);
            COPIA.tag(c, cam, v.set(PX + 0.3, 1.4, 0.3), "PELE · DESCAMAÇÃO", { a: a * range(u, 0.3, 0.6), dx: 30, dy: -330, sub: "SEMANA " + sem });
          }
        }
