#nullable enable
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PTCalc.Core.Models;

/// <summary>
/// Üçgen faz diyagramı sayfasının kaydedilebilir "belgesi": veri satırları, diyagram/grafik
/// ayarları ve grup başına stil. Aynı JSON hem tarayıcının localStorage'ında (otomatik
/// kayıt) hem de kullanıcının indirdiği .json dosyasında kullanılır; ileride sunucuya
/// kaydetme eklenirse yine bu biçim taşınır.
/// </summary>
public sealed class TernaryDocument
{
    public const int CurrentVersion = 1;

    public int Version { get; set; } = CurrentVersion;
    public DateTimeOffset SavedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Grid satırları olduğu gibi: [grup, sıra, oil, sur/cosur, water]. Boş satırlar atılır.</summary>
    public List<object?[]> Rows { get; set; } = new();

    public TernarySettings Settings { get; set; } = new();

    /// <summary>Grup ADINA göre stil (sıraya değil): satır eklenip çıkarılınca renk kaymaz.</summary>
    public Dictionary<string, GroupStyle> Styles { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public string ToJson() => JsonSerializer.Serialize(this, JsonOpts);

    /// <summary>Geçersiz/uyumsuz JSON'da null döner (istisna fırlatmaz).</summary>
    public static TernaryDocument? FromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            var doc = JsonSerializer.Deserialize<TernaryDocument>(json, JsonOpts);
            if (doc is null || doc.Version < 1 || doc.Version > CurrentVersion) return null;
            doc.Styles = new Dictionary<string, GroupStyle>(doc.Styles, StringComparer.OrdinalIgnoreCase);
            doc.Rows = doc.Rows.Select(NormalizeRow).Where(r => r.Any(c => c is not null)).ToList();
            return doc;
        }
        catch (JsonException) { return null; }
    }

    /// <summary>
    /// Deserializasyon hücreleri JsonElement olarak bırakır; grid'e ve hesaba giden yolda
    /// ilkel değerler (string/double/null) gerekir.
    /// </summary>
    private static object?[] NormalizeRow(object?[] row) => row.Select(c => c switch
    {
        JsonElement e => e.ValueKind switch
        {
            JsonValueKind.Number => e.GetDouble(),
            JsonValueKind.String => (object?)e.GetString(),
            JsonValueKind.True => 1.0,
            JsonValueKind.False => 0.0,
            _ => null
        },
        _ => c
    }).ToArray();
}

/// <summary>Diyagram ve grafik sekmelerindeki bütün ayarlar.</summary>
public sealed class TernarySettings
{
    public string ChartTitle { get; set; } = "Ternary Phase Diagram";
    public string TitleOil { get; set; } = "Oil";
    public string TitleSurfactant { get; set; } = "Surfactant";
    public string TitleWater { get; set; } = "Water";
    public int PolygonCloseType { get; set; } = 1;
    public int EdgeType { get; set; } = 2;
    public int AxisInterval { get; set; } = 10;
    public int BorderAlpha { get; set; } = 180;
    public int FillAlpha { get; set; } = 80;
    public bool SmoothEdges { get; set; }
    public int SmoothTension { get; set; } = 60;
    public bool ShowGradientFill { get; set; }
    public int GradientOpacity { get; set; } = 40;

    /// <summary>Görünen bölgenin alt sınırları (yüzde); hepsi 0 → tam üçgen. Bkz. TernaryRange.</summary>
    public double OilMin { get; set; }
    public double SurfMin { get; set; }
    public double WaterMin { get; set; }

    /// <summary>Yazı, renk ve çizgi özellikleri. Alanı olmayan eski belgeler varsayılanlarla açılır.</summary>
    public TernaryAppearance Appearance { get; set; } = new();
}

/// <summary>
/// Diyagramın görünüş özellikleri (özellik listesinden düzenlenir). Uzunluklar SVG birimidir (üçgen kenarı 400,
/// çizim alanı 500 genişlik); çizgi kalınlıkları ekranda piksel, indirilen SVG'de SVG birimidir. Her eksenin rengi
/// o eksenin çizgisi, tick'leri, etiketleri, başlığı ve grid'inde kullanılır. Değerler çizimden önce
/// <see cref="Normalized"/> ile izin verilen aralığa çekilir; aralıklar yazıların çizim alanından taşmayacağı
/// biçimde seçildi.
/// </summary>
public sealed record TernaryAppearance
{
    /// <summary>Yazı tipi anahtarları → CSS font-family yığını (indirilen SVG'de de geçerli).</summary>
    public static readonly IReadOnlyDictionary<string, string> Fonts = new Dictionary<string, string>
    {
        ["sans-serif"] = "sans-serif",
        ["Arial"] = "Arial, Helvetica, sans-serif",
        ["Times New Roman"] = "'Times New Roman', Times, serif",
        ["Georgia"] = "Georgia, serif",
    };

