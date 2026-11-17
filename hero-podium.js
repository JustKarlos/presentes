import * as THREE from 'three';

/* Podio 3D (cubos) estilo /1, alimentado con datos reales.
   Expone window.HeroPodium = { setTop(users, metric), resize() } */
(() => {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('scene-canvas');
  const overlayRoot = document.getElementById('overlay-root');
  const heroTop = document.getElementById('hero-top');
  if (!hero || !canvas || !overlayRoot) return;

  const isMobile = () => window.innerWidth < 768;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(hero.clientWidth, hero.clientHeight, false);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(isMobile() ? 55 : 45, hero.clientWidth / hero.clientHeight, 0.1, 100);
  camera.position.set(0, 1.1, isMobile() ? 7.5 : 6);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.2);
  sun.position.set(4, 6, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.1;
  ground.receiveShadow = true;
  scene.add(ground);

  const cubeSize = 0.82;
  const crateGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const dropHeight = 4.2;

  const textureLoader = new THREE.TextureLoader();
  const crateTexture = textureLoader.load('assets/caja.png');
  crateTexture.colorSpace = THREE.SRGBColorSpace;

  function makeCrate(rank) {
    const mat = new THREE.MeshStandardMaterial({ map: crateTexture, color: 0xffffff, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(crateGeo, mat);
    mesh.castShadow = true;
    mesh.visible = false;
    scene.add(mesh);

    const decor = null;

    const final = {
      1: { pos: new THREE.Vector3(0, 0.0, 0), rot: new THREE.Euler(0, 0, 0) },
      2: { pos: new THREE.Vector3(-1.55, -0.45, 0), rot: new THREE.Euler(0, -0.12, 0) },
      3: { pos: new THREE.Vector3(1.55, -0.7, 0), rot: new THREE.Euler(0, 0.12, 0) },
    }[rank];

    const hidden = {
      pos: final.pos.clone().add(new THREE.Vector3(0, dropHeight, 0)),
      rot: new THREE.Euler(0.12, final.rot.y - 0.18, 0.06),
    };

    return { rank, mesh, decor, hidden, final, active: false };
  }

  const crates = [1, 2, 3].map(makeCrate);

  function makeOverlay(rank) {
    const el = document.createElement('div');
    el.className = 'hero3d-overlay';
    el.dataset.rank = String(rank);
    el.style.opacity = '0';
    overlayRoot.appendChild(el);
    return { rank, el, user: null };
  }

  const overlays = [1, 2, 3].map(makeOverlay);

  function poseLerp(a, b, t) {
    const pos = a.pos.clone().lerp(b.pos, t);
    const rot = new THREE.Euler(
      a.rot.x + (b.rot.x - a.rot.x) * t,
      a.rot.y + (b.rot.y - a.rot.y) * t,
      a.rot.z + (b.rot.z - a.rot.z) * t
    );
    return { pos, rot };
  }

  const tmpVec = new THREE.Vector3();
  function worldToScreen(pos) {
    tmpVec.copy(pos).project(camera);
    const x = (tmpVec.x * 0.5 + 0.5) * hero.clientWidth;
    const y = (-tmpVec.y * 0.5 + 0.5) * hero.clientHeight;
    return { x, y };
  }

  function scrollProgress() {
    const rect = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    if (total <= 0) return 1;
    const scrolled = -rect.top;
    return clamp01(scrolled / total);
  }

  function stageT(p, start, end) {
    return clamp01((p - start) / (end - start));
  }

  function getStageProgress(p) {
    // Ventanas más amplias = caída más suave al hacer scroll
    return {
      3: easeInOutSine(stageT(p, 0.06, 0.46)),
      2: easeInOutSine(stageT(p, 0.30, 0.74)),
      1: easeInOutSine(stageT(p, 0.54, 1.0)),
    };
  }

  function renderOverlayContent(o) {
    const u = o.user;
    if (!u) { o.el.innerHTML = ''; return; }
    const esc = window.esc || ((s) => String(s ?? ''));
    const name = (window.nameHtml ? window.nameHtml(u) : esc(u.display_name || u.username || ''));
    const av = (window.avatarF ? window.avatarF(u, 72) : (window.avatar ? window.avatar(u, 72) : ''));
    const val = u._fmtValue ? `<div class="hero3d-val">${esc(u._fmtValue)}</div>` : '';
    const href = `/@${encodeURIComponent(u.username || '')}`;
    o.el.innerHTML = `<a class="hero3d-card" href="${href}">${av}<div class="hero3d-name">${name}</div>${val}</a>`;
  }

  function updateOverlays(tByRank) {
    for (const o of overlays) {
      const c = crates.find((x) => x.rank === o.rank);
      const tRank = tByRank[o.rank];
      if (!c.active || tRank <= 0) {
        o.el.style.opacity = '0';
        continue;
      }
      const above = c.mesh.position.clone().add(new THREE.Vector3(0, 0.78, 0));
      const pos = worldToScreen(above);
      o.el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -100%)`;
      const opacity = clamp01(tRank / 0.18);
      o.el.style.opacity = String(opacity);
    }
  }

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = isMobile() ? 55 : 45;
    camera.position.z = isMobile() ? 7.5 : 6;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let currentUsers = [];
  function setTop(users, metric) {
    currentUsers = Array.isArray(users) ? users.slice(0, 3) : [];
    window.__heroTop3 = { users: currentUsers, metric };
    for (let i = 0; i < 3; i++) {
      const rank = i + 1;
      const u = currentUsers[i] || null;
      const crate = crates.find(c => c.rank === rank);
      const ov = overlays.find(o => o.rank === rank);
      crate.active = !!u;
      ov.user = u;
      renderOverlayContent(ov);
    }
  }

  function tick() {
    const p = scrollProgress();

    const introT = clamp01(p / 0.10);
    if (heroTop) {
      heroTop.style.opacity = String(1 - introT);
      heroTop.style.transform = `translateX(-50%) translateY(${-introT * 20}px)`;
      heroTop.style.pointerEvents = introT > 0.95 ? 'none' : '';
    }

    const tByRank = getStageProgress(p);

    for (const c of crates) {
      const tRank = c.active ? tByRank[c.rank] : 0;
      const visible = c.active && tRank > 0;
      c.mesh.visible = visible;
      if (visible) {
        const pose = poseLerp(c.hidden, c.final, tRank);
        c.mesh.position.copy(pose.pos);
        c.mesh.rotation.copy(pose.rot);
      }
      if (c.decor) {
        c.decor.visible = visible;
        if (visible) {
          c.decor.position.copy(c.mesh.position).add(new THREE.Vector3(0, 0.75, 0));
          c.decor.rotation.y += 0.012;
        }
      }
    }

    updateOverlays(tByRank);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // iniciar (aunque aún no haya datos, la escena corre; se mostrará al llegar top3)
  resize();
  tick();

  window.HeroPodium = { setTop, resize, _crates: crates };
  if (window.__pendingHeroTop3) {
    try { setTop(window.__pendingHeroTop3.users, window.__pendingHeroTop3.metric); } catch {}
  }
})();
