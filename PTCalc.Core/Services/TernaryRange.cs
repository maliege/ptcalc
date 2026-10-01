namespace PTCalc.Core.Services;

using PTCalc.Core.Models;

/// <summary>
/// Üçgen diyagramda görünen bölge: her bileşenin alt sınırı (yüzde). Oil ≥ o₀, Surf ≥ s₀,
/// Water ≥ w₀ bölgesi büyük üçgenle aynı yöne bakan, kenarı <see cref="Side"/> = 100 − (o₀ + s₀ + w₀)
/// olan bir eşkenar üçgendir; çerçeve sabit kalır, bu alt üçgen çerçeveye büyütülür ve eksenler
/// min…min + kenar aralığıyla yeniden etiketlenir. Dikdörtgen bir bölge çerçeveyi üçgen bırakmaz;
/// bu yüzden yakınlaştırma yalnız bu biçimde yapılır.
///
/// Kartezyen koordinat (tam üçgen, kenar 1): sol alt köşe su köşesi (0, 0), sağ alt sürfaktan
/// köşesi (1, 0), üst köşe yağ köşesi (0,5; sin 60). Oil = y / sin 60, Surf = x − y·tan 30,
/// Water = 1 − x − y·tan 30.
/// </summary>
public readonly record struct TernaryRange(double OilMin, double SurfMin, double WaterMin)
{
    /// <summary>En küçük kenar (yüzde): en fazla 20 kat büyütme, tick etiketleri tamsayı kalır.</summary>
    public const double MinSide = 5.0;

    private const double Sin60 = 0.86602540378443864676372317075294;
    private const double Tan30 = 0.57735026918962576450914878050196;
    private const double Eps = 1e-9;

    public static TernaryRange Full => new(0, 0, 0);

    /// <summary>Alt üçgenin kenarı (yüzde).</summary>
    public double Side => 100.0 - OilMin - SurfMin - WaterMin;

    public bool IsFull => OilMin <= Eps && SurfMin <= Eps && WaterMin <= Eps;

    public bool IsValid =>
        double.IsFinite(OilMin) && double.IsFinite(SurfMin) && double.IsFinite(WaterMin) &&
        OilMin >= 0 && SurfMin >= 0 && WaterMin >= 0 && Side >= MinSide - Eps;

    /// <summary>Kayıttan okunan değerler için: geçersizse tam üçgen.</summary>
    public static TernaryRange Sanitize(double oilMin, double surfMin, double waterMin)
    {
        var r = new TernaryRange(oilMin, surfMin, waterMin);
        return r.IsValid ? r : Full;
    }

    /// <summary>Kartezyen noktanın bileşimi (yüzde).</summary>
    public static (double Oil, double Surf, double Water) Composition(PointD p)
    {
        double oil = p.Y / Sin60;
        double surf = p.X - p.Y * Tan30;
        return (oil * 100, surf * 100, (1 - oil - surf) * 100);
    }

    /// <summary>
    /// Tam üçgendeki noktayı çerçeve koordinatına götürür: alt üçgenin su köşesi (0, 0)'a gelir,
    /// kenar 1'e büyür. Benzerlik dönüşümü (öteleme + ölçek) olduğu için doğrular doğru kalır.
    /// </summary>
    public PointD ToFrame(PointD p)
    {
        double l = Side / 100.0;
        double xv = (SurfMin + OilMin / 2) / 100.0;
        double yv = OilMin / 100.0 * Sin60;
        return new PointD { X = (p.X - xv) / l, Y = (p.Y - yv) / l };
    }

    /// <summary>Çerçevedeki bileşimi (0–1) gerçek bileşime (0–1) çevirir.</summary>
    public (double Oil, double Surf, double Water) FromFrame(double oil, double surf, double water)
    {
        double l = Side / 100.0;
        return (OilMin / 100 + l * oil, SurfMin / 100 + l * surf, WaterMin / 100 + l * water);
    }

    /// <summary>Nokta görünen bölgede mi (sınır dahil, <paramref name="tolerance"/> yüzde puanı payla).</summary>
    public bool Contains(PointD p, double tolerance = 0.01)
    {
        var (o, s, w) = Composition(p);
        return o >= OilMin - tolerance && s >= SurfMin - tolerance && w >= WaterMin - tolerance;
    }

    /// <summary>
    /// Bir eksenin tick'leri: [min, min + kenar] içindeki <paramref name="step"/> katları ve çerçevedeki
    /// konumları (0–1). Alt sınır adımın katı değilse köşede tick olmaz.
    /// </summary>
    public static List<(double Value, double Fraction)> Ticks(double min, double side, double step)
    {
        if (step <= 0 || side <= 0) throw new ArgumentOutOfRangeException(nameof(step));
        var list = new List<(double, double)>();
        double first = Math.Ceiling((min - 1e-6) / step) * step;
        for (double v = first; v <= min + side + 1e-6; v += step)
        {
            double value = Math.Round(v, 6);
            list.Add((value, Math.Clamp((value - min) / side, 0, 1)));
        }
        return list;
    }

    private static readonly double[] NiceSteps = [1, 2, 5, 10, 20, 25, 50];

    /// <summary>
    /// Tick aralığı: tam üçgende kullanıcının seçtiği aralık; yakınlaştırınca tick sayısı aşağı yukarı
    /// aynı kalacak biçimde ölçeklenip yuvarlak bir sayıya (1, 2, 5, 10 …) yükseltilir.
    /// </summary>
    public static double NiceStep(double side, int baseInterval)
    {
        if (side >= 100 - Eps) return baseInterval;
        double raw = baseInterval * side / 100.0;
        foreach (var c in NiceSteps)
            if (c >= raw - Eps) return c;
        return NiceSteps[^1];
    }

    /// <summary>
    /// Görünen bölgenin merkezi çevresinde <paramref name="factor"/> kat yakınlaştırır (factor &lt; 1
    /// uzaklaştırır). Yeni üçgen büyük üçgenden taşarsa en yakın geçerli konuma kaydırılır.
    /// Sınırlar 0,1'e aşağı yuvarlanır (kenar biraz büyür, hep geçerli kalır).
    /// </summary>
    public TernaryRange Zoom(double factor)
    {
        if (!(factor > 0)) throw new ArgumentOutOfRangeException(nameof(factor));
        double side = Math.Clamp(Side / factor, MinSide, 100);
        double third = Side / 3;
        double newThird = side / 3;
        var mins = ProjectToSimplex(
            [OilMin + third - newThird, SurfMin + third - newThird, WaterMin + third - newThird],
            100 - side);
        return Rounded(mins);
    }

    /// <summary>
    /// Noktaların hepsini <paramref name="margin"/> yüzde puanı payla içine alan en küçük bölge.
    /// Nokta yoksa tam üçgen.
    /// </summary>
    public static TernaryRange FitTo(IEnumerable<PointD> points, double margin = 2.0)
    {
        double o = double.MaxValue, s = double.MaxValue, w = double.MaxValue;
        bool any = false;
        foreach (var p in points)
        {
            var (po, ps, pw) = Composition(p);
            o = Math.Min(o, po); s = Math.Min(s, ps); w = Math.Min(w, pw);
            any = true;
        }
        if (!any) return Full;

        // 1e-6: kartezyenden geri hesaplanan 30, 29,999… çıkabilir; bir puan fazla kesilmesin
        double Lower(double v) => Math.Floor(Math.Max(0, v - margin) + 1e-6);
        double[] mins = [Lower(o), Lower(s), Lower(w)];
        if (100 - mins.Sum() < MinSide)
            mins = ProjectToSimplex(mins, 100 - MinSide);
        return Rounded(mins);
    }

    private static TernaryRange Rounded(double[] mins)
    {
        double R(double v) => Math.Max(0, Math.Floor(v * 10 + 1e-6) / 10);
        return new TernaryRange(R(mins[0]), R(mins[1]), R(mins[2]));
    }

    /// <summary>
    /// v'ye en yakın (Öklid) nokta: m ≥ 0, Σm = total. Sıralamaya dayalı standart algoritma
    /// (Held, Wolfe ve Crowder 1974; Duchi ve ark. 2008).
    /// </summary>
    internal static double[] ProjectToSimplex(double[] v, double total)
    {
        if (total <= 0) return new double[v.Length];
        var u = v.OrderByDescending(x => x).ToArray();
        double cum = 0, theta = 0;
        for (int i = 0; i < u.Length; i++)
        {
            cum += u[i];
            double t = (cum - total) / (i + 1);
            if (u[i] - t > 0) theta = t;
        }
        return v.Select(x => Math.Max(0, x - theta)).ToArray();
    }
}
