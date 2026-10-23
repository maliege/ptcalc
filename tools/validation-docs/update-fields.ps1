# Üretilen .docx dosyalarında içindekiler ve sayfa alanlarını Word ile günceller.
# Kullanım: powershell -ExecutionPolicy Bypass -File update-fields.ps1
# Gereksinim: Microsoft Word (COM). PDF'e dönüştürme Word'de elle yapılır.
#
# Her belge geçici bir kopyadan açılır ve asıl yoluna SaveAs2 ile yazılır. Açık belgeyi kendi yoluna kaydetmek
# (Save ya da aynı yola SaveAs2) docx-js çıktısında görünmez bir uyumluluk sorusu açıp Word'ü bekletebiliyor.
# Ayrı, görünmez bir Word örneği kullanılır; kullanıcının açık Word oturumuna dokunulmaz.

$docs = Resolve-Path (Join-Path $PSScriptRoot "..\..\docs\validation\alcohol-dilution")
$stage = Join-Path $env:TEMP ("ptcalc-validation-stage-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force $stage | Out-Null

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    foreach ($file in Get-ChildItem $docs -Filter "PTC-VAL-*.docx") {
        $copy = Join-Path $stage $file.Name
        Copy-Item $file.FullName $copy
        $doc = $word.Documents.Open($copy, $false, $false, $false)
        foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
        $doc.Fields.Update() | Out-Null
        $doc.SaveAs2($file.FullName, 16)
        Write-Output ("{0}: {1} sayfa" -f $file.BaseName, $doc.ComputeStatistics(2))
        $doc.Close(0)
    }
}
finally {
    $word.Quit()
    Remove-Item -Recurse -Force -Confirm:$false $stage -ErrorAction SilentlyContinue
}
