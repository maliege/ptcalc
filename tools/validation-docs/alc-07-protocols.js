const { Paragraph, TextRun } = require("docx");
const { p, h1, h2, bullets, table, kv, WL, LANDSCAPE, PORTRAIT } = require("./lib");
const urs = require("./alc-01-urs");
const r = require("./refcalc");

const meta = {
  docNo: "PTC-VAL-ALC-07",
  rev: "00",
  status: "TASLAK — onaya sunulacak",
  title: "IQ / OQ / PQ Protokolleri",
  system: "Alkol Seyreltme Aracı (ptcalc.tr/alcohol-dilution)",
  version: "Yürütme, PTC-VAL-ALC-00 §7.4'e göre dondurulan sürümde yapılır; sürüm IQ-01'de kaydedilir.",
  related: "PTC-VAL-ALC-00 Plan; -01 URS; -03 Risk; -04 FS; -05 DS; -06 Kod İnceleme; -08 Test Kayıtları; -09 Sapmalar",
  revisions: [["00", "", "İlk yayın.", "—"]],
};

// --- Beklenen değerler referans hesaptan (refcalc.js) üretilir; elle yazılmaz. ---
const trn = (x, d = 2) => x.toFixed(d).replace(".", ",");
const enn = (x, d = 2) => x.toFixed(d);
const pctTr = (x, basis) => `%${trn(x)} ${basis}`;
const pctEn = (x, basis) => `${enn(x)}% ${basis}`;
// "0.##" biçimi: en çok 2 ondalık, sondaki sıfırlar atılır.
const short = (x, d = 2) => String(Number(x.toFixed(d))).replace(".", ",");

function recipeSteps(basis, amount, target, stock, t) {
  const x = r.dilution(basis, amount, target, stock, t);
  const vol = basis === "volume";
  const b = vol ? "v/v" : "w/w";
  const header = vol
    ? `%${short(target)} (${b}) alkol, ${short(x.finalVolume)} mL · stok %${short(stock)} (${b}), ${short(t, 1)} °C`
    : `%${short(target)} (${b}) alkol, ${short(x.finalMass)} g · stok %${short(stock)} (${b}), ${short(t, 1)} °C`;
  const s1 = vol
    ? `${short(stock)} derecelik alkolden ${trn(x.stockVolume)} mL ölçün (ya da ${trn(x.stockMass)} g tartın).`
    : `%${short(stock)} (w/w) alkolden ${trn(x.stockMass)} g tartın (≈ ${trn(x.stockVolume)} mL).`;
  const s2 = vol
    ? `Üzerine ${trn(x.waterVolume)} mL saf su ekleyin (ya da ${trn(x.waterMass)} g tartın).`
    : `Üzerine ${trn(x.waterMass)} g saf su ekleyin (≈ ${trn(x.waterVolume)} mL).`;
  const rows = [
    `Son karışım: ${trn(x.finalVolume)} mL · ${trn(x.finalMass)} g`,
    `Kütlece / hacimce derece: ${pctTr(x.wT, "w/w")} · ${pctTr(x.qT, "v/v")}`,
    `Saf etanol: ${trn(x.ethanolMass)} g`,
    `Hacim büzülmesi: ${trn(x.contraction)} mL`,
    ...(vol ? [`Basit orantıyla su: ${trn(x.naiveWater)} mL`] : ["\"Basit orantıyla su\" satırı yok."]),
  ];
  return { x, header, s1, s2, rows };
}

function densityExpect(basis, value, t) {
  const w = basis === "volume" ? r.volToMass(value) : value;
  const rho = r.rho(w / 100, t);
  return { rho, w, q: r.massToVol(w),
    text: `Yoğunluk (${short(t, 1)} °C): ${trn(rho)} kg/m³ · ${trn(rho / 1000, 5)} g/mL; Kütlece derece: ${pctTr(w, "w/w")}; Hacimce derece (20 °C): ${pctTr(r.massToVol(w), "v/v")}` };
}

function strengthExpect(rhoKg, t) {
  const w = r.massFromDensity(rhoKg, t);
  return { w, q: r.massToVol(w),
    text: `Kütlece derece: ${pctTr(w, "w/w")}; Hacimce derece (20 °C): ${pctTr(r.massToVol(w), "v/v")}` };
}

const densityRangeMsg = t =>
  `Yoğunluk ${short(t, 1)} °C'de ${trn(r.rho(1, t))} ile ${trn(r.rho(0, t))} kg/m³ arasında olmalıdır.`;

// Yuvarlama sınırına düşen beklenen değer, ekranda ±0,01 farkla görülebilir; protokolde işaretlenir.
const nearBoundary = (x, d = 2) => Math.abs(((x * 10 ** d) % 1) - 0.5) < 0.02;

// --- Test durumları ---
const TESTS = [];
const T = def => { TESTS.push(def); return def; };

const rec1 = recipeSteps("volume", 100, 70, 96, 20);
const rec2 = recipeSteps("mass", 120, 60, 90, 20);
const rec3 = recipeSteps("volume", 100, 70, 96, 25);
const rec4 = recipeSteps("volume", 100, 70, 100, 20);
const den = [["volume", 70, 20], ["mass", 50, 10], ["mass", 0, 4], ["mass", 100, 20], ["volume", 70, -20], ["volume", 70, 40]].map(a => ({ a, e: densityExpect(...a) }));
const str = [[885.56, 20], [950.0, 25], [998.0, 20]].map(a => ({ a, e: strengthExpect(...a) }));
const boundaryValues = [
  rec1.x.stockVolume, rec1.x.stockMass, rec1.x.waterVolume, rec1.x.waterMass, rec1.x.contraction,
  rec2.x.stockVolume, rec2.x.waterVolume, rec3.x.stockVolume, rec3.x.waterVolume, rec4.x.waterVolume,
  ...den.map(d => d.e.rho), ...str.map(s => s.e.w), ...str.map(s => s.e.q),
].filter(x => nearBoundary(x));

// IQ
T({ id: "IQ-01", phase: "IQ", title: "Onaylı sürümün tanımlanması", urs: ["URS-ALC-CHG-01", "URS-ALC-CHG-03"], risk: "R-28",
  purpose: "Validasyona konu sürümün ve alkolometri bileşenlerinin kimliğini kayda geçirmek.",
  pre: "Sürüm PTC-VAL-ALC-00 §7.4'e göre dondurulmuş; Git etiketi atılmış.",
  accept: "Etiket, commit ve tüm bileşen özetleri kayıtlı; CHANGELOG'da sürüm bölümü var.",
  steps: [
    ["Depoda `git rev-parse vX.Y.Z^{commit}` komutunu çalıştırın; etiketi ve tam commit kimliğini yazın.", "Etiket vardır; commit kimliği (40 karakter) kaydedilir."],
    ["`git ls-tree vX.Y.Z` ile PTC-VAL-ALC-00 §2.2'deki her dosyanın blob özetini yazdırın; çıktıyı kanıt olarak ekleyin.", "Tüm kapsam dosyaları listelenir; özetler kaydedilir."],
    ["CHANGELOG.md'de vX.Y.Z bölümünü açın.", "Bölüm vardır; kapsamdaki değişiklikler işaretlidir (URS-ALC-CHG-02)."],
  ] });
