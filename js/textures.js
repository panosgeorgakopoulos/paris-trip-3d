// Procedural PBR textures (Haussmann limestone, zinc roofs, monument facades & HD roads)
import { ctx } from './state.js';

export function createCircleTexture(innerColor, outerColor) {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  g.addColorStop(0, innerColor);
  g.addColorStop(0.42, outerColor);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// Authentic Parisian Haussmannian Limestone Facade (Diffuse + Emissive Window Glow)
export function createHaussmannTextures() {
  const w = 512, h = 512;
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = w; diffCanvas.height = h;
  const dctx = diffCanvas.getContext('2d');

  const emCanvas = document.createElement('canvas');
  emCanvas.width = w; emCanvas.height = h;
  const ectx = emCanvas.getContext('2d');
  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  // Warm Lutetian Cream Limestone base
  const grad = dctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ebe2ce');
  grad.addColorStop(0.65, '#dfd3bc');
  grad.addColorStop(1, '#cfc0a5');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, w, h);

  // Subtle ashlar stone horizontal courses
  dctx.strokeStyle = 'rgba(120, 105, 82, 0.14)';
  dctx.lineWidth = 1.5;
  for (let y = 0; y < h; y += 24) {
    dctx.beginPath();
    dctx.moveTo(0, y);
    dctx.lineTo(w, y);
    dctx.stroke();
  }

  // 5 Residential Haussmann floors + Ground-floor boutique arcade
  const cols = 6;
  const colW = w / cols;
  const floors = [
    { y: 24, fh: 68, balcony: true }, // 5th floor continuous wrought-iron balcony
    { y: 108, fh: 72, balcony: false }, // 4th floor
    { y: 194, fh: 74, balcony: false }, // 3rd floor
    { y: 282, fh: 78, balcony: true }, // 2nd floor piano nobile balcony!
    { y: 374, fh: 52, balcony: false }, // Entresol / mezzanine
  ];

  // Deterministic cozy lit windows
  let s = 4242;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  floors.forEach((fl) => {
    // Carved limestone cornice ledge beneath floor
    dctx.fillStyle = '#c8baa0';
    dctx.fillRect(0, fl.y + fl.fh + 2, w, 5);
    dctx.fillStyle = '#f5eedf';
    dctx.fillRect(0, fl.y + fl.fh, w, 2);

    for (let c = 0; c < cols; c++) {
      const wx = c * colW + 15;
      const ww = colW - 30;
      const wy = fl.y;
      const wh = fl.fh - 6;

      // Stone window surround molding
      dctx.fillStyle = '#efe7d6';
      dctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 6);
      // Dark French shutters flanking window
      dctx.fillStyle = '#5c6672';
      dctx.fillRect(wx - 7, wy, 5, wh);
      dctx.fillRect(wx + ww + 2, wy, 5, wh);

      const isLit = rnd() > 0.44;
      // Glass pane
      if (isLit) {
        const wg = dctx.createLinearGradient(wx, wy, wx, wy + wh);
        wg.addColorStop(0, '#ffe2a3');
        wg.addColorStop(1, '#e8a855');
        dctx.fillStyle = wg;
        dctx.fillRect(wx, wy, ww, wh);

        // Emissive warm window glow
        const eg = ectx.createLinearGradient(wx, wy, wx, wy + wh);
        eg.addColorStop(0, rnd() > 0.5 ? '#ffd485' : '#ffbe66');
        eg.addColorStop(1, '#c97c2c');
        ectx.fillStyle = eg;
        ectx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
      } else {
        dctx.fillStyle = '#253145';
        dctx.fillRect(wx, wy, ww, wh);
      }

      // Classic French mullion crossbars
      dctx.fillStyle = '#d8ccb6';
      dctx.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      dctx.fillRect(wx, wy + wh * 0.38, ww, 2.5);
      dctx.fillRect(wx, wy + wh * 0.7, ww, 2);
      ectx.fillStyle = '#000000';
      ectx.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      ectx.fillRect(wx, wy + wh * 0.38, ww, 2.5);

      // Individual wrought-iron Juliette railing
      dctx.fillStyle = '#1f2630';
      dctx.fillRect(wx - 3, wy + wh - 15, ww + 6, 3);
      for (let bx = wx; bx < wx + ww; bx += 7) {
        dctx.fillRect(bx, wy + wh - 15, 2, 15);
      }
    }

    // Continuous wrought-iron Haussmann balcony on 2nd & 5th floor
    if (fl.balcony) {
      const by = fl.y + fl.fh - 16;
      dctx.fillStyle = '#1a202b';
      dctx.fillRect(0, by, w, 3.5);
      dctx.fillRect(0, by + 13, w, 3);
      for (let bx = 0; bx < w; bx += 9) {
        dctx.fillRect(bx, by, 2, 16);
      }
    }
  });

  // Ground floor Parisian limestone arcade & warm café / boutique vitrines
  dctx.fillStyle = '#bfa98a';
  dctx.fillRect(0, 434, w, 78);
  for (let c = 0; c < 3; c++) {
    const sx = c * (w / 3) + 14;
    const sw = (w / 3) - 28;
    // Boutique awning (deep Parisian navy, burgundy, or forest green)
    const awningColors = ['#1f3654', '#6b2535', '#1d4538'];
    dctx.fillStyle = awningColors[c % 3];
    dctx.fillRect(sx - 4, 440, sw + 8, 13);
    // Warm storefront glass
    dctx.fillStyle = '#ffd58c';
    dctx.fillRect(sx, 453, sw, 52);
    ectx.fillStyle = '#ffb85c';
    ectx.fillRect(sx + 2, 455, sw - 4, 48);
    // Door frame
    dctx.fillStyle = '#2d241c';
    dctx.fillRect(sx + sw * 0.5 - 2, 453, 4, 52);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.ClampToEdgeWrapping;
  diffuseTex.encoding = THREE.sRGBEncoding;

  const emissiveTex = new THREE.CanvasTexture(emCanvas);
  emissiveTex.wrapS = THREE.RepeatWrapping;
  emissiveTex.wrapT = THREE.ClampToEdgeWrapping;
  emissiveTex.encoding = THREE.sRGBEncoding;

  return { diffuseTex, emissiveTex };
}

