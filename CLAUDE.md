# PTCalc — çalışma kılavuzu

Farmasötik teknoloji hesaplama araçları (Blazor Server, .NET 10). Türkçe **ptcalc.tr**, İngilizce
**ptcalc.net**; dil alan adından, kullanıcı seçimi çerezden. Depo herkese açık; sır içermez.

## Derleme ve test

```bash
dotnet build PTCalc.sln
dotnet test PTCalc.Core.Tests
dotnet run --project PTCalc/PTCalc.csproj --launch-profile http   # http://localhost:5277
```

- Proje adlarını bu yazımla kullan; `RootNamespace`/`AssemblyName` açıkça `PTCalc` (IStringLocalizer kaynak
  adını derleme adından türetir).
- `dotnet run` açıkken `dotnet build`/`publish` çalıştırma; çıktılar çakışır.
- İngilizce varsayılanı yerelde denemek için `http://ptcalc.net.localhost:5277`.

## Mimari

- `PTCalc.Core/`: saf hesaplama (kinetik motor, f1/f2, doz–yanıt, t-testi/ANOVA/regresyon/kalibrasyon, üçgen faz geometrisi). ASP.NET/Blazor
  bağımlılığı yok; kullanıcıya dönen her metin `CoreText.T("Türkçe", args)`.
- `PTCalc/`: sayfalar `Pages/Apps`, rehberler `Pages/AboutApps` + `Components/Guides`, alan adı kuralları
  `Site/SiteProfile.cs`, yönlendirme `Middleware/BrandRedirectMiddleware.cs`, SMTP `Services/`.
- `PTCalc.Core.Tests/`: xUnit; `DdsolverReferenceTests` gerçek DDSolver 1.0 çıktılarıyla karşılaştırma fikstürü.
  Kinetik motorunda değişiklikte mutlaka çalıştır. `StatisticsReferenceTests` SciPy/statsmodels referanslarıyla (`stats_reference.json`)
  karşılaştırır; referans üretim betiği `tools/make_stats_reference.py`.

Ayrıntı: `CONTRIBUTING.md`.

## Yerelleştirme

- Arayüz: `@L["Türkçe metin"]`; İngilizcesi `PTCalc/Resources/SharedResource.en.resx` (anahtar = Türkçe metin).
- Uzun bloklar: `@if (Lang.IsEn) { <text>…</text> } else { … }`; `<text>` içinde sınır boşluklarını koru, kod bloğunda
  çıplak noktalama bırakma.
- Çekirdek: `PTCalc.Core/Resources/CoreText.en.tsv` (satır = anahtar TAB çeviri; csproj'da `WithCulture="false"`).
- Handsontable başlıkları ve JS grafik etiketleri `OnInitialized` içinde kurulur.
- Sayfa içi çapalar tam yolla (`href="/about-kinetic-analysis#bolum"`), `<base href>` yüzünden `#bolum` çalışmaz.

## Yazım ve içerik kuralları

- DDSolver ile ilişki "karşılaştırıldı" diye anlatılır; "doğrulandı/validated", "üstün/outperforms" yazılmaz.
- Üçgen faz diyagramında alan ve ağırlık merkezi hesabı yazarın 2001 tarihli yazılımından gelir; Berkman & Güleç (2021)
  "aynı geometriyi sonradan yayımlayan" olarak anılır, yöntemin sahibi gibi değil.
- Kaynaklar DOI ile verilir; Türk literatürü için `docs/kinetik-turk-kaynaklar.md`.
- Site üniversitenin resmi yayını değildir; PTCalc = "Pharmaceutical Technology Calculators" (Hakkında sayfasında yazar).
- Eski marka adı (EgePharmTech) ve alan adları koda, metne ya da yönlendirmeye geri eklenmez.

## Dallar

- Günlük çalışma `dev` dalında (ya da ondan açılan kısa konu dallarında). `dev`'e push yayın tetiklemez; `test.yml`
  Ubuntu ve Windows'ta derler ve testleri koşar. "push et" varsayılan olarak `dev`'e push demektir.
- Siteyi güncellemek = `dev`'i `main`'e birleştirmek. `main`'e her push canlı siteyi yeniden yayımlar (~2–3 dk kesinti),
  bu yüzden `main`'e doğrudan commit atılmaz; birleştirme yalnız kullanıcı yayın istediğinde yapılır.
- Zenodo yalnız GitHub Release ile tetiklenir (webhook yalnız `release` olayını dinler); push'lar Zenodo'ya ulaşmaz.
  Etiket ve Release yalnız kullanıcı yeni sürüm istediğinde atılır.
- Varsayılan dal `main` kalır: JOSS hakemleri ve Zenodo onu okur. `paper/` değişiklikleri hakemlere gitmeden önce
  `main`'e birleştirilmelidir (belge değişikliği olduğu için yayın tetiklemez).

## Yayın

- `main`'e push → `.github/workflows/deploy.yml` (test → framework-dependent, `UseAppHost=false`, RID'siz yayın → lftp FTPS).
  Barındırma `.exe` dosyasına izin vermez; yayında `.exe` çıkarsa iş akışı durur. Belge değişiklikleri (`docs/**`, `*.md`,
  CITATION.cff, .zenodo.json, `tools/validation-docs/**`) yayın tetiklemez.