T({ id: "IQ-02", phase: "IQ", title: "Canlı yayının onaylı sürümle aynılığı", urs: ["URS-ALC-CHG-04"], risk: "R-27, R-28",
  purpose: "Sunucudaki yayının onaylı commit'ten, testler geçerek üretildiğini göstermek.",
  pre: "IQ-01 tamamlandı.",
  accept: "Yayın iş akışı onaylı commit için başarılı; sunucudaki dosya özetleri kayıtlı.",
  steps: [
    ["GitHub Actions'ta \"Deploy to Natro\" iş akışının onaylı commit için çalışmasını açın; çalışma numarasını ve \"Test\" adımının sonucunu yazın.", "Çalışma başarılı; Test adımı başarılı; commit IQ-01 ile aynı."],
    ["Sunucudan (Plesk dosya yöneticisi) PTCalc.Core.dll ve PTCalc.dll dosyalarını indirin; `Get-FileHash -Algorithm SHA256` ile özetlerini yazın.", "Özetler kaydedilir. Periyodik gözden geçirmede bu değerlerle karşılaştırılır."],
  ] });
T({ id: "IQ-03", phase: "IQ", title: "Sayfada sürüm gösterimi", urs: ["URS-ALC-OUT-04"], risk: "R-25",
  purpose: "Kullanıcının sayfada gördüğü sürümün onaylı sürüm olduğunu doğrulamak (E-1 giderildikten sonra).",
  pre: "IQ-01 tamamlandı; FS-ALC-60 gerçekleştirilmiş.",
  accept: "Her iki alan adında sürüm ve commit IQ-01 ile aynı.",
  steps: [
    ["https://ptcalc.tr/alcohol-dilution sayfasının altındaki sürüm satırını okuyun; ekran görüntüsü alın.", "\"PTCalc vX.Y.Z · commit <7 karakter>\"; IQ-01 ile aynı."],
    ["https://ptcalc.net/alcohol-dilution için aynı adımı yapın.", "Aynı sürüm ve commit."],
  ] });
T({ id: "IQ-04", phase: "IQ", title: "HTTPS ve yönlendirme", urs: ["URS-ALC-SEC-01"], risk: "R-29",
  purpose: "Sistemin yalnız şifreli bağlantıyla sunulduğunu doğrulamak.",
  pre: "—",
  accept: "Her iki alan adında geçerli sertifika; HTTP istekleri HTTPS'e yönlendirilir.",
  steps: [
    ["Tarayıcıda https://ptcalc.tr/alcohol-dilution açın; sertifikanın verildiği ad ve geçerlilik tarihlerini yazın.", "Sertifika geçerli; uyarı yok."],
    ["`curl -sI http://ptcalc.tr/alcohol-dilution` komutunun durum satırını ve Location başlığını yazın.", "301/302/307/308; Location https:// ile başlar."],
    ["Aynı iki adımı ptcalc.net için yapın.", "Aynı sonuç."],
  ] });
T({ id: "IQ-05", phase: "IQ", title: "Sunucu çalışma ortamı", urs: ["URS-ALC-ACC-07"], risk: "R-08",
  purpose: "Sunucudaki .NET çalışma ortamını kayda geçirmek.",
  pre: "Sunucu yönetim paneline erişim (depo sahibi).",
  accept: "Sürüm kayıtlı; ana sürüm OQ-01'in koşulduğu ortamla aynı (10.x).",
  steps: [
    ["Plesk panelinden ya da barındırma sağlayıcısından sunucudaki ASP.NET Core çalışma ortamı sürümünü öğrenin ve yazın.", "Microsoft.AspNetCore.App 10.x."],
  ] });
T({ id: "IQ-06", phase: "IQ", title: "Yerel kurulum (isteğe bağlı)", urs: ["URS-ALC-ACC-08"], risk: "—",
  purpose: "Kullanıcı kuruluş onaylı sürümü kendi ortamında çalıştıracaksa kurulumu doğrulamak. Yapılmayacaksa tüm adımlar N/A işaretlenir.",
  pre: ".NET 10 SDK kurulu.",
  accept: "Testler başarılı; sayfa açılıyor; sürüm IQ-01 ile aynı.",
  steps: [
    ["`git clone` ve `git checkout vX.Y.Z`; `dotnet test PTCalc.Core.Tests -c Release` çalıştırın; özet satırı yazın.", "Başarısız test yok."],
    ["`dotnet run --project PTCalc/PTCalc.csproj --launch-profile http` ile siteyi açın; http://localhost:5277/alcohol-dilution sayfasındaki sürümü okuyun.", "Sayfa açılır; sürüm ve commit IQ-01 ile aynı."],
  ] });

// OQ — otomatik
T({ id: "OQ-01", phase: "OQ", title: "Otomatik test paketi", urs: ["URS-ALC-ACC-02", "URS-ALC-ACC-04", "URS-ALC-ACC-06", "URS-ALC-ACC-07", "URS-ALC-ACC-08", "URS-ALC-INP-01", "URS-ALC-INP-04", "URS-ALC-INP-05", "URS-ALC-INP-06", "URS-ALC-INP-07", "URS-ALC-REC-03", "URS-ALC-REC-04"], risk: "R-01…R-11, R-15, R-17",
  purpose: "Hesap kitaplığının otomatik testlerini onaylı sürümde, iki işletim sisteminde ve iki bölge ayarında koşmak.",
  pre: "IQ-01 tamamlandı; KI-01 ve KI-02 kapatılmış (PTC-VAL-ALC-06).",
  accept: "Tüm testler başarılı; TRX çıktıları eklendi.",
  steps: [
    ["Onaylı commit'te Windows (Türkçe bölge ayarı) üzerinde `dotnet test PTCalc.Core.Tests -c Release --logger trx` çalıştırın; toplam/başarılı/başarısız sayılarını yazın; TRX dosyasını ekleyin.", "Başarısız 0."],
    ["GitHub Actions \"test\" iş akışının onaylı commit için Ubuntu ve Windows işlerini açın; sonuçlarını ve çalışma numarasını yazın; TRX yapıtlarını indirip ekleyin.", "İki iş de başarılı."],
    ["İki ortamdaki toplam test sayılarını karşılaştırın.", "Sayılar aynı."],
  ] });