    /// <summary>theme: sayfa temasının zemini; white: beyaz (yayın için); transparent: zeminsiz.</summary>
    public static readonly IReadOnlyList<string> Backgrounds = ["theme", "white", "transparent"];

    /// <summary>Grid çizgi stilleri → SVG stroke-dasharray (düz için null).</summary>
    public static readonly IReadOnlyDictionary<string, string?> GridStyles = new Dictionary<string, string?>
    {
        ["solid"] = null,
        ["dashed"] = "4 3",
        ["dotted"] = "1 2",
    };

    // Genel
    public string FontFamily { get; set; } = "sans-serif";
    public string Background { get; set; } = "theme";

    // Başlık. Renk null → temanın yazı rengi (beyaz zeminde koyu gri).
    public double TitleSize { get; set; } = 18;
    public bool TitleBold { get; set; } = true;
    public string? TitleColor { get; set; }

    // Eksen renkleri
    public string OilColor { get; set; } = "#ef4444";
    public string SurfColor { get; set; } = "#22c55e";
    public string WaterColor { get; set; } = "#3b82f6";

    // Yazılar
    public double AxisTitleSize { get; set; } = 16;
    public bool AxisTitleBold { get; set; } = true;
    public double TickLabelSize { get; set; } = 12;

    // Çizgiler
    public double AxisWidth { get; set; } = 2;
    public double TickWidth { get; set; } = 1.2;
    public double TickLength { get; set; } = 8;
    public bool ShowGrid { get; set; } = true;
    public double GridWidth { get; set; } = 1;
    public int GridOpacity { get; set; } = 25;
    public string GridStyle { get; set; } = "solid";

    // Veri noktaları (dolgu grubun kenar rengidir) ve ağırlık merkezi
    public double PointRadius { get; set; } = 4;
    public string PointStrokeColor { get; set; } = "#ffffff";
    public double PointStrokeWidth { get; set; } = 1;
    public bool ShowCentroid { get; set; } = true;
    public double CentroidRadius { get; set; } = 5;
    public string CentroidColor { get; set; } = "#ff0000";

    /// <summary>Özellik listesindeki sayı alanlarının aralıkları (en küçük, en büyük, adım).</summary>
    public static class Limits
    {
        public static readonly (double Min, double Max, double Step) TitleSize = (8, 28, 1);
        public static readonly (double Min, double Max, double Step) AxisTitleSize = (8, 24, 1);
        public static readonly (double Min, double Max, double Step) TickLabelSize = (6, 18, 1);
        public static readonly (double Min, double Max, double Step) AxisWidth = (0.5, 6, 0.5);
        public static readonly (double Min, double Max, double Step) TickWidth = (0.5, 4, 0.1);
        public static readonly (double Min, double Max, double Step) TickLength = (0, 12, 1);
        public static readonly (double Min, double Max, double Step) GridWidth = (0.25, 4, 0.25);
        public static readonly (double Min, double Max, double Step) GridOpacity = (0, 100, 5);
        public static readonly (double Min, double Max, double Step) PointRadius = (1, 10, 0.5);
        public static readonly (double Min, double Max, double Step) PointStrokeWidth = (0, 4, 0.5);
        public static readonly (double Min, double Max, double Step) CentroidRadius = (1, 12, 0.5);
    }

