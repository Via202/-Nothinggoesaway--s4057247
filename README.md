# Nothing Goes Away

A p5.js generative artwork about the continuing life of discarded materials, created for COMM2754 and SDG 12.

## Run locally

From this directory, run:

```sh
python -m http.server 8000
```

Open http://localhost:8000 in a browser. The project uses relative paths and does not require a server-side application. If Python is unavailable on Windows, try `py -m http.server 8000`.

## How to use the artwork

Choose EXPLORE to enter the artwork. Click an exposed tunnel object: bottle 1 shows a shirt, bottle 2 a bird, an apple shows a seedling and then a tree, and a bag shows a blue bag. Each click plays its corresponding original recording. ABOUT opens the project information on the landing page. A browser may block sound until it receives a user gesture. If a sound cannot play, the visual remains functional.

Page 2 is remembered in session storage on reload; a fresh arrangement and a different pattern mode are chosen. The existing interface does not provide a return-to-landing control. Closing the browser session, or clearing the page's session storage, returns to the landing page.

## Structure and adjustment

The canonical p5.js canvas is 1920 × 1080 with pixel density 1. CSS preserves the 16:9 composition; a separate ambient canvas extends the background. The repeated tunnel uses one of three modes: alternating checkerboard, diagonal grouping, and staggered rows. Each arrangement stays stable while the tunnel rotates. The material textures develop over time and are clipped behind the eye.

Edit CONFIG in `sketch.js` to change density, speed and timing. The original GIF frames are played at 70 ms per frame from reusable WebP atlases in `assets/frames`; the original GIFs remain in `assets/originals`. Audio files are in `assets/audio`. The bag result is an AI-assisted SVG in `assets/display/bag-result.svg` and should be reviewed by the student. The displayed bird uses a 351 × 378 bounding box, 1.35 times its previous 260 × 280 box. The outermost visible tunnel row starts at alpha 230/255 and smoothly returns toward 255 when hovered.

## Authorship and licenses

The student supplied the concept, original illustrations, sound recordings, and art direction. The project code and the new blue bag SVG were AI-assisted in this conversation; the student should inspect, edit, comment, and be able to explain them before submission. No claim is made that the student has already manually edited AI-generated code. See `STUDENT_REVIEW_CHECKLIST.md` and `COMPLIANCE_REPORT.md`.

Original project source code is distributed under GPL-3.0-or-later; the full license is in `LICENSE`. Artwork and audio remain the creator's work and are not automatically relicensed by that statement. p5.js and Sue Ellen Francisco have their own licenses; see `THIRD_PARTY_NOTICES.md` and `licenses/`.

## Known limitations

`apple.wav` is approximately 0.015 seconds long and may be inaudible or sound like a click; check the original recording. Audio output depends on the browser and device. The bibliography links to the publisher's 2010 edition, but the specific printed page has not been established. Several drawing and geometry functions exceed the requested 14-line guideline; see the audit. No GitHub commit or push has been made.
