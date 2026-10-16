# Piano Moths

A 15-second single-viewport hero sequence. A grand piano sits in a dark room. Keys depress. Moths lift off the keys, wings catching light with procedural scale ridges and structural color. At peak density the image warps — chromatic split, UV stretch, the fallboard reflection softens — then snaps back. The loop is seamless.

Built for drop-in use on a marketing site. No scroll. Fixed camera. One clock.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output lands in `dist/`. Serve that folder, or copy its contents into your existing site and load `index.html` (or the built JS entry) in a full-viewport container.

## Structure

- `src/sequence.js` — 15s timeline. Edit the timestamps and intensities to reshape the build.
- `src/moth.js` + `src/materials/wingMaterial.js` — wing geometry, flap shader, scale ridges, SSS approximation.
- `src/mothSystem.js` — burst spawning and culling.
- `src/post/distortionPass.js` — density-driven chromatic + warp pass.
- `src/piano.js` — body and individual keys.
- `src/scene.js` — lighting, camera, render loop.

## Drop-in

The sequence auto-starts. To embed in an existing page, mount the canvas into a fixed-height container and call `new HeroScene(canvas).start()`. Resize is handled internally.
