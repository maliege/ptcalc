const { p, h1, h2, bullets, table, kv } = require("./lib");

const meta = {
  docNo: "PTC-VAL-ALC-01",
  rev: "00",
  status: "TASLAK — onaya sunulacak",
  title: "Kullanıcı Gereksinimleri Spesifikasyonu (URS)",
  system: "Alkol Seyreltme Aracı (ptcalc.tr/alcohol-dilution)",
  version: "Sürümden bağımsız; doğrulama, PTC-VAL-ALC-00 §7.4'e göre dondurulan sürüm üzerinde yapılır.",
  related: "PTC-VAL-ALC-00 Validasyon Planı",
  revisions: [["00", "", "İlk yayın.", "—"]],
};

// Gereksinim tablosu: ID | Gereksinim (kabul ölçütüyle) | Öncelik | GxP | Doğrulama | Not
const COLS = [
  { w: 1650, h: "ID" }, { w: 4888, h: "Gereksinim" }, { w: 800, h: "Önc." },
  { w: 700, h: "GxP" }, { w: 800, h: "Doğr." }, { w: 800, h: "Not" },
];
const ALL = [];
const reqs = rows => { ALL.push(...rows); return table(COLS, rows); };
const GROUPS = [["REC", "Seyreltme tarifi"], ["DEN", "Dereceden yoğunluk"], ["STR", "Yoğunluktan derece"],
  ["ACC", "Hesap doğruluğu"], ["INP", "Girdi ve sınır denetimi"], ["OUT", "Çıktı ve izlenebilirlik"], ["LNG", "Dil"],
  ["DOC", "Belgeler"], ["SEC", "Erişim ve güvenlik"], ["CHG", "Sürüm ve değişiklik"]];
// Özet tablo, yukarıdaki gereksinim satırlarından sayılır (elle sayım yok).
function summary() {
  const count = rs => [rs.length, rs.filter(r => r[2] === "Z").length, rs.filter(r => r[3] === "E").length, rs.filter(r => r[5]).length];
  const rows = GROUPS.map(([g, name]) => [`${g} ${name}`, ...count(ALL.filter(r => r[0].startsWith(`URS-ALC-${g}-`))).map(String)]);
  rows.push(["**Toplam**", ...count(ALL).map(n => `**${n}**`)]);
  if (rows.slice(0, -1).reduce((a, r) => a + +r[1], 0) !== ALL.length) throw new Error("Grupsuz gereksinim var");
  return table([{ w: 3638, h: "Grup" }, { w: 1500, h: "Toplam" }, { w: 1500, h: "Zorunlu" }, { w: 1500, h: "GxP = E" }, { w: 1500, h: "Eksiğe bağlı" }], rows);
}

