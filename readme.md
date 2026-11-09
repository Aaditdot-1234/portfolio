# Aadit Chaurasia — Portfolio

A developer portfolio built around a real-time, ray-traced black hole
inspired by Gargantua. No textures or video: every pixel of the black hole
traces a bent light ray through curved spacetime in a fragment shader.
Scrolling into the last section drops the camera through the event horizon.

Built with React + Vite + three.js.

## Run it

```bash
npm install
npm run dev       # local dev server at http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build
```

## Deploy (Vercel)

Import the repo in Vercel. It detects Vite automatically
(build command `npm run build`, output directory `dist`). No extra config needed.

## Make it yours

| What | Where |
| --- | --- |
| Bio, about, experience, contact copy | `src/components/Sections.jsx` |
| Projects, skills, certifications | `src/data/projects.js`: set each project's `link` to its GitHub repo |
| Résumé download | replace `public/assets/Aadit-Chaurasia-Resume.pdf` |
| Each project's 3D visual | `builders` in `src/three/viewer.js` (`neural`, `voice`, `network`, `planet`) |
| Custom `.glb` model for a project | put it in `public/models/` and set `model: "/models/name.glb"` |
| Camera path while scrolling | `KEYS` array at the top of `src/three/blackHole.js` (one entry per section) |
| Black hole look (disk size, colours, brightness) | `src/three/blackHoleShader.js`: `DISK_IN`, `DISK_OUT`, the temperature ramp, `intensity` |
| The view inside the horizon | `singularity()` in `src/three/blackHoleShader.js` |
| Colours and fonts | CSS variables at the top of `src/index.css` |

If you add or remove a `<section>`, add or remove a matching entry in `KEYS`.

## Files

```
index.html                      HTML shell (fonts, favicon, #root)
src/main.jsx                    React entry
src/App.jsx                     page layout + loader
src/index.css                   all styling
src/components/Space.jsx        fixed black-hole canvas + HUD
src/components/Header.jsx       top nav with active-section highlighting
src/components/Sections.jsx     hero, about, experience, skills, contact
src/components/Work.jsx         project cards + interactive 3D viewer
src/three/blackHole.js          renderer, bloom, scroll-driven camera, HUD, adaptive resolution
src/three/blackHoleShader.js    the GLSL ray-tracer (lensing, disk, stars, inside-the-horizon view)
src/three/viewer.js             3D model viewer + procedural placeholder models
src/data/projects.js            your projects and skills (edit this)
public/assets/                  static files served as-is (résumé)
```

## Notes

- Resolution adapts automatically to keep the frame rate smooth on weaker GPUs.
- `prefers-reduced-motion` freezes the disk rotation and page animations.
