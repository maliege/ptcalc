// Sistem kitaplığının çıktıları: referans hesapla karşılaştırma için JSON.
using System.Globalization;
using System.Text.Json;
using PTCalc.Core.Alcoholometry;

CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
var conv = new List<double[]>();
for (int i = 0; i <= 1000; i++) { double q = i / 10.0; conv.Add(new[] { q, OimlAlcoholometry.VolumeToMassPercent(q), OimlAlcoholometry.MassToVolumePercent(q) }); }
var dens = new List<double[]>();
for (int t = -20; t <= 40; t++)
    for (int p = 0; p <= 100; p++)
    {
        double r = OimlAlcoholometry.DensityFromMassPercent(p, t);
        dens.Add(new[] { p, t, r, OimlAlcoholometry.MassPercentFromDensity(r, t) });
    }
var cases = new (string b, double amt, double tg, double st, double t)[]
{
    ("volume",100,70,96,20),("volume",100,70,96,25),("volume",1000,70,96,15),("volume",500,60,96,20),("volume",250,45,95,22),
    ("volume",100,80,99.5,20),("volume",1000,40,70,30),("volume",50,60,90,25),("volume",2000,25,96,-5),("volume",100,1,96,20),
    ("mass",120,60,90,20),("mass",500,60,93.84,20),("mass",1000,70,96,25),("mass",250,50,99,10),("mass",100,5,95,20),("mass",750,85,96,35),
};
var dil = cases.Select(c => {
    var r = c.b == "volume" ? AlcoholDilution.ByVolume(c.amt, c.tg, c.st, c.t) : AlcoholDilution.ByMass(c.amt, c.tg, c.st, c.t);
    return new { c.b, c.amt, c.tg, c.st, c.t, r.FinalVolume, r.FinalMass, r.EthanolMass, r.StockVolume, r.StockMass, r.WaterVolume, r.WaterMass, r.Contraction, r.NaiveWaterVolume };
}).ToList();
Console.WriteLine(JsonSerializer.Serialize(new { conv, dens, dil }));