- Sunucuda kalan dosyalar: `appsettings.Production.json` (yalnız `EmailSettings`), `App_Data/`, `wwwroot/UserFiles/`, `logs/`.
- Sırlar (`FTP_*`, SMTP parolası) asla depoya, çıktıya ya da sohbete yazılmaz; Plesk/Cloudflare/GitHub ayarlarını depo sahibi yapar.

## Sürüm ve atıf

Her yayında `CITATION.cff` (version, date-released) ve `PTCalc.Core.csproj` (Version) birlikte güncellenir, `vX.Y.Z`
etiketi ve GitHub Release atılır; Zenodo release'i arşivler.

Kullanıcıya görünen her değişiklik `CHANGELOG.md`'nin `[Unreleased]` bölümüne İngilizce eklenir (Keep a Changelog:
Added / Changed / Fixed / Removed). Sürümde bu bölüm `## [X.Y.Z] - tarih` + Zenodo sürüm DOI'si olur, alttaki karşılaştırma
bağlantıları güncellenir.

## Durum, kararlar ve yol haritası (2026-11-13)

**Durum**
- Sürüm 1.1.0 (Zenodo concept DOI 10.5281/zenodo.22894811). `main` = `dev` = 836b743, site canlı; `[Unreleased]`
  bölümünde üçgen diyagram (görünen bölge, tıklayarak veri ekleme, grup başına kapatma, görünüş listesi), kalibrasyon
  artık grafiği ve alkol seyreltme düzeltmeleri bekliyor.
- **JOSS reddedildi** (openjournals/joss-reviews#11434, 2026-11-10, track AEiC): depo 6 aydan kısa süredir açık
  (ilk commit 2026-09-19) ve ortak geliştirme pratiği kanıtı yok. Bot kontrolleri (bölümler, MIT lisansı, DOI'ler) geçti;
  makale `paper/` içinde hazır (1630 sözcük). Yeniden gönderim teşvik edildi.
- Alkol seyreltme validasyon dosyası `docs/validation/alcohol-dilution/` (Word, PTC-VAL-ALC-00…07 taslak rev 00);
  üretici `tools/validation-docs/`. KI-01…03 kodda kapandı (12954ec).

**Alınan kararlar**
- Çalışma `dev`'de, yayın yalnız istenince `main`'e birleştirme; Release/etiket yalnız sürüm istenince.
- Makalede ve sitede DDSolver "compared with"; üstünlük iddiası yok. AI kullanımı makalede beyan edilir.
- Etki bölümü 2001 kinetik bildirisi (Sci Pharm 69 Suppl. 1, S127–S128; 6 atıf) ve 2004 üçgen posterine
  (Acta Pharm Turc 46 Suppl., 36; 7 yayın) dayanır.
- Validasyon belgeleri yalnız Word üretilir; PDF'i kullanıcı yapar. İmzalarda yalnız rol, depoda isim yok.

**Açık işler**
- Validasyon: kod eksikleri E-1, E-2, E-4, E-5, E-7, E-9; belgeler 08–12; PQ laboratuvarda (yoğunluk ölçer).
- `[Unreleased]` değişiklikleri için 1.2.0 sürümü (CITATION.cff, csproj Version, Release, Zenodo DOI).
- Araştırma etkisi kanıtı: laboratuvar deneyleri (tablet çözünme kinetiği + emülsiyon üçgen faz diyagramı).

**Sıradaki adımlar**
1. Mart 2027'ye kadar düzenli, küçük commit'lerle açıkta geliştirme (tek seferde yığılmış commit'ten kaçın).
2. Ortak geliştirme kanıtı: GitHub Issues ile iş takibi, PR üzerinden değişiklik, dış katkıcı/kullanıcı geri bildirimi
   (tartışma grubu duyurusu yapıldı/yapılacak), CONTRIBUTING'e "good first issue" önerileri.
3. Zamanında sürümler (1.2.0, …) ve CHANGELOG.
4. JOSS'a yeniden gönderim en erken ~25 Mart 2027 (gönderimi kullanıcı yapar; reddedilen kayda atıfla).
   Alternatif/sonraki: alan dergisi (AAPS PharmSciTech, SoftwareX) DDSolver karşılaştırması + kendi deney verisiyle.
