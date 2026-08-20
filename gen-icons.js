/* Generates the app icons as PNGs with no dependencies. */
const zlib = require('zlib'), fs = require('fs'), path = require('path');

function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
let T = null;
function crc32(buf) {
  if (!T) { T = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c; } }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = T[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return c ^ -1;
}

const SS = 3; // supersample for smooth edges
function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const R = size * 0.315, TH = size * 0.088;          // ring radius + thickness
  const START = -Math.PI / 2, SWEEP = Math.PI * 1.52;  // open arc = "progress"
  const barW = size * 0.075, barGap = size * 0.052;    // three macro bars in the middle

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px_ = x + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
      const dx = px_ - cx, dy = py - cy;
      const dist = Math.hypot(dx, dy);

      // background: soft radial lift toward the centre
      const t = Math.min(1, dist / (size * 0.72));
      let cr = 20 + (1 - t) * 8, cg = 26 + (1 - t) * 14, cb = 22 + (1 - t) * 9;

      // ring
      if (Math.abs(dist - R) < TH / 2) {
        let a = Math.atan2(dy, dx) - START;
        while (a < 0) a += Math.PI * 2;
        if (a <= SWEEP) { cr = 61; cg = 220; cb = 132; }
        else { cr = 38; cg = 42; cb = 51; }
      }

      // three bars, tallest to shortest, sitting inside the ring
      const hs = [size * 0.115, size * 0.082, size * 0.052];
      for (let i = 0; i < 3; i++) {
        const bx = cx + (i - 1) * (barW + barGap);
        const top = cy + size * 0.085 - hs[i], bot = cy + size * 0.085;
        const rr = barW / 2;
        const ix = Math.abs(px_ - bx) <= barW / 2;
        const iy = py >= top && py <= bot;
        let inside = ix && iy;
        if (ix && py < top && py > top - rr) inside = Math.hypot(px_ - bx, py - top) <= rr;
        if (inside) {
          const cols = [[61, 220, 132], [79, 195, 247], [255, 183, 77]];
          [cr, cg, cb] = cols[i];
        }
      }
      r += cr; g += cg; b += cb;
    }
    const n = SS * SS, o = (y * size + x) * 4;
    px[o] = r / n; px[o + 1] = g / n; px[o + 2] = b / n; px[o + 3] = 255;
  }
  return png(size, size, px);
}

const dir = path.join(__dirname, 'icons');
fs.mkdirSync(dir, { recursive: true });
for (const s of [120, 152, 167, 180, 192, 256, 512, 1024]) {
  fs.writeFileSync(path.join(dir, `icon-${s}.png`), draw(s));
  process.stdout.write(`icon-${s}.png `);
}
console.log('\ndone');
