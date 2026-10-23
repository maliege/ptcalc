const { p, h1, h2, bullets, table, kv, WL, LANDSCAPE, PORTRAIT } = require("./lib");

const meta = {
  docNo: "PTC-VAL-ALC-03",
  rev: "00",
  status: "TASLAK — onaya sunulacak",
  title: "Risk Değerlendirmesi (FMEA)",
  system: "Alkol Seyreltme Aracı (ptcalc.tr/alcohol-dilution)",
  version: "Değerlendirme v1.1.0 kodu üzerinde yapılmıştır; dondurulan sürümle yeniden gözden geçirilir.",
  related: "PTC-VAL-ALC-00 Validasyon Planı; PTC-VAL-ALC-01 URS; PTC-VAL-ALC-02 GxP Değerlendirmesi",
  revisions: [["00", "", "İlk yayın.", "—"]],
};

// Risk sınıfı PTC-VAL-ALC-00 §7.2: Ş = 3 ya da RÖS ≥ 12 → Yüksek; 6–9 → Orta; ≤ 4 → Düşük.
const cls = (s, rpn) => (s === 3 || rpn >= 12) ? "Yüksek" : rpn >= 6 ? "Orta" : "Düşük";

// s: şiddet, o: olasılık, d: saptanabilirlik (mevcut kontrollerle); ro, rd: risk azaltma sonrası beklenen.
const R = [
  // — Hesap çekirdeği —
  { g: "Hesap çekirdeği", urs: "ACC-01, ACC-02", mode: "OIML katsayılarından biri yanlış aktarılmış (rakam, işaret, üs).",
    effect: "Belirli derece/sıcaklık bölgesinde yoğunluk ve tüm türev sonuçlar hatalı; küçük hata makul görünür.",
    cause: "Yaklaşık 50 katsayının elle aktarılması.",
    ctrl: "6 889 basılı hücreyle karşılaştırma (Tablo I–Vb).", s: 3, o: 2, d: 1,
    act: "Kod incelemesinde katsayıların kaynakla tek tek karşılaştırılması (DS eki); Ph. Eur. 5.5 ile ikinci referans (E-4).", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "ACC-02", mode: "Katsayılar doğru, formülün uygulanması hatalı (üs indeksi, (t−20) terimi, toplam sınırları).",
    effect: "Bazı sıcaklıklarda ya da derecelerde sistematik hata.", cause: "Kodlama hatası.",
    ctrl: "Tablo I ve II'de −20…40 °C, 5 °C adımlı karşılaştırma.", s: 3, o: 1, d: 1,
    act: "Kod incelemesi; OQ'da tablo testlerinin onaylı sürümde koşulması.", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "ACC-04, DEN-02", mode: "v/v → w/w sabit nokta iterasyonu yakınsamadan çıkar; 200 adımdan sonra son değer uyarısız döndürülür.",
    effect: "Hatalı w/w ve ona bağlı bütün sonuçlar; kullanıcı fark etmez.", cause: "Yakınsama koşulunun bir bölgede sağlanmaması; tolerans seçimi.",
    ctrl: "Yakınsama gerekçesi kod açıklamasında (|g′| < 0,4); 6 noktada gidiş–dönüş testi; Tablo IVb.", s: 3, o: 1, d: 2,
    act: "DS'de yakınsama kanıtı; OQ'da %0–100 aralığında 0,01 adımla gidiş–dönüş ve adım sayısı testi; yakınsama olmazsa hata verilmesi (kod incelemesi önerisi).", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "STR-01", mode: "Yoğunluktan derece (ikiye bölme) yanlış köke gider.",
    effect: "Yanlış analiz sonucu.", cause: "Yoğunluğun derece arttıkça her sıcaklıkta azaldığı varsayımının bir bölgede bozulması.",
    ctrl: "Aralık denetimi; 4 sıcaklıkta 21 noktalı ters çevirme testi; Tablo Va/Vb.", s: 3, o: 1, d: 2,
    act: "OQ'da −20…40 °C ızgarasında monotonluğun sayısal gösterimi ve ters çevirme testinin genişletilmesi.", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "REC-01…03, ACC-06", mode: "Kütle dengesi hatalı (stok ya da su kütlesi formülü).",
    effect: "Tarif hedef dereceyi vermez.", cause: "Kodlama hatası.",
    ctrl: "İki tarif testi; kütle ve etanol korunumu testi.", s: 3, o: 1, d: 2,
    act: "Bağımsız ikinci hesapla en az 10 vaka (E-5); korunum testlerinin rastgele girdilerle genişletilmesi.", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "REC-04", mode: "Hacimce tarifte yoğunluklar hazırlama sıcaklığı yerine 20 °C'de alınır (ya da tersi).",
    effect: "20 °C dışında hazırlanan karışım hedef dereceden sapar.", cause: "Sıcaklık parametresinin yanlış iletilmesi.",
    ctrl: "25 °C'de hazırlanan karışımın 20 °C derecesini sınayan test.", s: 3, o: 1, d: 2,
    act: "Farklı sıcaklıklarda bağımsız vakalar (E-5); PQ senaryo 3.", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "REC-03", mode: "Su hacmi basit orantıyla verilir; hacim büzülmesi ihmal edilir.",
    effect: "Hedeften düşük ya da yüksek derece.", cause: "Hesap yolunun yanlış seçilmesi.",
    ctrl: "Büzülme ve basit orantı ayrı satırlarda gösterilir; test.", s: 3, o: 1, d: 1,
    act: "OQ testi.", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "ACC-07, ACC-08", mode: "Çalışma ortamına göre kayan nokta sonuçları farklılaşır (.NET sürümü, işletim sistemi).",
    effect: "Canlı sitedeki sonuç test ortamındakinden farklı.", cause: "Matematik kitaplığı farkları.",
    ctrl: "Testler Ubuntu ve Windows'ta koşulur.", s: 3, o: 1, d: 2,
    act: "IQ'da sunucu .NET sürümünün kaydı; OQ testlerinin aynı çalışma ortamı sürümünde koşulması.", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "ACC-02, ACC-03", mode: "Referans test verisinde OCR kaynaklı yanlış \"beklenen değer\".",
    effect: "Testler hatalı kodu geçirir ya da doğru kodu düşürür; yanlış güven.", cause: "Taranmış tablo sayfalarından metin okuma.",
    ctrl: "OCR süzgeci hesap kodu kullanılmadan, tablonun iç tutarlılığıyla çalışır.", s: 3, o: 2, d: 2,
    act: "Ph. Eur. 5.5 ile ikinci referans (E-4); referans üretim betiğinin kod incelemesi; rastgele 50 hücrenin basılı tabloyla elle karşılaştırılması.", ro: 1, rd: 1 },
  { g: "Hesap çekirdeği", urs: "ACC-02, ACC-05", mode: "2 ondalık ve ±0,01 test toleransı küçük ama sistematik bir hatayı gizler.",
    effect: "Basılı duyarlığın altında sistematik sapma.", cause: "Basılı tabloların sınırlı duyarlığı.",
    ctrl: "Gidiş–dönüş testleri 8–9 ondalık duyarlıkta.", s: 2, o: 1, d: 3,
    act: "Bağımsız ikinci hesapla göreli 1e-6 duyarlıkta karşılaştırma.", ro: 1, rd: 1 },
  // — Girdi —
  { g: "Girdi", urs: "INP-01", mode: "Ondalık ayırıcı yanlış okunur (\"96,5\" → 965).",
    effect: "Hatalı derece ya da miktar.", cause: "Kültüre bağlı sayı okuma.",
    ctrl: "Kültürden bağımsız deterministik kural ve testleri; aralık dışı değer reddedilir.", s: 3, o: 1, d: 1,
    act: "OQ'da iki dilde ve iki ayırıcıyla arayüz testi.", ro: 1, rd: 1 },
  { g: "Girdi", urs: "INP-02", mode: "Binlik anlamında yazılan \"1,000\" ya da \"1.000\" 1 olarak okunur.",
    effect: "Miktarlar 1000 kat küçük; oranlar doğru.", cause: "Tek ayırıcının ondalık kabul edilmesi.",
    ctrl: "Okunan miktar tarif başlığında gösterilir.", s: 2, o: 2, d: 2,
    act: "Belirsiz girdide uyarı (E-7); OQ testi.", ro: 1, rd: 1 },
  { g: "Girdi", urs: "INP-08", mode: "Girdi değiştirildikten sonra Hesapla'ya basılmaz; ekranda önceki girdilere ait sonuç kalır.",
    effect: "Kullanıcı eski sonucu yeni girdilerin sonucu sanır.", cause: "Sonuç girdi değişiminde silinmiyor ya da işaretlenmiyor (mevcut davranış).",
    ctrl: "Tarif başlığında hesapta kullanılan girdiler gösterilir.", s: 3, o: 2, d: 2,
    act: "Girdi değişince sonucun silinmesi ya da \"güncel değil\" olarak işaretlenmesi (yeni eksik E-8); OQ testi.", ro: 1, rd: 1 },
  { g: "Girdi", urs: "STR-01, INP-07", mode: "Yoğunluk birimi yanlış seçilir (g/mL değeri kg/m³ seçiliyken).",
    effect: "Hatalı derece.", cause: "Birim seçimi gözden kaçar.",
    ctrl: "Aralık denetimi değeri reddeder; sonuçta iki birim de gösterilir.", s: 3, o: 2, d: 1,
    act: "OQ negatif testi (her iki yönde birim karışıklığı).", ro: 1, rd: 1 },
  { g: "Girdi", urs: "INP-04", mode: "Sıcaklık geçerlilik aralığı dışında hesap yapılır.",
    effect: "Formülün dış değer kestirimi; güvenilmez sonuç.", cause: "Sınır denetiminin eksik ya da hatalı olması.",
    ctrl: "−20…40 °C denetimi ve testi.", s: 3, o: 1, d: 1,
    act: "OQ'da sınır testleri (−20,01; −20; 40; 40,01).", ro: 1, rd: 1 },
  { g: "Girdi", urs: "INP-10", mode: "Düşük derece ve düşük sıcaklık bileşiminde (ör. %10 v/v, −15 °C) donmuş karışıma karşılık gelen sonuç verilir.",
    effect: "Sıvıya karşılık gelmeyen yoğunluk ya da derece.", cause: "Formül donma bölgesinde de sayı üretir; OIML tabloları bu bölgeyi içermez.",
    ctrl: "Yalnız yöntem sayfasında açıklama; araçta uyarı yok.", s: 2, o: 1, d: 3,
    act: "OIML Tablo I/II'nin her sıcaklıktaki en düşük derecesinin altında uyarı (yeni eksik E-9).", ro: 1, rd: 1 },
  { g: "Girdi", urs: "INP-05, INP-06", mode: "Hedef ≥ stok, stok > %100 ya da miktar ≤ 0 kabul edilir.",
    effect: "Anlamsız ya da negatif su miktarı.", cause: "Sınır denetiminin eksik olması.",
    ctrl: "Denetim ve testleri mevcut.", s: 3, o: 1, d: 1,
    act: "OQ sınır ve negatif testleri.", ro: 1, rd: 1 },
  // — Kullanım —
  { g: "Kullanım", urs: "REC-01, REC-02", mode: "Stok derecesi farklı bazda girilir (sertifikada %w/w, araçta %v/v seçili).",
    effect: "Hazırlanan karışım hedeften yaklaşık 1–2 puan sapar.", cause: "Araçta stok ve hedef için tek baz seçimi; etiket okuma hatası.",
    ctrl: "Baz seçimi görünür; sonuçta v/v ve w/w birlikte gösterilir.", s: 3, o: 2, d: 3,
    act: "Kullanım SOP'sinde stok bazının sertifikadan doğrulanması; rehberde uyarı; öneri: tarifte stok derecesinin öbür bazdaki karşılığının gösterilmesi.", ro: 1, rd: 2 },
  { g: "Kullanım", urs: "REC-04, REC-07", mode: "Hazırlama sıcaklığı 20 °C bırakılır, hacimle hazırlık farklı sıcaklıkta yapılır.",
    effect: "5 °C farkta derecede birkaç onda bir puan sapma.", cause: "Varsayılan değerin değiştirilmemesi.",
    ctrl: "Sıcaklık alanı görünür; 20 °C dışında uyarı gösterilir.", s: 2, o: 3, d: 3,
    act: "SOP: sıcaklığın ölçülüp girilmesi ya da tartarak hazırlama; PQ senaryo 3.", ro: 1, rd: 3 },
  { g: "Kullanım", urs: "STR-02", mode: "Cam alkolmetre/hidrometre okuması gerçek yoğunluk yerine girilir.",
    effect: "Küçük sistematik derece sapması.", cause: "Cam genleşme düzeltmesinin bilinmemesi.",
    ctrl: "Ekranda ve rehberde uyarı.", s: 2, o: 2, d: 3,
    act: "SOP: yalnız dijital yoğunluk ölçer değerinin girilmesi.", ro: 1, rd: 3 },
  { g: "Kullanım", urs: "URS §8", mode: "Stok alkolün gerçek derecesi etikettekinden farklıdır (nem çekme, buharlaşma).",
    effect: "Doğru hesaba rağmen hatalı derecede ürün.", cause: "Sistem dışı; stok derecesi doğrulanmadan kullanılır.",
    ctrl: "Yok (sistem verilen değeri doğru kabul eder).", s: 3, o: 2, d: 3,
    act: "SOP: stok derecesinin kullanımdan önce yoğunlukla doğrulanması (aracın yoğunluktan derece işleviyle).", ro: 1, rd: 2 },
  { g: "Kullanım", urs: "DOC-03", mode: "Araç kapsam dışı karışımda kullanılır (denatüre alkol, gliserollü çözelti, enjeksiyonluk için NaCl çözeltisiyle seyreltme).",
    effect: "Hatalı tarif ya da derece.", cause: "Sınırlamaların bilinmemesi.",
    ctrl: "Başlıca sınırlamalar araç sayfasındaki kısa rehberde, tamamı yöntem sayfasında yazılı.", s: 3, o: 2, d: 3,
    act: "Kısa rehberde eksik sınırlamaların (donma bölgesi, sıcaklık aralığı) tamamlanması; SOP'de kullanım kapsamının tanımlanması.", ro: 1, rd: 3 },
  { g: "Kullanım", urs: "OUT-02", mode: "Gösterim yuvarlaması küçük hazırlıklarda anlamlı olur.",
    effect: "Ölçüm aletinin çözünürlüğüne göre ihmal edilebilir sapma.", cause: "Sabit 2 ondalık gösterim.",
    ctrl: "Yok.", s: 1, o: 2, d: 3,
    act: "FS'de gösterim duyarlığının tanımlanması (E-6).", ro: 1, rd: 3 },
  // — Çıktı ve kayıt —
  { g: "Çıktı ve kayıt", urs: "OUT-03", mode: "Sonuç kayda elle aktarılırken hata yapılır (rakam yer değiştirmesi, yanlış satır).",
    effect: "Kayıtta ve hazırlıkta hatalı miktar.", cause: "Yazdırılabilir çıktı yok.",
    ctrl: "Yok.", s: 3, o: 2, d: 3,
    act: "Yazdırılabilir çıktı (E-2); SOP'de ikinci kişi kontrolü.", ro: 1, rd: 2 },
  { g: "Çıktı ve kayıt", urs: "OUT-04, CHG-01", mode: "Sonucun hangi sürümle üretildiği bilinmez.",
    effect: "Hatalı sürüm bulunduğunda etkilenen kayıtlar belirlenemez.", cause: "Sürüm sayfada ve çıktıda yok.",
    ctrl: "Yok.", s: 2, o: 2, d: 3,
    act: "Sayfada ve çıktıda sürüm ve commit gösterimi (E-1).", ro: 1, rd: 1 },
  { g: "Çıktı ve kayıt", urs: "LNG-03", mode: "İngilizce arayüzde etiket ya da ileti yanlış çevrilir (ör. stok ve hedef alanlarının anlamı karışır).",
    effect: "Değerlerin yanlış alanlara girilmesi.", cause: "Çeviri hatası.",
    ctrl: "Çeviri dosyası anahtarları Türkçe metindir.", s: 3, o: 1, d: 2,
    act: "OQ'da iki dilde aynı girdiyle aynı sonuç ve etiketlerin incelenmesi.", ro: 1, rd: 1 },
  { g: "Çıktı ve kayıt", urs: "LNG-02", mode: "Sayı biçimi arayüz diline uymaz (İngilizce sayfada virgüllü ondalık).",
    effect: "Sonucun yanlış okunması.", cause: "Kültür ayarının dilden farklı olması.",
    ctrl: "Biçim arayüz kültürüne bağlı.", s: 2, o: 1, d: 2,
    act: "OQ arayüz testi.", ro: 1, rd: 1 },
  // — Değişiklik ve altyapı —
  { g: "Değişiklik ve altyapı", urs: "CHG-02, CHG-04", mode: "Onaylı sürümden sonra hesabı değiştiren bir değişiklik canlıya çıkar; kullanıcı fark etmez.",
    effect: "Onaysız hesapla GMP sonucu.", cause: "main dalına her birleştirmede yayın; dal koruması yok.",
    ctrl: "Yayın öncesi testler; CHANGELOG.", s: 3, o: 2, d: 3,
    act: "Sürüm gösterimi ve kapsamdaki değişikliklerin işaretlenmesi (E-1, E-3); dal koruma (ALC-02 Ö-2); değişiklik kontrolü.", ro: 1, rd: 2 },
  { g: "Değişiklik ve altyapı", urs: "SEC-01", mode: "İletim sırasında sayfa ya da sonuç değiştirilir.",
    effect: "Kullanıcıya sahte sonuç gösterilir.", cause: "Şifresiz bağlantı.",
    ctrl: "HTTPS (Cloudflare + Origin CA).", s: 3, o: 1, d: 3,
    act: "IQ'da HTTPS, sertifika ve HTTP → HTTPS yönlendirmesinin doğrulanması.", ro: 1, rd: 3 },
  { g: "Değişiklik ve altyapı", urs: "SEC-03", mode: "Site erişilemez (sunucu arızası, yayın sırasında birkaç dakikalık kesinti).",
    effect: "Hesap gecikir; kalite etkisi yok.", cause: "Barındırma kesintisi.",
    ctrl: "Kesinti açıkça görünür.", s: 1, o: 2, d: 1,
    act: "SOP'de Ph. Eur. 5.5 tablolarıyla elle hesap yolu.", ro: 2, rd: 1 },
  { g: "Değişiklik ve altyapı", urs: "SEC-02, INP-08", mode: "Sunucu bağlantısı kopar; Hesapla tepki vermez, ekrandaki sonuç eski kalır.",
    effect: "Eski sonucun güncel sanılması.", cause: "Blazor Server bağlantı kopması.",
    ctrl: "Yeniden bağlanma uyarısı ekranı.", s: 2, o: 2, d: 2,
    act: "OQ'da bağlantı kopması testi; E-8 ile birlikte çözülür.", ro: 1, rd: 1 },
];

