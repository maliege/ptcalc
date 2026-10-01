using PTCalc.Core.Models;
using PTCalc.Core.Services;

namespace PTCalc.Core.Tests;

/// <summary>Üçgen diyagramın görünen bölgesi (alt sınırlarla tanımlı alt üçgen).</summary>
public class TernaryRangeTests
{
    private const double Sin60 = 0.86602540378443864676372317075294;

    /// <summary>Bileşimden (yüzde) kartezyen nokta; sayfadaki yerleşimle aynı.</summary>
    private static PointD At(double oil, double surf)
        => new() { X = surf / 100 + oil / 200, Y = oil / 100 * Sin60 };

    [Fact]
    public void Composition_matches_placement()
    {
        var (o, s, w) = TernaryRange.Composition(At(8.14, 72.67));
        Assert.Equal(8.14, o, 6);
        Assert.Equal(72.67, s, 6);
        Assert.Equal(19.19, w, 6);
    }

    [Fact]
    public void Full_range_is_identity()
    {
        var p = At(30, 50);
        var f = TernaryRange.Full.ToFrame(p);
        Assert.Equal(p.X, f.X, 12);
        Assert.Equal(p.Y, f.Y, 12);
        Assert.True(TernaryRange.Full.IsFull);
    }

    [Fact]
    public void Sub_triangle_vertices_map_to_frame_vertices()
    {
        var r = new TernaryRange(10, 50, 10);   // kenar 30
        Assert.Equal(30, r.Side, 9);

        // Su köşesi: Oil = min, Surf = min → (0, 0)
        var water = r.ToFrame(At(10, 50));
        Assert.Equal(0, water.X, 9);
        Assert.Equal(0, water.Y, 9);

        // Sürfaktan köşesi: Surf = min + kenar → (1, 0)
        var surf = r.ToFrame(At(10, 80));
        Assert.Equal(1, surf.X, 9);
        Assert.Equal(0, surf.Y, 9);

        // Yağ köşesi: Oil = min + kenar → (0,5; sin 60)
        var oil = r.ToFrame(At(40, 50));
        Assert.Equal(0.5, oil.X, 9);
        Assert.Equal(Sin60, oil.Y, 9);
    }

    [Fact]
    public void Frame_composition_is_linear_rescale()
    {
        var r = new TernaryRange(10, 50, 10);
        var p = At(25, 60);                      // su 15
        var (fo, fs, fw) = TernaryRange.Composition(r.ToFrame(p));
        Assert.Equal((25 - 10) / 30.0 * 100, fo, 6);
        Assert.Equal((60 - 50) / 30.0 * 100, fs, 6);
        Assert.Equal((15 - 10) / 30.0 * 100, fw, 6);

        var (o, s, w) = r.FromFrame(fo / 100, fs / 100, fw / 100);
        Assert.Equal(0.25, o, 9);
        Assert.Equal(0.60, s, 9);
        Assert.Equal(0.15, w, 9);
    }

    [Fact]
    public void Contains_respects_all_three_lower_bounds()
    {
        var r = new TernaryRange(10, 50, 10);
        Assert.True(r.Contains(At(25, 60)));
        Assert.True(r.Contains(At(10, 50)));     // köşe
        Assert.False(r.Contains(At(5, 60)));     // oil < 10
        Assert.False(r.Contains(At(20, 45)));    // surf < 50
        Assert.False(r.Contains(At(20, 75)));    // water 5 < 10
    }

    [Theory]
    [InlineData(-1, 0, 0)]
    [InlineData(40, 40, 16)]       // kenar 4 < 5
    [InlineData(double.NaN, 0, 0)]
    public void Invalid_ranges_sanitize_to_full(double o, double s, double w)
    {
        Assert.False(new TernaryRange(o, s, w).IsValid);
        Assert.True(TernaryRange.Sanitize(o, s, w).IsFull);
    }

    [Fact]
    public void Smallest_side_is_valid()
    {
        Assert.True(new TernaryRange(40, 40, 15).IsValid);
    }

