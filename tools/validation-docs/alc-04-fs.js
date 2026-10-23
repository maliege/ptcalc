const { p, h1, h2, bullets, table, kv } = require("./lib");
const urs = require("./alc-01-urs");

const meta = {
  docNo: "PTC-VAL-ALC-04",
  rev: "00",
  status: "TASLAK — onaya sunulacak",
  title: "Fonksiyonel Spesifikasyon (FS)",
  system: "Alkol Seyreltme Aracı (ptcalc.tr/alcohol-dilution)",
  version: "Mevcut davranış v1.1.0 kodundan; §9'daki planlanan işlevler dondurulacak sürümde.",
  related: "PTC-VAL-ALC-01 URS; PTC-VAL-ALC-03 Risk Değerlendirmesi; PTC-VAL-ALC-05 Tasarım Spesifikasyonu",
  revisions: [["00", "", "İlk yayın.", "—"]],
};

// Fonksiyonel maddeler: [ID, tanım, URS listesi]. URS kapsaması aşağıda denetlenir.
const FS = [];
const spec = rows => { FS.push(...rows); return table([{ w: 1350, h: "ID" }, { w: 6088, h: "Davranış" }, { w: 2200, h: "URS" }], rows); };

const inputCols = [{ w: 2300, h: "Alan" }, { w: 1700, h: "Varsayılan" }, { w: 2700, h: "Geçerli değer" }, { w: 2938, h: "Not" }];