T({ id: "OQ-02", phase: "OQ", title: "OIML basılı tablolarıyla karşılaştırma (sıkı ölçüt)", urs: ["URS-ALC-ACC-01", "URS-ALC-ACC-02"], risk: "R-01, R-02, R-10",
  purpose: "KI-02 kapatıldıktan sonra tablo testinin 0,01 payını yalnız yuvarlama sınırındaki hücrelerde kullandığını doğrulamak.",
  pre: "OQ-01 tamamlandı.",
  accept: "Sekiz tablonun tamamı başarılı; 0,01 payı kullanılan hücreler yalnız yuvarlama sınırında ve sayısı kod inceleme bulgusuyla tutarlı (≤ 5).",
  steps: [
    ["`dotnet test PTCalc.Core.Tests --filter Reproduces_printed_OIML_table` çalıştırın; tablo başına hücre sayısını ve payı kullanan hücre sayısını yazın.", "8 tablo başarılı; payı kullanan hücre sayısı ≤ 5."],
    ["Referans JSON'dan rastgele 50 hücre seçin (seçim yöntemini yazın) ve basılı OIML R 22 tablosuyla elle karşılaştırın.", "50 hücrenin tamamı basılı değerle aynı (KI-06)."],
  ] });
T({ id: "OQ-03", phase: "OQ", title: "Ph. Eur. 5.5 ile karşılaştırma", urs: ["URS-ALC-ACC-03"], risk: "R-09",
  purpose: "Sistemin farmakope alkolimetri tablosunu yeniden ürettiğini göstermek (E-4).",
  pre: "Ph. Eur. 5.5 tablosu için otomatik test eklenmiş (E-4); tablo kaynağı ve baskısı kayıtlı.",
  accept: "Tüm tablo değerleri tablonun basım duyarlığında yeniden üretilir.",
  steps: [
    ["Ph. Eur. 5.5 testini çalıştırın; karşılaştırılan değer sayısını ve sonucu yazın; kullanılan Ph. Eur. baskısını yazın.", "Başarılı; uyuşmayan değer yok."],
  ] });
T({ id: "OQ-04", phase: "OQ", title: "Bağımsız referans hesapla karşılaştırma", urs: ["URS-ALC-ACC-05", "URS-ALC-ACC-06", "URS-ALC-REC-01", "URS-ALC-REC-02", "URS-ALC-DEN-01", "URS-ALC-STR-01"], risk: "R-05, R-06",
  purpose: "Sistemi ayrı yazılmış bir hesapla ve farklı bir kişinin kendi aracıyla yaptığı hesapla karşılaştırmak.",
  pre: "Node.js ve .NET SDK kurulu; sitenin dotnet run oturumu kapalı.",
  accept: "compare.js \"UYGUN\" (en büyük fark ≤ 1·10⁻⁶); bağımsız kişinin 10 vakasında her miktar sistemden en çok 0,01 farklı.",
  steps: [
    ["tools/validation-docs klasöründe `node compare.js` çalıştırın; çıktıyı kanıt olarak ekleyin.", "Son satır \"UYGUN\"; beş karşılaştırmada en büyük fark ≤ 1·10⁻⁶."],
    ["Bağımsız teknik kontrolör §5'teki \"Bağımsız hesap formu\"ndaki 10 vakayı kendi aracıyla (ör. elektronik tablo ve OIML/Ph. Eur. tabloları) hesaplar; aynı girdileri sistemde hesaplayıp farkları forma yazar.", "Her miktarda fark ≤ 0,01 mL ya da g."],
  ] });
T({ id: "OQ-05", phase: "OQ", title: "Algoritma önkoşullarının sayısal denetimi", urs: ["URS-ALC-ACC-04"], risk: "R-03, R-04",
  purpose: "Sabit nokta iterasyonunun yakınsadığını ve yoğunluğun derece ile tekdüze azaldığını göstermek.",
  pre: "Node.js kurulu.",
  accept: "Dört ölçütün tamamı UYGUN.",
  steps: [
    ["tools/validation-docs klasöründe `node numeric-checks.js` çalıştırın; çıktıyı ekleyin.", "Dört satır UYGUN; en çok adım < 200; |g′| < 1; tekdüze: evet; gidiş–dönüş farkı ≤ 1e-9."],
  ] });

// OQ — arayüz
T({ id: "OQ-10", phase: "OQ", title: "Seyreltme tarifi — hacimce, varsayılan girdiler", urs: ["URS-ALC-REC-01", "URS-ALC-REC-03", "URS-ALC-REC-05", "URS-ALC-REC-06", "URS-ALC-INP-09", "URS-ALC-OUT-01", "URS-ALC-OUT-02", "URS-ALC-LNG-02"], risk: "R-05, R-07",
  purpose: "Varsayılan girdilerle hacimce tarifin ekranda doğru gösterildiğini doğrulamak.",
  pre: "Tarayıcıda https://ptcalc.tr/alcohol-dilution açık; Türkçe arayüz.",
  accept: "Tüm değerler beklenenle aynı (son basamakta ±0,01; FS §8.1).",
  steps: [
    ["Sayfayı açın; Seyreltme tarifi sekmesindeki varsayılan girdileri okuyun.", "Derece türü: Hacimce (%v/v, 20 °C) — miktar mL; stok 96; hedef 70; miktar 100; sıcaklık 20."],
    ["Hesapla'ya basın; tarif başlığını okuyun.", rec1.header],
    ["Tarifin numaralı adımlarını okuyun.", [`1. ${rec1.s1}`, `2. ${rec1.s2}`, "3. İyice karıştırın."]],
    ["Tarifin altındaki tabloyu okuyun.", rec1.rows],
    ["Tablonun altındaki açıklamayı okuyun.", `Hacim büzülmesi açıklaması ${trn(rec1.x.contraction)} mL ile; sıcaklık notu yok (20 °C).`],
  ] });
T({ id: "OQ-11", phase: "OQ", title: "Seyreltme tarifi — kütlece", urs: ["URS-ALC-REC-02", "URS-ALC-REC-05", "URS-ALC-REC-06"], risk: "R-05",
  purpose: "Kütlece tarifi doğrulamak.",
  pre: "OQ-10'daki sayfa.",
  accept: "Tüm değerler beklenenle aynı (±0,01).",
  steps: [
    ["Derece türünü Kütlece (%w/w) — miktar g seçin; stok 90, hedef 60, miktar 120, sıcaklık 20 girin; Hesapla'ya basın.", rec2.header],
    ["Numaralı adımları okuyun.", [`1. ${rec2.s1}`, `2. ${rec2.s2}`, "3. İyice karıştırın."]],
    ["Tabloyu okuyun.", rec2.rows],
  ] });
