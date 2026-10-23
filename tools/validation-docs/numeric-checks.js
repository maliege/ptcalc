// OQ-05: sistem algoritmalarının önkoşullarını sayısal olarak denetler (refcalc.numericChecks).
// Kullanım: node numeric-checks.js   → özet yazar; ölçütlerden biri sağlanmazsa çıkış kodu 1.
const { numericChecks } = require("./refcalc");

const c = numericChecks();
const criteria = [
  ["Sabit nokta iterasyonu en çok adım (sınır 200)", c.maxSteps, c.maxSteps < 200],
  ["En büyük daralma katsayısı |g′| (< 1 olmalı)", c.maxG.toFixed(4), c.maxG < 1],
  [`ρ'nun w ile tekdüze azalması (${c.gridPoints} nokta)`, c.monotone ? "evet" : "hayır", c.monotone],
  ["%v/v → %w/w → %v/v en büyük fark (≤ 1e-9)", c.maxRound.toExponential(2), c.maxRound <= 1e-9],
];
for (const [name, value, ok] of criteria) console.log(`${ok ? "UYGUN    " : "UYGUN DEĞİL"}  ${name}: ${value}`);
console.log(`Bilgi: en çok adım ${c.maxStepsAt} %v/v'de; en küçük yoğunluk adımı ${c.minStep.toExponential(2)} kg/m³ (t = ${c.worst.t} °C, p = ${c.worst.p}).`);
process.exit(criteria.every(x => x[2]) ? 0 : 1);
