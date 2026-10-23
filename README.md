# ASCII Studio

Turn an image or video into a photo overlaid with glowing ASCII glyphs, in the browser.

Live: https://ascii-studio-5h9.pages.dev

Everything runs locally in your browser. Files you open are never uploaded.

## Use

Open `index.html` (or the live link), then drop in an image or video.

- Left pane: which characters are drawn and where they appear.
- Right pane: colour, the background photo, and effects (bloom, vignette, grain).
- Bottom: save a PNG, record processed video, zoom.

No build step and no runtime dependencies: the whole app is `index.html`.

## Tests

```sh
npm install
npx playwright install chromium
npm test                                           # local
BASE_URL=https://ascii-studio-5h9.pages.dev npm test  # live site
```

## License

MIT © 2026 Rahul Jangid. You may use this code, including commercially, as long as the copyright notice and license are kept. See [LICENSE](LICENSE).
