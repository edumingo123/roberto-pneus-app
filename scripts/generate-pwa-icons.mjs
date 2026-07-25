import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(dir, { recursive: true });

function svg(size, fontSize) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#0A2540"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${fontSize}" fill="#F97316">RP</text>
</svg>`);
}

async function main() {
  await sharp(svg(192, 62)).png().toFile(path.join(dir, "icon-192.png"));
  await sharp(svg(512, 164)).png().toFile(path.join(dir, "icon-512.png"));
  await sharp(svg(180, 58)).png().toFile(path.join(dir, "apple-touch-icon.png"));
  await sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0A2540"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="140" fill="#F97316">RP</text>
</svg>`)
  )
    .png()
    .toFile(path.join(dir, "icon-512-maskable.png"));
  console.log("PWA icons generated:", fs.readdirSync(dir).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
