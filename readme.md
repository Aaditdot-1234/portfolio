# Aadit Chaurasia — Portfolio

A developer portfolio built around a real-time, ray-traced black hole
inspired by Gargantua. No textures or video: every pixel of the black hole
traces a bent light ray through curved spacetime in a fragment shader.

## Run it

ES modules don't load from `file://`, so serve the folder locally:

```bash
python -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

## Make it yours

| What | Where |
| --- | --- |
| Bio, about, experience timeline, contact | `index.html` |
| Projects, skills, certifications | `js/projects.js`: set each project's `link` to its GitHub repo |
| Résumé download | replace `assets/Aadit-Chaurasia-Resume.pdf` |
| Each project's 3D visual | `builders` in `js/viewer.js` (`neural`, `voice`, `network`, `planet`) |
| Camera path while scrolling | `KEYS` array at the top of `js/main.js` (one entry per section) |
| Black hole look (disk size, colours, brightness) | `js/blackhole.js`: `DISK_IN`, `DISK_OUT`, the temperature ramp, `intensity` |
| Colours and fonts | CSS variables at the top of `css/style.css` |

If you add or remove a `<section>`, add or remove a matching entry in `KEYS`.

## Files

```
index.html        page structure and copy
css/style.css     all styling
js/blackhole.js   the GLSL ray-tracer (lensing, accretion disk, stars)
js/main.js        renderer, bloom, scroll-driven camera, HUD, adaptive resolution
js/viewer.js      interactive 3D model viewer + procedural placeholder models
js/projects.js    your projects and skills (edit this)
```

## Notes

- Resolution adapts automatically to keep the frame rate smooth on weaker GPUs.
- `prefers-reduced-motion` freezes the disk rotation and page animations.
- Deploys as-is to any static host (GitHub Pages, Netlify, Vercel).
