const fs = require("fs");
const path = require("path");
const { p, h1, h2, bullets, table, kv } = require("./lib");

const meta = {
  docNo: "PTC-VAL-ALC-05",
  rev: "00",
  status: "TASLAK — onaya sunulacak",
  title: "Tasarım Spesifikasyonu (DS)",
  system: "Alkol Seyreltme Aracı (ptcalc.tr/alcohol-dilution)",
  version: "v1.1.0 kodundan; Ek A katsayıları belge üretilirken kaynak koddan okunur.",
  related: "PTC-VAL-ALC-04 Fonksiyonel Spesifikasyon; PTC-VAL-ALC-06 Kaynak Kod İnceleme Raporu",
  revisions: [["00", "", "İlk yayın.", "—"]],
};

// --- Katsayılar ve sabitler kaynak koddan okunur; belge kodla elle eşitlenmez. ---
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
const constant = name => {
  const m = src.match(new RegExp(`const (?:double|int) ${name} = ([^;]+);`));
  if (!m) throw new Error(`${name} sabiti bulunamadı`);
  return m[1].trim();
};
const K = Object.fromEntries(["MinTemperature", "MaxTemperature", "ReferenceTemperature", "Tolerance", "MaxIterations"].map(n => [n, constant(n)]));
// Ondalık noktayı Türkçe virgüle çevirir; tabloda değer koddaki basamaklarla aynı kalır.
const tr = s => s.replace(".", ",");

const coefRows = [
  ...A.map((v, i) => [`A${i + 1}`, "w^" + i, tr(v)]),
  ...B.map((v, i) => [`B${i + 1}`, `(t−20)^${i + 1}`, tr(v)]),
  ...C.flatMap((row, i) => row.map((v, k) => [`C${i + 1},${k + 1}`, `w^${k + 1}·(t−20)^${i + 1}`, tr(v)])),
];