// Classic Parisian Standing-Seam Blue-Grey Zinc Mansard Roof Texture with Lucarnes (Dormers)
export function createZincRoofTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#5a6b80');
  g.addColorStop(0.5, '#47576b');
  g.addColorStop(1, '#394657');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 128);

  // Standing zinc seam ribs
  for (let x = 0; x < 256; x += 12) {
    ctx.fillStyle = 'rgba(220, 235, 255, 0.14)';
    ctx.fillRect(x, 0, 2, 128);
    ctx.fillStyle = 'rgba(10, 16, 26, 0.25)';
    ctx.fillRect(x + 2, 0, 1.5, 128);
  }

  // Attic dormer windows (lucarnes) along roof slope
  for (let dx = 22; dx < 240; dx += 52) {
    ctx.fillStyle = '#323c4a';
    ctx.fillRect(dx - 2, 42, 24, 46);
    ctx.fillStyle = '#d9ccb6';
    ctx.fillRect(dx, 46, 20, 38);
    ctx.fillStyle = dx % 104 === 22 ? '#ffd280' : '#243042';
    ctx.fillRect(dx + 3, 50, 14, 30);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

// Subtle Seine Water Ripple Texture
export function createWaterTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#153152';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 12 + Math.random() * 28;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(130, 195, 255, 0.12)' : 'rgba(255, 222, 155, 0.08)';
    ctx.fillRect(x, y, w, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 3);
  return tex;
}

