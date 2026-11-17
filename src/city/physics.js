import * as THREE from 'three';

// Lightweight rigid-body integrator for the cinematic hypothesis.
// Bodies are oriented boxes resting on a flat ground (y = 0). Gravity is a
// function of time supplied by the director (on → off → on).

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _axes = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

export class Body {
  constructor(o) {
    this.prop = o.prop;            // InstancedProp
    this.index = o.index;
    this.p = o.p.clone();
    this.q = o.q ? o.q.clone() : new THREE.Quaternion();
    this.v = new THREE.Vector3();
    this.w = new THREE.Vector3();
    this.half = o.half.clone();
    this.scale = o.scale ?? 1;
    this.release = o.release;       // seconds after gravity switches off
    this.lift = o.lift;             // upward speed gained at release
    this.drift = o.drift ? o.drift.clone() : new THREE.Vector3();
    this.spin = o.spin ? o.spin.clone() : new THREE.Vector3();
    this.drag = o.drag ?? 0.02;     // air drag coefficient (terminal velocity)
    this.flutter = o.flutter ?? 0;  // sideways flutter for leaves / paper
    this.impact = o.impact ?? 0;    // strength multiplier for impact effects
    this.kind = o.kind ?? 'generic';
    this.bounce = o.bounce ?? 0.22;
    this.settle = o.settle ?? true;
    this.seed = o.seed ?? Math.random();
    this.state = 0;                 // 0 rest, 1 free, 2 landed
    this.impacted = false;
    this.visible = o.visible ?? 1;  // scale multiplier (e.g. water blobs growing)
    this.onLand = o.onLand;
    this.groundY = o.groundY ?? 0;
    this.initial = { p: this.p.clone(), q: this.q.clone() };
    this.alt = o.alt;               // alternative prop (pose swap) {prop,index}
    this.poseSwapped = false;
    this.wobble = o.wobble ?? 0;
  }

  lowestOffset() {
    // support extent of the OBB along world Y
    _m.makeRotationFromQuaternion(this.q);
    const e = _m.elements;
    const s = this.scale;
    return (Math.abs(e[1]) * this.half.x + Math.abs(e[5]) * this.half.y + Math.abs(e[9]) * this.half.z) * s;
  }

  write() {
    _s.setScalar(this.scale * this.visible);
    if (this.wobble > 0 && this.state === 1) {
      const t = this._t || 0;
      const a = Math.sin(t * 4.0 + this.seed * 20) * this.wobble;
      const b = Math.cos(t * 3.1 + this.seed * 11) * this.wobble;
      _s.set(this.scale * this.visible * (1 + a), this.scale * this.visible * (1 - a * 0.7 + b), this.scale * this.visible * (1 - b));
    }
    _m.compose(this.p, this.q, _s);
    if (this.alt) {
      const showAlt = this.poseSwapped;
      this.prop.setMatrix(this.index, showAlt ? ZERO : _m);
      this.alt.prop.setMatrix(this.alt.index, showAlt ? _m : ZERO);
    } else {
      this.prop.setMatrix(this.index, _m);
    }
  }
}

export class PhysicsWorld {
  constructor() {
    this.bodies = [];
    this.props = new Set();
    this.events = [];
  }

  add(b) { this.bodies.push(b); this.props.add(b.prop); if (b.alt) this.props.add(b.alt.prop); return b; }

  /**
   * @param {number} t film time
   * @param {number} dt fixed step
   * @param {number} g gravity (m/s², negative = down)
   * @param {number} tOff film time when gravity switched off
   */
  step(t, dt, g, tOff) {
    const zeroG = g > -0.5;
    for (const b of this.bodies) {
      b._t = t;
      if (b.state === 0) {
        if (tOff !== null && t >= tOff + b.release) {
          b.state = 1;
          b.v.set(b.drift.x, b.lift, b.drift.z);
          b.w.copy(b.spin);
          b.poseSwapped = !!b.alt;
        } else continue;
      }
      // integrate
      b.v.y += g * dt;
      const sp = b.v.length();
      if (zeroG) {
        // very gentle damping so rising objects slowly plateau (cinematic)
        b.v.multiplyScalar(Math.exp(-0.11 * dt));
      } else if (sp > 0) {
        // quadratic air drag -> terminal velocity sqrt(g/drag)
        const k = Math.min(1, b.drag * sp * dt);
        b.v.multiplyScalar(1 - k);
      }
      if (b.flutter > 0) {
        const f = b.flutter * (zeroG ? 0.15 : 1);
        b.v.x += Math.sin(t * 3.1 + b.seed * 40) * f * dt;
        b.v.z += Math.cos(t * 2.7 + b.seed * 17) * f * dt;
      }
      b.p.addScaledVector(b.v, dt);
      const wl = b.w.length();
      if (wl > 1e-5) {
        _v.copy(b.w).divideScalar(wl);
        _q.setFromAxisAngle(_v, wl * dt);
        b.q.premultiply(_q).normalize();
      }
      // ground
      const low = b.lowestOffset();
      const pen = b.groundY - (b.p.y - low);
      if (pen > 0) {
        b.p.y += pen;
        const vy = b.v.y;
        if (vy < -2.0 && !b.impacted) {
          b.impacted = true;
          if (b.impact > 0) this.events.push({ type: 'impact', body: b, speed: -vy, p: b.p.clone(), t });
          if (b.onLand) b.onLand(b, -vy, t);
          b.w.multiplyScalar(0.5).add(_v.set((b.seed - 0.5) * 2, 0, (0.5 - b.seed) * 1.5).multiplyScalar(Math.min(3, -vy * 0.15)));
        }
        b.v.y = vy < -1.0 ? -vy * b.bounce : 0;
        b.v.x *= 0.6; b.v.z *= 0.6;
        b.state = 2;
      }
      if (b.state === 2 && !zeroG) {
        // friction + settle on the closest face
        const grounded = b.p.y - b.lowestOffset() - b.groundY < 0.05;
        if (grounded) {
          const f = Math.exp(-5 * dt);
          b.v.x *= f; b.v.z *= f;
          b.w.multiplyScalar(Math.exp(-4 * dt));
          if (b.settle) this._settle(b, dt);
        }
      }
    }
  }

  _settle(b, dt) {
    _m.makeRotationFromQuaternion(b.q);
    _axes[0].setFromMatrixColumn(_m, 0);
    _axes[1].setFromMatrixColumn(_m, 1);
    _axes[2].setFromMatrixColumn(_m, 2);
    let best = 0, bestD = -1;
    for (let i = 0; i < 3; i++) {
      // prefer resting on the axis with the largest projection (weighted by thin dims)
      const d = Math.abs(_axes[i].y) * (1.0 + 0.3 / (b.half.getComponent(i) + 0.2));
      if (d > bestD) { bestD = d; best = i; }
    }
    const a = _axes[best];
    const target = a.y >= 0 ? UP : DOWN;
    _q2.setFromUnitVectors(a, target);
    _q.copy(_q2).multiply(b.q);
    b.q.slerp(_q, 1 - Math.exp(-6 * dt));
  }

  writeAll() {
    for (const b of this.bodies) b.write();
    for (const p of this.props) p.commit();
  }

  drainEvents() { const e = this.events; this.events = []; return e; }
}
