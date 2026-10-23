// Validasyon belgelerini docs/validation/alcohol-dilution/ altına Word olarak üretir.
// Kullanım: node build.js            → tüm belgeler
//           node build.js 03 04      → yalnız verilen belge numaraları
// İçindekiler alanları Word'de güncellenir: update-fields.ps1 (README).
const fs = require("fs");
const path = require("path");
const { build } = require("./lib");

const OUT = path.resolve(__dirname, "../../docs/validation/alcohol-dilution");

const scripts = fs.readdirSync(__dirname).filter(f => /^alc-\d\d-.+\.js$/.test(f)).sort();
const wanted = process.argv.slice(2);
const selected = wanted.length ? scripts.filter(f => wanted.includes(f.slice(4, 6))) : scripts;
if (wanted.length && selected.length !== wanted.length) {
  console.error(`Bulunamayan belge numarası var: ${wanted.join(", ")}`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
(async () => {
  for (const f of selected) {
    const { meta, body } = require(path.join(__dirname, f));
    const out = path.join(OUT, `${meta.docNo}.docx`);
    await build(meta, body, out);
    console.log(`${meta.docNo}  ${path.relative(process.cwd(), out)}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