T({ id: "OQ-12", phase: "OQ", title: "Seyreltme tarifi — 20 °C dışında hazırlık", urs: ["URS-ALC-REC-04", "URS-ALC-REC-07"], risk: "R-06, R-19",
  purpose: "Hazırlama sıcaklığının hacimlere yansıdığını ve sıcaklık notunun gösterildiğini doğrulamak.",
  pre: "OQ-10'daki sayfa.",
  accept: "Değerler beklenenle aynı (±0,01); not gösterilir.",
  steps: [
    ["Hacimce; stok 96, hedef 70, miktar 100, sıcaklık 25 girin; Hesapla'ya basın; adımları okuyun.", [`1. ${rec3.s1}`, `2. ${rec3.s2}`]],
    ["Tabloyu okuyun.", rec3.rows],
    ["Tablonun altındaki notu okuyun.", "\"Hacimler 25 °C'de ölçülmelidir; tartarak hazırlamak sıcaklıktan etkilenmez.\" yazar."],
    ["Sıcaklığı 20,4 yapıp Hesapla'ya basın.", "Sıcaklık notu yok (fark 0,5 °C'den küçük)."],
    ["Sıcaklığı 20,5 yapıp Hesapla'ya basın.", "Sıcaklık notu var."],
  ] });
T({ id: "OQ-13", phase: "OQ", title: "Dereceden yoğunluk", urs: ["URS-ALC-DEN-01", "URS-ALC-DEN-02", "URS-ALC-INP-04"], risk: "R-02, R-15",
  purpose: "Yoğunluk ve öbür bazdaki derece sonuçlarını, sıcaklık sınırları dahil doğrulamak.",
  pre: "Dereceden yoğunluk sekmesi açık.",
  accept: "Değerler beklenenle aynı (kg/m³ ve derece ±0,01; g/mL ±0,00001).",
  steps: den.map(({ a: [b, v, t], e }) => [
    `Derece türü ${b === "volume" ? "Hacimce" : "Kütlece"}; derece ${trn(v, 0)}; sıcaklık ${short(t, 1)}; Hesapla.`, e.text]) });
T({ id: "OQ-14", phase: "OQ", title: "Yoğunluktan derece", urs: ["URS-ALC-STR-01", "URS-ALC-STR-02"], risk: "R-04, R-14",
  purpose: "Ölçülen yoğunluktan derece hesabını ve birim seçimini doğrulamak.",
  pre: "Yoğunluktan derece sekmesi açık.",
  accept: "Değerler beklenenle aynı (±0,01); iki birimle aynı sonuç.",
  steps: [
    ["Sekme açıklamasını okuyun.", "Girdinin gerçek yoğunluk olduğu ve cam alkolmetre okumaları için cam genleşme düzeltmesi yapılmadığı yazar."],
    ...str.map(({ a: [rho, t], e }) => [
      `Birim g/mL; yoğunluk ${trn(rho / 1000, 5)}; sıcaklık ${short(t, 1)}; Hesapla.`, e.text]),
    [`Birimi kg/m³ yapın; yoğunluk ${trn(str[0].a[0])}; sıcaklık 20; Hesapla.`, `${str[0].e.text} (g/mL ile aynı).`],
  ] });
T({ id: "OQ-15", phase: "OQ", title: "Sayı okuma ve ondalık ayırıcı", urs: ["URS-ALC-INP-01", "URS-ALC-INP-02"], risk: "R-11, R-12",
  purpose: "Nokta ve virgülün aynı sonucu verdiğini ve belirsiz girdinin nasıl okunduğunu doğrulamak.",
  pre: "Seyreltme tarifi sekmesi; Hacimce.",
  accept: "Ayırıcıdan bağımsız aynı sonuç; belirsiz girdi okunan değerle gösterilir ve (E-7 sonrası) uyarı verilir.",
  steps: [
    ["Stok \"96,5\", hedef 70, miktar 100, sıcaklık 20; Hesapla; stok hacmini yazın.", `Stok hacmi ${trn(r.dilution("volume", 100, 70, 96.5, 20).stockVolume)} mL; başlıkta stok %96,5.`],
    ["Stok \"96.5\" ile tekrarlayın.", "Bir önceki adımla aynı sonuç."],
    ["Stok 96; miktar \"1,000\"; Hesapla.", `Başlıkta miktar 1 mL; FS-ALC-62 uyarısı ("1,000" 1 olarak okundu…); stok hacmi ${trn(r.dilution("volume", 1, 70, 96, 20).stockVolume)} mL.`],
    ["Miktar \"1000\"; Hesapla.", `Başlıkta 1000 mL; uyarı yok; stok hacmi ${trn(r.dilution("volume", 1000, 70, 96, 20).stockVolume)} mL.`],
  ] });
T({ id: "OQ-16", phase: "OQ", title: "Hatalı girdi iletileri", urs: ["URS-ALC-INP-03", "URS-ALC-INP-04", "URS-ALC-INP-05", "URS-ALC-INP-06", "URS-ALC-INP-07", "URS-ALC-INP-08"], risk: "R-13…R-17",
  purpose: "Her geçersiz girdide doğru iletinin gösterildiğini ve sonuç üretilmediğini doğrulamak.",
  pre: "Her adımdan önce geçerli bir hesap yapılmış olmalı (ekranda sonuç var).",
  accept: "Her adımda beklenen ileti gösterilir ve önceki sonuç ekrandan kalkar.",
  steps: [
    ["Tarif: stok \"abc\"; Hesapla.", "\"Stok alkol derecesi (%)\" alanına bir sayı girin. Sonuç yok."],
    ["Tarif: stok 96; miktar 0; Hesapla.", "Hazırlanacak miktar sıfırdan büyük olmalıdır. Sonuç yok."],
    ["Tarif: miktar 100; stok 100,01; Hesapla.", "Stok alkol derecesi 0'dan büyük, en çok 100 olmalıdır. Sonuç yok."],
    ["Tarif: stok 96; hedef 96; Hesapla.", "Hedef derece 0'dan büyük ve stok dereceden küçük olmalıdır. Sonuç yok."],
    ["Tarif: hedef 70; sıcaklık 40,01; Hesapla.", "Sıcaklık -20 ile 40 °C arasında olmalıdır (OIML R 22 geçerlilik aralığı). Sonuç yok."],
    ["Tarif: sıcaklık -20,01; Hesapla.", "Aynı sıcaklık iletisi. Sonuç yok."],
    ["Dereceden yoğunluk: derece 100,5; sıcaklık 20; Hesapla.", "Alkol oranı 0 ile 100 arasında olmalıdır. Sonuç yok."],
    ["Yoğunluktan derece: birim g/mL; yoğunluk 0,7; sıcaklık 20; Hesapla.", `${densityRangeMsg(20)} Sonuç yok.`],
    ["Yoğunluktan derece: birim kg/m³; yoğunluk 0,88556; sıcaklık 20; Hesapla.", `${densityRangeMsg(20)} Sonuç yok.`],
    ["Yoğunluktan derece: birim g/mL; yoğunluk 1,1; sıcaklık 20; Hesapla.", `${densityRangeMsg(20)} Sonuç yok.`],
  ] });
