// Compile the React/JSX source (public/app.jsx) to plain browser JS (public/app.js).
// Pre-compiling means the deployed app needs no in-browser Babel and no CDN — it loads
// only the small vendored React UMD builds. Run with: npm run build
const fs = require('fs');
const path = require('path');

// @babel/standalone is a dev-only dependency used purely at build time.
let Babel;
try {
  Babel = require('@babel/standalone');
} catch (e) {
  console.error('Missing @babel/standalone. Run: npm install --no-save @babel/standalone');
  process.exit(1);
}

const SRC = path.join(__dirname, 'public', 'app.jsx');
const OUT = path.join(__dirname, 'public', 'app.js');

const source = fs.readFileSync(SRC, 'utf8');
const { code } = Babel.transform(source, { presets: ['react'], compact: false });
const banner = '/* AUTO-GENERATED from app.jsx by build.js — do not edit directly. */\n';
fs.writeFileSync(OUT, banner + code, 'utf8');
console.log(`Built ${path.relative(__dirname, OUT)} (${code.length} bytes)`);
