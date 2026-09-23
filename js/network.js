import * as THREE from 'three';

// Deterministic PRNG (Park–Miller) so the network looks the same on every load.
export function rng(seed = 1) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647, (s - 1) / 2147483646);
}

// Points in a hollow sphere around the camera: uniform direction, uniform radius in [inner, outer].
export function makeNodes(count, { inner = 1.6, outer = 9.1, random = rng(1) } = {}) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1, th = random() * Math.PI * 2, r = Math.sqrt(1 - y * y);
    const d = inner + random() * (outer - inner);
    pts.push(new THREE.Vector3(r * Math.cos(th) * d, y * d, r * Math.sin(th) * d));
  }
  return pts;
}

// Link each point to up to maxLinks later points closer than maxDist.
export function linkNeighbours(points, maxDist = 1.15, maxLinks = 2) {
  const links = [];
  for (let i = 0; i < points.length; i++) {
    let n = 0;
    for (let j = i + 1; j < points.length && n < maxLinks; j++) {
      if (points[i].distanceTo(points[j]) < maxDist) { links.push([i, j]); n++; }
    }
  }
  return links;
}

const FADE = `uniform float fade; float depthFade(float w){ return smoothstep(fade, fade * .25, w); }`;

const NODE_VERT = `uniform vec2 pointer; uniform float dpr; attribute float size; varying float vHot; varying float vFade; ${FADE}
  void main(){
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    vHot = smoothstep(.35, 0., distance(clip.xy / clip.w, pointer));
    vFade = depthFade(clip.w);
    gl_PointSize = (2. + size * 3. + vHot * 6.) * .8 * dpr * (4. / clip.w);
    gl_Position = clip;
  }`;
const NODE_FRAG = `uniform vec3 accent; varying float vHot; varying float vFade;
  void main(){
    float d = length(gl_PointCoord - .5); if (d > .5) discard;
    gl_FragColor = vec4(mix(vec3(.9), accent, vHot), smoothstep(.5, 0., d) * (.55 + vHot * .45) * vFade);
  }`;
const LINE_VERT = `attribute float along; attribute float seed; varying float vAlong; varying float vSeed; varying float vFade; ${FADE}
  void main(){
    vAlong = along; vSeed = seed;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    vFade = depthFade(clip.w);
    gl_Position = clip;
  }`;
const LINE_FRAG = `uniform float t; uniform vec3 accent; uniform float pulseCut; varying float vAlong; varying float vSeed; varying float vFade;
  void main(){
    float phase = fract(t * (.15 + vSeed * .25) + vSeed * 7.);
    float pulse = smoothstep(.12, 0., abs(vAlong - phase)) * step(pulseCut, vSeed);
    gl_FragColor = vec4(mix(vec3(1.), accent, pulse), (.1 + pulse * .9) * vFade);
  }`;

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

export function createNetwork({ count, accent, dpr = 1, fade = 9, pulseRate = .28, random = rng(1) }) {
  const uniforms = {
    t: { value: 0 },
    pointer: { value: new THREE.Vector2(9, 9) },
    accent: { value: new THREE.Color(accent) },
    dpr: { value: dpr },
    fade: { value: fade },
  };
  const points = makeNodes(count, { random });
  const links = linkNeighbours(points);

  const nodeGeo = new THREE.BufferGeometry().setFromPoints(points);
  nodeGeo.setAttribute('size', new THREE.Float32BufferAttribute(points.map(() => random()), 1));
  const nodes = new THREE.Points(nodeGeo, new THREE.ShaderMaterial({ uniforms, vertexShader: NODE_VERT, fragmentShader: NODE_FRAG, ...additive }));

  const pos = [], along = [], seed = [];
  for (const [i, j] of links) {
    pos.push(...points[i].toArray(), ...points[j].toArray());
    along.push(0, 1);
    const s = random(); seed.push(s, s);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  lineGeo.setAttribute('along', new THREE.Float32BufferAttribute(along, 1));
  lineGeo.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 1));
  const lines = new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({
    uniforms: { ...uniforms, pulseCut: { value: 1 - pulseRate } }, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, ...additive }));

  const group = new THREE.Group();
  group.add(nodes, lines);
  return { group, uniforms, stats: { nodes: points.length, links: links.length } };
}
