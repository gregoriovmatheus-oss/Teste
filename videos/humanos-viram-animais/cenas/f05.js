/*META {"rotulos": [{"de": 3.85, "ate": 5.51, "texto": "TUDO É <span class=\"y\">AMEAÇA</span>"}], "D0": 5.51} */
        const st = T.createToyStage(canvas, { fov: 55, nevoa: [12, 70] });
        const S = st.scene, cam = st.cam;
        const city = T.rua({ len: 160, seed: 51 }); city.group.rotation.y = Math.PI / 2; S.add(city.group);
        const rato = A.createAnimal("rato", { fase: 0.2 }); rato.group.scale.setScalar(1.4); S.add(rato.group);
        const coelho = A.createAnimal("coelho", { fase: 0.4 }); coelho.group.scale.setScalar(1.8); S.add(coelho.group);
        const lixo = T.mesh(new THREE.CylinderGeometry(0.55, 0.48, 1.3, 18), 0x5f8a5a, S); lixo.position.set(6.2, 0.65 + 0.4, -8.6);
        const tampa = T.mesh(T.roundBox(1.2, 0.15, 1.2, 0.07), 0x4f7a4a, S); tampa.position.set(6.2, 1.75, -8.6);
        const e1 = A.createAnimal("elefante", { fase: 0.1 }); e1.group.scale.setScalar(1.3); A.face(e1.group, 0, 1); S.add(e1.group);
        const e2 = A.createAnimal("rinoceronte", { fase: 0.6 }); e2.group.scale.setScalar(1.4); A.face(e2.group, 0, -1); S.add(e2.group);
        const pc = T.carro(T.PAL.tijolo); pc.rotation.y = Math.PI / 2; S.add(pc);
        function render(t) {
          const mx = -2 + t * 1.9, mz = Math.sin(t * 3.2) * 0.5 + (t > 1.3 && t < 2.2 ? -0.6 * Math.sin((t - 1.3) / 0.9 * Math.PI) : 0);
          rato.group.position.set(mx, 0.12, mz);
          A.face(rato.group, 1, Math.cos(t * 3.2) * 0.5 * 1.6);
          rato.update(t, { passo: 7 });
          e1.group.position.set(1.5, 0.12, -9 + t * 2.3); e1.update(t, { passo: 0.9 });
          e2.group.position.set(6.5, 0.12, 9 - t * 2.4); e2.update(t, { passo: 1.2 });
          pc.position.set(-14 + t * 9, 0.12, -4);
          const ct = range(t, 2.6, 4.2);
          coelho.group.position.set(lerp(2.8, 5.4, ease.outCubic(ct)), 0.4, lerp(-6.2, -7.8, ease.outCubic(ct)));
          A.face(coelho.group, 1, -1);
          coelho.update(t, { passo: ct > 0 && ct < 1 ? 3 : 0, salto: ct > 0 && ct < 1 ? 0.3 : 0, cabeca: ct >= 1 ? Math.sin(t * 3) * 0.15 : 0 });
          const sh = T.shaker(5)(t, 0.04 + 0.08 * Math.max(0, Math.sin(t * 0.9 * 6.283)) * (1 - range(t, 3, 4)));
          const late = ease.inOutSine(range(t, 3.3, 5.0));
          cam.position.set(lerp(mx - 2.4, 4.0, late) + sh[0], lerp(0.55, 1.4, late) + sh[1], lerp(mz + 2.4, -4.2, late));
          cam.lookAt(lerp(mx + 1.5, 6.2, late), lerp(1.6, 0.9, late), lerp(mz - 1, -9, late));
          st.sol(mx, -2, 16);
          st.draw();
        }
