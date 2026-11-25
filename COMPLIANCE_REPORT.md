# Assignment compliance report

The statuses below distinguish observed checks from remaining review. This is not a guarantee of academic compliance.

## Changes and source counts

Modified original files: `index.html`, `style.css`, `sketch.js`, and `README.md`. Added: `assets/display/bag-result.svg`, `LICENSE`, `licenses/p5-LGPL-2.1.txt`, `THIRD_PARTY_NOTICES.md`, `STUDENT_REVIEW_CHECKLIST.md`, and this report. Original audio, illustrations, fonts, and p5.min.js were preserved. No Git commit or push was made.

| File | Physical lines before | Physical lines after |
|---|---:|---:|
| index.html | 8 | 112 |
| style.css | 23 | 275 |
| sketch.js | 128 | 720 |

The files previously had actual line breaks, but many unrelated statements were compressed onto single lines; this was compact formatting, not a VS Code word-wrap issue. They now contain multiline source. The third-party minified p5.js distribution was not reformatted; its SHA-256 matched the checkpoint.

## Function-length audit

Acorn parsed 47 functions and callbacks; 17 span 15 or more physical lines. The instructor’s short-function guideline is **NEEDS REVIEW**: the separation work is incomplete and these are not assertions that every exception is necessary. The student should review and split them further where practical.

| Function | Lines | Starts at | Current reason |
|---|---:|---:|---|
| `drawPlasticFragments` | 43 | 557 | shard geometry and splitting remain grouped |
| `drawOrganicRoots` | 41 | 629 | root branches and curves remain grouped |
| `generateTunnel` | 39 | 134 | perspective, modes, and row construction remain grouped |
| `drawAmbient` | 39 | 270 | viewport clipping and background extension remain grouped |
| `fitImage` | 34 | 194 | atlas and p5 image paths remain grouped |
| `drawNative` | 29 | 229 | canvas frame and fallback rendering remain grouped |
| `drawOrganicMatter` | 27 | 601 | organic fragment geometry remains grouped |
| `drawPetFlakes` | 25 | 481 | flake geometry remains grouped |
| `drawPetFilaments` | 24 | 507 | filament curves remain grouped |
| `drawPetWeave` | 24 | 532 | interlacing loops remain grouped |
| `findObject` | 22 | 376 | inverse transforms and hit testing remain grouped |
| `generateLandingGrid` | 22 | 671 | stable grid parameters remain grouped |
| `updateHover` | 21 | 399 | visible-depth calculation and interpolation remain grouped |
| `preload` | 16 | 55 | asset name list spans multiple lines |
| `mousePressed` | 16 | 359 | selection, sound, and texture state remain grouped |
| `drawRotatingTunnel` | 16 | 705 | tunnel transforms and row rendering remain grouped |
| `drawSelection` | 15 | 342 | pupil positioning and result transition remain grouped |

Refactoring separated setup/navigation and the PET, plastic, and organic texture routines into named parts, including `loadFrameAtlases`, `initializeAmbientCanvas`, `openArtwork`, `bindNavigation`, `generateLandingGrid`, `initializeTextureMarks`, `drawRotatingTunnel`, `drawPetTexture`, `drawPetFlakes`, `drawPetFilaments`, `drawPetWeave`, `drawPlasticTexture`, `drawPlasticFragments`, `drawOrganicTexture`, `drawOrganicMatter`, and `drawOrganicRoots`. Existing compact coordinate variables remain; naming cleanup is **NEEDS REVIEW**. Comments describe frame playback, seeded placement, clipping, hit detection, audio, and session state; student review and further comments remain required.

## Features and tests

- **PASS -** Local HTTP server on port 8072 served the project; browser loaded landing, ABOUT, EXPLORE and the rotating tunnel without observed console errors.
- **PASS -** Browser DOM reported canvas backing dimensions 1920 × 1080. Pixel density is set to 1. This checks the canvas, not an exported image.
- **PASS -** Test controls triggered all four result states: shirt, enlarged bird, seedling/tree transition, and the AI-assisted blue bag. This does not establish the accuracy of every rotating-object hitbox.
- **PASS -** Test controls triggered each original WAV and the browser reported a `playing` event for apple, bottle1, bottle2 and bag. Speaker audibility, sound quality, replay, and overlapping behavior still require listening tests.
- **PASS -** Page 2 stayed open after reload, and the observed mode changed from 1 to 0 in one reload test. Not all three arrangements were visually inspected in isolation.
- **PASS -** Full GPL 3.0 text is included in `LICENSE`. The LGPL 2.1 license for p5.js and SIL OFL font license are included; source artwork and audio have not been represented as GPL-licensed.
- **PASS -** ABOUT was inspected in the browser and shows 25 November 2026, Semester 3/2026, the revised attribution, and a publisher link.
- **NEEDS REVIEW -** The apple WAV is only about 0.015 seconds long; confirm it is the intended recording. Its browser `playing` event does not establish that it is audible.
- **NEEDS REVIEW -** The new bag SVG and project code were AI-assisted. The student must inspect, edit and comment on these sections, and review the rights and release terms. No student edits are claimed.
- **NEEDS REVIEW -** Full Harvard citation and quotation wording should be checked against the chosen printed edition and an authoritative page number. The wording appears in the book text, and publisher and library records identify the 2010 Free Press edition; the printed page number was not established.
- **NOT TESTED -** Fullscreen behavior at every required viewport, exact 1920 × 1080 exported capture, GitHub Pages deployment, extended performance on a typical laptop, every actual tunnel click and hover, and all three modes individually.
- **NOT TESTED -** Direct speaker listening, repeated playback, rapid switches, hover-only silence, and every transformation after the final refactoring. The test controls bypassed tunnel hit testing.

## Generative system

The new 3-way mode selection occurs on entry or Page 2 reload and avoids the immediately preceding session mode. The checkerboard uses row/column parity; diagonal mode changes the row parity rhythm; offset mode staggers alternate rows. The base perspective and rotation speed remain unchanged. The outermost visible depth row is rendered at 230/255 opacity, interpolating toward 255 on hover. Bird display is 1.35× its prior bounding dimensions. Bag produces no new material texture.

## Reference sources

- Leonard A (2010) *The story of stuff: how our obsession with stuff is trashing the planet, our communities, and our health - and a vision for change*, Free Press, New York. [Publisher’s 2010 edition](https://www.simonandschuster.net/books/The-Story-of-Stuff/Annie-Leonard/9781439148785).
- [Library catalog record](https://library.comfsm.fm/webopac/titleinfo?highlight=no&k1=1532241&k2=151453&k3=33353&limiters=DNA&offset=1).
- [Book text containing the quotation](https://www.pdf-archive.com/2014/07/14/the-story-of-stuff/the-story-of-stuff.pdf).
- [RMIT Harvard guide](https://rmit.libguides.com/library-research/harvard-style).

See `STUDENT_REVIEW_CHECKLIST.md` before submission.
