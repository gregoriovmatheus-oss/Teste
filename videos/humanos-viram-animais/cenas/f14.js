/*META {"rotulos": [{"de": 0.2, "ate": 2.6, "texto": "A TERRA <span class=\"y\">CONTINUA</span>"}]} */
        const st = T.createToyStage(canvas, { fov: 45, ceu: ["#7FBFD0", "#F3E2C4"], nevoa: [80, 400] });
        const S = st.scene, cam = st.cam;
        const rr = mulberry32(141);
        const ilha = (x, z, cor) => { const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g); const b = T.mesh(new THREE.CylinderGeometry(12, 11, 3, 40), 0xd98a4e, g, 0.85); b.position.y = -1.5; const tp = T.mesh(new THREE.CylinderGeometry(12.2, 12.2, 0.8, 40), cor, g, 0.9); tp.position.y = 0.4 - 0.4; return g; };
        const P = [[-20, -20], [20, -20], [-20, 20], [20, 20]];
        // floresta
        const fo = ilha(...P[0], T.PAL.verde);
        for (let i = 0; i < 16; i++) { const a = T.arvore(1 + rr() * 0.8, [T.PAL.verde, T.PAL.verdeEsc][i % 2], 600 + i); const r = Math.sqrt(rr()) * 9, an = rr() * 6.28; a.position.set(Math.cos(an) * r, 0.4, Math.sin(an) * r); fo.add(a); }
        const mF = A.createAnimal("macaco", { fase: 0.1 }); mF.group.scale.setScalar(1.6); fo.add(mF.group);
        // oceano
        const oc = ilha(...P[1], 0x3aa0c8);
        const dF = A.createAnimal("golfinho", { fase: 0.2 }); dF.group.scale.setScalar(1.8); oc.add(dF.group);
        const bF = A.createAnimal("baleia", { fase: 0.2 }); bF.group.scale.setScalar(0.5); bF.group.position.set(-3, -0.2, 4); oc.add(bF.group);
        // deserto
        const de = ilha(...P[2], 0xe8cf9a);
        for (let i = 0; i < 6; i++) { const c = new THREE.Group(); T.mesh(new THREE.CapsuleGeometry(0.5, 2.5, 4, 10), 0x5f9a4a, c).position.y = 1.7; const br = T.mesh(new THREE.CapsuleGeometry(0.3, 1, 4, 8), 0x5f9a4a, c); br.position.set(0.7, 2, 0); br.rotation.z = 0.6; const an = rr() * 6.28, r = 3 + rr() * 6; c.position.set(Math.cos(an) * r, 0.4, Math.sin(an) * r); de.add(c); }
        const rF = A.createAnimal("rinoceronte", { fase: 0.3 }); rF.group.scale.setScalar(1.3); de.add(rF.group);
        // cidade tomada
        const ci = ilha(...P[3], 0x9aa29a);
        for (let i = 0; i < 7; i++) { const b = T.predio({ w: 4, d: 4, h: 6 + rr() * 10, cor: [T.PAL.tijolo, T.PAL.amarelo, T.PAL.creme][i % 3], seed: i }); const an = i / 7 * 6.28, r = 6.5; b.position.set(Math.cos(an) * r, 0.4, Math.sin(an) * r); ci.add(b); for (let k = 0; k < 3; k++) { const v = T.mesh(T.SPH, T.PAL.verdeEsc, b); v.scale.setScalar(1.2); v.position.set((rr() - 0.5) * 3, rr() * b.userData.h, 2.1); } }
        const gF = A.createAnimal("girafa", { fase: 0.4 }); ci.add(gF.group);
        const ilhas = [fo, oc, de, ci];
        function render(t) {
          mF.group.position.set(Math.cos(t) * 3, 0.4, Math.sin(t) * 3); A.face(mF.group, -Math.sin(t), Math.cos(t)); mF.update(t, { passo: 2 });
          const jp = (t * 0.9) % 1; dF.group.position.set(lerp(-6, 6, jp), Math.sin(jp * Math.PI) * 5 - 0.5, 0); dF.group.rotation.z = Math.cos(jp * Math.PI) * 0.9; dF.update(t, { nada: 2 });
          bF.update(t, { nada: 0.5 });
          rF.group.position.set(Math.cos(-t * 0.6) * 2, 0.4, Math.sin(-t * 0.6) * 2); A.face(rF.group, Math.sin(-t * 0.6), -Math.cos(-t * 0.6)); rF.update(t, { passo: 1.3 });
          gF.group.position.set(Math.cos(t * 0.5) * 2, 0.4, Math.sin(t * 0.5) * 2); A.face(gF.group, -Math.sin(t * 0.5), Math.cos(t * 0.5)); gF.update(t, { passo: 1 });
          const seg = Math.min(3, Math.floor(t / 1.05));
          const top = ease.inOutCubic(range(t, 4.1, 5.88));
          const [ix, iz] = P[seg], lt = t - seg * 1.05;
          const ang = lt * 0.4 + seg;
          const close = [ix + Math.sin(ang) * (34 - lt * 4), 15 - lt * 2, iz + Math.cos(ang) * (34 - lt * 4)];
          const far = [0, 120, 60];
          cam.position.set(lerp(close[0], far[0], top), lerp(close[1], far[1], top), lerp(close[2], far[2], top));
          cam.lookAt(lerp(ix, 0, top), lerp(3, 0, top), lerp(iz, 0, top));
          st.sol(lerp(ix, 0, top), lerp(iz, 0, top), lerp(20, 50, top));
          st.draw();
        }
