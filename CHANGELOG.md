# Changelog

Notable changes to `gs1-barcode-parser-mod`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[semantic versioning](https://semver.org/spec/v2.0.0.html).

Releases before 1.0.3 predate this file and are not reconstructed here.

## 1.2.1 - 2026-08-13

### Fixed

- `703` and `723` build their identifier by putting the fourth digit onto a stem rather than by
  matching it, so a barcode stopping before that digit had no switch arm to fall through and came
  back as a successful parse whose `ai` was `"703"` or `"723"` — neither of which the standard
  defines — with a title trailing off after the `#`. Both are refused now. ([#18])

## 1.2.0 - 2026-08-13

### Added

- Date elements carry their date as text in a new `isoDate`, e.g. `"2025-06-30"`, or
  `"1985-06-30T14:35"` where the element holds a time. A date without a time of day cannot be
  carried unambiguously in a Javascript `Date` — reading one back means choosing between the
  local getters and the UTC ones, and either choice shifts the day for somebody. The text says
  the day the barcode says, wherever the reader sits. ([#15])

### Fixed

- README figures corrected. It claimed 205 identifiers against upstream's 134; counted the same
  way for both, the parser accepts 226 and upstream 143. It also documented an element attribute
  `title`, where the property is `dataTitle`, and sent readers to a `scripts` folder that no
  longer exists. ([#17])
- A barcode which stops part way through an application identifier is refused instead of
  coming back as a successful parse holding an empty element. Several inner switches carry no
  default arm, so 26 three digit prefixes — `]C1230`, `]C1430`, `]C1701` and the rest — matched
  nothing, parsed nothing, and returned `""` where an element should have been. Some are a real
  family with the last digit missing, others name nothing the standard defines. The guard sits
  at the end of the identifier switch rather than in each arm, so an identifier added later
  without a default cannot bring it back. ([#16])

## 1.1.0 - 2026-08-13

### Added

- Identifiers `03` MTO GTIN, `716` NHRN AIC and the person block `7250`-`7259`, which
  identifies a patient rather than a trade item, taking coverage from 193 identifiers to
  205. `7250` and `7251` carry a four digit year and get their own parser: reading them
  with the two digit one puts the date in the wrong century and leaves the surplus digits
  behind to be parsed as another identifier, so the barcode comes back with a spurious
  extra element instead of an error. ([#9])
- The human readable form of an element string is accepted:
  `(01)04012345678901(17)261230(10)ABC123`. It is rewritten into the separated form and
  parsed by the same identifiers as a scanned code, so both give the same result. Without a
  symbology identifier `codeName` becomes `GS1 Element String (HRI)`. ([#8])
- Bracketed identifiers are checked against the ones actually parsed, so `(017)250630` is
  refused rather than being read as identifier `01` with `7250630` as its data. ([#8])
- Coverage measurement with `c8`, reported in every CI run and enforced as a threshold, so
  a change that adds a branch nothing exercises fails rather than passing quietly. ([#10])
- Specs for every way an identifier can be refused, for the symbology identifiers other
  than `]C1`, for elements carrying an ISO code, and for the sliding year window. Coverage
  went from 94% of statements and 77% of branches to 99% and 97%. ([#11])
- Identifiers `7030`-`7039`, `7230`-`7239` and `8026`, which the parser supported but which
  were missing from the table meant to hold all of them. ([#11])
- Specs taking coverage to 100% of statements, branches, functions and lines, with the
  thresholds set there. The far half of the sliding year window is reached by moving the
  clock, being otherwise unreachable until 2050. ([#13])

### Fixed

- A date or a measure written in something other than digits is refused instead of coming
  back as a successful parse holding an `Invalid Date` or a null weight. Both were read with
  `parseInt` and `parseFloat`, wrapped in a `try` which could never fire because neither
  throws on rubbish — they return `NaN`. ([#13])

### Changed

- A fixed length element whose data is truncated is refused instead of returning a short or
  quietly wrong value. This affects all three fixed length parsers, and the two numeric ones
  are why it matters: a truncated measure returned 0.052 kg instead of 0.525 kg, and a
  truncated date read 2025-06-30 as 2025-06-03. A separator inside the element's own window
  counts as truncation too. ([#7])

  This is a behaviour change. Input that used to return a value now throws
  `truncated fixed length element`, and because the parse unwinds, a barcode whose last
  element is truncated loses the elements parsed before it. Valid input is unaffected: a
  differential run over 20,000 well formed barcodes found no difference.

### Removed

- The unreachable `case "38"` arm of the message switch. The check it belonged to runs
  outside the `try` that feeds the switch, so it could never fire. ([#11])

## 1.0.8 - 2026-08-13

### Fixed

- Two `switch` statements closed a level early, so 46 of the 193 supported identifiers were
  broken on 1.0.7. The whole `4300`-`4333` block and `710`-`715` threw `invalid AI`; `7010`
  parsed and was then relabelled as `7011`; `7020`-`7023`, `7040` and `7240`-`7242` came
  back with `ai: undefined`. All 193 parse correctly now. ([#6], reported by
  [@matevzv](https://github.com/matevzv), with the second case found by
  [@Duskfen](https://github.com/Duskfen))

### Added

- A spec that parses every supported identifier and checks each comes back under its own
  identifier, so this class of fault fails the build rather than shipping. ([#6])
- CI running lint, specs and build on every push and pull request, and publishing to npm
  from `master` through Trusted Publishing when the version is not already on the registry.
  ([#6])

### Changed

- The test runner is `jasmine` run directly, the linter `jshint`, the minifier `terser`.
  Two of the three grunt tasks had stopped working: `grunt-contrib-jasmine` drives PhantomJS,
  which no longer starts, so `npm test` hung rather than failing, and `grunt-contrib-uglify`
  cannot parse the ES6 `const` the source has used for years. ([#6])

## 1.0.7 - 2024-09-09

### Added

- A large number of identifiers, taking coverage well past what upstream ever had.
  ([#4], by [@guillaumegarcia13](https://github.com/guillaumegarcia13))

### Changed

- A two digit year is resolved with the sliding window from section 7.1.2 of the GS1
  General Specifications, relative to the current year, instead of the fixed rule that read
  51 to 99 as the twentieth century. ([#4])

## 1.0.6 - 2022-06-02

### Added

- The missing `41x` identifiers. ([#1], by
  [@chgenzel](https://github.com/chgenzel))

## 1.0.5 - 2020-03-06

### Added

- A `raw` property on every parsed element, holding the untouched substring it was read
  from.

## 1.0.4 - 2019-09-01

### Fixed

- A date whose day part is `00` is turned into the last day of that month rather than
  rolling into the next one.

## 1.0.3 - 2019-08-31

### Added

- `parseBarcode` is exported as a CommonJS module rather than left as a browser global.

### Fixed

- Only the first group separator is stripped when a scanned code is normalised, which had
  been breaking remedy QR codes.

Only `v1.0.7` is tagged, so the usual compare links between releases are left out until the
rest of the tags exist.

[#1]: https://github.com/MaximBelov/BarcodeParser/pull/1
[#4]: https://github.com/MaximBelov/BarcodeParser/pull/4
[#6]: https://github.com/MaximBelov/BarcodeParser/pull/6
[#7]: https://github.com/MaximBelov/BarcodeParser/pull/7
[#8]: https://github.com/MaximBelov/BarcodeParser/pull/8
[#9]: https://github.com/MaximBelov/BarcodeParser/pull/9
[#10]: https://github.com/MaximBelov/BarcodeParser/pull/10
[#11]: https://github.com/MaximBelov/BarcodeParser/pull/11
[#13]: https://github.com/MaximBelov/BarcodeParser/pull/13
[#15]: https://github.com/MaximBelov/BarcodeParser/pull/15
[#16]: https://github.com/MaximBelov/BarcodeParser/pull/16
[#17]: https://github.com/MaximBelov/BarcodeParser/pull/17
[#18]: https://github.com/MaximBelov/BarcodeParser/pull/18