T({ id: "OQ-17", phase: "OQ", title: "Sınır değerlerin kabulü", urs: ["URS-ALC-INP-04", "URS-ALC-INP-05"], risk: "R-15, R-17",
  purpose: "Geçerli aralığın uç değerlerinin kabul edildiğini doğrulamak.",
  pre: "—",
  accept: "Her adımda sonuç üretilir; değerler beklenenle aynı (±0,01).",
  steps: [
    ["Tarif: Hacimce; stok 100; hedef 70; miktar 100; sıcaklık 20; Hesapla.", [rec4.header, `1. ${rec4.s1}`, `2. ${rec4.s2}`]],
    ["Dereceden yoğunluk: Hacimce 70, sıcaklık -20 ve 40 sonuçları OQ-13'te alındı; burada yalnız iletinin çıkmadığını onaylayın.", "Hata iletisi yok."],
    ["Yoğunluktan derece: birim kg/m³; yoğunluk " + trn(r.rho(0, 20)) + "; sıcaklık 20; Hesapla.", `Kabul edilir; kütlece derece ${pctTr(r.massFromDensity(Number(r.rho(0, 20).toFixed(2)), 20), "w/w")}.`],
  ] });
T({ id: "OQ-18", phase: "OQ", title: "Sekme ve sonuç davranışı", urs: ["URS-ALC-INP-08", "URS-ALC-INP-09"], risk: "R-13, R-31",
  purpose: "Eski sonucun ekranda kalmadığını doğrulamak (E-8 sonrası).",
  pre: "FS-ALC-63 gerçekleştirilmiş.",
  accept: "Her adım beklendiği gibi.",
  steps: [
    ["OQ-10 hesabını yapın; Dereceden yoğunluk sekmesine geçip geri dönün.", "Tarif sonucu duruyor; varsa hata iletisi silinmiş."],
    ["Tarif sonucu ekrandayken hedef dereceyi 60 yapın (Hesapla'ya basmadan).", "Tarif sonucu ekrandan kalkar."],
    ["Derece türünü değiştirin (Hesapla'ya basmadan).", "Sonuç ekrandan kalkar."],
    ["Geçerli bir sonuç varken geçersiz girdiyle Hesapla'ya basın.", "Yalnız hata iletisi; sonuç yok."],
    ["Sunucu bağlantısını kesin (tarayıcıda ağı çevrimdışı yapın); bir girdiyi değiştirip Hesapla'ya basın; bağlantıyı açın.", "Yeniden bağlanma uyarısı görünür; güncel olmayan sonuç gösterilmez."],
  ] });
T({ id: "OQ-19", phase: "OQ", title: "İngilizce arayüz ve dil", urs: ["URS-ALC-LNG-01", "URS-ALC-LNG-02", "URS-ALC-LNG-03", "URS-ALC-ACC-07"], risk: "R-26, R-27",
  purpose: "İngilizce arayüzde aynı sonucun dile uygun biçimde gösterildiğini ve çeviri eksiği olmadığını doğrulamak.",
  pre: "https://ptcalc.net/alcohol-dilution açık.",
  accept: "Sayılar Türkçe arayüzle aynı; biçim İngilizce; Türkçe metin kalmamış.",
  steps: [
    ["OQ-10 girdileriyle Hesapla'ya basın; stok ve su miktarlarını, dereceleri okuyun.", [`Stok ${enn(rec1.x.stockVolume)} mL / ${enn(rec1.x.stockMass)} g; su ${enn(rec1.x.waterVolume)} mL / ${enn(rec1.x.waterMass)} g (nokta ondalık)`, `${pctEn(rec1.x.wT, "w/w")} · ${pctEn(rec1.x.qT, "v/v")}`]],
    ["Sayfadaki tüm etiket, açıklama, tarif ve rehber metinlerini okuyun.", "Türkçe kalmış metin yok; anlamlar Türkçe arayüzle eşdeğer."],
    ["OQ-16 adım 1 ve 8'i İngilizce arayüzde tekrarlayın.", ["Enter a number in the \"…\" field.", `At 20 °C the density must be between ${enn(r.rho(1, 20))} and ${enn(r.rho(0, 20))} kg/m³.`]],
    ["Dil seçicisinden Türkçeye geçin; sayfayı yenileyin.", "Arayüz Türkçe; seçim korunur."],
  ] });
T({ id: "OQ-20", phase: "OQ", title: "Tarayıcı uyumluluğu", urs: ["URS-ALC-SEC-02"], risk: "—",
  purpose: "Desteklenen tarayıcılarda aynı sonucu doğrulamak.",
  pre: "Tarayıcıların güncel sürümleri.",
  accept: "Her tarayıcıda OQ-10 adım 2–4 beklenenle aynı; düzen kullanılabilir.",
  steps: ["Chrome (masaüstü)", "Edge (masaüstü)", "Firefox (masaüstü)", "Mobil tarayıcı (cihaz ve tarayıcı adını yazın)"].map(b =>
    [`${b}: sürümünü yazın; OQ-10 adım 2–4'ü yapın.`, "OQ-10 ile aynı değerler; tüm alanlar ve sonuçlar okunabilir."]) });
T({ id: "OQ-21", phase: "OQ", title: "Rehber, yöntem sayfası ve veri saklanmaması", urs: ["URS-ALC-DOC-01", "URS-ALC-DOC-02", "URS-ALC-DOC-03", "URS-ALC-OUT-05", "URS-ALC-STR-02"], risk: "R-22",
  purpose: "Belge gereksinimlerini ve sistemin veri saklamadığını gösterimle doğrulamak.",
  pre: "—",
  accept: "Her adım beklendiği gibi.",
  steps: [
    ["Sayfanın sağındaki kısa rehberin \"Sınırlar\" bölümünü okuyun.", "Yalnız su–etanol; gerçek yoğunluk / cam düzeltmesi yok; enjeksiyonluk çözeltiler; sıcaklık aralığı ve donma bölgesi (FS-ALC-65)."],
    ["/about-alcohol-dilution sayfasını açın; formül, ters çözüm, seyreltme hesabı ve kaynaklar bölümlerini bulun.", "Bölümler var; kaynaklar DOI ya da yayın bilgisiyle."],
    ["Bir hesap yapın; sayfayı yenileyin.", "Girdiler varsayılana döner; sonuç yok."],
  ] });
