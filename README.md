# Poster Lab

Generative poster maker. Pick a pattern, tune a few sliders, roll a seed, download a print-ready PNG.
Inspired by [Book of Shapes](https://bookofshapes.com) and [Terraink](https://terraink.app).

No build, no dependencies — open `index.html` over any static server.

```bash
python3 -m http.server 8778
```

Every poster is reproducible from its URL (`#p=…&s=…&t=…`) — copy the link to share the exact sheet.

## Roadmap
1. ✅ Generative patterns (this)
2. Star map (date + place → night sky)
3. Typographic / lyric sheets
4. Audio waveform posters
5. GPS route (GPX) posters
6. Moon phase / calendar posters

Each will plug in as another "source" that draws into the same sheet frame.
