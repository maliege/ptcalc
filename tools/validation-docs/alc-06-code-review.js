const { p, h1, h2, bullets, table, kv } = require("./lib");
const { A, B, C, SRC_REL } = require("./oiml-source");

const meta = {
  docNo: "PTC-VAL-ALC-06",
  rev: "00",
  status: "TASLAK — bağımsız teknik kontrolörün doğrulamasına sunulacak",
  title: "Kaynak Kod İnceleme Raporu",
  system: "Alkol Seyreltme Aracı (ptcalc.tr/alcohol-dilution)",
  version: "İncelenen commit: daf779b (dev dalı), 2026-10-23",
  related: "PTC-VAL-ALC-04 FS; PTC-VAL-ALC-05 DS; PTC-VAL-ALC-03 Risk Değerlendirmesi",
  revisions: [["00", "", "İlk yayın (inceleme taslağı).", "—"]],
};

// İnceleme anındaki kayıtlar. Bu bölüm bir kayıttır; kod sonradan değişse de güncellenmez.
const REVIEW = {
  commit: "daf779b",
  date: "2026-10-23",
  sdk: ".NET SDK 10.0.402 (Windows 11)",
  testsAll: "740 test, 740 başarılı, 0 başarısız",
  testsScope: "38 test (AlcoholometryTests, NumericCellParserTests), 38 başarılı",
  files: [
    ["PTCalc.Core/Core/Alcoholometry/OimlAlcoholometry.cs", "202d812b96b0"],
    ["PTCalc.Core/Core/Alcoholometry/AlcoholDilution.cs", "98ed1d1ae188"],
    ["PTCalc.Core/Helpers/NumericCellParser.cs", "98d436dc7942"],
    ["PTCalc/Pages/Apps/AlcoholDilution.razor", "2a2fa9445120"],
    ["PTCalc.Core/Resources/CoreText.en.tsv", "31b4688d247a"],
    ["PTCalc/Resources/SharedResource.en.resx", "2929d85fa6ac ¹"],
    ["PTCalc/Components/Guides/AlcoholDilutionGuide.razor", "e915c5063418"],
    ["PTCalc/Pages/AboutApps/AlcoholDilutionAbout.razor", "67bb9d5700ff"],
    ["PTCalc.Core.Tests/AlcoholometryTests.cs", "c7275611eb92"],
    ["PTCalc.Core.Tests/NumericCellParserTests.cs", "e30357708ac4"],
    ["PTCalc.Core.Tests/oiml_r22_reference.json", "6eb55d858837"],
    ["tools/make_oiml_reference.py", "0cc71d5fa5e8"],
  ],
  // refcalc.numericChecks() ve compare.js çıktıları (2026-10-23).
  numeric: {
    maxSteps: 24, maxStepsAt: "%97,66 v/v", maxG: "0,3987", maxGAt: "w = 1",
    monotonePoints: "610 061", minStep: "0,0006 kg/m³ (−20 °C, %18,93 w/w)", roundTrip: "2,8·10⁻¹¹",
  },
  compare: [
    ["%v/v → %w/w (0–100, 0,1 adım)", "1 001", "6,2·10⁻¹¹ %"],
    ["%w/w → %v/v (0–100, 0,1 adım)", "1 001", "1,7·10⁻¹¹ %"],
    ["ρ(p, t) (p 0–100, t −20…40, 1'er adım)", "6 161", "2,4·10⁻¹⁰ kg/m³"],
    ["ρ → %w/w ters çevirme (aynı ızgara)", "6 161", "9,3·10⁻¹¹ %"],
    ["Seyreltme (16 vaka, iki tür, −5…35 °C; 9 çıktı alanı)", "144", "1,9·10⁻¹⁰ mL/g"],
  ],
  tableTolerance: { cells: "6 889", needed: 5, boundary: 5 },
};

const RES = { w: 1300, h: "Sonuç" };
const CHECK_COLS = [{ w: 700, h: "No" }, { w: 3300, h: "İnceleme ölçütü" }, RES, { w: 3438, h: "Kanıt / not" }, { w: 900, h: "BK ✓" }];

