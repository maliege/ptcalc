const { p, h1, h2, bullets, table, kv } = require("./lib");

const meta = {
  docNo: "PTC-VAL-ALC-02",
  rev: "00",
  status: "TASLAK — onaya sunulacak",
  title: "GxP, Annex 11 ve Part 11 Uygulanabilirlik Değerlendirmesi",
  system: "Alkol Seyreltme Aracı (ptcalc.tr/alcohol-dilution)",
  version: "Sürümden bağımsız; sistemin kayıt tutma biçimi değişirse yeniden değerlendirilir.",
  related: "PTC-VAL-ALC-00 Validasyon Planı; PTC-VAL-ALC-01 URS; PTC-VAL-ALC-03 Risk Değerlendirmesi",
  revisions: [["00", "", "İlk yayın.", "—"]],
};

// Uygulanabilirlik sütunu: U = uygulanır, K = kısmen, D = uygulanmaz (değerlendirildi).
const AP = { w: 1000, h: "Uyg." };

const body = [
  h1("1. Amaç"),
  p("Bu belge, Alkol Seyreltme aracının (\"sistem\") GxP ile ilişkisini belirler; EU GMP Annex 11 / TİTCK İyi İmalat Uygulamaları Kılavuzu Ek-11 ve 21 CFR Part 11 hükümlerinin sisteme uygulanıp uygulanmadığını madde madde değerlendirir. Uygulanan her hüküm bir URS maddesine, plan bölümüne ya da kullanıcı kuruluşun sorumluluğuna bağlanır."),

  h1("2. Kapsam ve Yöntem"),
  p("Değerlendirme PTC-VAL-ALC-00 §2'de tanımlanan sistemi kapsar. Her hüküm için uygulanabilirlik şu biçimde işaretlenmiştir:"),
  ...kv([
    ["U — Uygulanır", "Hüküm sisteme ya da sistemin kullanıldığı sürece doğrudan uygulanır; karşılığı gösterilir."],
    ["K — Kısmen", "Hükmün yalnız bir bölümü uygulanır ya da sorumluluk tedarikçi ile kullanıcı kuruluş arasında paylaşılır."],
    ["D — Uygulanmaz", "Hükmün konusu sistemde bulunmaz; gerekçe yazılır. \"Uygulanmaz\" bir değerlendirme sonucudur, atlanmış madde anlamına gelmez."],
  ], 2400),
  p("Kullanıcı kuruluş: sistemi GMP kapsamındaki bir faaliyette kullanan eczane, laboratuvar ya da üretim tesisi. Tedarikçi: PTCalc geliştiricisi."),

  h1("3. GxP Değerlendirmesi"),
  ...table([{ w: 4200, h: "Soru" }, { w: 1000, h: "Yanıt" }, { w: 4438, h: "Gerekçe" }], [
    ["Sistem GMP kapsamındaki bir faaliyette karar ya da işlem için kullanılabilir mi?", "Evet", "Seyreltme tarifine göre ürün, ara ürün, temizlik/dezenfeksiyon çözeltisi ya da analiz çözücüsü hazırlanabilir; yoğunluktan derece hesabı analiz sonucunu belirler."],
    ["Hatalı sonuç ürün kalitesini, hasta güvenliğini ya da veri bütünlüğünü etkileyebilir mi?", "Evet", "Hatalı derecede hazırlanan alkol dezenfeksiyon etkinliğini, çözünürlüğü ya da ekstraksiyon verimini değiştirir; hatalı derece analiz sonucunu yanlış kılar."],
    ["Sistem GMP kaydı oluşturur, değiştirir, saklar ya da iletir mi?", "Hayır", "Girdi ve sonuçlar sunucuda saklanmaz (URS-ALC-OUT-05); başka sisteme veri aktarılmaz."],
    ["Sistem bir GMP kaydının tek kaynağı mıdır?", "Hayır", "Kayıt, kullanıcının hazırlama ya da analiz kaydıdır. Sistem çıktısı bu kayda eklenir ya da aktarılır."],
    ["Sistem seri serbest bırakma ya da kalite kararı verir mi?", "Hayır", "Sistem yalnız hesap yapar; karar kullanıcıya aittir."],
    ["Sistemin yerini alabilecek el yöntemi var mı?", "Evet", "Ph. Eur. 5.5 / OIML R 22 tablolarından interpolasyonla elle hesap (iş sürekliliği yolu)."],
  ]),
  ...kv([
    ["Sonuç", "Sistem **GxP ile ilişkilidir** ve validasyon gerektirir. GAMP 5 Kategori 5 (özel geliştirilmiş yazılım). Kritiklik: hesap çekirdeği ve sonuç gösterimi yüksek, girdi okuma orta, rehber metinleri düşük."],
    ["Kayıt türü", "Hibrit: hesap elektroniktir; kayıt, imzalanmış basılı çıktı ya da kullanıcı kuruluşun kendi sistemindeki kayıttır."],
  ], 2000),

  h1("4. 21 CFR Part 11 Uygulanabilirliği"),
  h2("4.1 Değerlendirme"),
  p("Part 11, yürürlükteki kurallar (predicate rules) gereği tutulan kayıtların elektronik ortamda oluşturulması, değiştirilmesi, saklanması, arşivlenmesi, geri çağrılması ya da iletilmesine ve bu kayıtlara atılan elektronik imzalara uygulanır. FDA'nın \"Part 11, Electronic Records; Electronic Signatures — Scope and Application\" (2003) kılavuzu da bir bilgisayarlı sistemin yalnız çıktısının basılıp kayıt olarak kullanıldığı durumda kaydın basılı nüsha olduğunu belirtir."),
  p("Sistem elektronik kayıt oluşturmaz ve saklamaz; elektronik imza içermez. Bu nedenle **Part 11 sistemin kendisine uygulanmaz.** Kullanıcı kuruluş sistemin PDF çıktısını kendi elektronik kayıt sisteminde saklarsa, o kayıt için Part 11 yükümlülüğü kullanıcı kuruluşun sistemine aittir. Sistemin doğruluğu Part 11'den bağımsız olarak GMP gereği valide edilir (PTC-VAL-ALC-00)."),
  h2("4.2 Madde madde değerlendirme"),
  ...table([{ w: 1500, h: "Hüküm" }, { w: 2600, h: "Konu" }, AP, { w: 4538, h: "Değerlendirme ve karşılık" }], [
    ["§11.10(a)", "Sistem validasyonu", "U", "Kayıt tutmasa da GMP hesabında kullanıldığı için validasyon yapılır: bu dosya (PTC-VAL-ALC-00…12)."],
    ["§11.10(b)", "Kayıtların doğru ve eksiksiz kopyası", "K", "Sistem kayıt saklamaz. İnsan tarafından okunabilir, eksiksiz çıktı (girdiler, sonuçlar, tarih, sürüm) URS-ALC-OUT-03 ile istenmiştir (eksik E-2)."],
    ["§11.10(c)", "Kayıtların korunması ve geri çağrılması", "D", "Sistemde saklanan kayıt yok."],
    ["§11.10(d)", "Sisteme erişimin yetkili kişilerle sınırlanması", "D", "Kayıt tutmayan, herkese açık hesap aracı; erişim sınırlaması kaydın korunmasına hizmet etmez. Kodun ve yayının değiştirilmesi depo yetkisiyle sınırlıdır (bkz. Annex 11 §12)."],
    ["§11.10(e)", "Denetim izi", "D", "Oluşturulan ya da değiştirilen elektronik kayıt yok. Kodun değişiklik geçmişi Git ile izlenir."],
    ["§11.10(f)", "İşlem sırası denetimi", "K", "Hesap tek adımlıdır; geçersiz girdiyle sonuç üretilmez (URS-ALC-INP-03…08)."],
    ["§11.10(g)", "Yetki denetimleri", "D", "İmza, onay ya da kayıt değişikliği işlemi yok."],
    ["§11.10(h)", "Cihaz (terminal) denetimleri", "D", "Girdi kaynağı denetimi gerektiren veri toplama yok."],
    ["§11.10(i)", "Personelin eğitimi", "U", "Tedarikçi: geliştirici ve test personelinin yetkinlik kaydı (PTC-VAL-ALC-00 §8). Kullanıcı kuruluş: kullanım SOP'si eğitimi (PTC-VAL-ALC-12)."],
    ["§11.10(j)", "Elektronik imza sorumluluk politikası", "D", "Elektronik imza yok."],
    ["§11.10(k)", "Sistem belgelerinin kontrolü", "U", "Validasyon belgeleri numaralı ve revizyon kontrollüdür (PTC-VAL-ALC-00 §10); kod belgeleri depoda sürümlüdür."],
    ["§11.30", "Açık sistemler için denetimler", "D", "Sistem internet üzerinden sunulur (açık sistem) ama elektronik kayıt iletmez. Hesap bütünlüğü HTTPS ile korunur (URS-ALC-SEC-01)."],
    ["§11.50, §11.70", "İmza bildirimi, imza–kayıt bağlantısı", "D", "Elektronik imza yok. Basılı çıktıdaki imzalar ıslak imzadır."],
    ["§11.100–§11.300", "Elektronik imza bileşenleri ve kimlik bilgileri", "D", "Elektronik imza ve kullanıcı hesabı yok."],
  ]),

  h1("5. EU GMP Annex 11 / TİTCK Ek-11 Değerlendirmesi"),
  ...table([{ w: 1300, h: "Madde" }, { w: 2200, h: "Konu" }, AP, { w: 5138, h: "Değerlendirme ve karşılık" }], [
    ["İlke", "Validasyon; altyapının kalifikasyonu; elle işlemin yerini alırken kalite ve risk artmaması", "U", "Sistem elle tablo interpolasyonunun yerini alır. Validasyon bu dosyayla yapılır; barındırma altyapısı için sürüm ve erişim doğrulaması IQ'da (PTC-VAL-ALC-00 §11.1)."],
    ["1", "Risk yönetimi", "U", "FMEA: PTC-VAL-ALC-03. Validasyonun kapsamı ve derinliği risk sınıfına göre belirlenir (PTC-VAL-ALC-00 §7.2)."],
    ["2", "Personel", "U", "Roller ve bağımsızlık kuralı: PTC-VAL-ALC-00 §8."],
    ["3.1", "Tedarikçi ve hizmet sağlayıcılarla resmi anlaşma", "K", "Sistem ücretsiz ve herkese açıktır; tedarikçi ile kullanıcı arasında sözleşme ya da hizmet düzeyi taahhüdü yoktur. **Kullanıcı kuruluşun sorumluluğu:** bu durumu kendi risk değerlendirmesine almak; gerekirse onaylı sürümü etiketten kendi ortamında kurmak (bkz. §8, Ö-3)."],
    ["3.2", "Tedarikçinin yetkinlik ve güvenilirliğinin değerlendirilmesi", "K", "Tedarikçinin resmi bir kalite yönetim sistemi yoktur. Telafi edici kanıtlar: açık kaynak kod, sürekli entegrasyon test kayıtları, sürüm arşivi (Git etiketi, GitHub Release, Zenodo DOI), değişiklik kaydı, bu validasyon dosyası. Kullanıcı kuruluş tedarikçi değerlendirmesini bu kanıtlarla yapar (Ö-1)."],
    ["3.3", "Ticari hazır ürünler için belgelerin incelenmesi", "D", "Ticari hazır ürün değil; Kategori 5."],
    ["3.4", "Kalite sistemi ve denetim bilgilerinin denetçilere sunulması", "U", "Validasyon dosyası ve kaynak kod talep edildiğinde sunulabilir; kaynak kod herkese açıktır."],
    ["4.1", "Validasyon belgelerinin yaşam döngüsünü kapsaması", "U", "PTC-VAL-ALC-00 §7, §9."],
    ["4.2", "Değişiklik kontrolü ve sapma kayıtları", "U", "PTC-VAL-ALC-00 §12, §13.1; PTC-VAL-ALC-09."],
    ["4.3", "Güncel sistem envanteri", "U", "Kullanıcı kuruluşun bilgisayarlı sistem envanterine eklenir (kullanıcı sorumluluğu)."],
    ["4.4", "Kullanıcı gereksinimleri ve izlenebilirlik", "U", "URS: PTC-VAL-ALC-01; izlenebilirlik matrisi: PTC-VAL-ALC-10."],
    ["4.5", "Sistemin uygun bir kalite yönetim sistemine göre geliştirilmesi", "K", "Bkz. 3.2. Geliştirme süreci: konu dalı / dev / main akışı, uyarıların hata sayıldığı derleme, her push'ta iki işletim sisteminde test, testsiz yayının engellenmesi."],
    ["4.6", "Özel sistemlerin resmi değerlendirmesi", "U", "Kaynak kod incelemesi (PTC-VAL-ALC-06); FS ve DS (PTC-VAL-ALC-04, -05)."],
    ["4.7", "Test yöntemlerinin ve senaryolarının uygunluğu; sınır değerler", "U", "Otomatik testler, sınır ve negatif testler, bağımsız referanslar (PTC-VAL-ALC-00 §11)."],
    ["4.8", "Veri taşıma", "D", "Veri aktarımı ya da taşıması yok."],
    ["5", "Veri alışverişinde doğruluk kontrolleri", "D", "Başka sistemle elektronik veri alışverişi yok."],
    ["6", "Elle girilen kritik verilerin doğruluk kontrolü", "U", "Stok derecesi, hedef derece, miktar, sıcaklık ve yoğunluk elle girilen kritik verilerdir. Karşılık: sınır denetimi (URS-ALC-INP-03…07), okunan girdinin sonuçla birlikte yeniden gösterilmesi ve belirsiz girdide uyarı (URS-ALC-INP-02), çıktıda girdilerin yer alması (URS-ALC-OUT-03), kullanıcı kuruluşta ikinci kişi kontrolü (kullanım SOP'si)."],
    ["7.1", "Verilerin fiziksel ve elektronik korunması", "D", "Sistem veri saklamaz."],
    ["7.2", "Düzenli yedekleme", "K", "Kullanıcı verisi yok. Kaynak kodun ve yayınların yedeği: GitHub deposu ve Zenodo arşivi."],
    ["8.1", "Elektronik olarak saklanan verinin açık basılı kopyası", "U", "URS-ALC-OUT-03 (eksik E-2)."],
    ["8.2", "Seri serbest bırakmayı destekleyen kayıtlarda değişikliğin çıktıda görülmesi", "D", "Seri serbest bırakma kaydı yok; sistem veri değiştirmez."],
    ["9", "Denetim izi", "D", "GMP verisi oluşturulmaz ya da değiştirilmez. Yazılım değişikliklerinin izi Git geçmişinde ve CHANGELOG'dadır."],
    ["10", "Değişiklik ve yapılandırma yönetimi", "U", "PTC-VAL-ALC-00 §7.4, §13.1; URS-ALC-CHG-01…04 (eksik E-3)."],
    ["11", "Periyodik değerlendirme", "U", "PTC-VAL-ALC-00 §13.2; yılda bir."],
    ["12.1", "Yetkisiz erişime karşı fiziksel ve mantıksal denetimler", "K", "Kullanıcı tarafında erişim denetimi gerekmez (kayıt yok). Yazılımın bütünlüğü için: depoya yazma ve canlı yayın yetkisi depo sahibiyle sınırlıdır; yayın sırları depoda tutulmaz. Öneri Ö-2: main dalı için dal koruma kuralı."],
    ["12.2–12.4", "Güvenlik önlemlerinin kritikliğe uygunluğu; yetki değişikliklerinin kaydı; veri değişikliğinin kimliğe bağlanması", "D", "Kullanıcı hesabı ve veri değişikliği yok."],
    ["13", "Olay yönetimi", "U", "PTC-VAL-ALC-00 §13.3: hatalı sonuç bildirimi sapma olarak kaydedilir, kök neden ve CAPA."],
    ["14", "Elektronik imza", "D", "Elektronik imza yok."],
    ["15", "Seri serbest bırakma", "D", "Sistem seri serbest bırakmada kullanılmaz."],
    ["16", "İş sürekliliği", "U", "Sistem erişilemezse Ph. Eur. 5.5 tablolarıyla elle hesap; kullanım SOP'sinde tanımlanır (URS-ALC-SEC-03)."],
    ["17", "Arşivleme", "K", "Kullanıcı verisi arşivlenmez. Onaylı sürümün kodu ve derlemesi Git etiketi, GitHub Release ve Zenodo DOI ile kalıcı olarak arşivlenir; eski sürüm yeniden kurulabilir."],
  ]),

  h1("6. Veri Bütünlüğü (ALCOA+) — Hibrit Kullanım"),
  p("Sistem kayıt tutmadığından ALCOA+ ilkeleri, sistem çıktısının kullanıcının kaydına dönüştüğü noktada uygulanır. Aşağıdaki tablo her ilkenin hangi düzenekle karşılandığını gösterir."),
  ...table([{ w: 1900, h: "İlke" }, { w: 4538, h: "Düzenek" }, { w: 3200, h: "Kaynak" }], [
    ["Atfedilebilir", "Basılı çıktıda hesabı yapan ve kontrol eden kişinin imza ve tarih alanları.", "URS-ALC-OUT-03; kullanım SOP'si"],
    ["Okunaklı", "Birimli, bazı belirtilmiş, sabit basamaklı sonuçlar; basılı çıktı.", "URS-ALC-OUT-01, -02, -03"],
    ["Eşzamanlı", "Çıktıda hesap tarihi ve saati otomatik yer alır.", "URS-ALC-OUT-03"],
    ["Özgün", "İmzalı basılı çıktı (ya da kullanıcı sistemindeki PDF) özgün kayıttır; elle aktarılan değer çıktıyla karşılaştırılır.", "Kullanım SOP'si"],
    ["Doğru", "Validasyon; girdinin sonuçla yeniden gösterilmesi; ikinci kişi kontrolü.", "PTC-VAL-ALC-00; URS-ALC-INP-02"],
    ["Eksiksiz", "Çıktı tüm girdileri, sonuçları, sürümü ve yöntem referansını içerir.", "URS-ALC-OUT-03"],
    ["Tutarlı", "Aynı girdi her dilde ve ortamda aynı sonucu verir; sürüm çıktıda görünür.", "URS-ALC-ACC-07, OUT-04"],
    ["Kalıcı", "Basılı kayıt kullanıcı kuruluşun arşiv kurallarına tabidir.", "Kullanıcı kuruluş"],
    ["Erişilebilir", "Kayıt kullanıcı kuruluşta; hesap, arşivlenmiş sürümle yeniden üretilebilir.", "Annex 11 §17 değerlendirmesi"],
  ]),

  h1("7. Kullanıcı Kuruluşa Düşen Yükümlülükler"),
  p("Bu dosya tedarikçi dokümantasyonudur. Sistemi GMP kapsamında kullanacak kuruluş en az şunları yapar:"),
  ...bullets([
    "Sistemi bilgisayarlı sistem envanterine eklemek ve kullanım amacını tanımlamak (Annex 11 §4.3).",
    "Tedarikçi değerlendirmesini §5'teki kanıtlarla yapmak ve resmi anlaşma olmamasının riskini değerlendirmek (Annex 11 §3).",
    "Onaylı sürümü belirlemek ve kullanımdan önce sayfadaki sürümün onaylı sürümle aynı olduğunu doğrulamak.",
    "Kendi kullanım senaryoları için kullanıcı kabul testi (en az PQ senaryolarının bir bölümü) yapmak.",
    "Kullanım SOP'sini yürürlüğe almak: çıktının kayda eklenmesi, ikinci kişi kontrolü, stok derecesinin doğrulanması, iş sürekliliği yolu.",
    "Kullanıcıları eğitmek ve hatalı sonuç şüphesini tedarikçiye bildirmek.",
  ]),

  h1("8. Bulgular ve Öneriler"),
  ...table([{ w: 900, h: "No" }, { w: 6238, h: "Bulgu / öneri" }, { w: 2500, h: "Bağlantı" }], [
    ["E-2", "Yazdırılabilir çıktı yok; Annex 11 §6 ve §8.1 ile Part 11 §11.10(b) karşılıkları buna dayanıyor.", "URS-ALC-OUT-03"],
    ["E-3", "Canlı sürüm değişikliklerinin kullanıcı tarafından izlenmesi (Annex 11 §10).", "URS-ALC-CHG-02, CHG-03"],
    ["Ö-1", "Tedarikçinin geliştirme sürecini, test ve sürüm uygulamalarını özetleyen bir \"tedarikçi beyanı\" hazırlanması; kullanıcı kuruluşların tedarikçi değerlendirmesini kolaylaştırır.", "PTC-VAL-ALC-12 ile birlikte"],
    ["Ö-2", "main dalı için GitHub dal koruma kuralı (doğrudan push yerine birleştirme, testlerin geçmesi zorunlu) tanımlanması.", "Annex 11 §12.1; URS-ALC-CHG-04"],
    ["Ö-3", "Onaylı sürümün kullanıcı kuruluşun kendi ortamında çalıştırılabilmesi için kurulum talimatının yazılması (yerel IQ yolu).", "Annex 11 §3.1; PTC-VAL-ALC-00 §11.1"],
  ]),
];

module.exports = { meta, body };
