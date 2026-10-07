import fs from 'node:fs';
import path from 'node:path';

const site = path.join(import.meta.dirname, 'v1-site');
const prefix = '/formadlyaohrana/v1-site';
const absoluteAsset = /(?<!\/formadlyaohrana\/v1-site)\/(?:_next|fonts|v1)(?=[/"'`\\?]|$)/g;
let count = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.(html|css|js|txt)$/.test(entry.name)) continue;
    const original = fs.readFileSync(file, 'utf8');
    const updated = original.replace(absoluteAsset, match => prefix + match);
    if (updated !== original) {
      fs.writeFileSync(file, updated);
      count++;
    }
  }
}

walk(site);
fs.copyFileSync(path.join(site, 'v1.html'), path.join(site, 'v1', 'index.html'));
console.log(`Prepared ${count} files for ${prefix}/`);