const body = [
  h1("1. Amaç"),
  p("Bu belge, Fonksiyonel Spesifikasyonda (PTC-VAL-ALC-04) tanımlanan davranışın nasıl gerçekleştirildiğini tanımlar: yazılım mimarisi, modüller ve arayüzleri, hesap algoritmaları, sayısal duyarlık, hata yönetimi, yerelleştirme ve derleme/yayın düzeni. Kaynak kod incelemesi (PTC-VAL-ALC-06) ve IQ bu belgeye göre yapılır."),
  p(`Ek A'daki katsayılar ve §7'deki sabitler, belge üretilirken doğrudan kaynak dosyadan (${SRC_REL}) okunmuştur. Kod incelemesinde bu değerler OIML R 22 Ek'iyle tek tek karşılaştırılır.`),

  h1("2. Mimari"),
  h2("2.1 Katmanlar"),
  ...table([{ w: 2200, h: "Katman" }, { w: 3900, h: "Bileşen" }, { w: 3538, h: "Sorumluluk" }], [
    ["Sunum", "PTCalc/Pages/Apps/AlcoholDilution.razor (Blazor Server bileşeni)", "Girdi metnini okur, birim dönüşümü yapar, hesap kitaplığını çağırır, sonucu ve hatayı biçimlendirir. Hesap mantığı içermez."],
    ["Hesap", "PTCalc.Core/Core/Alcoholometry: OimlAlcoholometry, AlcoholDilution, DilutionResult", "OIML R 22 formülü, dönüşümler, seyreltme hesabı ve girdi sınır denetimi. ASP.NET/Blazor bağımlılığı yoktur."],
    ["Yardımcı", "PTCalc.Core/Helpers/NumericCellParser", "Kültürden bağımsız sayı okuma."],
    ["Yerelleştirme", "PTCalc/Resources/SharedResource.en.resx; PTCalc.Core/Resources/CoreText.en.tsv", "Arayüz ve hesap kitaplığı iletilerinin İngilizce karşılıkları; anahtar Türkçe metindir."],
    ["Belge", "PTCalc/Components/Guides/AlcoholDilutionGuide*.razor; PTCalc/Pages/AboutApps/AlcoholDilutionAbout.razor", "Kısa rehber ve yöntem sayfası."],
    ["Test", "PTCalc.Core.Tests: AlcoholometryTests, NumericCellParserTests; oiml_r22_reference.json", "Otomatik testler ve basılı tablo referansı."],
  ]),
  h2("2.2 Veri akışı"),
  ...bullets([
    "Kullanıcı metni (string) → Read() → NumericCellParser.TryParse → double. Okunamazsa ArgumentException (\"{alan} alanına bir sayı girin.\").",
    "Yoğunluktan derece sekmesinde g/mL seçiliyse değer 1000 ile çarpılarak kg/m³'e çevrilir; hesap kitaplığı yalnız kg/m³ alır.",
    "double girdiler → hesap kitaplığı yöntemi → DilutionResult kaydı ya da StrengthPoint değeri.",
    "Sonuç → F() / Pct() ile arayüz kültürüne göre biçimlendirme → HTML.",
    "Hesap kitaplığı ve Read() geçersiz girdide ArgumentException fırlatır; Run() bunu yakalar ve iletiyi _error alanına yazar. Sonuç alanı hesaptan önce null yapıldığından hatada sonuç gösterilmez.",
  ]),
  h2("2.3 Durum yönetimi"),
  p("Her sekmenin girdileri (metin) ve son sonucu bileşen alanlarında tutulur (_recipe, _densityResult, _strengthResult). Blazor Server'da bu alanlar kullanıcı bağlantısına (circuit) ait sunucu belleğindedir; sayfa kapatılınca silinir. Kalıcı depolama, oturum çerezi ya da veritabanı kullanılmaz (dil seçimi çerezi dışında)."),

  h1("3. Yazılım Ortamı"),
  ...kv([
    ["Çalışma ortamı", ".NET 10 (net10.0); sunucuda framework-dependent yayın, IIS (ANCM)."],
    ["Dil ve derleyici ayarları", "C#; nullable başvuru türleri açık; sürekli entegrasyonda derleme uyarıları hata sayılır (-warnaserror)."],
    ["Arayüz çatısı", "ASP.NET Core Blazor Server; Bootstrap ve Bootstrap Icons."],
    ["Hesap bağımlılıkları", "Alkolometri modülleri yalnız .NET temel kitaplığını (System.Math) kullanır; üçüncü taraf sayısal kitaplık kullanılmaz."],
    ["Test", "xUnit; System.Text.Json ile referans verisi okunur."],
    ["Referans üretimi", "tools/make_oiml_reference.py (Python, pypdf); OIML R 22 tablolarının taranmış PDF'inden."],
  ], 2400),

  h1("4. Modül Tasarımı"),
  h2("4.1 OimlAlcoholometry (statik sınıf)"),
  ...table([{ w: 2900, h: "Üye" }, { w: 2600, h: "Girdi → çıktı" }, { w: 2338, h: "Denetim" }, { w: 1800, h: "OIML karşılığı" }], [
    ["MinTemperature, MaxTemperature, ReferenceTemperature", `Sabitler: ${K.MinTemperature}, ${K.MaxTemperature}, ${K.ReferenceTemperature} °C`, "—", "Geçerlilik aralığı"],
    ["EthanolDensity20", "ρ(1, 20) kg/m³", "—", "≈ 789,24"],
    ["WaterDensity(t)", "t → ρ(0, t)", "Sıcaklık", "Tablo I, w = 0"],
    ["DensityFromMassPercent(p, t)", "%w/w, °C → kg/m³", "Oran, sıcaklık", "Tablo I, IIIa"],
    ["DensityFromVolumePercent(q, t)", "%v/v, °C → kg/m³", "Oran, sıcaklık", "Tablo II, IVa"],
    ["MassToVolumePercent(p)", "%w/w → %v/v", "Oran", "Tablo IIIb"],
    ["VolumeToMassPercent(q)", "%v/v → %w/w (iterasyon)", "Oran", "Tablo IVb"],
    ["MassPercentFromDensity(ρ, t)", "kg/m³, °C → %w/w (ikiye bölme)", "Sıcaklık, yoğunluk aralığı", "Tablo Va, VI"],
    ["VolumePercentFromDensity(ρ, t)", "kg/m³, °C → %v/v", "Sıcaklık, yoğunluk aralığı", "Tablo Vb, VII"],
    ["Formula(w, t) (özel)", "kütle kesri, °C → kg/m³", "Yok (çağıran denetler)", "Genel formül"],
  ]),
  h2("4.2 AlcoholDilution (statik sınıf) ve DilutionResult"),
  ...table([{ w: 3100, h: "Üye" }, { w: 6538, h: "Tanım" }], [
    ["ByVolume(V, q_hedef, q_stok, t = 20)", "Hacimce tarif: V mL, %v/v dereceler. Sırasıyla miktar ve derece denetimi, ardından Build()."],
    ["ByMass(m, p_hedef, p_stok, t = 20)", "Kütlece tarif: m g, %w/w dereceler. Sıcaklık yalnız yaklaşık hacimler için kullanılır (yine de aralık denetimi uygulanır)."],
    ["Build(...) (özel)", "Kütle dengesi ve hacimler (§6.5)."],
    ["CheckAmount, CheckStrengths (özel)", "Miktar > 0 ve sonlu; 0 < stok ≤ 100; 0 < hedef < stok. NaN reddedilir."],
  ]),
  ...table([{ w: 2600, h: "DilutionResult alanı" }, { w: 1300, h: "Birim" }, { w: 5738, h: "Tanım" }], [
    ["Basis, Temperature", "—, °C", "Derece türü ve hazırlama sıcaklığı."],
    ["TargetPercent, StockPercent", "%", "Girilen dereceler (girilen türde)."],
    ["TargetMassPercent, StockMassPercent", "%w/w", "Kütlece karşılıklar."],
    ["FinalVolume, FinalMass", "mL, g", "Son karışımın t'deki hacmi ve kütlesi."],
    ["EthanolMass", "g", "Son karışımdaki saf etanol kütlesi."],
    ["StockVolume, StockMass", "mL, g", "Ölçülecek / tartılacak stok miktarı."],
    ["WaterVolume, WaterMass", "mL, g", "Eklenecek su miktarı."],
    ["Contraction", "mL", "StockVolume + WaterVolume − FinalVolume."],
    ["NaiveWaterVolume", "mL", "FinalVolume − StockVolume (basit orantı)."],
  ]),
  h2("4.3 NumericCellParser.TryParse"),
  p("Metindeki nokta ve virgül sayılır. İkisi de varsa sonda kalan ondalık ayırıcıdır, diğeri silinir; tek ayırıcı bir kez geçiyorsa ondalık kabul edilip noktaya çevrilir; aynı ayırıcı birden fazla geçiyorsa hepsi silinir. Normalleştirilen metin invariant kültürde NumberStyles.Float ile ayrıştırılır (işaret, üs ve baş/son boşluk kabul edilir; binlik ayırıcı kabul edilmez). Sonuç makinenin bölge ayarından etkilenmez."),
  h2("4.4 Arayüz bileşeni (AlcoholDilution.razor)"),
  ...table([{ w: 2600, h: "Yöntem" }, { w: 7038, h: "Davranış" }], [
    ["ComputeRecipe()", "_recipe = null; dört alanı okur (stok, hedef, miktar, sıcaklık); türe göre ByVolume ya da ByMass."],
    ["ComputeDensity()", "_densityResult = null; derece ve sıcaklığı okur; hacimce ise VolumeToMassPercent; DensityFromMassPercent ve MassToVolumePercent ile sonuç."],
    ["ComputeStrength()", "_strengthResult = null; yoğunluk ve sıcaklığı okur; g/mL ise ×1000; MassPercentFromDensity ve MassToVolumePercent ile sonuç."],
    ["Run(action)", "_error = null; eylemi çalıştırır; yalnız ArgumentException yakalanır ve iletisi _error'a yazılır."],
    ["Read(text, alan)", "NumericCellParser.TryParse; başarısızsa alan adını içeren ArgumentException."],
    ["F(değer, biçim)", "CultureInfo.CurrentCulture ile ToString; varsayılan biçim F2."],
    ["Pct(değer, tür)", "Türkçede \"%62,39 w/w\", İngilizcede \"62.39% w/w\"."],
    ["SelectTab(tab)", "Etkin sekmeyi değiştirir, _error'ı siler; sonuçlara dokunmaz."],
  ]),

  h1("5. Arayüz Kültürü ve Yerelleştirme"),
  ...bullets([
    "İstek kültürü RequestLocalization ile alan adından ya da dil çerezinden belirlenir; varsayılan tr-TR (Program.cs). F() ve Pct() bu kültürü kullanır.",
    "Arayüz metinleri @L[\"Türkçe metin\"] ile yazılır; İngilizcesi SharedResource.en.resx'te, anahtar Türkçe metindir. Karşılığı olmayan anahtar Türkçe görünür; bu nedenle eksik çeviri OQ'da metin incelemesiyle aranır.",
    "Hesap kitaplığının iletileri CoreText.T(\"Türkçe\", args) ile üretilir; İngilizcesi CoreText.en.tsv'dedir (satır = anahtar TAB çeviri).",
    "Hesap kitaplığı kültürden bağımsızdır: double değerlerle çalışır, metin ayrıştırmaz (ayrıştırma NumericCellParser'da invariant kültürle yapılır).",
  ]),

  h1("6. Algoritmalar"),
  h2("6.1 OIML R 22 genel formülü"),
  p("ρ(w, t) = A₁ + Σₖ₌₂¹² Aₖ·w^(k−1) + Σₖ₌₁⁶ Bₖ·(t − 20)^k + Σᵢ₌₁⁵ Σₖ₌₁^mᵢ Cᵢ,ₖ·w^k·(t − 20)^i,  m = (11, 10, 9, 4, 2)"),
  p("w kütle kesri (0–1), t °C (IPTS-68), ρ kg/m³. Formula(w, t) terimleri doğrudan Math.Pow ile toplar; girdi denetimi yapmaz, denetim çağıran açık yöntemlerdedir. Katsayılar Ek A'dadır."),
  h2("6.2 Kütlece orandan hacimce dereceye"),
  p("φ = w · ρ(w, 20) / ρ_E(20),  ρ_E(20) = ρ(1, 20). Kapalı biçimde, iterasyonsuz hesaplanır."),
  h2("6.3 Hacimce dereceden kütlece orana"),
  p(`w denklemi w = φ · ρ_E(20) / ρ(w, 20) sabit nokta iterasyonuyla çözülür: w₀ = φ, wₙ₊₁ = φ · ρ_E(20) / ρ(wₙ, 20). Durma ölçütü |wₙ₊₁ − wₙ| < ${K.Tolerance}; en çok ${K.MaxIterations} adım.`),
  p("Yakınsama gerekçesi (kod açıklamasından): g(w) = φ·ρ_E/ρ(w) için |g′(w)| = w·|dρ/dw|/ρ aralık boyunca 0,4'ün altındadır (en büyük değer w → 1'de ≈ 0,399). Bu durumda hata her adımda en az 0,4 katına iner; 1e-12'ye en çok yaklaşık 31 adımda ulaşılır. Bu gerekçe OQ'da %0–100 aralığında sayısal olarak doğrulanır (PTC-VAL-ALC-03 R-03)."),
  h2("6.4 Yoğunluktan kütlece orana"),
  p(`ρ_ölçülen için ρ(w, t) = ρ_ölçülen denkleminin w ∈ [0, 1] kökü ikiye bölme yöntemiyle bulunur. Önce ρ_ölçülen'in [ρ(1, t), ρ(0, t)] aralığında olduğu denetlenir. Her adımda orta noktada ρ > ρ_ölçülen ise alt sınır, değilse üst sınır orta noktaya taşınır; aralık genişliği ${K.Tolerance}'un altına inince ya da ${K.MaxIterations} adımda durulur ve orta nokta döndürülür. Yaklaşık 40 adım yeter; sonuçtaki hata kütle kesrinde 5e-13'ten küçüktür. Yöntem, ρ'nun her sıcaklıkta w ile tekdüze azalmasına dayanır; bu varsayım OQ'da −20…40 °C ızgarasında doğrulanır (R-04).`),
  h2("6.5 Seyreltme hesabı"),
  ...table([{ w: 3000, h: "Büyüklük" }, { w: 6638, h: "Hesap" }], [
    ["Kütlece oranlar", "Hacimce türde w_h = §6.3(q_h), w_s = §6.3(q_s); kütlece türde w_h = p_h, w_s = p_s."],
    ["Son kütle m_son (g)", "Hacimce türde V · ρ(w_h, t) / 1000 (V mL, ρ kg/m³); kütlece türde m."],
    ["Etanol kütlesi m_E", "m_son · w_h / 100"],
    ["Stok kütlesi m_stok", "m_E / (w_s / 100)"],
    ["Su kütlesi m_su", "m_son − m_stok"],
    ["Yoğunluklar (g/mL)", "ρ_son = ρ(w_h, t)/1000; ρ_stok = ρ(w_s, t)/1000; ρ_su = ρ(0, t)/1000"],
    ["Hacimler (mL, t'de)", "V_son = m_son/ρ_son; V_stok = m_stok/ρ_stok; V_su = m_su/ρ_su"],
    ["Büzülme", "V_stok + V_su − V_son"],
    ["Basit orantıyla su", "V_son − V_stok"],
  ]),
  p("Kütle dengesi sıcaklıktan bağımsızdır; sıcaklık yalnız kütle ↔ hacim çevriminde girer. t = 20 °C'de hacimce türde V_stok = V · q_h / q_s olur (hacimce derecenin tanımı gereği 20 °C'de etanol hacmi korunur); bu özdeşlik testlerde denetlenir."),

  h1("7. Sayısal Duyarlık ve Sabitler"),
  ...table([{ w: 3000, h: "Sabit / özellik" }, { w: 2400, h: "Değer" }, { w: 4238, h: "Kullanım" }], [
    ["Sayı türü", "IEEE 754 double", "Yaklaşık 15–16 anlamlı basamak."],
    ["Tolerance", tr(K.Tolerance), "İterasyon ve ikiye bölme durma ölçütü (kütle kesri)."],
    ["MaxIterations", K.MaxIterations, "İterasyon ve ikiye bölme için güvenlik sınırı."],
    ["MinTemperature / MaxTemperature", `${K.MinTemperature} / ${K.MaxTemperature} °C`, "OIML R 22 geçerlilik aralığı."],
    ["ReferenceTemperature", `${K.ReferenceTemperature} °C`, "Hacimce derecenin ve Tablo III–V'in referans sıcaklığı."],
  ]),

  h1("8. Hata Yönetimi"),
  ...bullets([
    "Geçersiz girdi her katmanda ArgumentException ile bildirilir; ileti kullanıcıya gösterilecek metindir (FS §7.2).",
    "Hesap kitaplığı açık yöntemleri girdiyi kendisi denetler; arayüzün denetimine güvenmez. Böylece kitaplık başka bir arayüzden çağrıldığında da aynı sınırlar uygulanır.",
    "Arayüz yalnız ArgumentException'ı yakalar. Beklenmeyen başka bir hata Blazor'un genel hata ekranına düşer ve sonuç gösterilmez (bkz. §11, DS-N3).",
  ]),

  h1("9. Planlanan İşlevlerin Tasarımı"),
  ...table([{ w: 1400, h: "FS" }, { w: 8238, h: "Tasarım" }], [
    ["FS-ALC-60", "Sürüm ve commit, derlemede AssemblyInformationalVersion'a gömülür (.NET SDK SourceRevisionId / SourceLink ile \"+<commit>\" eki). Sayfa altı bileşeni bu değeri okur; ilk 7 karakter gösterilir. Değer elle girilmez."],
    ["FS-ALC-61", "Sonuç kartına \"Yazdır / PDF\" düğmesi; @media print stil sayfası ile yalnız çıktı bölümü basılır. Hesap anındaki tarih–saat sonuç nesnesine eklenir (sunucu UTC saati, tarayıcı saat dilimine çevrilerek ISO 8601 biçiminde). Girilen metinler sonuçla birlikte saklanır. Sunucuda dosya oluşturulmaz."],
    ["FS-ALC-62", "Belirsiz girdi deseni ^[+-]?\\d{1,3}[.,]\\d{3}$ Read() içinde denetlenir; eşleşirse uyarı listesine eklenir, hesap sürer."],
    ["FS-ALC-63", "Sekmedeki her girdi ve seçim alanında @bind:after o sekmenin sonuç alanını null yapar (ClearRecipe, ClearDensity, ClearStrength). Metin alanları @bind:event=\"oninput\" ile her tuşta, seçimler değişimde tetiklenir."],
    ["FS-ALC-64", "OIML Tablo I'in 0 °C altındaki sütunlarının basılı en düşük kütlece dereceleri bir dizi olarak hesap kitaplığına eklenir; ara sıcaklıkta doğrusal interpolasyon. Değerler basılı tablodan aktarılır ve kod incelemesinde tabloyla karşılaştırılır. Uyarı hesap sonucunu değiştirmez."],
    ["FS-ALC-65", "Kısa rehber metni güncellenir (Türkçe ve İngilizce)."],
  ]),

  h1("10. Derleme, Sürüm ve Yayın"),
  ...bullets([
    "Sürüm numarası PTCalc.Core.csproj <Version> alanındadır; her yayında CITATION.cff ile birlikte güncellenir, vX.Y.Z Git etiketi ve GitHub Release atılır; Zenodo yayını arşivler.",
    "Günlük çalışma dev dalındadır. Her push'ta .github/workflows/test.yml Ubuntu ve Windows'ta çözümü uyarılar hata sayılarak derler ve tüm testleri koşar (TRX çıktısı).",
    "Canlı yayın yalnız main dalına birleştirmeyle tetiklenir (.github/workflows/deploy.yml): testler yeniden koşulur, geçmezse yayın yapılmaz; framework-dependent, UseAppHost=false yayın FTPS ile sunucuya aktarılır. Belge değişiklikleri yayını tetiklemez.",
    "Kapsamdaki bileşenleri değiştiren yayınlar CHANGELOG'da ayrıca işaretlenir (URS-ALC-CHG-02; planlanan).",
  ]),

  h1("11. Tasarımda Saptanan Noktalar"),
  p("Aşağıdaki noktalar kaynak kod incelemesine (PTC-VAL-ALC-06) devredilir; inceleme sonucu orada kapatılır."),
  ...table([{ w: 1100, h: "No" }, { w: 5838, h: "Nokta" }, { w: 2700, h: "Öneri / risk" }], [
    ["DS-N1", `VolumeToMassPercent, ${K.MaxIterations} adımda yakınsamazsa son değeri uyarısız döndürür. Yakınsama kuramsal olarak güvence altında olsa da sessiz dönüş savunmacı tasarıma aykırıdır.`, "Yakınsamazsa hata fırlatılması; R-03."],
    ["DS-N2", "MassPercentFromDensity, adım sınırına ulaşırsa da orta noktayı döndürür. İkiye bölme yaklaşık 40 adımda durduğundan pratikte erişilemez.", "Bilgi; değişiklik gerekmez."],
    ["DS-N3", "Arayüz yalnız ArgumentException'ı yakalar; beklenmeyen hata genel hata ekranına düşer.", "Kabul edilebilir: hatalı sonuç gösterilmez."],
    ["DS-N4", "NumberStyles.Float bilimsel gösterimi kabul eder (\"1e2\" → 100).", "Bilgi; FS-ALC-40'ta belgelendi."],
    ["DS-N5", "Biçimlendirme CultureInfo.CurrentCulture'a bağlıdır; dil ile kültürün uyumu istek yerelleştirmesine dayanır.", "OQ'da iki alan adında doğrulanır (URS-ALC-LNG-02)."],
  ]),

  h1("12. Mevcut Otomatik Testler"),
  ...table([{ w: 3600, h: "Test" }, { w: 3838, h: "Denetlediği" }, { w: 2200, h: "URS" }], [
    ["Reproduces_printed_OIML_table (8 tablo)", "Tablo I, II, IIIa, IIIb, IVa, IVb, Va, Vb basılı değerleri; 2 ondalık, sınırda ±0,01.", "ACC-01, ACC-02"],
    ["Pure_ethanol_and_water_densities_match_OIML", "ρ_E(20) ≈ 789,24; ρ_su(20) = 998,20 kg/m³.", "ACC-02"],
    ["Volume_mass_conversion_round_trips", "%0, 5, 40, 70, 96, 100'de v/v → w/w → v/v, 9 ondalık.", "ACC-04"],
    ["Density_to_strength_inverts_the_formula_at_any_temperature", "−20, 0, 20, 40 °C'de %0–100 (5 adım) ters çevirme, 8 ondalık.", "ACC-04, STR-01"],
    ["Density_outside_water_ethanol_range_is_rejected", "Aralık dışı yoğunluk ve sıcaklık reddi.", "INP-04, INP-07"],
    ["Dilution_by_volume_accounts_for_contraction", "96 → 70 %v/v, 100 mL: stok hacmi, son kütle, su hacmi, korunum, büzülme.", "REC-01, REC-03, ACC-06"],
    ["Dilution_by_mass_is_a_plain_mass_balance", "120 g, 90 → 60 %w/w kütle dengesi.", "REC-02, ACC-06"],
    ["Dilution_away_from_20C_still_gives_the_target_strength", "25 °C'de hazırlanan karışımın 20 °C derecesi hedefe eşit.", "REC-04"],
    ["Dilution_rejects_target_not_below_stock", "Hedef = stok ve miktar = 0 reddi.", "INP-05, INP-06"],
    ["NumericCellParserTests", "Ayırıcı kuralları ve kültürden bağımsızlık.", "INP-01, ACC-07"],
  ]),
  p("Eksik testler (E-4, E-5 ve risk değerlendirmesindeki genişletmeler) OQ protokolünde (PTC-VAL-ALC-07) tanımlanır."),

  h1("Ek A. OIML R 22 Katsayıları (koddaki değerler)"),
  p(`Kaynak: ${SRC_REL}. Değerler koddaki basamaklarla aynıdır; ondalık ayırıcı virgüle çevrilmiştir. Toplam ${coefRows.length} katsayı (A: ${A.length}, B: ${B.length}, C: ${C.flat().length}).`),
  ...table([{ w: 1600, h: "Katsayı" }, { w: 3200, h: "Çarpılan terim" }, { w: 4838, h: "Değer" }], coefRows),
];

module.exports = { meta, body };
