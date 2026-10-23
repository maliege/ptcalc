// Sistem kitaplığının çıktılarını (syscheck) referans hesapla (refcalc.js) karşılaştırır.
// Kullanım: node compare.js   → özet yazar; herhangi bir fark 1e-6'yı aşarsa çıkış kodu 1.
// Çalıştırmadan önce sitenin dotnet run oturumu kapatılmalıdır (derleme çıktıları çakışır).
const { execFileSync } = require("child_process");
const path = require("path");
const r = require("./refcalc");

const LIMIT = 1e-6;

function systemOutput() {
  const proj = path.join(__dirname, "syscheck", "syscheck.csproj");
  const out = execFileSync("dotnet", ["run", "--project", proj, "-c", "Release", "--nologo"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out.slice(out.indexOf("{")));
}

function compare(s) {
  const max = (arr, f) => arr.reduce((m, x) => Math.max(m, f(x)), 0);
  const F = { FinalVolume: "finalVolume", FinalMass: "finalMass", EthanolMass: "ethanolMass", StockVolume: "stockVolume",
    StockMass: "stockMass", WaterVolume: "waterVolume", WaterMass: "waterMass", Contraction: "contraction", NaiveWaterVolume: "naiveWater" };
  return {
    volToMass: { n: s.conv.length, max: max(s.conv, ([q, w]) => Math.abs(w - r.volToMass(q))) },
    massToVol: { n: s.conv.length, max: max(s.conv, ([p, , v]) => Math.abs(v - r.massToVol(p))) },
    density: { n: s.dens.length, max: max(s.dens, ([p, t, rho]) => Math.abs(rho - r.rho(p / 100, t))) },
    densityRoundTrip: { n: s.dens.length, max: max(s.dens, ([p, , , back]) => Math.abs(back - p)) },
    dilution: { n: s.dil.length, max: max(s.dil, d => {
      const x = r.dilution(d.b, d.amt, d.tg, d.st, d.t);
      return Math.max(...Object.entries(F).map(([k, v]) => Math.abs(d[k] - x[v])));
    }) },
  };
}

if (require.main === module) {
  const result = compare(systemOutput());
  console.log(JSON.stringify(result, null, 2));
  const worst = Math.max(...Object.values(result).map(x => x.max));
  console.log(worst <= LIMIT ? `UYGUN: en büyük fark ${worst.toExponential(2)} ≤ ${LIMIT}` : `UYGUN DEĞİL: en büyük fark ${worst}`);
  process.exit(worst <= LIMIT ? 0 : 1);
}

module.exports = { compare, LIMIT };
