# Validasyon belgeleri üreticisi

Alkol Seyreltme aracının validasyon dosyasını (`PTC-VAL-ALC-nn`) Word belgesi olarak üretir. Çıktılar
`docs/validation/alcohol-dilution/` altına yazılır. Depoda yalnız boş imza alanlı şablonlar durur; imzalı
nüshalar, kişi adları ve kuruluş kayıtları depoya konmaz.

## Çalıştırma

```bash
cd tools/validation-docs
npm ci
node build.js            # tüm belgeler
node build.js 03 04      # yalnız verilen belge numaraları
```

İçindekiler tablosu bir Word alanıdır; `docx` kitaplığı onu boş yazar. Belgeleri üretip içindekileri ve
sayfa numaralarını Word ile güncellemek için (Windows, Microsoft Word gerekir):

```bash
powershell -ExecutionPolicy Bypass -File update-fields.ps1
```

PDF'e dönüştürme Word'de elle yapılır (Dosya → Farklı Kaydet → PDF); PDF'ler depoya konmaz. Betik takılırsa
yalnız penceresiz `WINWORD` sürecini sonlandırın ve `docs/validation/alcohol-dilution/` altında kalan
`~$*.docx` kilit dosyasını silin.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `lib.js` | Ortak şablon: kapak, rol bazlı imza bloğu, revizyon geçmişi, içindekiler, üst/alt bilgi, tablo yardımcıları, yatay sayfa (`LANDSCAPE` / `PORTRAIT`) |
| `alc-nn-*.js` | Her belgenin içeriği; `{ meta, body }` döndürür. Dosya adındaki `nn` belge numarasıdır |
| `build.js` | Belgeleri üretir |
| `update-fields.ps1` | İçindekiler ve alanları Word ile günceller |
| `oiml-source.js` | OIML katsayılarını ve sabitlerini C# kaynağından okur (DS eki, kod incelemesi, referans hesap) |
| `refcalc.js` | Referans hesap: OIML formülünün sistemden ayrı JavaScript uygulaması; protokollerdeki beklenen değerleri üretir |
| `compare.js` | OQ-04: sistem kitaplığının çıktılarını (`syscheck/`) referans hesapla karşılaştırır; `node compare.js` |
| `numeric-checks.js` | OQ-05: yakınsama ve tekdüzelik denetimleri; `node numeric-checks.js` |
| `syscheck/` | Derlenmiş PTCalc.Core'u çağırıp sonuçları JSON olarak yazan konsol projesi (çözüme eklenmez) |

## Kurallar

- Yeni belge: `alc-nn-ad.js` dosyası ekleyin; `meta.docNo`, `meta.rev` ve `meta.revisions` doldurulur.
- Onaylanmış bir belgede değişiklik yeni revizyondur: `meta.rev` artırılır, `meta.revisions` satırına tarih,
  açıklama ve değişiklik kontrol numarası eklenir.
- Sayılan değerler (gereksinim özeti, risk sınıfları, RÖS, katsayı ekleri) betik içinde hesaplanır ya da
  kaynak koddan okunur; elle yazılmaz.
- `docs/**` ve bu klasör canlı yayını tetiklemez.