    [Fact]
    public void Ticks_are_step_multiples_inside_range()
    {
        var t = TernaryRange.Ticks(12, 30, 5);
        Assert.Equal([15, 20, 25, 30, 35, 40], t.Select(x => x.Value));
        Assert.Equal((15 - 12) / 30.0, t[0].Fraction, 9);
        Assert.Equal((40 - 12) / 30.0, t[^1].Fraction, 9);

        var full = TernaryRange.Ticks(0, 100, 10);
        Assert.Equal(11, full.Count);
        Assert.Equal(0, full[0].Fraction);
        Assert.Equal(1, full[^1].Fraction);
    }

    [Theory]
    [InlineData(100, 10, 10)]
    [InlineData(100, 20, 20)]
    [InlineData(50, 10, 5)]
    [InlineData(30, 10, 5)]
    [InlineData(20, 10, 2)]
    [InlineData(10, 10, 1)]
    [InlineData(5, 10, 1)]
    [InlineData(50, 20, 10)]
    public void NiceStep_keeps_tick_count_roughly_constant(double side, int baseInterval, double expected)
    {
        Assert.Equal(expected, TernaryRange.NiceStep(side, baseInterval));
    }

    [Fact]
    public void Zoom_in_keeps_centre_and_shrinks_side()
    {
        var r = new TernaryRange(10, 50, 10);           // merkez: 20 / 60 / 20
        var z = r.Zoom(2);
        Assert.True(z.IsValid);
        Assert.Equal(15, z.Side, 1);
        Assert.Equal(20, z.OilMin + z.Side / 3, 1);
        Assert.Equal(60, z.SurfMin + z.Side / 3, 1);
        Assert.Equal(20, z.WaterMin + z.Side / 3, 1);
    }

    [Fact]
    public void Zoom_out_stays_inside_full_triangle()
    {
        // Köşeye yakın küçük bölge: uzaklaşınca negatif sınır çıkmamalı
        var r = new TernaryRange(2, 85, 3);             // kenar 10
        var z = r.Zoom(1 / 4.0);                        // kenar 40
        Assert.True(z.IsValid);
        Assert.InRange(z.Side, 40, 40.3);
        Assert.True(z.OilMin >= 0 && z.SurfMin >= 0 && z.WaterMin >= 0);

        var full = r.Zoom(1 / 100.0);
        Assert.True(full.IsFull);
    }

    [Fact]
    public void Zoom_in_is_limited_by_min_side()
    {
        var r = new TernaryRange(30, 30, 30).Zoom(100);
        Assert.True(r.IsValid);
        Assert.InRange(r.Side, TernaryRange.MinSide, TernaryRange.MinSide + 0.3);
    }

    [Fact]
    public void FitTo_contains_every_point_with_margin()
    {
        var pts = new[] { At(8.14, 72.67), At(16.87, 65.43), At(43.60, 46.34), At(7.64, 64.88), At(43.33, 46.85) };
        var r = TernaryRange.FitTo(pts);
        Assert.True(r.IsValid);
        Assert.False(r.IsFull);
        Assert.All(pts, p => Assert.True(r.Contains(p, 0)));
        Assert.Equal(5, r.OilMin);       // floor(7,64 − 2)
        Assert.Equal(44, r.SurfMin);     // floor(46,34 − 2)
        Assert.Equal(7, r.WaterMin);     // en küçük su 9,82 (43,33 / 46,85) − 2
    }

    [Fact]
    public void FitTo_single_point_gives_smallest_valid_triangle_around_it()
    {
        var p = At(30, 40);
        var r = TernaryRange.FitTo([p]);
        Assert.True(r.IsValid);
        Assert.True(r.Contains(p, 0));
        Assert.InRange(r.Side, TernaryRange.MinSide, 6.5);
    }

    [Fact]
    public void FitTo_without_points_is_full()
    {
        Assert.True(TernaryRange.FitTo([]).IsFull);
    }
}