const body = [
  h1("1. Amaç"),
  p("Bu belge, Alkol Seyreltme aracının kullanıcı bakış açısından ne yapması gerektiğini tanımlar. Gereksinimler test edilebilir biçimde yazılmıştır; her biri risk değerlendirmesi (PTC-VAL-ALC-03), fonksiyonel spesifikasyon (PTC-VAL-ALC-04) ve test protokolleriyle (PTC-VAL-ALC-07) izlenebilirlik matrisinde (PTC-VAL-ALC-10) bağlanır."),

  h1("2. Kapsam"),
  p("Kapsam, PTC-VAL-ALC-00 §2'de tanımlanan üç işlev (seyreltme tarifi, dereceden yoğunluk, yoğunluktan derece) ile bunların girdi, çıktı, dil, belge ve sürüm yönetimi yönleridir. Kapsam dışı konular §8'de listelenmiştir."),

  h1("3. Kullanım Amacı ve Kullanıcılar"),
  h2("3.1 Kullanım amacı"),
  ...bullets([
    "Bilinen dereceli stok etanolün suyla seyreltilerek istenen derece ve miktarda su–etanol karışımı hazırlanması (ör. %70 v/v dezenfektan; ekstraksiyon, granülasyon ve analiz çözücüleri).",
    "Bilinen dereceli su–etanol karışımının belirli sıcaklıktaki yoğunluğunun bulunması (ör. hazırlanan karışımın yoğunlukla kontrolü için beklenen değer).",
    "Dijital yoğunluk ölçer ile ölçülen yoğunluktan etanol derecesinin bulunması (Ph. Eur. 2.9.10 yaklaşımı).",
  ]),
  h2("3.2 Kullanıcı profili"),
  p("Eczacılar, laboratuvar analistleri, üretim ve majistral hazırlık personeli, öğrenciler. Kullanıcıların %v/v ve %w/w kavramlarını ve hacim büzülmesini bildiği, ancak alkolometri tablolarını ya da formülünü elle uygulamadığı varsayılır."),
  h2("3.3 Kullanım ortamı"),
  p("Güncel bir web tarayıcısı (masaüstü ya da mobil) üzerinden, internet bağlantısıyla. Kullanıcı girişi yoktur; sistem kullanıcı verisini saklamaz."),

  h1("4. Gereksinimlerin Yazımı"),
  ...kv([
    ["ID", "URS-ALC-<grup>-<sıra>. Gruplar: REC seyreltme tarifi, DEN dereceden yoğunluk, STR yoğunluktan derece, ACC hesap doğruluğu, INP girdi ve sınır denetimi, OUT çıktı ve izlenebilirlik, LNG dil, DOC belgeler, SEC erişim ve güvenlik, CHG sürüm ve değişiklik yönetimi."],
    ["Öncelik (Önc.)", "Z: Zorunlu — karşılanmadan sistem kullanıma alınamaz. İs: İstenen — karşılanmaması gerekçelendirilerek kabul edilebilir."],
    ["GxP", "E: ürün kalitesini ya da veri bütünlüğünü doğrudan etkiler. H: etkilemez."],
    ["Doğrulama (Doğr.)", "T: test (otomatik ya da elle). K: kod ya da belge incelemesi. G: gösterim (ekranda görülerek doğrulama)."],
    ["Not", "E-n: PTC-VAL-ALC-00 §15'teki ön değerlendirme eksiği; mevcut sürümde karşılanmıyor."],
  ], 2000),
  p("\"Sistem …-meli\" ifadesi zorunluluk bildirir. Sayısal kabul ölçütleri gereksinimin içinde verilmiştir. Sayılarda ondalık ayırıcı olarak virgül kullanılmıştır."),

  h1("5. İşlevsel Gereksinimler"),
  h2("5.1 Seyreltme tarifi (REC)"),
  ...reqs([
    ["URS-ALC-REC-01", "Sistem, stok derecesi (%v/v), hedef derece (%v/v), hazırlanacak son hacim (mL) ve hazırlama sıcaklığı (°C) girildiğinde ölçülecek stok alkol hacmini (mL) ve kütlesini (g), eklenecek su hacmini (mL) ve kütlesini (g) hesaplamalıdır.", "Z", "E", "T", ""],
    ["URS-ALC-REC-02", "Sistem, stok derecesi (%w/w), hedef derece (%w/w) ve hazırlanacak son kütle (g) girildiğinde tartılacak stok alkol ve su kütlelerini (g) ve bunların yaklaşık hacimlerini (mL) hesaplamalıdır.", "Z", "E", "T", ""],
    ["URS-ALC-REC-03", "Su miktarı etanolün kütle dengesinden bulunmalı, karışınca oluşan hacim büzülmesi hesaba katılmalıdır; su hacmi basit orantıdan (son hacim − stok hacmi) elde edilmemelidir.", "Z", "E", "T, K", ""],
    ["URS-ALC-REC-04", "Hacimce tarifte hacimler hazırlama sıcaklığındaki hacimler olmalı; hazırlanan karışımın 20 °C'deki hacimce derecesi hazırlama sıcaklığından bağımsız olarak hedef dereceye eşit olmalıdır.", "Z", "E", "T", ""],
    ["URS-ALC-REC-05", "Sistem son karışımın hacmini ve kütlesini, kütlece ve hacimce derecesini, içerdiği saf etanol kütlesini ve hacim büzülmesi miktarını göstermelidir. Hacimce tarifte basit orantının önereceği su hacmi de karşılaştırma için gösterilmelidir.", "Z", "E", "T, G", ""],
    ["URS-ALC-REC-06", "Tarif, kullanıcının sırayla uygulayabileceği numaralı adımlar halinde yazılmalıdır (stok alkolü ölç/tart, suyu ekle, karıştır).", "Z", "H", "G", ""],
    ["URS-ALC-REC-07", "Hazırlama sıcaklığı 20 °C'den en az 0,5 °C farklı olduğunda sistem, hacimlerin bu sıcaklıkta ölçülmesi gerektiğini ve tartarak hazırlamanın sıcaklıktan etkilenmediğini belirtmelidir.", "İs", "E", "T", ""],
  ]),
  h2("5.2 Dereceden yoğunluk (DEN)"),
  ...reqs([
    ["URS-ALC-DEN-01", "Sistem, %v/v (20 °C) ya da %w/w derece ve sıcaklık girildiğinde karışımın o sıcaklıktaki yoğunluğunu kg/m³ ve g/mL olarak göstermelidir.", "Z", "E", "T", ""],
    ["URS-ALC-DEN-02", "Sistem, girilen derecenin öbür bazdaki karşılığını (%w/w ↔ %v/v) da göstermelidir.", "Z", "E", "T", ""],
  ]),
  h2("5.3 Yoğunluktan derece (STR)"),
  ...reqs([
    ["URS-ALC-STR-01", "Sistem, ölçülen yoğunluk (g/mL ya da kg/m³, kullanıcı seçer) ve ölçüm sıcaklığı girildiğinde kütlece derece (%w/w) ve 20 °C'deki hacimce derece (%v/v) göstermelidir.", "Z", "E", "T", ""],
    ["URS-ALC-STR-02", "Sistem, girdinin gerçek yoğunluk olması gerektiğini ve cam alkolmetre okumaları için cam genleşme düzeltmesi yapmadığını ekranda belirtmelidir.", "Z", "E", "G", ""],
  ]),

  h1("6. Hesap Doğruluğu (ACC)"),
  ...reqs([
    ["URS-ALC-ACC-01", "Yoğunluk hesapları OIML R 22 (1975) genel formülü ve Ek'teki katsayılarla yapılmalıdır. Kodda kullanılan her katsayı kaynakla birebir aynı olmalıdır.", "Z", "E", "K", ""],
    ["URS-ALC-ACC-02", "OIML R 22 Tablo I, II, IIIa, IIIb, IVa, IVb, Va ve Vb'nin basılı değerleri yeniden üretilmelidir: hesaplanan değer 2 ondalığa yuvarlandığında basılı değerle aynı olmalı; yuvarlama sınırındaki hücrelerde fark en çok 0,01 olmalıdır.", "Z", "E", "T", ""],
    ["URS-ALC-ACC-03", "Ph. Eur. 5.5 alkolimetri tablosundaki %v/v, %m/m ve yoğunluk (20 °C) değerleri, tablonun basım duyarlığında yeniden üretilmelidir.", "Z", "E", "T", "E-4"],
    ["URS-ALC-ACC-04", "%v/v → %w/w → %v/v dönüşümü %0–100 aralığında başlangıç değerini en az 9 ondalık basamak doğrulukla geri vermelidir. Yoğunluk → derece dönüşümü −20…40 °C'de formülün tersini en az 8 ondalık basamak doğrulukla vermelidir.", "Z", "E", "T", ""],
    ["URS-ALC-ACC-05", "Seyreltme sonuçları, bağımsız olarak (farklı kişi ve farklı araçla) hesaplanmış en az 10 vakayla karşılaştırılmalıdır; vakalar iki bazı, farklı stok ve hedef dereceleri ve 20 °C dışındaki sıcaklıkları kapsamalıdır. Gösterilen her miktar bağımsız hesaptan en çok 0,01 mL ya da 0,01 g farklı olabilir.", "Z", "E", "T", "E-5"],
    ["URS-ALC-ACC-06", "Her seyreltme sonucunda stok kütlesi + su kütlesi = son kütle ve stoktaki etanol kütlesi = son karışımdaki etanol kütlesi eşitlikleri, göreli olarak en az 1e-9 doğrulukla sağlanmalıdır.", "Z", "E", "T", ""],
    ["URS-ALC-ACC-07", "Sayısal sonuçlar sunucunun bölge ayarından ve arayüz dilinden bağımsız olmalıdır: aynı girdiler tr-TR ve en-US kültürlerinde ve Türkçe/İngilizce arayüzde aynı sonucu vermelidir.", "Z", "E", "T", ""],
    ["URS-ALC-ACC-08", "Hesap çekirdeği tek başına otomatik olarak test edilebilir olmalı; testler her kod değişikliğinde sürekli entegrasyonda en az iki işletim sisteminde koşulmalıdır.", "Z", "E", "K", ""],
  ]),

  h1("7. Girdi, Çıktı ve Destek Gereksinimleri"),
  h2("7.1 Girdi ve sınır denetimi (INP)"),
  ...reqs([
    ["URS-ALC-INP-01", "Sayısal alanlarda hem nokta hem virgül ondalık ayırıcı olarak kabul edilmelidir (\"96,5\" ve \"96.5\" → 96,5). Okuma kuralı deterministik olmalı, bölge ayarına bağlı olmamalı ve FS'de yazılı olmalıdır.", "Z", "E", "T", ""],
    ["URS-ALC-INP-02", "Birden fazla anlama gelebilen girdide (tek ayırıcının ardından tam üç rakam; ör. \"1,000\" ya da \"1.000\": ondalık okumada 1, binlik okumada 1000) sistem, girdiyi nasıl okuduğunu belirterek kullanıcıyı uyarmalıdır. Okunan girdi değerleri sonuçla birlikte yeniden gösterilmelidir.", "Z", "E", "T", "E-7"],
    ["URS-ALC-INP-03", "Sayı olarak okunamayan girdide sistem, ilgili alanın adını içeren bir hata iletisi göstermeli ve sonuç üretmemelidir.", "Z", "E", "T", ""],
    ["URS-ALC-INP-04", "Sıcaklık −20…40 °C (OIML R 22 geçerlilik aralığı) dışında olduğunda sistem aralığı belirten bir hata iletisi göstermeli ve sonuç üretmemelidir.", "Z", "E", "T", ""],
    ["URS-ALC-INP-05", "Derece %0–100 dışında olduğunda; seyreltmede stok derecesi 0'dan büyük ve en çok 100, hedef derece 0'dan büyük ve stok dereceden küçük olmadığında sistem hata iletisi göstermeli ve sonuç üretmemelidir.", "Z", "E", "T", ""],
    ["URS-ALC-INP-06", "Hazırlanacak miktar 0'dan büyük olmadığında sistem hata iletisi göstermeli ve sonuç üretmemelidir.", "Z", "E", "T", ""],
    ["URS-ALC-INP-07", "Ölçülen yoğunluk, verilen sıcaklıkta saf etanol ile saf su yoğunlukları arasında değilse sistem bu sınırları sayıyla belirten bir hata iletisi göstermeli ve sonuç üretmemelidir.", "Z", "E", "T", ""],
    ["URS-ALC-INP-08", "Hatalı bir girdiyle hesap istendiğinde önceki geçerli sonuç ekrandan kaldırılmalıdır; ekranda hiçbir zaman güncel girdilere ait olmayan bir sonuç kalmamalıdır. Girdi değiştirildiğinde önceki sonuç silinmeli ya da güncel olmadığı açıkça belirtilmelidir.", "Z", "E", "T", "E-8"],
    ["URS-ALC-INP-09", "Sekme ya da derece türü değiştirildiğinde, sonuç hangi derece türü ve birimle üretildiyse onu açıkça göstermelidir.", "Z", "E", "T", ""],
    ["URS-ALC-INP-10", "Derece ve sıcaklık bileşimi OIML R 22 tablolarının sıvı bölgesi dışında kaldığında (düşük sıcaklıkta düşük dereceli karışımın donması) sistem, sonucun sıvı bir karışıma karşılık gelmeyebileceğini belirten bir uyarı göstermelidir. Sınır, OIML Tablo I ve II'de her sıcaklık için verilen en düşük derecedir.", "Z", "E", "T", "E-9"],
  ]),
  h2("7.2 Çıktı ve izlenebilirlik (OUT)"),
  ...reqs([
    ["URS-ALC-OUT-01", "Gösterilen her sayısal değerin yanında birimi (mL, g, kg/m³, g/mL, °C) ve derecelerde bazı (v/v, w/w) bulunmalıdır.", "Z", "E", "G", ""],
    ["URS-ALC-OUT-02", "Gösterim duyarlığı: miktarlar (mL, g) ve dereceler 2 ondalık; yoğunluk kg/m³ olarak 2, g/mL olarak 5 ondalık. Gösterim duyarlığı ile kabul ölçütleri arasındaki ilişki FS'de tanımlanmalıdır.", "Z", "E", "T, K", "E-6"],
    ["URS-ALC-OUT-03", "Sistem; girdileri, sonuçları, hesap tarihini ve saatini, yazılım sürümünü ve commit kimliğini, yöntem referansını (OIML R 22) ve sayfa numarasını içeren yazdırılabilir bir çıktı (yazdırma görünümü ya da PDF) üretmelidir. Çıktıda kullanıcının imza/tarih ve kontrol eden imza/tarih alanları bulunmalıdır.", "Z", "E", "T, G", "E-2"],
    ["URS-ALC-OUT-04", "Yazılım sürümü ve commit kimliği alkol seyreltme sayfasında görünür olmalıdır.", "Z", "E", "G", "E-1"],
    ["URS-ALC-OUT-05", "Sistem kullanıcı girdilerini ve sonuçlarını sunucuda kalıcı olarak saklamamalıdır; sistemin kendisi elektronik kayıt oluşturmamalıdır.", "Z", "E", "K", ""],
  ]),
  h2("7.3 Dil (LNG)"),
  ...reqs([
    ["URS-ALC-LNG-01", "Arayüz, iletiler ve rehber Türkçe ve İngilizce olarak sunulmalıdır; dil alan adına göre belirlenmeli, kullanıcı değiştirebilmelidir.", "Z", "H", "G", ""],
    ["URS-ALC-LNG-02", "Sayılar arayüz dilinin kuralına göre biçimlenmelidir (Türkçede virgül ondalık ve yüzde işareti önde: %62,39; İngilizcede nokta ondalık ve yüzde işareti sonda: 62.39%).", "Z", "E", "T", ""],
    ["URS-ALC-LNG-03", "İki dildeki teknik terimler ve hata iletileri anlamca eşdeğer olmalıdır; çevirisi eksik metin bulunmamalıdır.", "Z", "H", "K", ""],
  ]),
  h2("7.4 Belgeler (DOC)"),
  ...reqs([
    ["URS-ALC-DOC-01", "Sayfada kullanımı anlatan kısa bir rehber bulunmalı; ayrıntılı yöntem açıklaması (formül, ters dönüşüm yöntemi, hacim büzülmesi) ayrı bir sayfada verilmelidir.", "Z", "H", "G", ""],
    ["URS-ALC-DOC-02", "Yöntem açıklamasında kaynaklar DOI ya da yayın bilgisiyle verilmelidir.", "Z", "H", "K", ""],
    ["URS-ALC-DOC-03", "Sistemin sınırlamaları (geçerlilik aralığı, cam genleşme düzeltmesi yapılmaması, yalnız su–etanol karışımları, karışma ısısı) rehberde açıkça yazılmalıdır.", "Z", "E", "K", ""],
  ]),
  h2("7.5 Erişim, güvenlik ve kullanılabilirlik (SEC)"),
  ...reqs([
    ["URS-ALC-SEC-01", "Sistem yalnız HTTPS üzerinden sunulmalı; HTTP istekleri HTTPS'e yönlendirilmelidir.", "Z", "E", "T", ""],
    ["URS-ALC-SEC-02", "Sistem güncel Chrome, Edge ve Firefox masaüstü tarayıcılarında ve en az bir mobil tarayıcıda aynı sonuçları vermeli ve kullanılabilir olmalıdır.", "Z", "H", "T", ""],
    ["URS-ALC-SEC-03", "Sistem erişilemediğinde kullanıcının başvuracağı yedek yöntem (Ph. Eur. 5.5 tablolarıyla elle hesap) kullanım SOP'sinde tanımlanmalıdır.", "Z", "E", "K", ""],
  ]),
  h2("7.6 Sürüm ve değişiklik yönetimi (CHG)"),
  ...reqs([
    ["URS-ALC-CHG-01", "Her yayın benzersiz bir sürüm numarası, Git etiketi ve değişiklik kaydıyla (CHANGELOG) tanımlanmalı; kaynak kod ve yayın arşivlenmelidir.", "Z", "E", "K", ""],
    ["URS-ALC-CHG-02", "Kapsamdaki bileşenleri (PTC-VAL-ALC-00 §2.2) değiştiren yayınlar değişiklik kaydında ayrıca işaretlenmelidir; kullanıcı, kullandığı sürümün onaylı sürümle hesap yönünden aynı olup olmadığını anlayabilmelidir.", "Z", "E", "K", "E-3"],
    ["URS-ALC-CHG-03", "Onaylı sürüm ile alkolometri hesabını etkilemeyen sonraki sürümler arasındaki ilişki (ör. alkolometri bileşenlerinin özetleri) IQ'da doğrulanabilir olmalıdır.", "İs", "E", "T", "E-3"],
    ["URS-ALC-CHG-04", "Kapsamdaki bileşenlerde değişiklik yapan bir yayın, otomatik alkolometri testleri geçmeden canlıya çıkmamalıdır.", "Z", "E", "K", ""],
  ]),

  h1("8. Kapsam Dışı ve Kısıtlar"),
  ...bullets([
    "Cam alkolmetre ve hidrometre okumaları için cam genleşme düzeltmesi (OIML Tablo VIII–X).",
    "Su–etanol dışındaki bileşenleri içeren karışımlar (denatüre alkol, gliserollü ya da çözünmüş madde içeren çözeltiler).",
    "Karışma ısısı ve hazırlama sırasında sıcaklık yükselmesinin hacimlere etkisi; sistem sıcaklık dengelenmiş ölçüm varsayar.",
    "−20 °C altı ve 40 °C üstü sıcaklıklar.",
    "Stok alkolün gerçek derecesinin belirlenmesi: kullanıcı stok derecesini sertifikadan ya da ölçümden bilmelidir; sistem verilen değeri doğru kabul eder.",
    "Kullanıcı hesabı, elektronik imza, denetim izi; sistem elektronik kayıt tutmadığından bunlar gereksinim değildir (değerlendirme: PTC-VAL-ALC-02).",
  ]),

  h1("9. Gereksinim Özeti"),
  ...summary(),
];

// ids: diğer belgelerin izlenebilirlik denetimi için.
module.exports = { meta, body, ids: ALL.map(r => r[0]), rows: ALL };
