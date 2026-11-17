/*META {"imports": ["oceano"], "rotulos": [{"de": 0, "ate": 2.55, "top": 660, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se os oceanos<br><span class=\"y\">sumissem?</span>"}], "D0": 5.36} */
        const O = OCEANO;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#3d76b8", "#f6d3a0"], nevoa: [120, 900], corNevoa: "#b9cbd6", nuvens: 10, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        // praia: areia sobe para +z; o fundo desce para -z (plataforma suave, depois mais íngreme)
        const alt = (x, z) => {
          let y = z > 0 ? z * 0.07 : z * 0.055 + Math.min(0, z + 60) * 0.045;
          y += 0.28 * O.fbm(x * 0.05, z * 0.05, 3, 2);
          if (z < -3) y += 0.07 * Math.sin(x * 0.8 + O.ruido(x * 0.1, z * 0.1, 5) * 3);
          return y;
        };
        const cor = (x, z, y, c) => {
          if (y > 0.4) O.mistura(c, 0xe3cb9c, 0xd2b886, (O.ruido(x * 0.2, z * 0.2, 9) + 1) / 2);
          else if (y > -0.5) O.mistura(c, 0x9c8160, 0xc4a87c, (y + 0.5) / 0.9);
          else { O.mistura(c, 0x7a6a4e, 0x55573e, clamp(-y / 4) + 0.35 * O.ruido(x * 0.07, z * 0.07, 4)); }
        };
        S.add(O.terreno({ w: 240, d: 270, sx: 90, sz: 110, cz: -85, alt, cor }));
        // rochas com algas, conchas
        const rr = mulberry32(17);
        const rochaG = new THREE.IcosahedronGeometry(1, 1);
        { const p = rochaG.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.22 * O.ruido(p.getX(i) * 2 + 9, p.getZ(i) * 2 + p.getY(i), 3); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } rochaG.computeVertexNormals(); }
        const mRocha = T.TOON({ color: 0x57524c, roughness: 0.85, flatShading: true }), mAlga = T.TOON({ color: 0x4b5a2a, roughness: 0.7, flatShading: true });
        for (let i = 0; i < 26; i++) {
          const x = (rr() - 0.5) * 50, z = -6 - rr() * 70, s = 0.5 + rr() * 1.6;
          const m = new THREE.Mesh(rochaG, rr() < 0.45 ? mAlga : mRocha); m.scale.set(s * (1 + rr()), s * 0.6, s); m.position.set(x, alt(x, z) + s * 0.1, z); m.rotation.y = rr() * 6;
          m.castShadow = m.receiveShadow = true; S.add(m);
        }
        // peixes que ficam no seco quando a água passa
        const cores = [0xc9a13a, 0x9fb3bd, 0xd06a3a, 0x7d8f99, 0xc9a13a];
        const pe = [[-2.2, -9], [1.8, -13], [-0.6, -18], [3.6, -24], [-4, -30]].map(([x, z], i) => {
          const f = O.peixe(cores[i], 30 + i); f.group.scale.setScalar(1.6); S.add(f.group); return { f, x, z, y: alt(x, z), fase: i * 0.37 };
        });
        // água: plano com ondas + espuma por vértice
        const AW = 240, AD = 270, ag = new THREE.PlaneGeometry(AW, AD, 64, 84); ag.rotateX(-Math.PI / 2); ag.translate(0, 0, -85);
        const ap = ag.attributes.position, base = Float32Array.from(ap.array), acol = new Float32Array(ap.count * 3);
        const chaoY = new Float32Array(ap.count);
        for (let i = 0; i < ap.count; i++) chaoY[i] = alt(base[i * 3], base[i * 3 + 2]);
        ag.setAttribute("color", new THREE.BufferAttribute(acol, 3));
        const agua = new THREE.Mesh(ag, T.TOON({ vertexColors: true, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.93 }));
        agua.material.envMapIntensity = 0.55; agua.receiveShadow = true; S.add(agua);
        const cFundo = new THREE.Color(0x15596e), cRaso = new THREE.Color(0x3fa5a8), cEsp = new THREE.Color(0xf4f1ea), cc = new THREE.Color();
        // Sol baixo sobre o mar
        const sc = document.createElement("canvas"); sc.width = sc.height = 128;
        { const g = sc.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,252,240,1)"); r.addColorStop(0.12, "rgba(255,240,200,1)"); r.addColorStop(0.35, "rgba(255,200,130,0.35)"); r.addColorStop(1, "rgba(255,170,90,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
        const solTx = new THREE.CanvasTexture(sc); solTx.colorSpace = THREE.SRGBColorSpace;
        const sol = new THREE.Sprite(new THREE.SpriteMaterial({ map: solTx, blending: THREE.AdditiveBlending, fog: false, depthWrite: false, transparent: true }));
        sol.position.set(80, 70, -440); sol.scale.setScalar(85); S.add(sol);
        const longe = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), T.TOON({ color: 0x174f66, roughness: 0.15 })); longe.rotation.x = -Math.PI / 2; longe.position.z = -1500; S.add(longe);
        const nivel = (t) => 0.12 * Math.sin(t * 1.3) - 0.72 * Math.pow(Math.max(0, t - 2.85), 1.9);
        function render(t) {
          const wl = nivel(t);
          const recua = clamp((t - 2.85) / 2.5);
          for (let i = 0; i < ap.count; i++) {
            const x = base[i * 3], z = base[i * 3 + 2];
            const amp = 1 - 0.6 * recua;
            const w = amp * (0.2 * Math.sin(0.33 * z - 2.1 * t + 0.04 * x) + 0.07 * Math.sin(1.1 * z + 0.6 * x - 3.3 * t) + 0.05 * Math.sin(0.7 * x - 0.9 * z + 1.7 * t));
            const y = wl + w;
            ap.setY(i, y);
            const prof = y - chaoY[i];
            cc.copy(cFundo).lerp(cRaso, clamp(1 - prof / 2.2));
            const esp = clamp(1 - prof / 0.13) + clamp((w - 0.22) / 0.06) * 0.6;
            cc.lerp(cEsp, clamp(esp));
            acol[i * 3] = cc.r; acol[i * 3 + 1] = cc.g; acol[i * 3 + 2] = cc.b;
          }
          longe.position.y = wl - 0.06;
          ap.needsUpdate = true; ag.attributes.color.needsUpdate = true; ag.computeVertexNormals();
          for (const p of pe) {
            const seco = p.y > wl + 0.05;
            const ph = t * 2.6 + p.fase * 7, pulo = seco ? Math.pow(Math.max(0, Math.sin(ph)), 6) : 0;
            p.f.group.position.set(p.x, p.y + 0.12 + pulo * 0.45, p.z);
            p.f.group.rotation.set(Math.PI / 2 - pulo * 0.5, 0, p.fase * 4 + pulo * 0.6);
            p.f.tail.rotation.y = seco ? Math.sin(ph * 3) * 0.7 * (0.3 + pulo) : Math.sin(t * 5 + p.fase) * 0.3;
          }
          const u = t / D, e = ease.inOutSine(u);
          cam.position.set(lerp(-3.5, 2.5, u), lerp(1.7, 6.2, e), lerp(15, 5, u));
          cam.lookAt(lerp(0, 0.5, u), lerp(0.4, -2.6, e), lerp(-30, -42, u));
          st.sol(0, -25, 60);
          st.key.position.set(55, 48, -110); st.key.target.position.set(0, 0, -20);
          st.rim.position.set(-40, 30, 60);
          st.draw();
        }