T({ id: "OQ-22", phase: "OQ", title: "Yazdırılabilir çıktı", urs: ["URS-ALC-OUT-03"], risk: "R-24",
  purpose: "Çıktının gerekli bütün öğeleri içerdiğini doğrulamak (E-2 sonrası).",
  pre: "FS-ALC-61 gerçekleştirilmiş.",
  accept: "Çıktı FS-ALC-61'deki her öğeyi içerir; değerler ekrandakiyle aynı.",
  steps: [
    ["OQ-10 hesabını yapın; \"Yazdır / PDF\" düğmesine basın; PDF olarak kaydedin ve ekleyin.", "Yazdırma görünümü açılır; yalnız çıktı bölümü."],
    ["Çıktıda şu öğeleri işaretleyin: başlık ve işlev; girilen metin ve okunan değerle girdiler; sonuçlar; OIML R 22 referansı; tarih–saat (ISO 8601, saat dilimi); sürüm ve commit; sayfa adresi; Hesaplayan ve Kontrol eden alanları; sayfa numarası.", "Tüm öğeler var; değerler OQ-10 ile aynı; sürüm IQ-01 ile aynı."],
  ] });
T({ id: "OQ-23", phase: "OQ", title: "Donma bölgesi uyarısı", urs: ["URS-ALC-INP-10"], risk: "R-16",
  purpose: "Donma bölgesindeki bileşimde uyarı verildiğini doğrulamak (E-9 sonrası).",
  pre: "FS-ALC-64 gerçekleştirilmiş.",
  accept: "Sınırın altında uyarı var, üstünde yok; sonuç her iki durumda gösterilir.",
  steps: [
    ["Dereceden yoğunluk: Kütlece 10; sıcaklık -15; Hesapla.", "Sonuç ve donma uyarısı gösterilir."],
    ["Kütlece 40; sıcaklık -15; Hesapla.", "Sonuç gösterilir; uyarı yok."],
    ["Kütlece 10; sıcaklık 5; Hesapla.", "Uyarı yok (0 °C üstü)."],
  ] });

// PQ
const pqRec = recipeSteps("volume", 100, 70, 96, 20);
T({ id: "PQ-0", phase: "PQ", title: "Stok alkolün derecesinin belirlenmesi", urs: ["URS-ALC-STR-01", "URS-ALC-ACC-03"], risk: "R-21",
  purpose: "Stok alkolün gerçek derecesini ölçmek; bu değer PQ-1…PQ-4'te girdi olarak kullanılır.",
  pre: "§6.1 cihaz ve malzeme kaydı tamamlandı; yoğunluk ölçer günlük kontrolü uygun.",
  accept: "Üç ölçümün açıklığı ≤ 0,05 kg/m³; sistem ile Ph. Eur. tablosundan bulunan derece farkı ≤ 0,05.",
  steps: [
    ["Stok alkolün yoğunluğunu 20,00 °C'de üç kez ölçün; §6.2 Form A'ya yazın.", "Üç değer kaydedildi; açıklık ≤ 0,05 kg/m³."],
    ["Ortalama yoğunluğu sistemin Yoğunluktan derece işlevine girin; %v/v ve %w/w dereceyi yazın; ekran görüntüsü alın.", "Değerler kaydedildi."],
    ["Aynı yoğunluktan Ph. Eur. 5.5 tablosuyla interpolasyonla dereceyi bulun.", "Sistemle fark ≤ 0,05."],
  ] });
T({ id: "PQ-1", phase: "PQ", title: "Hacimce hazırlık, 20 °C", urs: ["URS-ALC-REC-01", "URS-ALC-REC-03", "URS-ALC-REC-05"], risk: "R-05, R-07",
  purpose: "Sistemin hacimce tarifiyle hazırlanan karışımın hedef dereceyi verdiğini göstermek.",
  pre: "PQ-0 tamamlandı.",
  accept: "Her hazırlıkta ölçülen derece hedeften ±0,3; üç hazırlığın ortalaması ±0,2 %v/v; sistem ile Ph. Eur. derece farkı ≤ 0,05.",
  steps: [
    ["Sistemde Hacimce; stok = PQ-0 %v/v değeri; hedef 70; miktar 100; sıcaklık 20; Hesapla. Tarifi Form B'ye yazın; ekran görüntüsü alın.", `Tarif üretilir (bilgi: stok %96 olsaydı stok ${trn(pqRec.x.stockVolume)} mL, su ${trn(pqRec.x.waterVolume)} mL).`],
    ["Stok ve suyu 20 °C'de ayrı ayrı ölçüp karıştırın; kapalı kapta 20 °C'ye dengeleyin. Üç bağımsız hazırlık yapın.", "Hazırlık kayıtları Form B'de."],
    ["Her hazırlığın yoğunluğunu 20,00 °C'de iki kez ölçün; ortalamayı sistemle ve Ph. Eur. tablosuyla dereceye çevirin; Form B'ye yazın.", "Kabul ölçütü karşılanır."],
  ] });
T({ id: "PQ-2", phase: "PQ", title: "Kütlece hazırlık", urs: ["URS-ALC-REC-02", "URS-ALC-ACC-06"], risk: "R-05",
  purpose: "Kütlece tarifle tartılarak hazırlanan karışımın hedef dereceyi verdiğini göstermek.",
  pre: "PQ-0 tamamlandı.",
  accept: "Her hazırlıkta ölçülen derece hedeften ±0,3; ortalama ±0,2 %w/w; sistem ile Ph. Eur. farkı ≤ 0,05.",
  steps: [
    ["Sistemde Kütlece; stok = PQ-0 %w/w değeri; hedef 60; miktar 500; sıcaklık 20; Hesapla; tarifi Form B'ye yazın.", "Tarif üretilir."],
    ["Stok ve suyu tartarak üç bağımsız hazırlık yapın; tartımları yazın.", "Tartımlar tarifle ±0,05 g içinde."],
    ["Yoğunluğu 20,00 °C'de ikişer kez ölçüp dereceye çevirin.", "Kabul ölçütü karşılanır."],
  ] });
T({ id: "PQ-3", phase: "PQ", title: "Hacimce hazırlık, 25 °C", urs: ["URS-ALC-REC-04", "URS-ALC-REC-07"], risk: "R-06, R-19",
  purpose: "20 °C dışında hazırlıkta sıcaklığın doğru hesaba katıldığını göstermek.",
  pre: "PQ-0 tamamlandı; su banyosu 25,0 ± 0,2 °C.",
  accept: "PQ-1 ile aynı.",
  steps: [
    ["Sistemde Hacimce; stok = PQ-0 %v/v; hedef 70; miktar 100; sıcaklık 25; Hesapla; tarifi yazın.", "Tarif ve 25 °C notu üretilir."],
    ["Stok ve suyu 25 °C'ye dengeleyip ölçün; karıştırın; üç hazırlık.", "Kayıtlar Form B'de."],
    ["Karışımları 20,00 °C'de ikişer kez ölçüp dereceye çevirin.", "Kabul ölçütü karşılanır."],
  ] });
