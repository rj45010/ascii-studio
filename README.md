# ASCII Studio

Turn an image or video into a photo overlaid with glowing ASCII glyphs, in the browser.

Live: https://ascii-studio-5h9.pages.dev

Everything runs locally in your browser. Files you open are never uploaded.

## Use

Click **Open** or drop an image or video anywhere on the page. The bar under the tabs shows the file name and size.

**Left pane: glyphs**

| Control | What it does |
|---|---|
| Characters | The glyph set, darkest to brightest |
| Cell size | Grid spacing in pixels; smaller means more, smaller glyphs |
| Opacity | Glyph opacity |
| Random characters | Pick glyphs at random instead of by brightness |
| Threshold | Pixels darker than this get no glyph |
| Coverage | How many of the qualifying cells get a glyph |
| Edges | Adds glyphs along edges in the image |
| Invert | Put glyphs in dark areas instead of bright ones |

**Right pane: image**

| Control | What it does |
|---|---|
| Brightness, Contrast, Saturation | Colour grade for the photo and for glyph selection |
| Blur, Dim | Softening and darkening of the photo under the glyphs |
| Bloom | Glow around the glyphs |
| Vignette | Darkened corners |
| Grain | Film grain |

**Bottom bar**

- Save: downloads the current frame as a PNG at the source resolution (up to 1920px wide).
- Record (video only): restarts the video and records until you press it again, then downloads an mp4 (or webm where mp4 isn't supported).
- Zoom: − and + step by 25% between 10% and 800%. Click the percentage for 100%, or Fit to fit the window. Pinch or Ctrl/Cmd + scroll also zooms.

Limits: recordings have no audio and run in real time, so a 30-second clip takes 30 seconds to record.

No build step and no runtime dependencies: the whole app is `index.html`.

## Tests

End-to-end tests run the real page in Chromium with Playwright: rendering, every control, PNG export, zoom, drag and drop, video recording and the phone layout.

```sh
npm install
npx playwright install chromium
npm test                                              # local
BASE_URL=https://ascii-studio-5h9.pages.dev npm test  # live site
```

## License

MIT © 2026 Rahul Jangid. You may use this code, including commercially, as long as the copyright notice and license are kept. See [LICENSE](LICENSE).
