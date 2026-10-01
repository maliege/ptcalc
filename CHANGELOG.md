# Changelog

All notable changes to PTCalc are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Every release is archived on Zenodo; the concept DOI
[10.5281/zenodo.22894811](https://doi.org/10.5281/zenodo.22894811) always resolves to the latest version.

Work in progress lives on the `dev` branch; `main` is what runs on https://ptcalc.net and https://ptcalc.tr.

## [Unreleased]

### Added

- **Pseudo-ternary phase diagram: visible region (partial ternary diagram).** A lower limit can be set for each
  component (Oil ≥ o₀, Surfactant ≥ s₀, Water ≥ w₀). The region is an equilateral triangle of side
  100 − (o₀ + s₀ + w₀) facing the same way as the full triangle; the frame stays fixed, the region is enlarged to
  fill it, the axes are relabelled for the new range and the tick interval scales with the side. Phase regions
  are clipped to the frame and points outside the region are hidden. Area and centroid are still computed in
  the full triangle.
  - Lower-limit fields on the Chart tab, with validation (non-negative, side of at least 5 points).
  - "Fit to data" chooses the smallest triangle that contains all points and regions with a 2-point margin;
    "Full triangle" resets the view.
  - Zoom buttons on the diagram zoom about the centre of the visible region.
  - Ctrl/⌘ + mouse wheel (or a touchpad pinch) zooms while keeping the composition under the cursor in place;
    while zoomed, dragging pans the region. The browser previews the change immediately and the server redraws
    the axes once the gesture settles.
  - The visible region is saved in the browser and in the `.json` work file, and "Download SVG" exports the
    diagram as shown, so a partial ternary diagram can be used directly in a publication.
- Composition read-out (Oil / Surfactant / Water, %) under the cursor on the phase diagram.
- `TernaryRange` in `PTCalc.Core` (mapping, ticks, zoom about a point, fit to data) with unit tests.

### Changed

- Phase diagram: the chart grows with the column width and fits the window height instead of a fixed 450 px;
  tick labels and axis titles are larger; the gradient fill is computed for the visible region.
- Calibration curve: in the residual plot each residual is drawn as a vertical line from zero, so the sign and
  size of the deviation can be read at each concentration level.
- Changes under `paper/` no longer trigger a redeployment of the web site.

## [1.1.0] - 2026-09-25

Zenodo: [10.5281/zenodo.22957458](https://doi.org/10.5281/zenodo.22957458)

### Added

- **Alcohol dilution** tool: recipe for diluting stock ethanol to a target strength and amount, by volume or by
  weight, accounting for volume contraction; density from strength and strength from density; OIML R 22
  formula between −20 and 40 °C. Bilingual guide on volume contraction, the tables and the iterative inverse.
- Reference comparison with the printed OIML R 22 tables: 6 889 cells of Tables I–Vb read from the scans by
  `tools/make_oiml_reference.py` (`AlcoholometryTests`, `oiml_r22_reference.json`).
- English `README.md` (Turkish moved to `README.tr.md`), `CODE_OF_CONDUCT.md`, issue templates (bug report, feature request) and a pull-request template,
  an English summary in `CONTRIBUTING.md`, and `docs/core-library-usage.md` (library API walk-through).
- Continuous integration (`.github/workflows/test.yml`): build with warnings as errors and the full test suite
  on Ubuntu and Windows for every branch and pull request.
- Draft software paper (`paper/paper.md`, `paper/paper.bib`).
- Author ORCID and the Zenodo DOI badge in the citation metadata (`CITATION.cff`, `.zenodo.json`, README).

## [1.0.0] - 2026-09-22

Zenodo: [10.5281/zenodo.22894812](https://doi.org/10.5281/zenodo.22894812)

First public release as a stand-alone repository. The tools grew out of software used at the Department of
Pharmaceutical Technology, Faculty of Pharmacy, Ege University since 1995 (see the History section of the
[README](README.md#history)); the earlier code history was not carried over.

### Added

- **Dissolution kinetics**: 16 release models, model subset selection, Tlag / F0 / Fmax variants, nonlinear
  least squares in the F(%) domain, AIC / AICc / MSC ranking with Akaike weights, the Korsmeyer–Peppas F ≤ 60 %
  rule and Hopfenberg geometries.
- **Pseudo-ternary phase diagram**: polygon area and centroid of phase regions, closing options, smoothed
  (Bezier) boundary, per-group styles, a row-total check, saving to the browser and to a `.json` file, and SVG
  export.
- **f1 / f2 similarity factors** with model-independent profile metrics (AUC, DE, MDT).
- **Dose–response**: LD50 / LD90 by probit, logit and 4PL with confidence intervals.
- **t-test** (independent and paired, Levene, Welch, Cohen's d), **one-way ANOVA** (Levene, Tukey HSD /
  Tukey–Kramer, η² / ω²), **multiple linear regression** (coefficient tests, model ANOVA, VIF, Durbin–Watson,
  prediction and confidence intervals) and **calibration curve** (LOD / LOQ per ICH Q2(R2), back-calculated
  accuracy, replicate RSD, step-by-step inverse prediction for unknowns).
- Reference comparisons in the test suite: dissolution kinetics against DDSolver 1.0 output on 32 worksheets
  (`DdsolverReferenceTests`), statistics against SciPy / statsmodels (`StatisticsReferenceTests`,
  generated by `tools/make_stats_reference.py`).
- Bilingual interface (English at ptcalc.net, Turkish at ptcalc.tr, switchable), a bilingual guide for each
  tool with DOI-referenced sources, and an offline page for the installable web app.
- MIT licence, `CITATION.cff`, `.zenodo.json` and `THIRD-PARTY-NOTICES.md`.

[Unreleased]: https://github.com/maliege/ptcalc/compare/v1.1.0...dev
[1.1.0]: https://github.com/maliege/ptcalc/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/maliege/ptcalc/releases/tag/v1.0.0