T({ id: "PQ-4", phase: "PQ", title: "Ayırt edicilik: basit orantıyla hazırlık", urs: ["URS-ALC-REC-03"], risk: "R-07",
  purpose: "Hacim büzülmesinin ölçülebilir etkisini ve yöntemin bunu ayırt ettiğini göstermek.",
  pre: "PQ-1 tamamlandı.",
  accept: "Bilgi amaçlıdır: basit orantıyla hazırlığın sapması PQ-1 sapmasından anlamlı ölçüde büyük beklenir.",
  steps: [
    ["PQ-1 tarifindeki \"Basit orantıyla su\" hacmini kullanarak bir hazırlık yapın; 20 °C'de ölçüp dereceye çevirin; Form B'ye yazın.", "Sapma PQ-1 ortalama sapmasıyla karşılaştırılıp raporlanır."],
  ] });

// --- Çizim yardımcıları ---
const STEP_COLS = [{ w: 650, h: "Adım" }, { w: 4300, h: "Talimat" }, { w: 3900, h: "Beklenen sonuç" }, { w: 3220, h: "Gerçekleşen sonuç" }, { w: 700, h: "G/K" }, { w: 1800, h: "Paraf / tarih" }];

function testBlock(t) {
  const steps = t.steps.map(([ins, exp], i) => [String(i + 1), ins, Array.isArray(exp) ? exp : [exp], "", "", ""])
    .map(row => row.map(c => Array.isArray(c) ? c.map(s => new Paragraph({ children: [new TextRun({ text: s, size: 18 })], spacing: { after: 40 } })) : c));
  return [
    h2(`${t.id} ${t.title}`),
    ...kv([
      ["Amaç", t.purpose],
      ["Bağlantılar", `URS: ${t.urs.join(", ")} · Risk: ${t.risk}`],
      ["Ön koşul", t.pre],
      ["Kabul ölçütü", t.accept],
    ], 2200, WL),
    ...table(STEP_COLS, steps, { width: WL, rowHeight: 560 }),
    ...table([{ w: 2600, h: "Sonuç (Geçti / Kaldı)" }, { w: 2200, h: "Sapma no" }, { w: 4885, h: "Uygulayan (ad soyad, imza, tarih)" }, { w: 4885, h: "Kontrol eden (ad soyad, imza, tarih)" }],
      [["", "", "", ""]], { width: WL, rowHeight: 700 }),
  ];
}

// Bağımsız hesap formu vakaları (OQ-04 adım 2).
const indepCases = [
  ["Hacimce", 100, 70, 96, 20], ["Hacimce", 1000, 70, 96, 15], ["Hacimce", 500, 60, 96, 20], ["Hacimce", 250, 45, 95, 22],
  ["Hacimce", 1000, 40, 70, 30], ["Hacimce", 2000, 25, 96, -5], ["Kütlece", 120, 60, 90, 20], ["Kütlece", 1000, 70, 96, 25],
  ["Kütlece", 250, 50, 99, 10], ["Kütlece", 750, 85, 96, 35],
];

// --- İzlenebilirlik: T ya da G ile doğrulanan her URS en az bir teste bağlı olmalı. ---
const byUrs = new Map();
for (const t of TESTS) for (const u of t.urs) {
  if (!urs.ids.includes(u)) throw new Error(`${t.id}: bilinmeyen URS ${u}`);
  byUrs.set(u, [...(byUrs.get(u) ?? []), t.id]);
}
const needsTest = urs.rows.filter(row => /[TG]/.test(row[4]));
const uncovered = needsTest.filter(row => !byUrs.has(row[0])).map(row => row[0]);
if (uncovered.length) throw new Error(`Teste bağlanmamış URS: ${uncovered.join(", ")}`);

const phaseList = ph => TESTS.filter(t => t.phase === ph);

