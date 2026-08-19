"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const logoPath = path.join(__dirname, "../public/images/logo/logo-crm.png");
const iconPath = path.join(__dirname, "../app/icon.png");
const sourcePath = path.join(
  __dirname,
  "../../back-saas-crm/assets/c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_5afea91b31629f2c021f3cd9289ffd0c_images_LOGOCRM-2f87c3e2-0766-4f45-a7c2-550782f6372f.png",
);

function isRemovableBlack(r, g, b, threshold = 42) {
  return r <= threshold && g <= threshold && b <= threshold;
}

async function makeTransparent(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isRemovableBlack(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  const tmp = `${outputPath}.tmp`;
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .trim({ threshold: 1 })
    .toFile(tmp);

  fs.renameSync(tmp, outputPath);
}

async function main() {
  const input = fs.existsSync(sourcePath) ? sourcePath : logoPath;
  await makeTransparent(input, logoPath);
  fs.copyFileSync(logoPath, iconPath);

  const meta = await sharp(logoPath).metadata();
  console.log(`Logo transparente ${meta.width}x${meta.height} -> ${logoPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
