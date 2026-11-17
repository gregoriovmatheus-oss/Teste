/*META {"imports": ["avenida", "terra"], "rotulos": [{"de": 4.05, "ate": 6.57, "sai": false, "texto": "Com ou <span class=\"y\">sem a gente</span>"}], "D0": 6.57} */
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#2F4A80", "#F09A5E"], nevoa: [80, 520], corNevoa: "#c99a7c", luz: 0.85 });
        const S = st.scene, cam = st.cam;
        const av = AVENIDA.avenida(S);
        av.set({ racha: 1, mato: 1, hera: 1, sujeira: 0.9, ferrugem: 1, floresta: 1, fenda: 0.8 }, 0);
        // cidade-floresta em volta da avenida (instanciada): prédios cobertos de verde e copas por toda parte
        const rr = mulberry32(1401), o = new THREE.Object3D();
        const cel = [];
        for (let x = -230; x <= 230; x += 22) for (let z = -300; z <= 160; z += 22) { if (Math.abs(x) < 34) continue; cel.push([x + (rr() - 0.5) * 6, z + (rr() - 0.5) * 6]); }
        const pr = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), T.M(0xffffff, 0.9), cel.length); S.add(pr); pr.receiveShadow = true;
        const tops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), T.M(0xffffff, 0.9), cel.length * 3); S.add(tops);
        const NC = 2400, cp = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), T.M(0xffffff, 0.85), NC); S.add(cp);
        const pc = [0x9c8f7c, 0xb5afa5, 0x8d8780, 0xa07a5c, 0x7d8480], vc = [0x3f6e2c, 0x4f7f34, 0x5a8a3a, 0x36612a, 0x6a8f3e];
        cel.forEach(([x, z], i) => {
          const w = 8 + rr() * 8, h = 8 + Math.pow(rr(), 1.5) * 45;
          o.position.set(x, h / 2, z); o.rotation.set(0, 0, 0); o.scale.set(w, h, w); o.updateMatrix(); pr.setMatrixAt(i, o.matrix); pr.setColorAt(i, new THREE.Color(pc[i % 5]).multiplyScalar(0.75));
          for (let j = 0; j < 3; j++) { o.position.set(x + (rr() - 0.5) * w * 0.7, h + 0.4, z + (rr() - 0.5) * w * 0.7); o.scale.set(1.5 + rr() * 2.5, 0.8 + rr(), 1.5 + rr() * 2.5); o.updateMatrix(); tops.setMatrixAt(i * 3 + j, o.matrix); tops.setColorAt(i * 3 + j, new THREE.Color(vc[(i + j) % 5])); }
        });
        for (let i = 0; i < NC; i++) {
          const x = (rr() - 0.5) * 520, z = -320 + rr() * 500; if (Math.abs(x) < 15 && z > -100) { o.scale.setScalar(1e-4); } else { const s = 3 + rr() * 4; o.scale.set(s, s * 0.85, s); }
          o.position.set(x, 5 + rr() * 3, z); o.updateMatrix(); cp.setMatrixAt(i, o.matrix); cp.setColorAt(i, new THREE.Color(vc[i % 5]).multiplyScalar(0.8 + rr() * 0.3));
        }
        const aves = T.bando(S, { n: 40, seed: 1402, cor: 0x2a2e34 });
        // ---------- a Terra vista do espaço (o planeta continua) ----------
        const ES = new THREE.Scene(); ES.background = new THREE.Color(0x000000);
        ES.add(TERRA.createCeu({ seed: 14, n: 4000, via: 0.5 }));
        const E = await TERRA.createTerra({ raio: 1 }); ES.add(E.group);
        E.sol.set(1, 0.15, -0.35); E.u.luzes.value = 0.25; E.u.atmo.value = 1.1;
        const cam2 = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.01, 2000);
        st.extraWarm = [{ renderer: st.renderer, scene: ES, camera: cam2 }];
        const T1 = 3.3;
        function render(t) {
          if (t < T1) {
            st.bloom = 0.5;
            av.set({ racha: 1, mato: 1, hera: 1, sujeira: 0.9, ferrugem: 1, floresta: 1, fenda: 0.8 }, t);
            aves.update(t, [-10 + t * 7, 30 + t * 4, 10], [14, 4, 8], 0.4, 0.8);
            const e = ease.inOutSine(range(t, 0, T1));
            cam.position.set(lerp(-2, 8, e), lerp(16, 210, e), lerp(48, 70, e));
            cam.lookAt(0, 0, lerp(-10, -30, e));
            st.sol(0, -20, lerp(70, 220, e));
            st.draw(S, cam, { cor: "#ffffff", a: 0.9 * range(t, T1 - 0.35, T1) });
          } else {
            st.bloom = 0.8;
            const u = t - T1;
            E.aim(-46.6 + u * 4, -23.5 + u * 1.5);
            E.nuv.rotation.y = u * 0.01;
            const e = ease.outCubic(range(u, 0, 3.27));
            cam2.position.set(lerp(0.25, 0.9, e), lerp(-0.15, -0.6, e), lerp(1.5, 4.4, e));
            cam2.lookAt(0, lerp(0.1, 0.2, e), 0);
            st.draw(ES, cam2, { cor: "#ffffff", a: 0.8 * (1 - range(u, 0, 0.45)) });
          }
        }
