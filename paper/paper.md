---
title: 'PTCalc: open computational tools for pharmaceutical technology'
tags:
  - pharmaceutical technology
  - dissolution kinetics
  - drug release modelling
  - model selection
  - pseudo-ternary phase diagram
  - analytical method validation
  - alcoholometry
  - C#
  - .NET
authors:
  - name: Mehmet Ali Ege
    orcid: 0000-0002-4953-2812
    affiliation: 1
affiliations:
  - name: Department of Pharmaceutical Technology, Faculty of Pharmacy, Ege University, İzmir, Türkiye
    index: 1
date: 17 October 2026
bibliography: paper.bib
---

# Summary

PTCalc ("Pharmaceutical Technology Calculators") is an open-source web application and .NET library for the
routine computations of pharmaceutical technology and formulation research. Its core is a dissolution-kinetics
engine that fits sixteen drug-release models (zero-order, first-order, Higuchi, Hixson–Crowell,
Korsmeyer–Peppas, Weibull, Hopfenberg, Baker–Lonsdale, Makoid–Banakar, Peppas–Sahlin, logistic, Gompertz,
probit and their $F_\mathrm{max}$ forms) by nonlinear least squares in the released-fraction domain, with
optional lag-time ($T_\mathrm{lag}$), burst ($F_0$) and plateau ($F_\mathrm{max}$) variants, and ranks them by
the Akaike information criterion with Akaike weights [@Akaike1974]. Around the engine sit tools that
formulation scientists use daily: $f_1$/$f_2$ similarity factors and model-independent profile metrics
[@Moore1996; @Costa2001], a pseudo-ternary phase-diagram tool that measures the area and centroid of
emulsion/microemulsion regions, dose–response analysis (LD$_{50}$/LD$_{90}$ by probit, logit and 4PL), and a
statistics set for laboratory data: $t$-test, one-way ANOVA with Tukey HSD [@Tukey1949; @Kramer1956], multiple
linear regression with prediction intervals, and calibration curves with LOD/LOQ following ICH Q2(R2)
[@ICHQ2R2; @Miller2018]. An alcoholometry module evaluates the OIML R 22 water–ethanol equation [@OIML1975]
to give dilution recipes and density–strength conversions for galenical preparation.

The application runs in the browser (Blazor Server, .NET 10) at <https://ptcalc.net> (English) and
<https://ptcalc.tr> (Turkish); data entered by the user stays in the browser session and is never stored on the
server. The same computations are available as a dependency-light class library (`PTCalc.Core`, MIT licence)
that can be used from any .NET language or from scripts. Each tool ships with a bilingual guide that explains
the method, its prerequisites and its common misuses, with DOI-referenced sources.

# Statement of need

Dissolution-profile modelling is a standard step in formulation development and in *in vitro*–*in vivo*
correlation studies, yet it is still mostly done with spreadsheets. The most widely used dedicated tool,
DDSolver [@Zhang2010], is an Excel add-in restricted to Windows Excel, and KinetDS [@Mendyk2012] is a Java
desktop program that is no longer maintained. Spreadsheet practice commonly linearises each model (for example
$\log F$ versus $\log t$ for Korsmeyer–Peppas) and compares models by $R^2$ in the transformed space, which
makes the goodness-of-fit measures incomparable across models and systematically favours models with more
parameters. PTCalc addresses these problems in one place:

- every model is fitted to the same data in the same ($F$, %) domain, so residual sums of squares, AIC, AICc
  and MSC are directly comparable, and the ranking penalises extra parameters;
- the Korsmeyer–Peppas rule of fitting only the $F \le 60\,\%$ portion [@Korsmeyer1983; @Costa2001] is applied
  by default and reported separately, because a model fitted to a subset of the points cannot be ranked by AIC
  against models fitted to all points;
- Hopfenberg geometry exponents [@Hopfenberg1976] include the half-sphere and triangle cases introduced for
  erodible tablets by @Karasulu2000, and degenerate cases that coincide with other models are excluded from the
  ranking so that Akaike weights are not double-counted;
- the solver combines a linear seed with Levenberg–Marquardt refinement and a Nelder–Mead fallback and never
  returns a fit worse than its seed.

The engine's equations, point-selection rules and goodness-of-fit definitions were compared with DDSolver 1.0
on 32 worksheets (37 formulations) generated with the add-in's own example data: at DDSolver's parameter
estimates PTCalc reproduces DDSolver's SS, $R^2$, adjusted $R^2$, MSE, AIC, MSC and secondary parameters
($T_{25}$–$T_{90}$) to within $10^{-7}$ relative error, and its own fits are never worse in SS than
DDSolver's in any of the 37 cases. These comparisons are part of the test suite and run in continuous
integration. The statistics module is compared in the same way against SciPy and statsmodels reference values,
including the studentized-range distribution used by Tukey HSD, which is implemented from its integral
definition because no .NET numerical library provides it.

