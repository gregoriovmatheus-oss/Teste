/*META {"imports": ["solkit"], "rotulos": [{"de": 0.6, "ate": 2.1, "top": 680, "texto": "A geada<br><span class=\"y\">mata</span> a lavoura"}, {"de": 2.2, "ate": 3.55, "top": 680, "texto": "Canos<br><span class=\"y\">congelam</span>"}, {"de": 3.75, "ate": 7.07, "top": 680, "texto": "<span class=\"k\">ESTOQUES DE GRÃOS</span><br>Comida para <span class=\"y\">meses</span>", "sai": false}], "D0": 7.07} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#03060f", "#122038"], nevoa: [40, 170], corNevoa: "#0c162a", nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environmentIntensity = 0.25; st.hemi.intensity = 0.35; st.hemi.color.setHex(0x8fa8e0); st.rim.intensity = 0.5; st.rim.color.setHex(0x8fb0ff);
        st.key.intensity = 0.9; st.key.color.setHex(0xb4c6ff);
        const stars = SK.estrelas(S, { n: 2200, r: 900, seed: 131 });
        // solo da lavoura (vira branco de geada)
        const soloMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: 0.95 });
        const solo = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), soloMat); solo.rotation.x = -Math.PI / 2; solo.receiveShadow = true; S.add(solo);
        // plantas em fileiras: caule + folhas (InstancedMesh low-poly)
        const rr = mulberry32(132);
        const plantas = [];
        for (let fx = -9; fx <= 9; fx++) for (let z = 10; z > -38; z -= 1.6) plantas.push([fx * 1.5 + (rr() - 0.5) * 0.3, z + (rr() - 0.5) * 0.4, 0.8 + rr() * 0.4, rr() * 6.28]);
        const NP = plantas.length;
        const verde = new THREE.Color(0x4f8a2e), morto = new THREE.Color(0x8a7a4a), branco = new THREE.Color(0xdfe9f5);
        const caMat = new THREE.MeshStandardMaterial({ color: 0x5f8a34, roughness: 0.7 }), foMat = new THREE.MeshStandardMaterial({ color: 0x4f8a2e, roughness: 0.6, side: THREE.DoubleSide });
        const caule = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.08, 1, 5), caMat, NP);
        const FL = 4, folhas = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), foMat, NP * FL);
        S.add(caule, folhas);
        const o3 = new THREE.Object3D();
        // cristais de gelo brilhando no chão e nas folhas
        const NG = 900, gp = new Float32Array(NG * 3), ga = new Float32Array(NG), gd = [];
        for (let i = 0; i < NG; i++) { gp.set([(rr() - 0.5) * 30, 0.05 + rr() * 1.4 * (rr() < 0.4 ? 1 : 0), 10 - rr() * 48], i * 3); gd.push(rr()); }
        const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(gp, 3)); gg.setAttribute("aA", new THREE.BufferAttribute(ga, 1));
        const gm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          vertexShader: `attribute float aA; varying float vA; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 90.0 / -mv.z; }`,
          fragmentShader: `varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d,d)*30.0) * vA; if (a < 0.003) discard; gl_FragColor = vec4(vec3(0.8,0.9,1.0)*a, 1.0); }` });
        const gelo = new THREE.Points(gg, gm); gelo.frustumCulled = false; S.add(gelo);
        // cano de água no primeiro plano, com casca de gelo e pingentes
        const cano = T.mesh(new THREE.CylinderGeometry(0.28, 0.28, 16, 18), 0xb87333, S, 0.35); cano.rotation.z = Math.PI / 2; cano.position.set(0, 0.55, 12.5);
        cano.material.metalness = 0.8;
        const cascaMat = new THREE.MeshStandardMaterial({ color: 0xe8f2ff, roughness: 0.15, transparent: true, opacity: 0, emissive: 0x9fc4ff, emissiveIntensity: 0.15 });
        const casca = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16, 18), cascaMat); casca.rotation.z = Math.PI / 2; casca.position.copy(cano.position); S.add(casca);
        const NI = 22, pinMat = new THREE.MeshStandardMaterial({ color: 0xdfeeff, roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x9fc4ff, emissiveIntensity: 0.2 });
        const pingentes = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 1, 6), pinMat, NI); S.add(pingentes);
        const pd = Array.from({ length: NI }, (_, i) => [-7 + i * 0.66 + (rr() - 0.5) * 0.3, 0.3 + rr() * 0.4, rr() * 0.5]);
        const pos = [-6, -8.5, -0.8, 1.5, 4.5];
        const marcas = pos.map((x) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.04, 6, 16), new THREE.MeshStandardMaterial({ color: 0x8a5a2b, metalness: 0.7, roughness: 0.4 })); r.rotation.y = Math.PI / 2; r.position.set(x, 0.55, 12.5); S.add(r); return r; });
        // silos de grãos ao fundo
        const siloMat = new THREE.MeshStandardMaterial({ color: 0xaab3bf, metalness: 0.75, roughness: 0.35 });
        const silos = [];
        for (let i = 0; i < 4; i++) {
          const g = new THREE.Group(); g.position.set(-9 + i * 6, 0, -48);
          const corpo = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 13, 28), siloMat); corpo.position.y = 6.5; g.add(corpo);
          const teto = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2.2, 28), siloMat); teto.position.y = 14.1; g.add(teto);
          for (let k = 1; k < 6; k++) { const an = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.05, 4, 28), siloMat); an.rotation.x = Math.PI / 2; an.position.y = k * 2.2; g.add(an); }
          const lamp = SK.brilho(0xffd59a, 3, "suave", 0.9); lamp.position.set(0, 9, 2.8); g.add(lamp);
          S.add(g); silos.push(g);
        }
        const galpao = T.mesh(T.roundBox(10, 5, 7, 0.2), 0x7a3b2e, S, 0.8); galpao.position.set(10, 2.5, -44);
        const v = new THREE.Vector3();
        const tag = (p, s, o) => { const [x, y, z] = SK.proj(p, cam); if (z < 1) SK.txt(st.ctx, s, x, y, o); };
        function render(t) {
          const h = ease.outCubic(range(t, 0.4, 2.8));   // geada
          const ic = ease.outCubic(range(t, 2.0, 3.4));  // gelo no cano
          soloMat.color.lerpColors(new THREE.Color(0x3b2a1c), new THREE.Color(0x9aa8b8), h * 0.85);
          foMat.color.lerpColors(verde, morto, h).lerp(branco, h * 0.35); caMat.color.lerpColors(new THREE.Color(0x5f8a34), morto, h);
          plantas.forEach(([x, z, s, ph], i) => {
            const vento = Math.sin(t * 1.3 + ph) * 0.04 * (1 - h);
            o3.position.set(x, 0.75 * s, z); o3.rotation.set(vento, ph, 0); o3.scale.set(1, 1.5 * s, 1); o3.updateMatrix(); caule.setMatrixAt(i, o3.matrix);
            for (let k = 0; k < FL; k++) {
              const ang = ph + k * 1.57, alt = (0.5 + k * 0.28) * s, caida = lerp(0.5, 1.35, h) + k * 0.05;
              o3.position.set(x + Math.cos(ang) * 0.32, alt, z + Math.sin(ang) * 0.32);
              o3.rotation.set(0, -ang, -caida + vento); o3.scale.set(0.42 * s, 0.07, 1); o3.updateMatrix();
              folhas.setMatrixAt(i * FL + k, o3.matrix);
            }
          });
          caule.instanceMatrix.needsUpdate = folhas.instanceMatrix.needsUpdate = true;
          gd.forEach((ph, i) => { ga[i] = h * (0.25 + 0.75 * Math.max(0, Math.sin(t * 3 + ph * 40))) * (ph < h ? 1 : 0.2); });
          gg.attributes.aA.needsUpdate = true;
          cascaMat.opacity = 0.75 * ic; casca.scale.set(1, 1, 1).multiplyScalar(1); casca.scale.y = 1; casca.scale.x = casca.scale.z = 0.75 + 0.25 * ic;
          pd.forEach(([x, l, ph], i) => { const k = ease.outCubic(range(t, 2.1 + ph, 3.6 + ph)); o3.position.set(x, 0.55 - 0.32 - l * k / 2, 12.5); o3.rotation.set(Math.PI, 0, 0); o3.scale.set(1, Math.max(0.001, l * k), 1); o3.updateMatrix(); pingentes.setMatrixAt(i, o3.matrix); });
          pingentes.instanceMatrix.needsUpdate = true;
          // câmera: rente ao cano, sobe e avança sobre a lavoura até os silos
          const e1 = ease.inOutSine(range(t, 0, 3.6)), e2 = ease.inOutCubic(range(t, 3.4, 7.07));
          cam.position.set(lerp(-2.4, 0.6, e1) + lerp(0, 1.0, e2), lerp(1.3, 2.1, e1) + lerp(0, 12, e2), lerp(17.5, 16.3, e1) - lerp(0, 16, e2));
          cam.lookAt(lerp(lerp(-1, 1, e1), 0, e2), lerp(0.5, 6, e2), lerp(10, -46, ease.inOutSine(range(t, 3.0, 7.07))));
          st.sol(0, cam.position.z - 20, 50);
          stars.set(0.9, t);
          st.draw();
          tag(v.set(-1.5, 1.6, 9), "ABAIXO DE 0 °C", { tam: 30, cor: "#9fd6ff", a: range(t, 0.9, 1.2) * (1 - range(t, 2.6, 2.9)) });
          tag(v.set(3.5, 1.3, 12.5), "ÁGUA CONGELA E EXPANDE", { tam: 26, cor: SK.AZUL, a: range(t, 2.6, 2.9) * (1 - range(t, 3.9, 4.2)) });
        }
