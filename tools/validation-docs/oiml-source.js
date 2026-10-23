// OIML R 22 katsayılarını ve sabitlerini doğrudan C# kaynak dosyasından okur.
// Belgeler ve referans hesap katsayıları elle kopyalamaz; kaynakta değişiklik olursa belgeye de yansır.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const SRC_REL = "PTCalc.Core/Core/Alcoholometry/OimlAlcoholometry.cs";
const src = fs.readFileSync(path.join(ROOT, SRC_REL), "utf8");

function arrayBlock(name) {
  const m = src.match(new RegExp(`static readonly double\\[\\]${name === "C" ? "\\[\\]" : ""} ${name} =\\s*\\{([\\s\\S]*?)\\n    \\};`));
  if (!m) throw new Error(`${name} dizisi bulunamadı`);
  return m[1];
}
const nums = text => (text.replace(/\/\/.*$/gm, "").match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi) ?? []);

const A = nums(arrayBlock("A"));
const B = nums(arrayBlock("B"));
const C = [...arrayBlock("C").matchAll(/new\[\]\s*\{([\s\S]*?)\}/g)].map(m => nums(m[1]));
if (A.length !== 12 || B.length !== 6 || C.map(r => r.length).join() !== "11,10,9,4,2")
  throw new Error(`Katsayı sayıları beklenenden farklı: A=${A.length}, B=${B.length}, C=${C.map(r => r.length)}`);

function constant(name) {
  const m = src.match(new RegExp(`const (?:double|int) ${name} = ([^;]+);`));
  if (!m) throw new Error(`${name} sabiti bulunamadı`);
  return m[1].trim();
}
const constants = Object.fromEntries(
  ["MinTemperature", "MaxTemperature", "ReferenceTemperature", "Tolerance", "MaxIterations"].map(n => [n, constant(n)]));

// Kaynak satır numarası: kod incelemesi bulgularında dosya:satır olarak kullanılır.
function lineOf(relPath, needle) {
  const text = fs.readFileSync(path.join(ROOT, relPath), "utf8").split(/\r?\n/);
  const i = text.findIndex(l => l.includes(needle));
  if (i < 0) throw new Error(`${relPath} içinde bulunamadı: ${needle}`);
  return `${relPath}:${i + 1}`;
}

module.exports = { SRC_REL, A, B, C, constants, lineOf };