// High-Detail Procedural Textures for Realistic Parisian Museums, Palaces & Churches
export function createMonumentTextures() {
  // 1. Classical French Palace / Museum Facade (Arched Arcades + Classical Pilasters + Glowing Windows)
  const pc = document.createElement('canvas');
  pc.width = 512; pc.height = 256;
  const pctx = pc.getContext('2d');
  const pe = document.createElement('canvas');
  pe.width = 512; pe.height = 256;
  const pectx = pe.getContext('2d');
  pectx.fillStyle = '#000000';
  pectx.fillRect(0, 0, 512, 256);

  const pGrad = pctx.createLinearGradient(0, 0, 0, 256);
  pGrad.addColorStop(0, '#efe6d4');
  pGrad.addColorStop(0.55, '#e5d9c1');
  pGrad.addColorStop(1, '#d3c4a8');
  pctx.fillStyle = pGrad;
  pctx.fillRect(0, 0, 512, 256);

  // Horizontal sculpted stone entablatures & stringcourses
  [14, 102, 114, 174].forEach((cy, idx) => {
    pctx.fillStyle = idx % 2 === 0 ? '#cbbca0' : '#f7f0e2';
    pctx.fillRect(0, cy, 512, 6);
  });
  // 8 Classical Bays: Ground-floor rusticated arches + upper pedimented gallery windows
  for (let i = 0; i < 8; i++) {
    const bx = i * 64;
    // Pilaster columns between bays
    pctx.fillStyle = '#f5eedf';
    pctx.fillRect(bx + 2, 20, 8, 226);
    pctx.fillStyle = '#c4b599';
    pctx.fillRect(bx + 10, 20, 3, 226);

    // Upper story classical window + triangular pediment
    pctx.fillStyle = '#f8f2e6';
    pctx.beginPath();
    pctx.moveTo(bx + 16, 34);
    pctx.lineTo(bx + 34, 22);
    pctx.lineTo(bx + 52, 34);
    pctx.closePath();
    pctx.fill();
    pctx.fillStyle = '#ffe0a0';
    pctx.fillRect(bx + 20, 36, 28, 56);
    pectx.fillStyle = i % 3 === 0 ? '#ffcf78' : '#b8823c';
    pectx.fillRect(bx + 22, 38, 24, 52);
    pctx.fillStyle = '#d4c6ac';
    pctx.fillRect(bx + 33, 36, 2, 56);
    pctx.fillRect(bx + 20, 60, 28, 2);

    // Ground floor grand semicircular stone arcade
    pctx.fillStyle = '#2a3347';
    pctx.beginPath();
    pctx.arc(bx + 34, 152, 16, Math.PI, 0);
    pctx.lineTo(bx + 50, 248);
    pctx.lineTo(bx + 18, 248);
    pctx.closePath();
    pctx.fill();

    pctx.fillStyle = '#ffd68c';
    pctx.beginPath();
    pctx.arc(bx + 34, 156, 12, Math.PI, 0);
    pctx.lineTo(bx + 46, 242);
    pctx.lineTo(bx + 22, 242);
    pctx.closePath();
    pctx.fill();

    pectx.fillStyle = '#e69f45';
    pectx.fillRect(bx + 24, 156, 20, 82);
  }
  const palaceDiff = new THREE.CanvasTexture(pc);
  palaceDiff.wrapS = THREE.RepeatWrapping; palaceDiff.encoding = THREE.sRGBEncoding;
  const palaceEm = new THREE.CanvasTexture(pe);
  palaceEm.wrapS = THREE.RepeatWrapping; palaceEm.encoding = THREE.sRGBEncoding;

  // 2. Gothic Cathedral Lancet & Tracery Texture (Notre-Dame, St-Séverin, St-Étienne)
  const gc = document.createElement('canvas');
  gc.width = 256; gc.height = 256;
  const gctx = gc.getContext('2d');
  const ge = document.createElement('canvas');
  ge.width = 256; ge.height = 256;
  const gectx = ge.getContext('2d');
  gctx.fillStyle = '#ded3be';
  gctx.fillRect(0, 0, 256, 256);
  gectx.fillStyle = '#000000';
  gectx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) {
    const x = i * 64 + 14;
    // Stone buttress rib
    gctx.fillStyle = '#c4b79e';
    gctx.fillRect(i * 64, 0, 8, 256);
    // Pointed Gothic stained-glass lancet
    gctx.fillStyle = '#334d94';
    gctx.beginPath();
    gctx.moveTo(x, 195);
    gctx.lineTo(x, 76);
    gctx.quadraticCurveTo(x + 18, 28, x + 36, 76);
    gctx.lineTo(x + 36, 195);
    gctx.closePath();
    gctx.fill();

    // Luminous stained glass jewel tones
    const sg = gectx.createLinearGradient(0, 40, 0, 195);
    sg.addColorStop(0, '#ff8aa8');
    sg.addColorStop(0.45, '#7c6eff');
    sg.addColorStop(1, '#ffd478');
    gectx.fillStyle = sg;
    gectx.beginPath();
    gectx.moveTo(x + 3, 192);
    gectx.lineTo(x + 3, 78);
    gectx.quadraticCurveTo(x + 18, 36, x + 33, 78);
    gectx.lineTo(x + 33, 192);
    gectx.closePath();
    gectx.fill();

    // Dark stone gothic mullion tracery
    gctx.fillStyle = '#2a2a33';
    gctx.fillRect(x + 17, 56, 2.5, 138);
    gectx.fillStyle = '#000000';
    gectx.fillRect(x + 17, 56, 2.5, 138);
  }
  const gothicDiff = new THREE.CanvasTexture(gc);
  gothicDiff.wrapS = THREE.RepeatWrapping; gothicDiff.encoding = THREE.sRGBEncoding;
  const gothicEm = new THREE.CanvasTexture(ge);
  gothicEm.wrapS = THREE.RepeatWrapping; gothicEm.encoding = THREE.sRGBEncoding;

  // 3. Notre-Dame Radial Stained-Glass Rose Window Texture
  const rc = document.createElement('canvas');
  rc.width = 256; rc.height = 256;
  const rctx = rc.getContext('2d');
  rctx.fillStyle = '#24232c';
  rctx.fillRect(0, 0, 256, 256);
  const cx = 128, cy = 128;
  const rg = rctx.createRadialGradient(cx, cy, 8, cx, cy, 118);
  rg.addColorStop(0, '#fff2b0');
  rg.addColorStop(0.28, '#e6426d');
  rg.addColorStop(0.62, '#4b68f0');
  rg.addColorStop(0.88, '#9e3bf0');
  rg.addColorStop(1, '#262330');
  rctx.fillStyle = rg;
  rctx.beginPath();
  rctx.arc(cx, cy, 118, 0, Math.PI * 2);
  rctx.fill();
  // 12 radial stone tracery spokes & concentric rings
  rctx.strokeStyle = '#1b1c24';
  rctx.lineWidth = 6;
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    rctx.beginPath();
    rctx.moveTo(cx, cy);
    rctx.lineTo(cx + Math.cos(ang) * 118, cy + Math.sin(ang) * 118);
    rctx.stroke();
  }
  [36, 76, 114].forEach((rad) => {
    rctx.beginPath();
    rctx.arc(cx, cy, rad, 0, Math.PI * 2);
    rctx.stroke();
  });
  const roseTex = new THREE.CanvasTexture(rc);
  roseTex.encoding = THREE.sRGBEncoding;

  // 4. Sainte-Chapelle Towering Stained-Glass Wall Texture
  const scc = document.createElement('canvas');
  scc.width = 256; scc.height = 256;
  const scctx = scc.getContext('2d');
  scctx.fillStyle = '#c8bda8';
  scctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6; i++) {
    const sx = i * 42 + 6;
    const sg = scctx.createLinearGradient(0, 12, 0, 240);
    sg.addColorStop(0, '#ff6e9c');
    sg.addColorStop(0.32, '#7d52ff');
    sg.addColorStop(0.68, '#2d7dff');
    sg.addColorStop(1, '#ffcf6b');
    scctx.fillStyle = sg;
    scctx.fillRect(sx, 14, 30, 228);
    scctx.fillStyle = '#252130';
    scctx.fillRect(sx + 14, 14, 2.5, 228);
    for (let hy = 46; hy < 230; hy += 36) scctx.fillRect(sx, hy, 30, 2.5);
  }
  const scTex = new THREE.CanvasTexture(scc);
  scTex.wrapS = THREE.RepeatWrapping; scTex.encoding = THREE.sRGBEncoding;

  // 5. Musée d'Orsay Giant Golden Station Clock Dial Texture
  const oc = document.createElement('canvas');
  oc.width = 256; oc.height = 256;
  const octx = oc.getContext('2d');
  octx.fillStyle = '#5e492b';
  octx.beginPath(); octx.arc(128, 128, 126, 0, Math.PI * 2); octx.fill();
  const og = octx.createRadialGradient(128, 128, 14, 128, 128, 112);
  og.addColorStop(0, '#fff7dc');
  og.addColorStop(0.75, '#f6cf78');
  og.addColorStop(1, '#c99034');
  octx.fillStyle = og;
  octx.beginPath(); octx.arc(128, 128, 112, 0, Math.PI * 2); octx.fill();
  // Radial Roman numeral tick marks
  octx.strokeStyle = '#231c14';
  octx.lineWidth = 7;
  for (let h = 0; h < 12; h++) {
    const ang = (h / 12) * Math.PI * 2;
    octx.beginPath();
    octx.moveTo(128 + Math.cos(ang) * 76, 128 + Math.sin(ang) * 76);
    octx.lineTo(128 + Math.cos(ang) * 102, 128 + Math.sin(ang) * 102);
    octx.stroke();
  }
  // Ornate Clock Hands (~12:15!)
  octx.lineWidth = 9;
  octx.beginPath(); octx.moveTo(128, 128); octx.lineTo(128, 56); octx.stroke();
  octx.lineWidth = 6;
  octx.beginPath(); octx.moveTo(128, 128); octx.lineTo(192, 128); octx.stroke();
  octx.fillStyle = '#231c14';
  octx.beginPath(); octx.arc(128, 128, 11, 0, Math.PI * 2); octx.fill();
  const orsayClockTex = new THREE.CanvasTexture(oc);
  orsayClockTex.encoding = THREE.sRGBEncoding;

  // 6. Place des Vosges Louis XIII Red-Brick & White-Limestone Arcade Texture
  const vc = document.createElement('canvas');
  vc.width = 256; vc.height = 128;
  const vctx = vc.getContext('2d');
  vctx.fillStyle = '#a84e43';
  vctx.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 4; i++) {
    const vx = i * 64;
    // White limestone vertical quoin bands
    vctx.fillStyle = '#eae1ce';
    vctx.fillRect(vx, 0, 9, 128);
    vctx.fillRect(vx + 55, 0, 9, 128);
    // Upper tall multi-pane window
    vctx.fillStyle = '#ffd78c';
    vctx.fillRect(vx + 18, 14, 28, 42);
    vctx.strokeStyle = '#efe7d6';
    vctx.lineWidth = 3;
    vctx.strokeRect(vx + 18, 14, 28, 42);
    // Ground floor arched white limestone loggia arcade
    vctx.fillStyle = '#e6dcc8';
    vctx.fillRect(vx, 68, 64, 60);
    vctx.fillStyle = '#2a2f3d';
    vctx.beginPath();
    vctx.arc(vx + 32, 92, 19, Math.PI, 0);
    vctx.lineTo(vx + 51, 128);
    vctx.lineTo(vx + 13, 128);
    vctx.closePath();
    vctx.fill();
  }
  const vosgesTex = new THREE.CanvasTexture(vc);
  vosgesTex.wrapS = THREE.RepeatWrapping; vosgesTex.encoding = THREE.sRGBEncoding;

  // 7. Palais-Royal Buren Columns Black-and-White Vertical Stripes Texture
  const bc = document.createElement('canvas');
  bc.width = 128; bc.height = 64;
  const bctx = bc.getContext('2d');
  for (let i = 0; i < 8; i++) {
    bctx.fillStyle = i % 2 === 0 ? '#f8f6f0' : '#151821';
    bctx.fillRect(i * 16, 0, 16, 64);
  }
  const burenTex = new THREE.CanvasTexture(bc);
  burenTex.wrapS = THREE.RepeatWrapping; burenTex.encoding = THREE.sRGBEncoding;

  // 8. Moulin Rouge Glowing Neon Marquee Sign Texture
  const mc = document.createElement('canvas');
  mc.width = 256; mc.height = 64;
  const mctx = mc.getContext('2d');
  mctx.fillStyle = '#400612';
  mctx.fillRect(0, 0, 256, 64);
  mctx.strokeStyle = '#ff4265';
  mctx.lineWidth = 4;
  mctx.strokeRect(4, 4, 248, 56);
  mctx.fillStyle = '#ff6b86';
  mctx.font = 'bold 26px Georgia, serif';
  mctx.textAlign = 'center';
  mctx.textBaseline = 'middle';
  mctx.fillText('MOULIN ROUGE', 128, 34);
  const moulinSignTex = new THREE.CanvasTexture(mc);
  moulinSignTex.encoding = THREE.sRGBEncoding;

  return {
    palaceDiff, palaceEm, gothicDiff, gothicEm,
    roseTex, scTex, orsayClockTex, vosgesTex, burenTex, moulinSignTex,
  };
}