R.forEach((r, i) => {
  r.id = `R-${String(i + 1).padStart(2, "0")}`;
  r.rpn = r.s * r.o * r.d;
  r.cls = cls(r.s, r.rpn);
  r.rrpn = r.s * r.ro * r.rd;
});

const COLS = [
  { w: 650, h: "No" }, { w: 1150, h: "URS" }, { w: 2350, h: "Hata türü" }, { w: 2000, h: "Olası etki" },
  { w: 1800, h: "Olası neden" }, { w: 1900, h: "Mevcut kontroller" }, { w: 380, h: "Ş" }, { w: 380, h: "O" },
  { w: 380, h: "S" }, { w: 560, h: "RÖS" }, { w: 820, h: "Sınıf" }, { w: 2200, h: "Risk azaltma ve doğrulama" },
];
const fmeaRows = R.map(r => [r.id, r.urs, r.mode, r.effect, r.cause, r.ctrl,
  String(r.s), String(r.o), String(r.d), `**${r.rpn}**`, r.cls,
  [r.act, `**Beklenen artık:** O${r.ro} × S${r.rd} → RÖS ${r.rrpn}`]]);

const count = (pred) => R.filter(pred).length;
const highOnes = R.filter(r => r.cls === "Yüksek");
const residualOver = R.filter(r => r.rrpn > 6);

