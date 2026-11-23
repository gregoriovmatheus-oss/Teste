/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f08\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f08\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f08\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f08\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f08\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 2.5, "ate": 4.6, "texto": "Uma <span class=\"y\">apendicite</span><br>não dói"}], "D0": 5.82} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#04060a", "#0c1420"], nevoa: [3, 14], corNevoa: "#070b12", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.45; st.key.intensity = 1.8; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.6;
        // corpo de vidro (some aos poucos: "invisíveis")
        const h = A.createAnimal("humano", {}); S.add(h.group);
        const vidro = new THREE.MeshStandardMaterial({ color: 0x9fc8e8, roughness: 0.15, transparent: true, opacity: 0.3, depthWrite: false, emissive: 0x10283c, emissiveIntensity: 0.6 });
        h.group.traverse((o) => { if (o.isMesh) o.material = vidro; });
        h.update(0, {});
        // intestino grosso (U invertido) e o apêndice no lado direito do corpo (+z)
        const P = (x, y, z) => new THREE.Vector3(x, y, z);
        const col = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(0.03, 0.9, 0.13), P(0.04, 1.08, 0.15), P(0.05, 1.17, 0.06), P(0.05, 1.17, -0.08), P(0.04, 1.06, -0.15), P(0.03, 0.9, -0.13)]), 40, 0.035, 8),
          new THREE.MeshStandardMaterial({ color: 0xc97a6e, roughness: 0.5, emissive: 0x3a1410, emissiveIntensity: 0.5 })); S.add(col);
        const apm = new THREE.MeshStandardMaterial({ color: 0xd08070, roughness: 0.4, emissive: 0xff4a1a, emissiveIntensity: 0 });
        const ap = new THREE.Mesh(new THREE.CapsuleGeometry(1, 3, 6, 10), apm); ap.position.set(0.04, 0.86, 0.15); ap.rotation.x = -0.5; S.add(ap);
        const apg = DOR.glowSprite(0xff6a2a, 0.3, 0); apg.position.copy(ap.position); S.add(apg);
        // o alarme (luz de alerta) ao lado: continua apagado
        const al = new THREE.Group(); al.position.set(0.12, 0.98, 0.4); S.add(al);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.4, metalness: 0.6 })); al.add(base);
        const cup = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 12, 0, 6.283, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a0e0e, roughness: 0.1, transparent: true, opacity: 0.9 })); cup.position.y = 0.015; al.add(cup);
        // estouro
        const R = mulberry32(88), NB = 220, bp = new Float32Array(NB * 3), bv = [];
        for (let i = 0; i < NB; i++) { const v = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(0.1 + R() * 0.35); bv.push(v); }
        const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
        const bur = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xff8a4c, size: 0.018, transparent: true, opacity: 0, depthWrite: false, map: DOR.glowTex(), blending: THREE.AdditiveBlending })); S.add(bur);
        const TB = 5.07;
        function render(t) {
          vidro.opacity = lerp(0.32, 0.1, ease.inOutSine(range(t, 0.6, 1.6)));
          const inch = ease.inOutSine(range(t, 2.3, TB));
          const r = lerp(0.012, 0.028, inch) * (1 + 0.06 * Math.sin(t * 8) * inch);
          ap.scale.set(r, t < TB ? lerp(0.015, 0.02, inch) : 0.012, r);
          apm.emissiveIntensity = inch * (0.6 + 0.4 * Math.sin(t * 6)); apm.color.setHex(inch > 0.5 ? 0xd85a40 : 0xd08070);
          apg.material.opacity = inch * 0.5 * (t < TB ? 1 : 0);
          const q = t - TB, bpos = bg.attributes.position;
          for (let i = 0; i < NB; i++) { const s = Math.max(0, q); bpos.setXYZ(i, ap.position.x + bv[i].x * s * 2, ap.position.y + bv[i].y * s * 2 - s * s * 0.2, ap.position.z + bv[i].z * s * 2); }
          bpos.needsUpdate = true; bur.material.opacity = q > 0 ? 1 - range(q, 0.3, 0.75) : 0;
          // corpo inteiro → mergulho até o abdômen
          const a = ease.inOutCubic(range(t, 1.0, 2.6));
          const c0 = new THREE.Vector3(2.9, 1.15, 1.2), c1 = new THREE.Vector3(0.95, 0.98, 0.5);
          cam.position.lerpVectors(c0, c1, a); cam.position.x += Math.sin(t * 0.8) * 0.02;
          cam.lookAt(lerp(0, 0.04, a), lerp(1.0, 0.74, a), lerp(0, 0.17, a));
          const sh = q > 0 ? Math.max(0, 1 - q * 2) * 0.015 : 0; cam.rotateZ(Math.sin(t * 50) * sh);
          st.bloom = 0.6 + inch * 0.2;
          st.sol(0, 0, 3, 1);
          st.draw(undefined, undefined, q > 0 ? { cor: "#ff7a3c", a: Math.max(0, 0.45 - q * 1.2) } : null);
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          DOR.frase(c, cam, al.position, "ALARME: APAGADO", range(t, 3.25, 3.45) * vv * (1 - range(t, 4.5, 4.7)), { cor: DOR.LARANJA, tam: 26, ymin: 560, ymax: 680, dy: -60 });
          DOR.frase(c, cam, ap.position, "ESTOUROU", range(t, TB, TB + 0.15) * vv, { cor: DOR.LARANJA, tam: 32, dy: 160 });
        }
