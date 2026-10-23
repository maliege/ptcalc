// Ortak belge şablonu: kapak + imza bloğu + revizyon geçmişi + içindekiler + üst/alt bilgi.
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, Header, Footer, PageNumber, TableOfContents, LevelFormat,
  PageBreak, BorderStyle, VerticalAlign, HeightRule, PageOrientation,
} = require("docx");

const W = 9638;   // A4 dikey, 2 cm kenar boşluğu
const WL = 14570; // A4 yatay
const FONT = "Calibri";
const HEAD_FILL = "D9E2F3";
const border = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const borders = { top: border, bottom: border, left: border, right: border };

// "**kalın** düz" biçimindeki metni TextRun dizisine çevirir.
function runs(text, opts = {}) {
  const parts = String(text).replace(/`/g, "").split(/(\*\*[^*]+\*\*)/);
  return parts.filter(s => s.length).map(s =>
    s.startsWith("**") ? new TextRun({ ...opts, text: s.slice(2, -2), bold: true })
                       : new TextRun({ text: s, ...opts }));
}

const p = (text, o = {}) => new Paragraph({ children: runs(text, o.run), spacing: { after: 120 }, ...o.para });
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const bullet = (t, level = 0) => new Paragraph({ numbering: { reference: "bul", level }, children: runs(t), spacing: { after: 60 } });
const num = (t, ref = "num") => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60 } });
const bullets = arr => arr.map(t => bullet(t));
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map(c =>
    c instanceof Paragraph ? c
      : new Paragraph({ children: runs(c, { size: o.size ?? 18, bold: o.bold }), alignment: o.align, spacing: { after: 40 } }));
  return new TableCell({
    children: paras,
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: o.valign ?? VerticalAlign.TOP,
    columnSpan: o.span,
  });
}

// cols: [{ w, h }]; rows: [[metin|[paragraf...]]]; ilk satır başlık, sayfa geçişinde tekrarlanır.
function table(cols, rows, o = {}) {
  const widths = cols.map(c => c.w);
  const tw = o.width ?? W;
  const sum = widths.reduce((a, b) => a + b, 0);
  if (sum !== tw) throw new Error(`Tablo genişliği ${sum} ≠ ${tw}`);
  const header = new TableRow({
    tableHeader: true,
    children: cols.map(c => cell(c.h, c.w, { bold: true, fill: HEAD_FILL })),
  });
  const body = rows.map(r => new TableRow({
    cantSplit: true,
    height: o.rowHeight ? { value: o.rowHeight, rule: HeightRule.ATLEAST } : undefined,
    children: r.map((c, i) => cell(c, widths[i], { valign: o.valign, bold: o.boldFirst && i === 0, fill: o.fillFirst && i === 0 ? "F2F2F2" : undefined })),
  }));
  return [new Table({ width: { size: tw, type: WidthType.DXA }, columnWidths: widths, rows: [header, ...body] }),
          new Paragraph({ children: [], spacing: { after: 120 } })];
}

// Anahtar–değer tablosu (başlıksız).
function kv(rows, w1 = 2600, width = W) {
  const w2 = width - w1;
  return [new Table({
    width: { size: width, type: WidthType.DXA }, columnWidths: [w1, w2],
    rows: rows.map(([k, v]) => new TableRow({ children: [cell(k, w1, { bold: true, fill: "F2F2F2" }), cell(v, w2)] })),
  }), new Paragraph({ children: [], spacing: { after: 120 } })];
}

// İmzalar role göre; ad soyad, rolün altındaki çizgiye elle yazılır.
function signatureBlock() {
  const cols = [{ w: 4638, h: "Rol / Ad Soyad" }, { w: 3000, h: "İmza" }, { w: 2000, h: "Tarih" }];
  const writeLine = () => new Paragraph({
    spacing: { before: 360, after: 40 },
    border: { bottom: { style: BorderStyle.DOTTED, size: 6, color: "808080", space: 1 } },
    children: [new TextRun({ text: "Ad Soyad:", size: 16, color: "595959" })],
  });
  const rows = [
    ["Hazırlayan", "Sistem sahibi / geliştirici"],
    ["Kontrol Eden", "Bağımsız teknik kontrolör"],
    ["Onaylayan", "Kalite Güvence (QA)"],
  ].map(([role, desc]) => [[
    new Paragraph({ children: [new TextRun({ text: role, bold: true, size: 20 })] }),
    new Paragraph({ children: [new TextRun({ text: desc, size: 16, italics: true })] }),
    writeLine(),
  ], "", ""]);
  return table(cols, rows, { rowHeight: 1300 });
}

function cover(meta) {
  return [
    new Paragraph({ spacing: { before: 600, after: 120 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "PTCalc — Pharmaceutical Technology Calculators", size: 22, color: "595959" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [new TextRun({ text: meta.system, size: 26, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 },
      children: [new TextRun({ text: meta.title, size: 40, bold: true, color: "1F3864" })] }),
    ...kv([
      ["Belge No", meta.docNo],
      ["Revizyon", meta.rev],
      ["Durum", meta.status],
      ["Yürürlük tarihi", "Onay tarihinde yürürlüğe girer: ____ / ____ / ________"],
      ["Sistem / sürüm", meta.version],
      ["İlgili belgeler", meta.related],
    ]),
    new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "Onay", bold: true, size: 24 })] }),
    ...signatureBlock(),
    p("İmzalar şu anlamı taşır. **Hazırlayan:** içeriğin doğru, eksiksiz ve dayanak belgelerle tutarlı olduğunu beyan eder. "
      + "**Kontrol Eden:** belgeyi hazırlayandan bağımsız olarak teknik doğruluk ve düzenleyici uygunluk yönünden incelediğini beyan eder. "
      + "**Onaylayan:** belgenin yürürlüğe girmesini Kalite Güvence adına onaylar. Ad soyad, imza ve tarih (GG.AA.YYYY) imzalayan tarafından ıslak imza sırasında elle yazılır.",
      { run: { size: 16, italics: true } }),
    new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "Revizyon Geçmişi", bold: true, size: 24 })] }),
    ...table([{ w: 1000, h: "Rev." }, { w: 1600, h: "Tarih" }, { w: 5038, h: "Değişikliğin açıklaması" }, { w: 2000, h: "Değişiklik kontrol no" }],
      [...meta.revisions, ["", "", "", ""]], { rowHeight: 360 }),
    pageBreak(),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "İçindekiler", bold: true, size: 26, color: "1F3864" })] }),
    new TableOfContents("İçindekiler", { hyperlink: true, headingStyleRange: "1-2" }),
    pageBreak(),
  ];
}

// Gövdede LANDSCAPE / PORTRAIT işaretleri yeni bölüm (sayfa yönü) başlatır.
const LANDSCAPE = { section: "landscape" };
const PORTRAIT = { section: "portrait" };

function splitSections(items) {
  const out = [{ landscape: false, children: [] }];
  for (const it of items) {
    if (it === LANDSCAPE || it === PORTRAIT) out.push({ landscape: it === LANDSCAPE, children: [] });
    else out[out.length - 1].children.push(it);
  }
  return out.filter(s => s.children.length);
}

function build(meta, body, outPath) {
  const makeHeader = width => new Header({
    children: [new Table({
      width: { size: width, type: WidthType.DXA }, columnWidths: [3000, width - 5500, 2500],
      rows: [new TableRow({ children: [
        cell("**PTCalc**\nAlkol Seyreltme".split("\n").map(t => new Paragraph({ children: runs(t, { size: 16 }) })), 3000),
        cell(meta.title, width - 5500, { bold: true, align: AlignmentType.CENTER, valign: VerticalAlign.CENTER, size: 18 }),
        cell([`Belge No: ${meta.docNo}`, `Revizyon: ${meta.rev}`].map(t => new Paragraph({ children: runs(t, { size: 16 }) })), 2500),
      ] })],
    })],
  });
  const footer = new Footer({
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ children: ["Sayfa ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], size: 16 }),
      ] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Basılı kopyalar kontrolsüzdür; geçerli revizyon belge listesinden doğrulanır.", size: 14, color: "7F7F7F" }),
      ] }),
    ],
  });

  const doc = new Document({
    creator: "PTCalc",
    title: `${meta.docNo} ${meta.title}`,
    styles: {
      default: { document: { run: { font: FONT, size: 20 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, color: "1F3864", font: FONT }, paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0, keepNext: true } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, color: "2F5496", font: FONT }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1, keepNext: true } },
      ],
    },
    numbering: {
      config: [
        { reference: "bul", levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } },
        ] },
        ...["num", "num2", "num3", "num4"].map(ref => ({ reference: ref, levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } },
        ] })),
      ],
    },
    sections: splitSections([...cover(meta), ...body,
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 360 }, children: [new TextRun({ text: "— Belge sonu —", italics: true, color: "7F7F7F" })] })])
      .map(({ landscape, children }) => ({
        properties: { page: {
          size: { width: 11906, height: 16838, orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 567, footer: 567 },
        } },
        headers: { default: makeHeader(landscape ? WL : W) },
        footers: { default: footer },
        children,
      })),
  });
  return Packer.toBuffer(doc).then(buf => fs.writeFileSync(outPath, buf));
}

module.exports = { p, h1, h2, bullet, bullets, num, table, kv, pageBreak, build, W, WL, LANDSCAPE, PORTRAIT };
