/*META {"imports": ["mente"], "rotulos": [{"de": 2.0, "ate": 4.15, "texto": "<span class=\"k\">LIMITE DO FILTRO</span><br><span class=\"y\">2 ou 3</span> vozes ao mesmo tempo"}], "D0": 5.89} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#05070e", "#0c1222"], nevoa: [9, 30], corNevoa: "#070a14", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xdfe9ff); st.key.intensity = 2.0; st.hemi.intensity = 0.3; st.rim.color.set(0x7cc8ff);
        const piso = new THREE.Mesh(new THREE.CircleGeometry(9, 48), T.M(0x1a1f2a, 0.35, { metalness: 0.3 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        const halo = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.06, 64), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.6, toneMapped: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.02; S.add(halo);
        // ouvinte no centro + 3 falantes em volta
        const F = [[-2.6, -1.6], [2.8, -1.2], [0.2, -3.4]];
        const L = [{ x: 0, z: 0.4, ry: Math.PI, sent: 0, cor: 0xe8e2d4 }, ...F.map(([x, z]) => ({ x, z, ry: Math.atan2(-x, 0.4 - z), sent: 0, braco: true }))];
        const p = MENTE.povo(S, L, { seed: 505 });
        const TV = [0.0, 2.26, 2.73];  // cada voz entra quando é dita ("duas", "três")
        // fluxos de voz: partículas indo da cabeça do falante até a do ouvinte
        const NP = 220, vp = new Float32Array(3 * NP * 3), vc = new Float32Array(3 * NP * 3);
        const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.BufferAttribute(vp, 3)); vg.setAttribute("color", new THREE.BufferAttribute(vc, 3));
        S.add(new THREE.Points(vg, new THREE.PointsMaterial({ map: MENTE.glowTex(), size: 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false })));
        const CV = [MENTE.COR.azul, [0.6, 1, 0.75], [1, 0.85, 0.45]], R = mulberry32(506), J = Array.from({ length: 3 * NP }, () => [R(), R() * 6.28]);
        const ch = new THREE.Vector3(), cs = new THREE.Vector3();
        // medidor de compreensão (barra vertical ao lado do ouvinte)
        const bar = MENTE.barras(S, 2, { larg: 0.16, prof: 0.16 });
        function render(t) {
          p.update(t, {});
          p.cabeca(0, t, ch); ch.y -= 0.1;
          const caos = range(t, 2.6, 4.4);
          for (let v = 0; v < 3; v++) {
            const on = range(t, TV[v], TV[v] + 0.35);
            p.cabeca(v + 1, t, cs); cs.y -= 0.12;
            for (let k = 0; k < NP; k++) {
              const q = v * NP + k, [o, ph] = J[q], u = ((t * 0.55 + o) % 1 + 1) % 1, w = t * 3 + ph + u * 9;
              const amp = 0.06 + caos * 0.35 * Math.sin(Math.PI * u);
              vp[q * 3] = lerp(cs.x, ch.x, u) + Math.sin(w) * amp; vp[q * 3 + 1] = lerp(cs.y, ch.y, u) + Math.sin(Math.PI * u) * 0.5 + Math.cos(w * 1.3) * amp; vp[q * 3 + 2] = lerp(cs.z, ch.z, u) + Math.cos(w) * amp;
              const e = on * (0.5 + 0.5 * Math.sin(u * 40 - t * 12)) * (u < (t - TV[v]) * 1.6 ? 1 : 0);
              const cc = CV[v]; vc[q * 3] = cc[0] * e; vc[q * 3 + 1] = cc[1] * e; vc[q * 3 + 2] = cc[2] * e;
            }
          }
          vg.attributes.position.needsUpdate = true; vg.attributes.color.needsUpdate = true;
          // compreensão: cheia com 1 voz, despenca em "despenca" (5,15 s)
          const comp = lerp(lerp(1, 0.72, range(t, 2.4, 3.2)), 0.12, ease.inCubic(range(t, 4.3, 5.3)));
          const lar = range(t, 4.4, 5.2), cor = [lerp(0.49, 1, lar) * 1.5, lerp(0.78, 0.54, lar) * 1.5, lerp(1, 0.3, lar) * 1.5];
          bar.set(0, 1.25, 0.9 + comp * 1.0, 0.4, comp * 2.0, cor);
          bar.set(1, 1.25, 1.9, 0.4, 2.0, [0.08, 0.1, 0.14]); bar.mesh.material.transparent = false;
          bar.fim();
          halo.material.opacity = 0.6 * (1 - lar * 0.5);
          st.bloom = 0.7;
          // órbita lenta ao redor do ouvinte
          const e = ease.inOutSine(range(t, 0, 5.89)), a = lerp(0.55, -0.35, e), r = lerp(7.6, 6.2, e);
          cam.position.set(Math.sin(a) * r, lerp(3.6, 2.6, e), 0.4 + Math.cos(a) * r);
          cam.lookAt(0, lerp(1.0, 1.35, e), -0.6);
          st.sol(0, 0, 8);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st);
          const [bx, by] = MENTE.proj(new THREE.Vector3(1.25, 3.1, 0.4), cam), [qx, qy] = MENTE.proj(new THREE.Vector3(1.25, 0.9 + comp * 2, 0.4), cam);
          MENTE.txt(c, "COMPREENSÃO", bx, by - 40, { tam: 24, cor: MENTE.AZUL, a: vv * range(t, 0.3, 0.8), esp: 0.25 });
          MENTE.txt(c, "DESPENCA", qx + 30, qy, { tam: 34, cor: MENTE.LARANJA, al: "left", a: vv * range(t, 5.1, 5.3), esp: 0.2 });
          ["1 VOZ", "2 VOZES", "3 VOZES"].forEach((s, v) => { const [x, y] = MENTE.proj(new THREE.Vector3(F[v][0], 2.45, F[v][1]), cam); MENTE.txt(c, s, x, Math.max(y, 500), { tam: 26, cor: "#e7f2ff", a: vv * range(t, TV[v], TV[v] + 0.25), esp: 0.2 }); });
        }