    /// <summary>Geçersiz renk, yazı tipi ya da stil varsayılana; sayılar izin verilen aralığa çekilir.</summary>
    public TernaryAppearance Normalized()
    {
        var d = new TernaryAppearance();
        static double C(double v, (double Min, double Max, double Step) l, double fallback)
            => double.IsFinite(v) ? Math.Clamp(v, l.Min, l.Max) : fallback;

        return this with
        {
            FontFamily = FontFamily is not null && Fonts.ContainsKey(FontFamily) ? FontFamily : d.FontFamily,
            Background = Background is not null && Backgrounds.Contains(Background) ? Background : d.Background,
            TitleSize = C(TitleSize, Limits.TitleSize, d.TitleSize),
            TitleColor = GroupStyles.ValidHex(TitleColor),
            OilColor = GroupStyles.ValidHex(OilColor) ?? d.OilColor,
            SurfColor = GroupStyles.ValidHex(SurfColor) ?? d.SurfColor,
            WaterColor = GroupStyles.ValidHex(WaterColor) ?? d.WaterColor,
            AxisTitleSize = C(AxisTitleSize, Limits.AxisTitleSize, d.AxisTitleSize),
            TickLabelSize = C(TickLabelSize, Limits.TickLabelSize, d.TickLabelSize),
            AxisWidth = C(AxisWidth, Limits.AxisWidth, d.AxisWidth),
            TickWidth = C(TickWidth, Limits.TickWidth, d.TickWidth),
            TickLength = C(TickLength, Limits.TickLength, d.TickLength),
            GridWidth = C(GridWidth, Limits.GridWidth, d.GridWidth),
            GridOpacity = (int)C(GridOpacity, Limits.GridOpacity, d.GridOpacity),
            GridStyle = GridStyle is not null && GridStyles.ContainsKey(GridStyle) ? GridStyle : d.GridStyle,
            PointRadius = C(PointRadius, Limits.PointRadius, d.PointRadius),
            PointStrokeColor = GroupStyles.ValidHex(PointStrokeColor) ?? d.PointStrokeColor,
            PointStrokeWidth = C(PointStrokeWidth, Limits.PointStrokeWidth, d.PointStrokeWidth),
            CentroidRadius = C(CentroidRadius, Limits.CentroidRadius, d.CentroidRadius),
            CentroidColor = GroupStyles.ValidHex(CentroidColor) ?? d.CentroidColor,
        };
    }

    [JsonIgnore]
    public string FontStack => Fonts.TryGetValue(FontFamily, out var f) ? f : "sans-serif";

    [JsonIgnore]
    public string? GridDashArray => GridStyles.TryGetValue(GridStyle, out var g) ? g : null;
}

/// <summary>
/// Bir grubun kullanıcı tarafından değiştirilmiş stili. Her alan isteğe bağlıdır; null olan
/// alan için sayfanın genel varsayılanı (palet rengi, ortak opaklık kaydırıcıları) geçerlidir.
/// </summary>
public sealed class GroupStyle
{
    /// <summary>#rrggbb</summary>
    public string? Fill { get; set; }
    /// <summary>#rrggbb</summary>
    public string? Stroke { get; set; }
    /// <summary>0–255</summary>
    public int? FillAlpha { get; set; }
    /// <summary>0–255</summary>
    public int? StrokeAlpha { get; set; }
    public double? StrokeWidth { get; set; }

    [JsonIgnore]
    public bool IsEmpty => Fill is null && Stroke is null && FillAlpha is null && StrokeAlpha is null && StrokeWidth is null;
}

/// <summary>Çizimde kullanılan, tüm alanları çözülmüş stil.</summary>
public sealed record EffectiveStyle(string Fill, string Stroke, double FillOpacity, double StrokeOpacity, double StrokeWidth);

public static class GroupStyles
{
    public const double DefaultStrokeWidth = 2.0;

    /// <summary>Grup stilini genel varsayılanlarla birleştirir. Opaklıklar 0–1'e çevrilir.</summary>
    public static EffectiveStyle Resolve(GroupStyle? style, string defaultColor, int defaultFillAlpha, int defaultStrokeAlpha)
    {
        string fill = ValidHex(style?.Fill) ?? defaultColor;
        string stroke = ValidHex(style?.Stroke) ?? defaultColor;
        int fa = Math.Clamp(style?.FillAlpha ?? defaultFillAlpha, 0, 255);
        int sa = Math.Clamp(style?.StrokeAlpha ?? defaultStrokeAlpha, 0, 255);
        double w = style?.StrokeWidth is double sw && sw >= 0 && sw <= 20 ? sw : DefaultStrokeWidth;
        return new EffectiveStyle(fill, stroke, fa / 255.0, sa / 255.0, w);
    }

    /// <summary>"#rrggbb" biçimindeyse normalize eder (küçük harf), değilse null.</summary>
    public static string? ValidHex(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        s = s.Trim();
        if (s.Length != 7 || s[0] != '#') return null;
        for (int i = 1; i < 7; i++)
            if (!Uri.IsHexDigit(s[i])) return null;
        return s.ToLowerInvariant();
    }
}