export function createParisRoadTextures() {
  const maxAniso = Math.min(16, ctx.renderer.capabilities.getMaxAnisotropy());
  // 1. HD Parisian Grand Boulevard Texture (512x1024, Full Anisotropy — razor-sharp at oblique angles!)
  function makeAsphaltTex(isBoulevard) {
    const w = 512, h = 1024;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    // Pale Lutetian limestone flagstone sidewalks (trottoirs) with individual slab bevels
    ctx.fillStyle = '#c8bfb0';
    ctx.fillRect(0, 0, w, h);
    const curbX = isBoulevard ? 60 : 76;
    for (let y = 0; y < h; y += 48) {
      ctx.fillStyle = (y / 48) % 2 === 0 ? 'rgba(255,252,244,0.12)' : 'rgba(60,55,48,0.06)';
      ctx.fillRect(0, y, curbX - 10, 46);
      ctx.fillRect(w - curbX + 10, y, curbX - 10, 46);
      ctx.fillStyle = 'rgba(65,60,52,0.34)';
      ctx.fillRect(0, y, w, 2);
    }

    // Raised beveled granite Parisian curb blocks
    ctx.fillStyle = '#dfd7c6';
    ctx.fillRect(curbX - 12, 0, 14, h);
    ctx.fillRect(w - curbX - 2, 0, 14, h);
    ctx.fillStyle = 'rgba(50,48,44,0.38)';
    for (let y = 0; y < h; y += 64) {
      ctx.fillRect(curbX - 12, y, 14, 2);
      ctx.fillRect(w - curbX - 2, y, 14, 2);
    }

    // Dark mineral-textured Parisian roadway asphalt
    const roadW = w - curbX * 2;
    ctx.fillStyle = '#2c323e';
    ctx.fillRect(curbX, 0, roadW, h);

    // Subtle realistic dual wheel-track wear sheen along lanes
    ctx.fillStyle = 'rgba(18, 22, 30, 0.24)';
    if (isBoulevard) {
      [0.2, 0.36, 0.64, 0.8].forEach((f) => ctx.fillRect(curbX + roadW * f - 10, 0, 20, h));
    } else {
      [0.28, 0.72].forEach((f) => ctx.fillRect(curbX + roadW * f - 14, 0, 28, h));
    }

    // Crisp high-frequency asphalt aggregate mineral grain
    let rs = isBoulevard ? 1337 : 7331;
    const rr = () => { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
    for (let i = 0; i < 4200; i++) {
      const nx = curbX + rr() * roadW;
      const ny = rr() * h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,252,244,0.065)' : 'rgba(6,8,14,0.11)';
      ctx.fillRect(nx, ny, 2.2, 2.2);
    }
    // Crisp curb-drop gutter shadow
    ctx.fillStyle = 'rgba(8, 12, 18, 0.48)';
    ctx.fillRect(curbX, 0, 9, h);
    ctx.fillRect(w - curbX - 9, 0, 9, h);

    // Razor-sharp French white dashed lane dividers
    ctx.fillStyle = 'rgba(246, 243, 235, 0.82)';
    if (isBoulevard) {
      for (let y = 148; y < h - 44; y += 92) {
        ctx.fillRect(w / 2 - 7, y, 4.5, 48);
        ctx.fillRect(w / 2 + 2.5, y, 4.5, 48);
        ctx.fillRect(curbX + roadW * 0.25 - 1.5, y, 3.5, 36);
        ctx.fillRect(curbX + roadW * 0.75 - 1.5, y, 3.5, 36);
      }
    } else {
      for (let y = 128; y < h - 38; y += 88) {
        ctx.fillRect(w / 2 - 2.5, y, 5, 44);
      }
    }

    // Classic French white zebra pedestrian crosswalk (Passage Piétons)
    ctx.fillStyle = 'rgba(248, 245, 238, 0.86)';
    const stripes = isBoulevard ? 7 : 5;
    const step = roadW / (stripes + 0.6);
    for (let s = 0; s < stripes; s++) {
      const sx = curbX + step * (s + 0.35);
      ctx.fillRect(sx, 26, step * 0.52, 68);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = maxAniso;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // 2. HD Historic Pavés Parisiens (512x512 Beveled Granite Cobblestones + Limestone Trottoirs)
  const cc = document.createElement('canvas');
  cc.width = 512; cc.height = 512;
  const cctx = cc.getContext('2d');
  cctx.fillStyle = '#c4bbb0';
  cctx.fillRect(0, 0, 512, 512);
  cctx.fillStyle = '#2c313c';
  cctx.fillRect(56, 0, 400, 512);
  const shades = ['#6b707e', '#5d6371', '#777b88', '#545a68', '#6e6d6c', '#636875'];
  for (let row = 0; row < 32; row++) {
    const offset = (row % 2) * 11;
    for (let col = 0; col < 19; col++) {
      const bx = 58 + col * 22 + offset;
      if (bx > 432) continue;
      const by = row * 16 + 1;
      cctx.fillStyle = shades[(row * 7 + col * 3) % shades.length];
      cctx.fillRect(bx, by, 19, 13);
      // Individual granite sett top highlight & bottom bevel shadow
      cctx.fillStyle = 'rgba(255,252,244,0.16)';
      cctx.fillRect(bx, by, 19, 2);
      cctx.fillStyle = 'rgba(12,15,22,0.28)';
      cctx.fillRect(bx, by + 11, 19, 2);
    }
  }
  // Granite curb borders
  cctx.fillStyle = '#dbd2c1';
  cctx.fillRect(48, 0, 10, 512);
  cctx.fillRect(454, 0, 10, 512);
  const cobbleTex = new THREE.CanvasTexture(cc);
  cobbleTex.wrapS = THREE.ClampToEdgeWrapping;
  cobbleTex.wrapT = THREE.RepeatWrapping;
  cobbleTex.anisotropy = maxAniso;
  cobbleTex.encoding = THREE.sRGBEncoding;

  return {
    boulevardTex: makeAsphaltTex(true),
    streetTex: makeAsphaltTex(false),
    cobbleTex,
  };
}