Diluting stock ethanol to a working strength is a routine step in galenical preparation, and its arithmetic is
not the obvious one: water and ethanol contract on mixing, so the naive proportion between stock and target
strength prescribes too little water. The reference data are the OIML R 22 alcoholometric tables
[@OIML1975], normally consulted as printed tables and interpolated by hand. PTCalc evaluates the underlying
equation directly and returns the dilution recipe by volume or by weight at the preparation temperature,
together with density–strength conversions and the inverse of the equation, which has no closed form and is
solved iteratively. This module is checked against the printed tables themselves: 6 889 cells of Tables I to V,
transcribed from the published tables independently of the code, are reproduced at the tables' own two-decimal
precision in all but five cells, which differ by 0.01 on a rounding boundary.

The pseudo-ternary phase-diagram tool computes the area and centroid of a phase region by the shoelace formula
on the plotted polygon, a metric the author's group has used since 2001 to compare surfactant systems
quantitatively rather than by visual inspection, and draws the region boundary as a centripetal Catmull–Rom
curve through the measured points. The calibration-curve tool is designed for teaching as well as routine use:
besides slope, intercept, LOD and LOQ it back-calculates every standard, flags levels outside the usual
accuracy limits, and shows the inverse-prediction calculation for unknown samples step by step with the
intermediate quantities [@Miller2018].

PTCalc is intended for formulation scientists, analytical laboratories and pharmacy students. The tools descend
from desktop programs developed and used in the author's department since 1995; the present repository is a
rewrite as a single open-source web application and library.

# State of the field

Dedicated dissolution-modelling software is scarce. DDSolver [@Zhang2010] is the de facto reference: it is
comprehensive, but it is a closed Excel add-in that runs only in Windows Excel, its source cannot be inspected
or tested, and its Nelder–Mead optimiser can stop before convergence. KinetDS [@Mendyk2012] is open source but
is a desktop Java program that is no longer maintained. General-purpose environments (R, Python with SciPy,
commercial statistics packages) can fit any of these models, but the model library, the point-selection rules,
the ranking criteria and the pharmaceutical secondary parameters have to be written by each user, which is
rarely practical for formulation laboratories or students. Similarity factors and alcoholometric dilution are
usually computed in ad hoc spreadsheets, and we are not aware of an open tool that measures pseudo-ternary
phase-region areas. PTCalc does not try to replace general statistical environments; it packages the
pharmaceutical-technology-specific conventions in one tested, open and platform-independent place, and it
documents where its definitions coincide with or differ from DDSolver.

# Software design

The code is split into a computational library and a user interface. `PTCalc.Core` contains all numerical
methods and has no ASP.NET or Blazor dependency; it depends only on MathNet.Numerics, so it can be used from
tests, scripts or other .NET applications, and every user-facing message passes through a small localisation
layer (Turkish keys with an English translation table) so that the library itself stays language-neutral. The
web application (Blazor Server) is a thin layer that parses tabular input, calls the library and renders tables
and charts; computation therefore happens on the server while entered data are held only in the user's session.
A server-side interactive model was chosen over a client-side (WebAssembly) build to keep the initial page load
small for students on slow connections, at the cost of requiring a live connection.

Several design choices trade generality for correctness in the pharmaceutical setting: models are fitted in the
untransformed released-fraction domain rather than linearised, so that information criteria are comparable;
model variants that become mathematically identical to another model are removed from the ranking; and
numerical routines that .NET lacks (the studentized-range distribution, the inverse of the OIML equation) are
implemented directly and checked against external references. The test suite (xUnit) compares the kinetic
engine with DDSolver output, the statistics with SciPy/statsmodels values generated by a script kept in the
repository, and the alcoholometry module with the printed OIML tables; it runs on Linux and Windows in
continuous integration on every push.

# Research impact statement

PTCalc continues desktop tools that have been used in the author's department for dissolution and
phase-diagram work since 1995, including published studies on erodible tablets [@Karasulu2000]. The
dissolution-kinetics and IVIVC program from which the kinetic engine descends was presented in 2001
[@Ege2001] and is cited in at least six papers from 2003 to 2024. The
phase-diagram analysis program from which the ternary tool descends was presented in 2004 [@Ege2004]; we have
found at least seven peer-reviewed papers from 2007 to 2026 that cite it or name it as the software used to
draw their pseudo-ternary diagrams, for example in ocular [@UstundagOkur2014] and oral [@Ebrahimi2026]
microemulsion formulation. The web
application is publicly available without registration in English and Turkish, and its bilingual guides are
written for teaching as well as for laboratory use. Each release is archived on Zenodo with a citable DOI, and
the core library can be reused independently of the website, which makes analyses reproducible from the
versioned source.

# AI usage disclosure

Generative AI tools (Anthropic Claude, via Claude Code) were used during development to assist with code
refactoring, test scaffolding, documentation, English translation of the interface and guides, and editing of
this manuscript. All methods, equations and reference comparisons were chosen by the author, and all
AI-assisted output was reviewed, tested and revised by the author, who takes full responsibility for the
software and the paper.

# Acknowledgements

The author thanks colleagues at the Department of Pharmaceutical Technology, Ege University, whose dissolution
and phase-diagram data shaped these tools over many years. DDSolver example data are used only within the unit
tests for comparison; see the repository's third-party notices.

# References
