import * as THREE from 'three';
import { Earth } from './earth.js';
import { Starfield } from './starfield.js';
import { RNG } from '../core/rng.js';

export class SpaceScene {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.002, 1200);
    this.earth = new Earth(renderer);
    this.scene.add(this.earth.group);
    this.stars = new Starfield(this.earth.sunDir);
    this.scene.add(this.stars.group);

    this.sunLight = new THREE.DirectionalLight(0xfff2e0, 4.0);
    this.sunLight.position.copy(this.earth.sunDir).multiplyScalar(10);
    this.scene.add(this.sunLight);
    this.scene.add(new THREE.AmbientLight(0x223355, 0.15));

    this._debris();
  }

  // Foreground water globules and rock fragments drifting in orbit (scene 4).
  _debris() {
    const rng = new RNG(31);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x9fd6ff, roughness: 0.04, metalness: 0.0, transmission: 0.0,
      transparent: true, opacity: 0.55, clearcoat: 1, clearcoatRoughness: 0.02,
      envMapIntensity: 1, emissive: 0x0a2440, emissiveIntensity: 0.4, specularIntensity: 1,
    });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.9 });
    const nW = 70, nR = 50;
    const water = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 32, 16), waterMat, nW);
    const rockGeo = new THREE.IcosahedronGeometry(1, 1);
    const p = rockGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const s = 0.7 + rng.float() * 0.6;
      p.setXYZ(i, p.getX(i) * s, p.getY(i) * s * 0.8, p.getZ(i) * s);
    }
    rockGeo.computeVertexNormals();
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, nR);
    this.debrisItems = [];
    const add = (mesh, i, scaleR) => {
      // spread along a tube around the camera path used in shot 4
      const a = rng.float(-0.5, 0.5);
      const item = {
        mesh, i,
        base: new THREE.Vector3(rng.float(-0.07, 0.07), rng.float(-0.035, 0.035), rng.float(-0.35, -0.05)),
        vel: new THREE.Vector3(rng.float(-1, 1), rng.float(-1, 1), rng.float(-1, 1)).multiplyScalar(0.0015),
        rot: new THREE.Euler(rng.float(0, 6), rng.float(0, 6), a),
        spin: new THREE.Vector3(rng.float(-1, 1), rng.float(-1, 1), rng.float(-1, 1)).multiplyScalar(0.6),
        s: scaleR(),
        wob: rng.float(0, 10),
      };
      this.debrisItems.push(item);
    };
    for (let i = 0; i < nW; i++) add(water, i, () => Math.pow(rng.float(), 2) * 0.0035 + 0.0004);
    for (let i = 0; i < nR; i++) add(rocks, i, () => Math.pow(rng.float(), 3) * 0.0012 + 0.00015);
    this.debris = new THREE.Group();
    this.debris.add(water, rocks);
    this.debris.visible = false;
    this.scene.add(this.debris);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this.waterMesh = water; this.rockMesh = rocks;
  }

  /** anchor: world matrix for the debris cloud; k: visibility */
  updateDebris(t, anchor, k) {
    this.debris.visible = k > 0.001;
    if (!this.debris.visible) return;
    this.debris.matrixAutoUpdate = false;
    this.debris.matrix.copy(anchor);
    this.debris.matrixWorldNeedsUpdate = true;
    const e = new THREE.Euler();
    for (const it of this.debrisItems) {
      this._v.copy(it.base).addScaledVector(it.vel, t);
      e.set(it.rot.x + it.spin.x * t, it.rot.y + it.spin.y * t, it.rot.z + it.spin.z * t);
      this._q.setFromEuler(e);
      const w = it.mesh === this.waterMesh ? 0.12 : 0;
      this._s.set(1 + Math.sin(t * 3 + it.wob) * w, 1 - Math.sin(t * 3 + it.wob) * w, 1 + Math.cos(t * 2.3 + it.wob) * w)
        .multiplyScalar(it.s * k);
      this._m.compose(this._v, this._q, this._s);
      it.mesh.setMatrixAt(it.i, this._m);
    }
    this.waterMesh.instanceMatrix.needsUpdate = true;
    this.rockMesh.instanceMatrix.needsUpdate = true;
  }

  update(t, state) {
    const cd = this.camera.position.length();
    this.earth.atmoMat.uniforms.uIntensity.value = 0.22 + 0.78 * THREE.MathUtils.smoothstep(cd, 1.06, 1.5);
    this.earth.update(t, state.earth);
    this.stars.update(t, this.camera, state.starFade ?? 1);
  }
}