const body = [
  h1("1. Amaç"),
  p("Bu belge, Alkol Seyreltme aracının kullanıcıya görünen davranışını tanımlar: ekranlar, girdi alanları, geçerlilik kuralları, hata iletileri, hesap sonuçları ve sonuçların gösterim biçimi. Her fonksiyonel madde URS maddelerine bağlanır; nasıl gerçekleştirildiği Tasarım Spesifikasyonunda (PTC-VAL-ALC-05) yer alır. OQ test betikleri bu belgedeki maddelere göre yazılır."),
  p("§3–§8 mevcut davranışı (v1.1.0) tanımlar. §9, ön değerlendirme ve risk değerlendirmesinde saptanan eksikleri (E-1…E-9) gidermek için **planlanan** davranışı tanımlar; bu maddeler dondurulacak sürümde gerçekleştirilir ve o sürüm üzerinde test edilir."),

  h1("2. Tanımlar"),
  ...table([{ w: 2200, h: "Simge / terim" }, { w: 7438, h: "Anlamı" }], [
    ["φ (q)", "Hacimce alkol derecesi, %v/v; 20 °C'deki hacimlere göre."],
    ["w (p)", "Kütlece alkol oranı, %w/w."],
    ["ρ(w, t)", "Kütlece oranı w olan karışımın t sıcaklığındaki yoğunluğu, kg/m³ (OIML R 22)."],
    ["t", "Sıcaklık, °C. Hazırlama ya da ölçüm sıcaklığı."],
    ["Stok", "Seyreltilecek, derecesi bilinen alkol."],
    ["Hedef", "Hazırlanmak istenen karışımın derecesi."],
    ["Büzülme", "Stok ve su hacimleri toplamı ile karışımın hacmi arasındaki fark (mL)."],
  ]),

  h1("3. Genel Ekran Düzeni"),
  ...spec([
    ["FS-ALC-01", "Araç /alcohol-dilution adresindedir. Türkçe ptcalc.tr, İngilizce ptcalc.net alan adından sunulur; kullanıcı dil seçimini değiştirebilir.", "URS-ALC-LNG-01"],
    ["FS-ALC-02", "Sayfanın solunda üç sekmeli bir hesap kartı bulunur: \"Seyreltme tarifi\", \"Dereceden yoğunluk\", \"Yoğunluktan derece\". Varsayılan sekme Seyreltme tarifidir. Her sekmenin üstünde işlevi anlatan kısa bir açıklama vardır.", "URS-ALC-REC-01, URS-ALC-DEN-01, URS-ALC-STR-01"],
    ["FS-ALC-03", "Hesap, \"Hesapla\" düğmesiyle başlatılır. Sonuç, hesap kartının altında ayrı bir kartta yalnız etkin sekme için gösterilir. Hata iletisi hesap kartının içinde, düğmenin altında sarı uyarı kutusunda gösterilir.", "URS-ALC-INP-03"],
    ["FS-ALC-04", "Sayfanın sağında kısa kullanım rehberi (işlev, hacim büzülmesinin nedeni, yöntem, sınırlar) bulunur. Ayrıntılı yöntem açıklaması ve kaynaklar /about-alcohol-dilution sayfasındadır.", "URS-ALC-DOC-01, URS-ALC-DOC-02, URS-ALC-DOC-03"],
    ["FS-ALC-05", "Sekme değiştirildiğinde hata iletisi silinir; her sekmenin son sonucu korunur ve yalnız kendi sekmesinde gösterilir.", "URS-ALC-INP-09"],
  ]),

  h1("4. Seyreltme Tarifi"),
  h2("4.1 Girdiler"),
  ...table(inputCols, [
    ["Derece türü", "Hacimce", "Hacimce (%v/v, 20 °C) — miktar mL; Kütlece (%w/w) — miktar g", "Stok ve hedef derece aynı türdedir."],
    ["Stok alkol derecesi (%)", "96", "0 < değer ≤ 100", ""],
    ["Hedef derece (%)", "70", "0 < değer < stok derecesi", ""],
    ["Hazırlanacak miktar (mL ya da g)", "100", "değer > 0", "Birim, derece türüne göre etikette değişir."],
    ["Hazırlama sıcaklığı (°C)", "20", "−20 ≤ değer ≤ 40", "Kütlece türde yalnız yaklaşık hacimleri etkiler."],
  ]),
  h2("4.2 Hesap ve çıktılar"),
  ...spec([
    ["FS-ALC-10", "Hacimce türde son kütle, hedef karışımın hazırlama sıcaklığındaki yoğunluğundan bulunur; kütlece türde son kütle girilen miktardır. Etanol kütlesi korunur; stok kütlesi = etanol kütlesi / stok kütlece oranı, su kütlesi = son kütle − stok kütlesi. Hacimler kütlelerin hazırlama sıcaklığındaki yoğunluklara bölünmesiyle bulunur.", "URS-ALC-REC-01, URS-ALC-REC-02, URS-ALC-REC-03, URS-ALC-REC-04, URS-ALC-ACC-06"],
    ["FS-ALC-11", "Hacimce türde tarif üç numaralı adımdır: (1) \"{stok} derecelik alkolden {V_stok} mL ölçün (ya da {m_stok} g tartın).\" (2) \"Üzerine {V_su} mL saf su ekleyin (ya da {m_su} g tartın).\" (3) \"İyice karıştırın.\"", "URS-ALC-REC-01, URS-ALC-REC-06"],
    ["FS-ALC-12", "Kütlece türde adımlar: (1) \"%{stok} (w/w) alkolden {m_stok} g tartın (≈ {V_stok} mL).\" (2) \"Üzerine {m_su} g saf su ekleyin (≈ {V_su} mL).\" (3) \"İyice karıştırın.\"", "URS-ALC-REC-02, URS-ALC-REC-06"],
    ["FS-ALC-13", "Tarifin başlığı hesapta kullanılan girdileri yeniden gösterir: hedef derece ve türü, son miktar, stok derecesi ve türü, hazırlama sıcaklığı.", "URS-ALC-INP-02, URS-ALC-INP-09"],
    ["FS-ALC-14", "Tarifin altındaki tabloda: son karışımın hacmi (mL) ve kütlesi (g); kütlece ve hacimce derecesi; saf etanol kütlesi (g); hacim büzülmesi (mL); yalnız hacimce türde basit orantının önereceği su hacmi (son hacim − stok hacmi, mL).", "URS-ALC-REC-05"],
    ["FS-ALC-15", "Tablonun altında hacim büzülmesinin miktarı ve nedeni bir cümleyle açıklanır. Hazırlama sıcaklığı 20 °C'den en az 0,5 °C farklıysa \"Hacimler {t} °C'de ölçülmelidir; tartarak hazırlamak sıcaklıktan etkilenmez.\" notu eklenir.", "URS-ALC-REC-07"],
  ]),

  h1("5. Dereceden Yoğunluk"),
  ...table(inputCols, [
    ["Derece türü", "Hacimce", "Hacimce (%v/v, 20 °C); Kütlece (%w/w)", ""],
    ["Alkol derecesi (%)", "70", "0 ≤ değer ≤ 100", "Saf su (0) ve saf etanol (100) dahil."],
    ["Sıcaklık (°C)", "20", "−20 ≤ değer ≤ 40", ""],
  ]),
  ...spec([
    ["FS-ALC-20", "Sonuç tablosu: \"Yoğunluk ({t} °C)\" satırında yoğunluk kg/m³ (kalın) ve g/mL; \"Kütlece derece\" (%w/w); \"Hacimce derece (20 °C)\" (%v/v). Girilen derece hangi türdeyse öbür türdeki karşılığı da gösterilir.", "URS-ALC-DEN-01, URS-ALC-DEN-02"],
  ]),

  h1("6. Yoğunluktan Derece"),
  ...table(inputCols, [
    ["Ölçülen yoğunluk", "0,88556", "Ölçüm sıcaklığında saf etanol ile saf su yoğunlukları arasında (sınırlar dahil)", "Varsayılan, arayüz diline göre biçimlenir."],
    ["Birim", "g/mL", "g/mL; kg/m³", "g/mL girdisi 1000 ile çarpılarak kg/m³'e çevrilir."],
    ["Ölçüm sıcaklığı (°C)", "20", "−20 ≤ değer ≤ 40", ""],
  ]),
  ...spec([
    ["FS-ALC-30", "Sonuç tablosu: \"Ölçülen yoğunluk ({t} °C)\" kg/m³ ve g/mL; \"Kütlece derece\" (%w/w, kalın); \"Hacimce derece (20 °C)\" (%v/v, kalın).", "URS-ALC-STR-01"],
    ["FS-ALC-31", "Sekmenin açıklamasında girdinin gerçek yoğunluk olması gerektiği ve cam alkolmetre okumaları için cam genleşme düzeltmesi yapılmadığı yazılır; aynı bilgi kısa rehberin \"Sınırlar\" bölümünde de yer alır.", "URS-ALC-STR-02, URS-ALC-DOC-03"],
  ]),

  h1("7. Girdi Okuma ve Doğrulama"),
  h2("7.1 Sayı okuma kuralı"),
  ...spec([
    ["FS-ALC-40", "Baştaki ve sondaki boşluklar atılır. Metinde hem nokta hem virgül varsa sonda kalan ondalık ayırıcıdır, diğeri binlik ayırıcıdır (\"1.234,5\" ve \"1,234.5\" → 1234,5). Tek ayırıcı bir kez geçiyorsa ondalıktır (\"96,5\" ve \"96.5\" → 96,5; \"1,000\" → 1). Aynı ayırıcı birden fazla geçiyorsa binlik ayırıcıdır (\"1.234.567\" → 1234567). Sonuç sunucunun ya da tarayıcının bölge ayarından bağımsızdır. Bilimsel gösterim (\"1e2\" → 100) kabul edilir.", "URS-ALC-INP-01, URS-ALC-ACC-07"],
  ]),
  h2("7.2 Doğrulama sırası ve iletiler"),
  p("Denetimler aşağıdaki sırayla yapılır; ilk başarısız denetimin iletisi gösterilir, sonuç üretilmez ve o sekmenin önceki sonucu kaldırılır (FS-ALC-50)."),
  ...table([{ w: 900, h: "Sıra" }, { w: 3000, h: "Koşul" }, { w: 2869, h: "İleti (TR)" }, { w: 2869, h: "İleti (EN)" }], [
    ["1", "Bir alan sayı olarak okunamıyor (alanlar ekrandaki sırayla denetlenir).", "\"{alan}\" alanına bir sayı girin.", "Enter a number in the \"{field}\" field."],
    ["2", "Tarif: miktar ≤ 0 ya da sayı değil.", "Hazırlanacak miktar sıfırdan büyük olmalıdır.", "The amount to prepare must be greater than zero."],
    ["3", "Tarif: stok ≤ 0 ya da stok > 100.", "Stok alkol derecesi 0'dan büyük, en çok 100 olmalıdır.", "The stock alcohol strength must be greater than 0 and at most 100."],
    ["4", "Tarif: hedef ≤ 0 ya da hedef ≥ stok.", "Hedef derece 0'dan büyük ve stok dereceden küçük olmalıdır.", "The target strength must be greater than 0 and lower than the stock strength."],
    ["5", "Derece < 0 ya da > 100 (dereceden yoğunluk).", "Alkol oranı 0 ile 100 arasında olmalıdır.", "The alcohol strength must be between 0 and 100."],
    ["6", "Sıcaklık < −20 ya da > 40 °C.", "Sıcaklık -20 ile 40 °C arasında olmalıdır (OIML R 22 geçerlilik aralığı).", "The temperature must be between -20 and 40 °C (the validity range of OIML R 22)."],
    ["7", "Yoğunluktan derece: yoğunluk, t'de saf etanol yoğunluğundan küçük ya da saf su yoğunluğundan büyük.", "Yoğunluk {t} °C'de {ρ_etanol} ile {ρ_su} kg/m³ arasında olmalıdır.", "At {t} °C the density must be between {ρ_ethanol} and {ρ_water} kg/m³."],
  ]),
  ...spec([
    ["FS-ALC-41", "Sayı olmayan girdi, alanın etiketini içeren ileti 1 ile reddedilir.", "URS-ALC-INP-03"],
    ["FS-ALC-42", "Sıcaklık aralık dışındaysa ileti 6 gösterilir.", "URS-ALC-INP-04"],
    ["FS-ALC-43", "Derece sınırları iletiler 3, 4 ve 5 ile; miktar sınırı ileti 2 ile denetlenir.", "URS-ALC-INP-05, URS-ALC-INP-06"],
    ["FS-ALC-44", "Yoğunluk aralığı ileti 7 ile denetlenir; iletide sınırlar o sıcaklık için sayıyla (2 ondalık) verilir.", "URS-ALC-INP-07"],
  ]),

  h1("8. Sonuçların Gösterimi"),
  ...spec([
    ["FS-ALC-50", "Hesapla'ya basıldığında o sekmenin önceki sonucu önce kaldırılır; hesap başarılıysa yeni sonuç gösterilir, başarısızsa yalnız hata iletisi kalır.", "URS-ALC-INP-08"],
    ["FS-ALC-51", "Her sayısal değerin yanında birimi (mL, g, kg/m³, g/mL, °C) ve derecelerde türü (v/v, w/w) yazılır.", "URS-ALC-OUT-01"],
    ["FS-ALC-52", "Gösterim duyarlığı: miktarlar (mL, g), dereceler, yoğunluk (kg/m³) ve büzülme 2 ondalık; yoğunluk (g/mL) 5 ondalık. Başlıkta yeniden gösterilen girdiler en çok 2 ondalık (derece, miktar) ve 1 ondalık (sıcaklık) ile, sondaki sıfırlar atılarak yazılır.", "URS-ALC-OUT-02"],
    ["FS-ALC-53", "Türkçe arayüzde ondalık ayırıcı virgül ve yüzde işareti önde (%62,39 w/w); İngilizce arayüzde ondalık ayırıcı nokta ve yüzde işareti sonda (62.39% w/w).", "URS-ALC-LNG-02"],
    ["FS-ALC-54", "Arayüz metinleri ve hata iletileri iki dilde eşdeğerdir; İngilizce karşılığı bulunmayan metin bulunmaz.", "URS-ALC-LNG-03"],
    ["FS-ALC-55", "Girdi ve sonuçlar yalnız kullanıcının tarayıcı oturumuna bağlı sunucu belleğinde tutulur; sayfa kapatılınca kaybolur, sunucuda dosyaya ya da veritabanına yazılmaz.", "URS-ALC-OUT-05"],
  ]),
  h2("8.1 Gösterim duyarlığı ile kabul ölçütlerinin ilişkisi"),
  p("Bu bölüm ön değerlendirme eksiği E-6'yı karşılar."),
  ...bullets([
    "Gösterilen değer, hesaplanan değerin belirtilen basamağa yuvarlanmışıdır; gösterimden doğan fark son basamağın yarısını (2 ondalıkta 0,005) aşmaz.",
    "Otomatik OQ testleri (URS-ALC-ACC-02…06) yuvarlanmamış değerlerle yapılır; kabul ölçütleri o testlerde tanımlıdır.",
    "Arayüz testlerinde ekranda okunan değer, referans değerin aynı basamağa yuvarlanmışıyla karşılaştırılır; yuvarlama sınırındaki değerler için son basamakta ±1 (2 ondalıkta 0,01) fark kabul edilir.",
    "2 ondalıklı mL ve g gösterimi, laboratuvar ölçüm araçlarının çözünürlüğünden (ör. 100 mL'lik A sınıfı mezür, 0,01 g okunabilirlikli terazi) daha incedir; gösterim duyarlığı hazırlığın doğruluğunu sınırlamaz.",
    "Başlıkta yeniden gösterilen girdi, 2 ondalıktan fazla basamakla girilmişse yuvarlanmış görünür; girilen metnin tamamı planlanan çıktıda yer alır (FS-ALC-61).",
  ]),

  h1("9. Planlanan İşlevler (Eksiklerin Giderilmesi)"),
  p("Aşağıdaki maddeler mevcut sürümde yoktur. Dondurulacak sürümde gerçekleştirilir; gerçekleştirme ayrıntısı DS'de, doğrulama OQ'dadır."),
  ...spec([
    ["FS-ALC-60", "**Sürüm gösterimi (E-1).** Sayfanın altında \"PTCalc vX.Y.Z · commit <ilk 7 karakter>\" yazılır. Değer derleme sırasında gömülür; elle yazılmaz.", "URS-ALC-OUT-04, URS-ALC-CHG-01"],
    ["FS-ALC-61", "**Yazdırılabilir çıktı (E-2).** Her sonuç kartında \"Yazdır / PDF\" düğmesi bulunur. Tarayıcının yazdırma görünümü yalnız şu bölümleri içerir: başlık ve işlev adı; girilen metin ve okunan değerle birlikte tüm girdiler; tüm sonuçlar; yöntem referansı (OIML R 22); hesap tarihi ve saati (ISO 8601, saat dilimiyle); sürüm ve commit; sayfa adresi; \"Hesaplayan: ad soyad / imza / tarih\" ve \"Kontrol eden: ad soyad / imza / tarih\" alanları; sayfa numarası. PDF, tarayıcının \"PDF olarak kaydet\" seçeneğiyle alınır; sunucuda kayıt oluşmaz.", "URS-ALC-OUT-03, URS-ALC-OUT-05"],
    ["FS-ALC-62", "**Belirsiz sayı uyarısı (E-7).** Girdi metni işaretli ya da işaretsiz 1–3 rakam, tek bir nokta ya da virgül ve tam 3 rakamdan oluşuyorsa (ör. \"1,000\", \"2.500\") hesap yapılır ve sonuçta şu uyarı gösterilir: \"\\\"{metin}\\\" {değer} olarak okundu. Binlik ayırıcı kastettiyseniz ayırıcı olmadan yazın.\"", "URS-ALC-INP-02"],
    ["FS-ALC-63", "**Eski sonucun kaldırılması (E-8).** Bir sekmedeki herhangi bir girdi alanına yazıldığında (her tuşta) ya da seçim değiştiğinde o sekmenin sonucu ekrandan kaldırılır; yeni sonuç için yeniden Hesapla'ya basılır.", "URS-ALC-INP-08"],
    ["FS-ALC-64", "**Donma bölgesi uyarısı (E-9).** Sıcaklık 0 °C'nin altındayken kütlece derece, OIML R 22 Tablo I'in o sıcaklık için basılı en düşük derecesinin altındaysa sonuç gösterilir ve şu uyarı eklenir: \"Bu derece ve sıcaklıkta karışım donmuş olabilir; sonuç sıvı bir karışıma karşılık gelmeyebilir (OIML R 22 Tablo I sınırı).\" Ara sıcaklıklarda sınır komşu tablo sütunları arasında doğrusal interpolasyonla bulunur.", "URS-ALC-INP-10"],
    ["FS-ALC-65", "**Kısa rehberin tamamlanması.** Kısa rehberin \"Sınırlar\" bölümüne geçerli sıcaklık aralığı (−20…40 °C) ve donma bölgesi eklenir.", "URS-ALC-DOC-03"],
  ]),

  h1("10. Fonksiyonel Olmayan ve Süreç Gereksinimleri"),
  p("Aşağıdaki URS maddeleri ekran davranışı değil, hesap doğruluğu, altyapı ya da süreç gereksinimidir. FS'de yalnız karşılandıkları yer gösterilir."),
  ...spec([
    ["FS-ALC-70", "Hesap doğruluğu: hesaplar OIML R 22 genel formülüyle yapılır; formül, katsayılar ve ters çözümler DS §6'da tanımlıdır. Doğruluk ölçütleri URS'de, testler OQ'dadır.", "URS-ALC-ACC-01, URS-ALC-ACC-02, URS-ALC-ACC-03, URS-ALC-ACC-04, URS-ALC-ACC-05, URS-ALC-ACC-08"],
    ["FS-ALC-71", "Sistem yalnız HTTPS üzerinden sunulur; HTTP istekleri HTTPS'e yönlendirilir.", "URS-ALC-SEC-01"],
    ["FS-ALC-72", "Ekran düzeni masaüstünde iki sütun, dar ekranda tek sütundur; tüm işlevler güncel Chrome, Edge, Firefox ve mobil tarayıcılarda kullanılabilir.", "URS-ALC-SEC-02"],
    ["FS-ALC-73", "Sistem erişilemezse kullanılacak elle hesap yolu kullanım SOP'sinde tanımlanır (PTC-VAL-ALC-12).", "URS-ALC-SEC-03"],
    ["FS-ALC-74", "Sürüm, değişiklik kaydı ve yayın düzeni DS §10'da; değişiklik kontrolü PTC-VAL-ALC-00 §13.1'de tanımlıdır.", "URS-ALC-CHG-02, URS-ALC-CHG-03, URS-ALC-CHG-04"],
  ]),
];

// İzlenebilirlik: her URS maddesi en az bir FS maddesine bağlı olmalı.
const covered = new Map();
for (const [id, , u] of FS) for (const r of u.split(/,\s*/)) covered.set(r, [...(covered.get(r) ?? []), id]);
const missing = urs.ids.filter(id => !covered.has(id));
const unknown = [...covered.keys()].filter(id => !urs.ids.includes(id));
if (missing.length || unknown.length) throw new Error(`URS kapsaması: eksik ${missing.join(", ")}; bilinmeyen ${unknown.join(", ")}`);

body.push(
  h1("11. URS → FS İzlenebilirliği"),
  p(`${urs.ids.length} URS maddesinin tamamı en az bir FS maddesine bağlıdır (betik içinde denetlenir).`),
  ...table([{ w: 2400, h: "URS" }, { w: 7238, h: "FS maddeleri" }], urs.ids.map(id => [id, covered.get(id).join(", ")])),
);

module.exports = { meta, body, ids: FS.map(r => r[0]) };