const body = [
  h1("1. Amaç"),
  p("Bu rapor, Alkol Seyreltme aracının kaynak kodunun Tasarım Spesifikasyonuna (PTC-VAL-ALC-05) uygunluğunu, hesap yönteminin doğruluğunu, girdi denetimini, hata yönetimini, yerelleştirmeyi ve otomatik testlerin yeterliliğini inceler (Annex 11 §4.6; GAMP 5 Kategori 5). Bulgular sınıflandırılır ve kapanışları izlenir."),

  h1("2. İncelemenin Niteliği ve Bağımsızlık"),
  p("Bu raporun ilk taslağı yapay zekâ destekli bir kod incelemesiyle (Anthropic Claude) hazırlanmıştır: kod okunmuş, otomatik testler koşulmuş ve hesaplar sistemden ayrı yazılmış bir referans hesapla karşılaştırılmıştır. Bu taslak, Validasyon Planı'nın gerektirdiği bağımsız insan incelemesinin yerini tutmaz."),
  p("**Bağımsız teknik kontrolör:** her inceleme ölçütünü (§4) kendisi doğrular ve \"BK ✓\" sütununu paraflar; Ek A'daki katsayıları OIML R 22 basılı Ek'iyle kendisi karşılaştırır; bulguların (§6) sınıfını onaylar ya da değiştirir. Kontrolör raporu \"Hazırlayan\" olarak imzalar; imza, incelemenin kontrolör tarafından yapıldığını ve sonuçlarını üstlendiğini beyan eder. Geliştirici \"Kontrol Eden\" olarak yalnız bulguların teknik olarak anlaşıldığını imzalar (PTC-VAL-ALC-00 §9)."),

  h1("3. Kapsam ve İnceleme Ortamı"),
  ...kv([
    ["İncelenen commit", `${REVIEW.commit} (dev dalı)`],
    ["İnceleme tarihi", REVIEW.date],
    ["Derleme ortamı", REVIEW.sdk],
    ["Tüm test paketi", REVIEW.testsAll],
    ["Kapsamdaki testler", REVIEW.testsScope],
    ["Referans hesap", "tools/validation-docs/refcalc.js: OIML formülünün ayrı JavaScript uygulaması; ters dönüşümler sistemden farklı yöntemle (ikiye bölme) çözülür. Katsayılar kaynak koddan okunur; aynılıkları Ek A ile denetlenir."],
    ["Sistem çıktısı", "tools/validation-docs/syscheck: derlenmiş PTCalc.Core kitaplığını çağırıp sonuçları yazar; compare.js referansla karşılaştırır."],
  ], 2600),
  h2("3.1 İncelenen dosyalar"),
  ...table([{ w: 6800, h: "Dosya" }, { w: 2838, h: "Git blob (ilk 12)" }], REVIEW.files),
  p("¹ Çalışma kopyasında bu dosyada kapsam dışı (üçgen faz diyagramı) commit edilmemiş değişiklikler vardı; inceleme commit'teki hâline göre yapılmıştır. Diğer dosyalar commit'le aynıdır.", { run: { size: 16, italics: true } }),

  h1("4. İnceleme Ölçütleri ve Sonuçlar"),
  p("Sonuç: **Uygun**, **Bulgu** (bkz. §6) ya da **BK** (yalnız bağımsız kontrolör yapabilir). \"BK ✓\" sütunu kontrolörün parafı içindir."),
  h2("4.1 Hesap yöntemi"),
  ...table(CHECK_COLS, [
    ["K-01", "Formülün yapısı DS §6.1 ile aynı: A terimleri w⁰…w¹¹, B terimleri (t−20)¹…⁶, C terimleri w^k·(t−20)^i, m = (11, 10, 9, 4, 2).", "Uygun", "OimlAlcoholometry.cs:178–197. Tablo I ve II'de −20…40 °C basılı değerler yeniden üretiliyor.", ""],
    ["K-02", "Katsayıların OIML R 22 Ek'iyle birebir aynılığı.", "BK", `Ek A (${A.length + B.length + C.flat().length} katsayı). Dolaylı kanıt: 6 889 basılı hücre yeniden üretiliyor.`, ""],
    ["K-03", "Birimler: w kütle kesri (yüzde/100), yoğunluk kg/m³, seyreltmede g/mL (÷1000), g/mL girdisi ×1000.", "Uygun", "AlcoholDilution.cs:76–78; AlcoholDilution.razor ComputeStrength.", ""],
    ["K-04", "%w/w → %v/v dönüşümü DS §6.2 ile aynı.", "Uygun", "MassToVolumePercent; referansla en büyük fark 1,7·10⁻¹¹ %.", ""],
    ["K-05", "%v/v → %w/w sabit nokta iterasyonunun yakınsaması.", "Uygun", `|g′| en büyük ${REVIEW.numeric.maxG} (${REVIEW.numeric.maxGAt}); 0,01 adımlı 10 001 noktada en çok ${REVIEW.numeric.maxSteps} adım (${REVIEW.numeric.maxStepsAt}); sınır 200.`, ""],
    ["K-06", "İterasyon sınırına ulaşıldığında davranış.", "Bulgu", "KI-01.", ""],
    ["K-07", "Yoğunluktan derece: ρ'nun w ile tekdüze azalması (ikiye bölmenin önkoşulu).", "Uygun", `${REVIEW.numeric.monotonePoints} noktada (−20…40 °C, 1 °C; %0–100, 0,01) tekdüze; en küçük adım ${REVIEW.numeric.minStep}.`, ""],
    ["K-08", "İkiye bölmenin durması ve sonucu.", "Uygun", "Aralık 1e-12'nin altına yaklaşık 40 adımda iner; adım sınırına ulaşılamaz (DS-N2).", ""],
    ["K-09", "Seyreltme kütle dengesi ve hacimler DS §6.5 ile aynı.", "Uygun", "AlcoholDilution.Build; 16 vakada referansla en büyük fark 1,9·10⁻¹⁰.", ""],
    ["K-10", "Sayısal duyarlık: büyük katsayılı polinomda basamak kaybı ve tolerans seçimi.", "Uygun", "Polinom [0, 1]'de değerlendirilir; |Aₖ| ≤ 7,5·10⁵, ρ ≈ 10³: yaklaşık 3 basamak kayıp, 1e-12 toleransı ulaşılabilir. Referansla farklar 10⁻¹⁰ düzeyinde.", ""],
  ]),
  h2("4.2 Girdi, hata yönetimi ve arayüz"),
  ...table(CHECK_COLS, [
    ["K-11", "Her açık hesap yöntemi girdisini kendisi denetler (NaN, sonsuz, aralık).", "Uygun", "CheckPercent, CheckTemperature, CheckAmount, CheckStrengths, MassPercentFromDensity aralık denetimi. Sonsuz değerler aralık sınırlarınca reddedilir.", ""],
    ["K-12", "Miktar için üst sınır.", "Gözlem", "KI-04.", ""],
    ["K-13", "Sayı okuma kuralı FS-ALC-40 ile aynı; kültürden bağımsız.", "Uygun", "NumericCellParser.cs:61–101; NumericCellParserTests.", ""],
    ["K-14", "\"NaN\" ve \"Infinity\" metinlerinin okunması.", "Gözlem", "KI-05.", ""],
    ["K-15", "Hata yönetimi: geçersiz girdide sonuç gösterilmez.", "Uygun", "Sonuç alanı hesaptan önce null (razor:267, 282, 294); ArgumentException yakalanır (razor:309).", ""],
    ["K-16", "Girdi değişince eski sonucun kaldırılması (URS-ALC-INP-08).", "Bulgu", "KI-03.", ""],
    ["K-17", "Kütlece tarifte sıcaklık denetimi.", "Gözlem", "KI-07.", ""],
    ["K-18", "Biçimlendirme FS-ALC-52/53 ile aynı (F2, F5, 0.##, 0.#; Pct dil kuralı).", "Uygun", "AlcoholDilution.razor F() ve Pct().", ""],
    ["K-19", "Sayfadaki tüm @L[...] anahtarlarının İngilizce karşılığı var.", "Uygun", "46 anahtarın 46'sı SharedResource.en.resx'te (commit'teki hâli); hesap kitaplığının 6 iletisi CoreText.en.tsv'de.", ""],
    ["K-20", "Güvenlik: girdi yalnız sayıya çevrilir; dosya, ağ, veritabanı erişimi yok; çıktı Blazor tarafından HTML olarak kodlanır.", "Uygun", "Sayfada MarkupString ya da JS çağrısı yok.", ""],
  ]),
  h2("4.3 Testler ve referans verisi"),
  ...table(CHECK_COLS, [
    ["K-21", "Otomatik testler kapsamdaki açık API'yi ve URS doğruluk ölçütlerini kapsıyor.", "Uygun", "DS §12. Eksikler OQ'da tamamlanır (E-4, E-5).", ""],
    ["K-22", "Tablo testinin toleransı açıklamasıyla tutarlı.", "Bulgu", "KI-02.", ""],
    ["K-23", "Referans verisinin üretimi hesap kodundan bağımsız.", "Uygun", "make_oiml_reference.py yalnız PDF metnini ve tablonun iç tutarlılığını kullanır; hesap kodunu çağırmaz.", ""],
    ["K-24", "OCR süzgecinin saptayamadığı hata türleri.", "Gözlem", "KI-06.", ""],
    ["K-25", "Derleme uyarısız; CI uyarıları hata sayıyor.", "Uygun", "test.yml: dotnet build -warnaserror; yerel derleme uyarısız.", ""],
  ]),

  h1("5. Sayısal Denetimler"),
  h2("5.1 Sistem ile referans hesabın karşılaştırması"),
  p("Derlenmiş PTCalc.Core kitaplığının (syscheck) çıktıları referans hesapla (refcalc.js) karşılaştırılmıştır. Kabul sınırı 1·10⁻⁶ (compare.js)."),
  ...table([{ w: 5000, h: "Karşılaştırma" }, { w: 1600, h: "Nokta" }, { w: 3038, h: "En büyük mutlak fark" }], REVIEW.compare),
  h2("5.2 Basılı tablo karşılaştırmasında 0,01 payının kullanımı"),
  p(`Referans hesapla ${REVIEW.tableTolerance.cells} basılı hücrenin ${REVIEW.tableTolerance.needed}'inde 2 ondalığa yuvarlanmış değer basılı değerden 0,01 farklıdır; bu hücrelerin ${REVIEW.tableTolerance.boundary}'i de yuvarlama sınırındadır (yuvarlanmamış değerin üçüncü ondalığı 4 ya da 5). Geri kalan tüm hücreler basılı değerle tam aynıdır. Sistem, testin açıklamasındaki daha sıkı ölçütü fiilen karşılamaktadır; ancak test bu ölçütü uygulamamaktadır (KI-02).`),

  h1("6. Bulgular"),
  ...table([{ w: 800, h: "No" }, { w: 1000, h: "Sınıf" }, { w: 2000, h: "Konum" }, { w: 3438, h: "Bulgu ve öneri" }, { w: 1200, h: "İlişki" }, { w: 1200, h: "Kapanış (BK paraf/tarih)" }], [
    ["KI-01", "Minör", "OimlAlcoholometry.cs:135–141", `VolumeToMassPercent ${200} adımda yakınsamazsa son değeri uyarısız döndürür. Yakınsama sayısal olarak gösterildi (en çok ${REVIEW.numeric.maxSteps} adım), ancak sessiz dönüş savunmacı tasarıma aykırıdır. **Öneri:** döngü sonunda InvalidOperationException fırlatılması ve bunu sınayan bir test.`, "DS-N1, R-03", ""],
    ["KI-02", "Minör", "AlcoholometryTests.cs:45 (açıklama :11)", "Test, açıklamasında yalnız yuvarlama sınırındaki hücrelere 0,01 pay tanındığını söylerken bu payı tüm hücrelere uygular. Böylece 0,01'lik sistematik bir hata testten geçebilir. **Öneri:** tam eşitlik istenmesi; 0,01 payının yalnız yuvarlanmamış değerin yuvarlama sınırına yakın olduğu hücrelerde (üçüncü ondalık 4 ya da 5) tanınması; payı kullanan hücre sayısının raporlanması.", "R-10", ""],
    ["KI-03", "Majör", "AlcoholDilution.razor:46–114", "Girdi alanları @bind ile bağlıdır ve değişimde sonuç kaldırılmaz; Hesapla'ya basılmadan ekranda eski girdilere ait sonuç kalır. URS-ALC-INP-08 karşılanmıyor. **Öneri:** FS-ALC-63 (@bind:after ile sonucun null yapılması) ve OQ testi.", "E-8, R-13", ""],
    ["KI-04", "Gözlem", "AlcoholDilution.cs:101–105", "Miktar için üst sınır yoktur. Yaklaşık 2·10³⁰⁵ mL'nin üstünde ara çarpım taşar ve sonuçlar sonsuz/NaN olur. Gerçekçi kullanımda erişilemez. **Öneri:** isteğe bağlı olarak sonuçların sonlu olduğunun denetlenmesi.", "—", ""],
    ["KI-05", "Gözlem", "NumericCellParser.cs:100", "Invariant kültür \"NaN\" ve \"Infinity\" metinlerini sayı olarak kabul eder. Hesap kitaplığı bu değerleri aralık denetimiyle reddeder; kullanıcı \"sayı girin\" yerine aralık iletisini görür. Sonuç üretilmez. **Öneri:** değişiklik gerekmez; FS-ALC-40'a not düşülebilir.", "—", ""],
    ["KI-06", "Gözlem", "make_oiml_reference.py:25, :68", "OCR süzgeci komşu hücrelerden 0,025'ten az sapan hataları ayırt edemez; son basamakta 1–2 birimlik bir okuma hatası referansa girebilir. Bu, testin 0,02'den küçük hataları ayırt etme gücünü sınırlar. **Öneri:** Ph. Eur. 5.5 ile ikinci referans (E-4) ve rastgele hücrelerin basılı tabloyla elle karşılaştırılması (OQ).", "R-09", ""],
    ["KI-07", "Gözlem", "AlcoholDilution.cs:65–71, :76", "Kütlece tarifte sıcaklık yalnız yaklaşık hacimler için kullanılır, yine de −20…40 °C dışı reddedilir. Tutucu davranıştır; kütlece hazırlığı engellemez çünkü sıcaklık alanı serbestçe 20 bırakılabilir. **Öneri:** değişiklik gerekmez.", "—", ""],
  ]),
  p("Ön değerlendirme eksikleri E-1, E-2, E-4, E-5, E-7 ve E-9 kod hatası değil, eksik işlev ya da testtir; Validasyon Planı §15'te izlenir ve burada yeniden bulgu olarak açılmamıştır. E-8 kodda doğrulandığı için KI-03 olarak kaydedilmiştir."),

  h1("7. Sonuç"),
  ...bullets([
    "Kritik bulgu yoktur. Hesap yöntemi DS ile uyumludur; sistem, ayrı yazılmış referans hesapla 10⁻¹⁰ düzeyinde, basılı OIML tablolarıyla 6 884 hücrede tam, 5 hücrede yuvarlama sınırında uyuşmaktadır.",
    "KI-03 (majör) ve KI-01, KI-02 (minör) OQ yürütmesinden önce kapatılmalıdır. Gözlemler (KI-04…KI-07) gerekçeleriyle kabul edilebilir.",
    "K-02 (katsayıların OIML Ek'iyle karşılaştırılması) bağımsız kontrolör tarafından Ek A'da tamamlanmadan bu rapor onaylanamaz.",
  ]),

  h1("Ek A. Katsayı Karşılaştırma Listesi"),
  p(`Koddaki değerler ${SRC_REL} dosyasından belge üretilirken okunmuştur. Kontrolör her satırda OIML R 22 Ek'indeki değeri yazar, aynıysa \"E\", farklıysa \"H\" işaretler ve paraflar. Herhangi bir \"H\" sapma olarak kaydedilir.`),
  ...table([{ w: 1100, h: "Katsayı" }, { w: 3000, h: "Koddaki değer" }, { w: 3300, h: "OIML R 22 Ek değeri" }, { w: 900, h: "E/H" }, { w: 1338, h: "Paraf" }], [
    ...A.map((v, i) => [`A${i + 1}`, v, "", "", ""]),
    ...B.map((v, i) => [`B${i + 1}`, v, "", "", ""]),
    ...C.flatMap((row, i) => row.map((v, k) => [`C${i + 1},${k + 1}`, v, "", "", ""])),
  ], { rowHeight: 380 }),
];

module.exports = { meta, body };
