const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const mobileRoot = path.resolve(__dirname, '..');
const androidRes = path.join(mobileRoot, 'android/app/src/main/res');
const iosAssets = path.join(mobileRoot, 'ios/App/App/Assets.xcassets');
const logoSvg = fs.readFileSync(path.join(mobileRoot, 'public/images/yespiz-logo.svg'));
const markSvg = Buffer.from(logoSvg.toString().replace('width="164" height="52" viewBox="0 0 164 52"', 'width="40" height="52" viewBox="0 0 40 52"'));
const background = '#F5F7FC';

async function brandedIcon(size, foreground = false) {
  const mark = await sharp(markSvg, { density: 600 })
    .resize({ height: Math.round(size * (foreground ? 0.52 : 0.65)) })
    .png()
    .toBuffer();
  const { width, height } = await sharp(mark).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: foreground ? '#00000000' : background } })
    .composite([{ input: mark, left: Math.floor((size - width) / 2), top: Math.floor((size - height) / 2) }])
    .png()
    .toBuffer();
}

async function brandedSplash(width, height) {
  const logo = await sharp(logoSvg, { density: 300 })
    .resize({ width: Math.round(Math.min(width * 0.55, height * 0.52)) })
    .png()
    .toBuffer();
  const dimensions = await sharp(logo).metadata();
  return sharp({ create: { width, height, channels: 3, background } })
    .composite([{ input: logo, left: Math.floor((width - dimensions.width) / 2), top: Math.floor((height - dimensions.height) / 2) }])
    .png()
    .toBuffer();
}

async function main() {
  for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    const directory = path.join(androidRes, `mipmap-${density}`);
    const icon = await brandedIcon(size);
    fs.writeFileSync(path.join(directory, 'ic_launcher.png'), icon);
    fs.writeFileSync(path.join(directory, 'ic_launcher_round.png'), icon);
    fs.writeFileSync(path.join(directory, 'ic_launcher_foreground.png'), await brandedIcon(size * 2.25, true));
  }

  for (const directory of fs.readdirSync(androidRes).filter((name) => name === 'drawable' || name.startsWith('drawable-port-') || name.startsWith('drawable-land-'))) {
    const splash = path.join(androidRes, directory, 'splash.png');
    const { width, height } = await sharp(splash).metadata();
    fs.writeFileSync(splash, await brandedSplash(width, height));
  }

  fs.writeFileSync(path.join(iosAssets, 'AppIcon.appiconset/AppIcon-512@2x.png'), await brandedIcon(1024));
  for (const name of fs.readdirSync(path.join(iosAssets, 'Splash.imageset')).filter((file) => file.endsWith('.png'))) {
    const splash = path.join(iosAssets, 'Splash.imageset', name);
    const { width, height } = await sharp(splash).metadata();
    fs.writeFileSync(splash, await brandedSplash(width, height));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