const body = [
  h1("1. Amaç ve Kapsam"),
  p("Bu belge, Validasyon Planı (PTC-VAL-ALC-00 §11) uyarınca yürütülecek kurulum (IQ), operasyonel (OQ) ve performans (PQ) kalifikasyonu test durumlarını tanımlar. Her test durumu amacını, bağlı olduğu URS maddelerini ve riskleri, ön koşulunu, kabul ölçütünü ve adımlarını içerir. Belge onaylandıktan sonra yürütmede doldurulur; doldurulmuş nüsha test kaydıdır (PTC-VAL-ALC-08)."),
  p(`Toplam ${TESTS.length} test durumu: IQ ${phaseList("IQ").length}, OQ ${phaseList("OQ").length}, PQ ${phaseList("PQ").length}. URS'de test ya da gösterimle doğrulanan her madde en az bir test durumuna bağlıdır (Ek A; betik içinde denetlenir).`),

  h1("2. Ön Koşullar"),
  ...bullets([
    "PTC-VAL-ALC-00…06 onaylıdır; kod inceleme raporunun (PTC-VAL-ALC-06) majör ve minör bulguları kapatılmıştır.",
    "Ön değerlendirme eksikleri (E-1…E-9) giderilmiş, sürüm dondurulmuştur; bağlı oldukları test durumları (IQ-03, OQ-03, OQ-15 adım 3, OQ-18, OQ-22, OQ-23) ancak bundan sonra yürütülür.",
    "Uygulayıcılar bu protokol ve PTC-VAL-ALC-00 §10 (GDP) konusunda eğitilmiştir; eğitim kayıtları dosyadadır.",
    "PQ için cihaz ve malzemeler PTC-VAL-ALC-00 §11.3'e uygundur; kalibrasyonlar geçerlidir.",
  ]),

  h1("3. Yürütme Kuralları"),
  ...bullets([
    "Adımlar sırayla yürütülür. Gerçekleşen sonuç, ekranda ya da cihazda görülen değer olduğu gibi yazılır; \"uygun\", \"OK\" ya da tik işareti tek başına sonuç sayılmaz.",
    "G/K sütununa G (geçti) ya da K (kaldı) yazılır. Bir adım kalırsa yürütme durdurulur, sapma formu (PTC-VAL-ALC-09) açılır ve sapma numarası test sonucu tablosuna yazılır.",
    "Uygulanmayan adım \"N/A\" yazılıp gerekçesiyle paraflanır. Boş alan bırakılmaz.",
    "Sayısal karşılaştırmada FS §8.1 uygulanır: ekrandaki değer beklenen değerden son basamakta en çok 1 birim farklı olabilir.",
    "Kanıtlar (ekran görüntüsü, komut çıktısı, TRX, cihaz çıktısı) \"<test no>-<adım>-<sıra>\" biçiminde adlandırılır (ör. OQ-10-3-1), sayfa numarası verilir ve uygulayıcı tarafından paraflanır.",
    "Ekran görüntülerinde sayfa adresi ve sürüm satırı görünmelidir.",
    "Düzeltmeler PTC-VAL-ALC-00 §10'a göre tek çizgiyle yapılır; paraf, tarih ve gerekçe yazılır.",
  ]),
  h2("3.1 Beklenen değerlerin kaynağı"),
  p("Arayüz testlerindeki beklenen sayısal değerler belge üretilirken tools/validation-docs/refcalc.js referans hesabıyla hesaplanmış ve Türkçe biçimde yazılmıştır; elle aktarılmamıştır. Referans hesap ile sistem arasındaki uyum OQ-04'te ayrıca gösterilir."),
  ...(boundaryValues.length
    ? [p(`Not: ${boundaryValues.length} beklenen değer yuvarlama sınırına çok yakındır; bu değerlerde son basamakta 1 birim fark beklenebilir.`)]
    : [p("Beklenen değerlerin hiçbiri yuvarlama sınırına yakın değildir.")]),

  h1("4. Personel Kaydı"),
  p("Bu protokolde paraf ya da imza atan herkes aşağıya kaydolur."),
  ...table([{ w: 2800, h: "Ad soyad" }, { w: 2400, h: "Rol" }, { w: 1300, h: "Paraf" }, { w: 1838, h: "İmza" }, { w: 1300, h: "Tarih" }],
    Array.from({ length: 6 }, () => ["", "", "", "", ""]), { rowHeight: 520 }),

  LANDSCAPE,
  h1("5. Kurulum Kalifikasyonu (IQ)"),
  ...phaseList("IQ").flatMap(testBlock),
  h1("6. Operasyonel Kalifikasyon (OQ)"),
  ...phaseList("OQ").flatMap(testBlock),
  h2("Bağımsız hesap formu (OQ-04 adım 2)"),
  p("Bağımsız kontrolör her vakayı kendi aracıyla hesaplar; sistemde aynı girdileri hesaplayıp farkı yazar. Kabul: her miktarda |fark| ≤ 0,01."),
  ...table([{ w: 650, h: "No" }, { w: 2700, h: "Girdi (tür; miktar; hedef; stok; °C)" }, { w: 1500, h: "Stok (BK)" }, { w: 1500, h: "Su (BK)" }, { w: 1500, h: "Stok (sistem)" }, { w: 1500, h: "Su (sistem)" }, { w: 1300, h: "En büyük |fark|" }, { w: 1200, h: "G/K" }, { w: 2720, h: "Paraf / tarih" }],
    indepCases.map(([b, a, tg, st, t], i) => [String(i + 1), `${b}; ${a} ${b === "Hacimce" ? "mL" : "g"}; %${tg}; %${st}; ${t}`, "", "", "", "", "", "", ""]),
    { width: WL, rowHeight: 520 }),
  h1("7. Performans Kalifikasyonu (PQ)"),
  h2("7.1 Cihaz ve malzeme kaydı"),
  ...table([{ w: 3000, h: "Kalem" }, { w: 3000, h: "Tanım / model" }, { w: 2400, h: "Kimlik / seri no" }, { w: 2400, h: "Kalibrasyon geçerlilik" }, { w: 2170, h: "Günlük kontrol sonucu" }, { w: 1600, h: "Paraf / tarih" }],
    ["Yoğunluk ölçer", "Terazi", "Mezür / büret", "Pipet", "Termometre", "Su banyosu", "Stok etanol (sertifika derecesi)", "Arıtılmış su"].map(k => [k, "", "", "", "", ""]),
    { width: WL, rowHeight: 520 }),
  ...phaseList("PQ").flatMap(testBlock),
  h2("7.2 Form A — Stok alkol ölçümü (PQ-0)"),
  ...table([{ w: 1400, h: "Ölçüm" }, { w: 2400, h: "Yoğunluk (kg/m³)" }, { w: 2000, h: "Sıcaklık (°C)" }, { w: 2800, h: "Sistem: %v/v · %w/w" }, { w: 2600, h: "Ph. Eur.: %v/v" }, { w: 1570, h: "Fark" }, { w: 1800, h: "Paraf / tarih" }],
    [["1", "", "", "", "", "", ""], ["2", "", "", "", "", "", ""], ["3", "", "", "", "", "", ""], ["Ortalama", "", "", "", "", "", ""]],
    { width: WL, rowHeight: 520 }),
  h2("7.3 Form B — Hazırlık ve ölçüm (PQ-1 … PQ-4)"),
  ...table([{ w: 1100, h: "Test" }, { w: 900, h: "Hazırlık" }, { w: 1700, h: "Stok ölçülen (mL / g)" }, { w: 1700, h: "Su ölçülen (mL / g)" }, { w: 1300, h: "ρ₁ (kg/m³)" }, { w: 1300, h: "ρ₂ (kg/m³)" }, { w: 1500, h: "Derece (sistem)" }, { w: 1500, h: "Derece (Ph. Eur.)" }, { w: 1300, h: "Hedeften sapma" }, { w: 600, h: "G/K" }, { w: 1670, h: "Paraf / tarih" }],
    [...["PQ-1", "PQ-2", "PQ-3"].flatMap(t => ["1", "2", "3", "Ort."].map(n => [t, n, "", "", "", "", "", "", "", "", ""])), ["PQ-4", "1", "", "", "", "", "", "", "", "", ""]],
    { width: WL, rowHeight: 480 }),
  PORTRAIT,

  h1("8. Yürütme Özeti"),
  ...table([{ w: 1300, h: "Test" }, { w: 4338, h: "Başlık" }, { w: 1600, h: "Sonuç" }, { w: 1200, h: "Sapma no" }, { w: 1200, h: "Paraf" }],
    TESTS.map(t => [t.id, t.title, "", "", ""]), { rowHeight: 360 }),
  h2("8.1 Yürütme sonrası inceleme ve onay"),
  p("Kontrol Eden, tüm test kayıtlarının eksiksiz, okunaklı ve GDP'ye uygun olduğunu, kanıtların ekli olduğunu ve sapmaların kayda geçtiğini doğrular. QA, sonuçları Validasyon Özet Raporu'na aktarılmak üzere onaylar."),
  ...table([{ w: 4638, h: "Rol / Ad Soyad" }, { w: 3000, h: "İmza" }, { w: 2000, h: "Tarih" }],
    [["Kontrol Eden (yürütme incelemesi)", "", ""], ["Onaylayan — Kalite Güvence (QA)", "", ""]], { rowHeight: 1000 }),

  h1("Ek A. URS → Test İzlenebilirliği"),
  p("Doğrulama yöntemi yalnız K (kod/belge incelemesi) olan maddeler PTC-VAL-ALC-06 ve belge incelemesiyle karşılanır."),
  ...table([{ w: 2200, h: "URS" }, { w: 1200, h: "Doğr." }, { w: 6238, h: "Test durumları" }],
    urs.rows.map(row => [row[0], row[4], byUrs.get(row[0])?.join(", ") ?? "PTC-VAL-ALC-06 / belge incelemesi"])),
];

module.exports = { meta, body, ids: TESTS.map(t => t.id) };
