import * as THREE from 'three';

const canvas = document.querySelector('#world');
const controls = document.querySelector('#egg-controls');
const motion = document.querySelector('#motion');
const palettes = [
  { name: '薄荷', shell: '#c6e2b8', patch: '#72ad8a', fleck: '#a8cb96' },
  { name: '草莓', shell: '#efb6c4', patch: '#cc7395', fleck: '#e799af' },
  { name: '天空', shell: '#b9dbef', patch: '#72a9c8', fleck: '#98c1dc' },
  { name: '奶油', shell: '#f4d997', patch: '#caa85d', fleck: '#e2bf77' },
  { name: '葡萄', shell: '#d4bfed', patch: '#9d7ac8', fleck: '#baa0db' },
  { name: '蜜桃', shell: '#efc39b', patch: '#cc8d5c', fleck: '#dfaa7b' },
  { name: '海盐', shell: '#b1dbc9', patch: '#64a58e', fleck: '#8ec2ac' },
  { name: '彩虹', shell: '#f0e9d6', patch: '#d6a4be', fleck: '#dce8ba' },
];
const glyphs = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  k: ['10000', '10000', '10010', '10100', '11000', '10100', '10010'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01111'],
  n: ['00000', '00000', '11110', '10001', '10001', '10001', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  t: ['00100', '00100', '11111', '00100', '00100', '00100', '00011'],
};
const random = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor('#dce7cf');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 1000);
  camera.position.z = 500;
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const normals = unit.getAttribute('normal');
  const shading = [];
  for (let i = 0; i < normals.count; i++) {
    const factor = normals.getY(i) > .5 ? 1 : normals.getX(i) > .5 ? .73 : normals.getZ(i) > .5 ? .92 : .82;
    shading.push(factor, factor, factor);
  }
  unit.setAttribute('color', new THREE.Float32BufferAttribute(shading, 3));
  const voxelMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  function voxels(cells) {
    const mesh = new THREE.InstancedMesh(unit, voxelMaterial, cells.length);
    cells.forEach((cell, i) => {
      dummy.position.set(cell.x, cell.y, cell.z || 0);
      dummy.scale.set(cell.sx || 1, cell.sy || 1, cell.sz || 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(cell.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  const profile = [1.9, 2.8, 3.35, 3.7, 3.7, 3.5, 3.15, 2.7, 1.95, 1.05];
  const filled = new Set();
  for (let y = 0; y < profile.length; y++)
    for (let x = -4; x < 4; x++)
      for (let z = -4; z < 4; z++)
        if ((x + .5) ** 2 + (z + .5) ** 2 <= profile[y] ** 2) filled.add(`${x},${y},${z}`);
  const surface = [...filled].map((key) => key.split(',').map(Number)).filter(([x, y, z]) =>
    [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(
      ([dx, dy, dz]) => !filled.has(`${x + dx},${y + dy},${z + dz}`)
    )
  );

  const shadowGeometry = new THREE.CircleGeometry(1, 32);
  const kickDuration = .48;
  const roamSeed = Math.random() * 10000;
  const eggs = Array.from({ length: 20 }, (_, index) => {
    const palette = palettes[(index * 3) % palettes.length];
    const cells = surface.map(([x, y, z]) => {
      const patch = random(Math.floor((x + 4) / 2) * 11 + Math.floor(y / 2) * 17 + Math.floor((z + 4) / 2) * 23 + index * 31);
      const tint = index === 13 && patch < .4
        ? palettes[Math.floor(y / 2) % palettes.length].patch
        : patch < .25 ? palette.patch : patch < .40 ? palette.fleck : palette.shell;
      return { x: x + .5, y: y + .5, z: z + .5, color: tint };
    });
    const body = voxels(cells);
    const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ color: '#687e59', transparent: true, opacity: .13, depthWrite: false }));
    const group = new THREE.Group();
    group.add(body, shadow);
    scene.add(group);
    shadow.position.set(.7, -.3, -7);
    const button = document.createElement('button');
    button.className = 'egg';
    button.type = 'button';
    button.setAttribute('aria-label', `${palette.name}方块蛋 ${index + 1}，点击让它跳一下`);
    controls.append(button);
    const egg = { body, shadow, group, button, seed: index * 3.9, kickAt: -100, hovered: false, scale: 1, x: 0, y: 0, height: 0, margin: 0, speed: 0, vx: 0, vy: 0, tx: 0, ty: 0, turn: 0, turnAt: 0, jumpAt: -1, jumpDuration: .4, jumpHeight: 1.5, jumpLean: 0, nextJumpAt: Math.random() * .65 };
    button.addEventListener('click', () => { if (elapsed - egg.kickAt >= kickDuration) egg.kickAt = elapsed; if (paused) render(0); });
    button.addEventListener('pointerenter', () => { egg.hovered = true; });
    button.addEventListener('pointerleave', () => { egg.hovered = false; });
    return egg;
  });

  const logo = new THREE.Group();
  const logoLetters = [];
  const titleColors = ['#f5d68c', '#edafba', '#b8d8a3', '#9fcbdc', '#c5b2df', '#f0c29b', '#dfa9c4', '#a5d6c4'];
  let cursor = 0;
  for (const letter of 'TokenPet') {
    const cells = [];
    const tint = titleColors[logoLetters.length];
    glyphs[letter].forEach((row, y) => [...row].forEach((bit, x) => {
      if (bit === '1') cells.push({ x: x - 2, y: 3 - y, z: 0, color: tint });
    }));
    const character = new THREE.Group();
    character.add(
      voxels(cells.map((cell) => ({ ...cell, x: cell.x + .22, y: cell.y - .28, z: -.75, sx: 1.28, sy: 1.28, sz: 2.25, color: '#637363' }))),
      voxels(cells.map((cell) => ({ ...cell, sx: 1.10, sy: 1.10, sz: 1.1 })))
    );
    character.position.set(cursor + 2, 3, 0);
    logoLetters.push(character);
    logo.add(character);
    cursor += 6;
  }
  logoLetters.forEach((character) => { character.position.x -= (cursor - 2) / 2; });
  scene.add(logo);

  const grass = voxels(Array.from({ length: 84 }, (_, i) => ({ x: 0, y: 0, z: -180, color: i % 6 ? '#a9bb99' : '#f5efd1' })));
  scene.add(grass);
  let width = 1, height = 1, logoY = 0, logoScale = 1, fieldTop = 0;

  function layout() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    const columns = width < 620 ? 3 : width < 960 ? 4 : 5;
    const rows = height < 540 ? 3 : width < 620 ? 5 : 4;
    logoScale = Math.min(width * .76 / (cursor - 1), height * .12 / 7, 14.2);
    const titleTop = Math.min(44, height * .05);
    const header = titleTop + 7 * logoScale + 45;
    fieldTop = header;
    const cellW = width / columns;
    const cellH = (height - header - 47) / rows;
    eggs.forEach((egg, i) => {
      const visible = i < columns * rows;
      egg.group.visible = visible;
      egg.button.hidden = !visible;
      if (!visible) return;
      const col = i % columns, row = Math.floor(i / columns);
      const rawX = cellW * (col + .5 + (random(roamSeed + i + 10) - .5) * 1.1);
      const y = header + cellH * (row + .87 + (random(roamSeed + i + 40) - .5) * .85);
      const eggHeight = Math.min(cellH * .78, cellW * .9, 127) * (.88 + random(i + 80) * .20);
      const margin = eggHeight * .52 + 7;
      const x = Math.max(margin, Math.min(width - margin, rawX));
      egg.scale = eggHeight / 10;
      egg.height = eggHeight;
      egg.margin = margin;
      egg.x = x;
      egg.y = Math.max(header + eggHeight * 1.1, Math.min(height - 22, y));
      egg.speed = (16 + random(roamSeed + i + 46) * 34) * Math.min(1, Math.max(.55, width / 900));
      const angle = random(roamSeed + i * 17) * Math.PI * 2;
      egg.tx = Math.cos(angle);
      egg.ty = Math.sin(angle) * .72;
      egg.vx = egg.tx * egg.speed;
      egg.vy = egg.ty * egg.speed;
      egg.turnAt = elapsed + .4 + random(roamSeed + i + 24) * 2.4;
      egg.group.scale.setScalar(egg.scale);
      const hitWidth = eggHeight * .88;
      Object.assign(egg.button.style, { left: '0px', top: '0px', width: `${hitWidth}px`, height: `${eggHeight * 1.43}px` });
    });
    logo.scale.setScalar(logoScale);
    logoY = height / 2 - titleTop - 7 * logoScale;
    logo.position.set(0, logoY, 40);
    logo.rotation.set(.20, -.07, -.013);
    for (let i = 0; i < grass.count; i++) {
      const x = (random(i + 101) - .5) * width;
      const y = (random(i + 304) - .5) * (height - 100) - 40;
      const size = 1.5 + random(i + 82) * 1.5;
      dummy.position.set(x, y, -180);
      dummy.rotation.set(0, 0, i % 3 ? 0 : Math.PI / 4);
      dummy.scale.set(size, i % 5 ? size * .45 : size, .4);
      dummy.updateMatrix();
      grass.setMatrixAt(i, dummy.matrix);
    }
    grass.instanceMatrix.needsUpdate = true;
    render(0);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let elapsed = 0, last = 0, frame = 0;
  function syncMotion() {
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? '继续跳动' : '暂停跳动');
  }
  function wander(egg, index, delta) {
    if (delta === 0) return;
    if (elapsed >= egg.turnAt) {
      const angle = random(roamSeed + index * 71 + ++egg.turn * 13) * Math.PI * 2;
      egg.tx = Math.cos(angle);
      egg.ty = Math.sin(angle) * .72;
      egg.speed = (16 + random(roamSeed + index * 19 + egg.turn * 37) * 34) * Math.min(1, Math.max(.55, width / 900));
      egg.turnAt = elapsed + .7 + random(index + egg.turn * 31) * 3;
    }
    const blend = 1 - Math.exp(-delta * 1.8);
    egg.vx += (egg.tx * egg.speed - egg.vx) * blend;
    egg.vy += (egg.ty * egg.speed - egg.vy) * blend;
    let pushX = 0, pushY = 0;
    for (const other of eggs) {
      if (other === egg || !other.group.visible) continue;
      const dx = egg.x - other.x;
      const dy = (egg.y - egg.height * .5) - (other.y - other.height * .5);
      const distanceSquared = dx * dx + dy * dy;
      const space = (egg.height + other.height) * .42;
      if (distanceSquared > 0 && distanceSquared < space * space) {
        const distance = Math.sqrt(distanceSquared);
        const force = (1 - distance / space) * 45;
        pushX += dx / distance * force;
        pushY += dy / distance * force;
      }
    }
    egg.x += (egg.vx + pushX) * delta;
    egg.y += (egg.vy + pushY) * delta;
    const top = fieldTop + egg.height * 1.1;
    if (egg.x < egg.margin || egg.x > width - egg.margin) {
      const sign = egg.x < egg.margin ? 1 : -1;
      egg.x = Math.max(egg.margin, Math.min(width - egg.margin, egg.x));
      egg.tx = Math.abs(egg.tx) * sign;
      egg.vx = Math.abs(egg.vx) * sign;
    }
    if (egg.y < top || egg.y > height - 22) {
      const sign = egg.y < top ? 1 : -1;
      egg.y = Math.max(top, Math.min(height - 22, egg.y));
      egg.ty = Math.abs(egg.ty) * sign;
      egg.vy = Math.abs(egg.vy) * sign;
    }
  }
  function render(delta) {
    const step = paused ? 0 : delta;
    elapsed += step;
    eggs.forEach((egg, i) => {
      if (!egg.group.visible) return;
      wander(egg, i, step);
      egg.group.position.set(egg.x - width / 2, height / 2 - egg.y, egg.y / height * 140);
      egg.button.style.transform = `translate3d(${egg.x - egg.height * .44}px, ${egg.y - egg.height * 1.36}px, 0)`;
      egg.button.style.zIndex = String(Math.round(egg.y));
      if (step > 0 && elapsed >= egg.nextJumpAt) {
        egg.jumpAt = elapsed;
        egg.jumpDuration = .36 + Math.random() * .22;
        egg.jumpHeight = .8 + Math.random() * 1.8;
        egg.jumpLean = (Math.random() - .5) * .26;
        egg.nextJumpAt = elapsed + egg.jumpDuration + .03 + Math.random() * (Math.random() < .18 ? 1.1 : .28);
      }
      const phase = Math.min(1, Math.max(0, (elapsed - egg.jumpAt) / egg.jumpDuration));
      const airtime = (phase - .12) / .72;
      const flight = airtime > 0 && airtime < 1 ? 4 * airtime * (1 - airtime) : 0;
      const kickTime = elapsed - egg.kickAt;
      const kick = kickTime >= 0 && kickTime < kickDuration ? Math.sin(kickTime / kickDuration * Math.PI) : 0;
      const lift = Math.max(flight * egg.jumpHeight, kick * 3.2);
      const land = phase >= .84 ? Math.sin((phase - .84) / .16 * Math.PI) : 0;
      const crouch = phase < .12 ? Math.sin(phase / .12 * Math.PI) : 0;
      const squash = 1 + flight * .06 - land * .11 - crouch * .07;
      egg.body.position.y = lift;
      egg.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
      egg.body.rotation.set(.13, .42 + Math.sin(elapsed * .62 + egg.seed) * .09 + egg.vx / egg.speed * .10 + (egg.hovered ? .12 : 0), Math.sin(elapsed * 1.25 + egg.seed) * .034 - egg.vx * .0009 + flight * egg.jumpLean + kick * .07 * (i % 2 ? 1 : -1));
      egg.shadow.scale.set(3.7 - lift * .28, .68 - lift * .045, 1);
      egg.shadow.material.opacity = .14 - lift * .018;
    });
    logo.position.y = logoY + Math.sin(elapsed * .85) * logoScale * .06;
    logoLetters.forEach((character, index) => {
      character.position.y = 3 + Math.sin(elapsed * 1.6 + index * .7) * .22;
      character.rotation.z = Math.sin(elapsed * 1.2 + index * .8) * .035;
    });
    renderer.render(scene, camera);
  }
  function tick(now) {
    const delta = last ? Math.min((now - last) / 1000, .045) : 0;
    last = now;
    render(delta);
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);
    last = 0;
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  motion.addEventListener('click', () => { paused = !paused; syncMotion(); resume(); render(0); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); resume(); render(0); });
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('resize', layout);
  layout();
  syncMotion();
  resume();
  document.documentElement.dataset.ready = 'true';
}

try {
  start();
} catch (error) {
  console.error(error);
  document.documentElement.classList.add('webgl-error');
  document.querySelector('#loading').textContent = '这个浏览器暂时无法显示 3D。请使用支持 WebGL 的 Chrome 或 Edge。';
}