const body = [
  h1("1. Amaç"),
  p("Bu belge, Alkol Seyreltme aracının hata türlerini, etkilerini ve nedenlerini ICH Q9(R1) ve GAMP 5 ilkelerine göre değerlendirir; her risk için mevcut kontrolleri, risk azaltma eylemlerini ve validasyonda uygulanacak doğrulamayı belirler. Sonuçlar test derinliğini (PTC-VAL-ALC-00 §7.2) ve izlenebilirlik matrisini (PTC-VAL-ALC-10) besler."),

  h1("2. Kapsam"),
  p("Değerlendirme PTC-VAL-ALC-00 §2'de tanımlanan sistemi ve sistemin kullanım sürecini kapsar: girdinin hazırlanması, hesap, sonucun gösterilmesi, kayda aktarılması ve hazırlıkta kullanılması. Kullanıcıdan kaynaklanan hatalar, sistemin bunları önleyebildiği ya da görünür kılabildiği ölçüde değerlendirilmiştir; sistem dışında kalan kontroller kullanım SOP'sine (PTC-VAL-ALC-12) aktarılır."),

  h1("3. Yöntem"),
  h2("3.1 Ekip"),
  p("Değerlendirme geliştirici tarafından hazırlanır, bağımsız teknik kontrolör ve Kalite Güvence ile gözden geçirilir. Puanlar üzerinde uzlaşılamazsa daha yüksek puan alınır."),
  h2("3.2 Puanlama ölçekleri"),
  ...table([{ w: 900, h: "Puan" }, { w: 2900, h: "Şiddet (Ş)" }, { w: 2900, h: "Olasılık (O)" }, { w: 2938, h: "Saptanabilirlik (S)" }], [
    ["3", "Hatalı sayısal sonuç ürün kalitesini ya da analiz sonucunu etkiler; hasta güvenliğine dolaylı etki olabilir.", "Kontrol yok ya da mantık karmaşık; benzer hata daha önce görülmüş ya da insan hatasına açık.", "Hata kullanıcı tarafından fark edilemez; sonuç makul görünür."],
    ["2", "İşlevsel aksama ya da yanıltıcı sunum; sonuç doğruluğunu dolaylı ya da küçük ölçüde etkiler.", "Kısmi kontrol var; hata olası ama seyrek.", "Dikkatli kullanıcı fark edebilir (ör. okunan girdi sonuçla yeniden gösterilir)."],
    ["1", "Kalite etkisi yok; gecikme, görünüm ya da belge hatası.", "Basit, kanıtlanmış yöntem; otomatik testle korunuyor.", "Sistem işlemi engeller ya da hata açıkça görünür (hata iletisi, aralık dışı değer)."],
  ]),
  p("Olasılık ve saptanabilirlik **mevcut kontrollerle** (değerlendirme tarihindeki v1.1.0 kodu) puanlanır. Risk öncelik sayısı RÖS = Ş × O × S."),
  h2("3.3 Risk sınıfı ve gerektirdiği doğrulama"),
  ...table([{ w: 1600, h: "Sınıf" }, { w: 2200, h: "Ölçüt" }, { w: 5838, h: "Asgari doğrulama (PTC-VAL-ALC-00 §7.2)" }], [
    ["Yüksek", "Ş = 3 ya da RÖS ≥ 12", "Bağımsız referansla otomatik test; sınır ve negatif testler; kod incelemesi; uygunsa PQ."],
    ["Orta", "RÖS 6–9", "Pozitif ve negatif test; kod incelemesi."],
    ["Düşük", "RÖS ≤ 4", "Gösterim ya da belge incelemesi."],
  ]),
  h2("3.4 Artık riskin kabulü"),
  p("Risk azaltma eylemlerinden sonra olasılık ve saptanabilirlik yeniden puanlanır; şiddet değişmez. Beklenen artık RÖS ≤ 6 ise risk kabul edilebilir. Artık RÖS > 6 olan riskler için Kalite Güvence'nin yazılı gerekçesi gerekir. Beklenen artık değerler, eylemlerin doğrulanmasından sonra Validasyon Özet Raporu'nda kesinleştirilir."),

  h1("4. Süreç Adımları"),
  ...table([{ w: 800, h: "Adım" }, { w: 3000, h: "Süreç adımı" }, { w: 5838, h: "İlgili risk grupları" }], [
    ["1", "Stok alkolün derecesinin belirlenmesi", "Kullanım (stok derecesi, baz)"],
    ["2", "Girdilerin sisteme girilmesi", "Girdi (okuma, birim, sınırlar, donma bölgesi)"],
    ["3", "Hesap", "Hesap çekirdeği (formül, iterasyon, kütle dengesi, platform)"],
    ["4", "Sonucun gösterilmesi", "Girdi (eski sonuç), Çıktı ve kayıt (dil, biçim, yuvarlama)"],
    ["5", "Sonucun kayda aktarılması", "Çıktı ve kayıt (aktarma, sürüm)"],
    ["6", "Hazırlık ve kontrol ölçümü", "Kullanım (sıcaklık, hidrometre, kapsam dışı karışım)"],
    ["Sürekli", "Yazılımın değişmesi ve sunulması", "Değişiklik ve altyapı"],
  ]),

  LANDSCAPE,
  h1("5. FMEA Tablosu"),
  p("URS sütunundaki numaralar URS-ALC- önekiyle okunur. RÖS ve sınıf, puanlardan hesaplanmıştır; sınıf kuralı §3.3'tedir."),
  ...table(COLS, fmeaRows, { width: WL }),
  PORTRAIT,

  h1("6. Sonuçlar"),
  h2("6.1 Risk dağılımı"),
  ...table([{ w: 3638, h: "Sınıf" }, { w: 2000, h: "Başlangıç" }, { w: 4000, h: "Not" }], [
    ["Yüksek", String(count(r => r.cls === "Yüksek")), "Şiddeti 3 olan her risk, RÖS'ü ne olursa olsun yüksek sınıftadır."],
    ["Orta", String(count(r => r.cls === "Orta")), ""],
    ["Düşük", String(count(r => r.cls === "Düşük")), ""],
    ["**Toplam**", `**${R.length}**`, ""],
  ]),
  p(`Başlangıçta RÖS ≥ 12 olan riskler (${R.filter(r => r.rpn >= 12).map(r => r.id).join(", ")}) ağırlıkla kullanım hataları, elle aktarma, eski sonucun ekranda kalması, değişiklik yönetimi ve test referans verisinin güvenilirliğiyle ilgilidir. Hesap çekirdeğinin riskleri, mevcut otomatik testler sayesinde düşük olasılık ve iyi saptanabilirlikle puanlanmıştır; şiddetleri nedeniyle yine de yüksek sınıftadır ve tam doğrulama gerektirir.`),
  h2("6.2 Artık riski 6'nın üstünde kalan riskler"),
  ...table([{ w: 900, h: "No" }, { w: 4200, h: "Hata türü" }, { w: 900, h: "Artık" }, { w: 3638, h: "Kabul gerekçesi (QA onayına sunulur)" }],
    residualOver.map(r => [r.id, r.mode, String(r.rrpn), {
      "SEC-01": "Saldırı olasılığı TLS ile en düşük düzeydedir; kullanıcı tarafında saptama mümkün değildir.",
      "DOC-03": "Kapsam dışı kullanım sistemle önlenemez; SOP ve eğitimle olasılık en aza indirilir.",
      "REC-04, REC-07": "Sapma küçüktür (Ş = 2); SOP sıcaklık ölçümünü ya da tartarak hazırlamayı zorunlu kılar.",
      "STR-02": "Sapma küçüktür (Ş = 2); SOP yalnız dijital yoğunluk ölçer değerine izin verir.",
    }[r.urs] ?? ""])),
  h2("6.3 Yeni saptanan eksikler"),
  p("Değerlendirme sırasında Validasyon Planı §15'teki listeye iki eksik eklenmiştir; ikisi de URS'ye işlenmiştir:"),
  ...table([{ w: 900, h: "No" }, { w: 6238, h: "Eksik" }, { w: 2500, h: "URS / risk" }], [
    ["E-8", "Girdi değiştirildiğinde önceki sonuç ekranda kalıyor; sonuç silinmiyor ya da güncel olmadığı belirtilmiyor.", "URS-ALC-INP-08; R-13, R-31"],
    ["E-9", "Donma bölgesindeki derece–sıcaklık bileşimleri için araçta uyarı yok; bilgi yalnız yöntem sayfasında.", "URS-ALC-INP-10; R-16"],
  ]),
  h2("6.4 Sistem dışı kontroller (kullanım SOP'sine aktarılacak)"),
  ...bullets([
    "Stok alkolün derecesinin ve bazının (%v/v ya da %w/w) sertifikadan doğrulanması; gerektiğinde yoğunlukla ölçülmesi (R-18, R-21).",
    "Hacimle hazırlıkta sıcaklığın ölçülüp girilmesi ya da tartarak hazırlanması (R-19).",
    "Yoğunluktan derece hesabında yalnız dijital yoğunluk ölçer değerinin kullanılması (R-20).",
    "Kullanım kapsamının (yalnız su–etanol) tanımlanması (R-22).",
    "Çıktının kayda eklenmesi ve ikinci kişi kontrolü (R-24).",
    "Sayfadaki sürümün onaylı sürümle karşılaştırılması (R-25, R-28).",
    "Sistem erişilemezse elle hesap yolu (R-30).",
  ]),
  h2("6.5 Gözden geçirme"),
  p("Bu değerlendirme; sürüm dondurulduğunda, eksikler giderildiğinde, kapsamdaki bileşenlerde değişiklik yapıldığında, sapma ya da kullanıcı bildirimi yeni bir hata türü ortaya koyduğunda ve periyodik gözden geçirmede (yılda bir) yeniden ele alınır."),
];

// Sonuç bölümündeki risk numaralarının tabloyla tutarlı olduğunu denetle.
const idOf = s => R.find(r => r.mode.startsWith(s)).id;
const expect = {
  "R-13": idOf("Girdi değiştirildikten"), "R-16": idOf("Düşük derece ve düşük"), "R-18": idOf("Stok derecesi farklı"),
  "R-19": idOf("Hazırlama sıcaklığı 20"), "R-20": idOf("Cam alkolmetre"), "R-21": idOf("Stok alkolün gerçek"),
  "R-22": idOf("Araç kapsam dışı"), "R-24": idOf("Sonuç kayda elle"), "R-25": idOf("Sonucun hangi sürümle"),
  "R-28": idOf("Onaylı sürümden sonra"), "R-30": idOf("Site erişilemez"), "R-31": idOf("Sunucu bağlantısı"),
};
for (const [k, v] of Object.entries(expect)) if (k !== v) throw new Error(`${k} beklenirken ${v}`);

module.exports = { meta, body };
