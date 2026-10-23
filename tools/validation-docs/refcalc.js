// Referans hesap: OIML R 22 formülünün sistemden ayrı yazılmış JavaScript uygulaması.
// Protokollerdeki beklenen değerleri ve kod incelemesindeki sayısal denetimleri üretir.
// Katsayılar kaynak koddan okunur (oiml-source.js); katsayıların OIML ile aynılığı kod incelemesinde ayrıca
// denetlenir. Ters dönüşümler sistemden farklı yöntemle çözülür: v/v → w/w sistemde sabit nokta iterasyonu,
// burada ikiye bölmedir.
const { A, B, C } = require("./oiml-source");

const a = A.map(Number), b = B.map(Number), c = C.map(r => r.map(Number));

function rho(w, t) {
  const d = t - 20;
  let s = a[0];
  for (let k = 2; k <= 12; k++) s += a[k - 1] * w ** (k - 1);
  for (let k = 1; k <= 6; k++) s += b[k - 1] * d ** k;
  for (let i = 1; i <= 5; i++) {
    let inner = 0;
    for (let k = 1; k <= c[i - 1].length; k++) inner += c[i - 1][k - 1] * w ** k;
    s += inner * d ** i;
  }
  return s;
}

const rhoE20 = rho(1, 20);
const massToVol = p => { const w = p / 100; return w * rho(w, 20) / rhoE20 * 100; };

// Artan f(x) için f(x) = y'nin [lo, hi] kökü.
function bisect(f, y, lo, hi) {
  for (let n = 0; n < 200 && hi - lo > 1e-14; n++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < y) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
const volToMass = q => bisect(massToVol, q, 0, 100);
// ρ w ile azalır; -ρ artar.
const massFromDensity = (r, t) => bisect(w => -rho(w / 100, t), -r, 0, 100);

function dilution(basis, amount, target, stock, t) {
  const wT = basis === "volume" ? volToMass(target) : target;
  const wS = basis === "volume" ? volToMass(stock) : stock;
  const rF = rho(wT / 100, t) / 1000, rS = rho(wS / 100, t) / 1000, rW = rho(0, t) / 1000;
  const finalMass = basis === "volume" ? amount * rF : amount;
  const ethanolMass = finalMass * wT / 100;
  const stockMass = ethanolMass / (wS / 100);
  const waterMass = finalMass - stockMass;
  const finalVolume = finalMass / rF, stockVolume = stockMass / rS, waterVolume = waterMass / rW;
  return {
    wT, wS, qT: massToVol(wT), finalVolume, finalMass, ethanolMass, stockVolume, stockMass, waterVolume, waterMass,
    contraction: stockVolume + waterVolume - finalVolume, naiveWater: finalVolume - stockVolume,
  };
}

// --- Sistem algoritmalarının davranışını inceleyen sayısal denetimler (kod incelemesi için) ---

// Sistemdeki sabit nokta iterasyonunun adım sayısı (OimlAlcoholometry.VolumeToMassPercent ile aynı kural).
function fixedPointSteps(q) {
  const phi = q / 100;
  let w = phi;
  for (let n = 0; n < 200; n++) {
    const next = phi * rhoE20 / rho(w, 20);
    if (Math.abs(next - w) < 1e-12) return n + 1;
    w = next;
  }
  return 200;
}

// |g'(w)| = w·|dρ/dw|/ρ (20 °C), merkezi farkla.
function contractionFactor(w) {
  const h = 1e-6;
  const lo = Math.max(0, w - h), hi = Math.min(1, w + h);
  const drho = (rho(hi, 20) - rho(lo, 20)) / (hi - lo);
  return w * Math.abs(drho) / rho(w, 20);
}

function numericChecks() {
  let maxSteps = 0, maxStepsAt = 0;
  for (let i = 0; i <= 10000; i++) {
    const q = i / 100;
    const s = fixedPointSteps(q);
    if (s > maxSteps) { maxSteps = s; maxStepsAt = q; }
  }
  let maxG = 0, maxGAt = 0;
  for (let i = 0; i <= 10000; i++) {
    const g = contractionFactor(i / 10000);
    if (g > maxG) { maxG = g; maxGAt = i / 100; }
  }
  // ρ'nun w ile tekdüze azalması: −20…40 °C, 1 °C ve 0,01 %w/w ızgarası.
  let monotone = true, worst = null, minStep = Infinity;
  for (let t = -20; t <= 40; t++) {
    let prev = rho(0, t);
    for (let i = 1; i <= 10000; i++) {
      const r = rho(i / 10000, t);
      if (prev - r < minStep) { minStep = prev - r; worst = { t, p: i / 100 }; }
      if (r >= prev) monotone = false;
      prev = r;
    }
  }
  // Gidiş–dönüş: sistemin sabit nokta sonucu ile referansın ikiye bölme sonucu arasındaki en büyük fark.
  let maxRound = 0;
  for (let i = 0; i <= 10000; i++) {
    const q = i / 100;
    const back = massToVol(volToMass(q));
    maxRound = Math.max(maxRound, Math.abs(back - q));
  }
  return { maxSteps, maxStepsAt, maxG, maxGAt, monotone, minStep, worst, maxRound, gridPoints: 61 * 10001 };
}

// Testlerdeki el hesabıyla tutarlılık: refcalc kendi içinde de denetlenir.
{
  const r = dilution("volume", 100, 70, 96, 20);
  const ok = Math.abs(r.finalMass - 88.556) < 0.005 && Math.abs(r.waterVolume - 29.74) < 0.005
    && Math.abs(r.stockVolume - 100 * 70 / 96) < 1e-6 && Math.abs(rhoE20 - 789.24) < 0.005;
  if (!ok) throw new Error("refcalc, AlcoholometryTests'teki el hesabıyla uyuşmuyor");
}

module.exports = { rho, rhoE20, massToVol, volToMass, massFromDensity, dilution, numericChecks };
