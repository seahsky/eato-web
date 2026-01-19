/**
 * Icon Generation Script
 * Converts the master SVG icon to all required PNG sizes for PWA manifest
 *
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../public/icons");

// Required icon sizes for PWA manifest
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log("Generating PWA icons from SVG...\n");

  // Read the master SVG
  const svgPath = join(iconsDir, "icon-512x512.svg");
  const svgBuffer = readFileSync(svgPath);

  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        quality: 100,
        compressionLevel: 9,
      })
      .toFile(outputPath);

    console.log(`  ✓ Generated icon-${size}x${size}.png`);
  }

  console.log("\n✅ All icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
