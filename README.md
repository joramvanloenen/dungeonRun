# DUNGEON//RUN

A fast, zero-dependency, top-down pixel-art dungeon crawler **and a built-in world workshop** for desktop and touchscreens. Everything runs as static files on GitHub Pages.

## Play

Open [DUNGEON//RUN](https://joramvanloenen.github.io/dungeonRun/).

Defeat every monster in a room, step into the glowing green exit to descend, keep your combo alive and survive as long as possible. Damage scales as you go deeper. Killing enemies awards souls, higher combos multiply rewards, and every seven kills unlocks a health/attack upgrade. Props can contain souls, and lava damages the player.

| Control | Action |
|---|---|
| WASD or arrow keys | Move |
| Hold left mouse button or Space | Rapid melee attacks |
| Mouse position | Aim weapon |
| Shift | Dash in movement or facing direction |
| Escape | Pause / resume |
| R (after defeat) | Restart |
| Touch joystick | Move on touchscreen |
| Touch sword and dash buttons | Attack / dash on touchscreen |

## Workshop

Switch to **Workshop** in the navigation bar.

- **Room Editor** — paint floor/wall/hazard tiles on a 28×17 grid; place enemy and prop instances; set hero spawn and level exit; draw or bucket-fill tiles; make and duplicate custom rooms.
- **Texture Lab** — edit 16×16 tile textures pixel-by-pixel. Set tiles as collidable and/or damaging.
- **Enemy Forge** — draw 16×16 enemy sprites and configure health, movement speed, attack damage, soul reward and chase / ranged / charge AI.
- **Prop Studio** — draw 16×16 props and configure collisions, destructibility, durability and soul drops.
- **Shared asset pipeline** — new texture/monster/prop art appears immediately in room editing and in the next run.
- **Undo/redo** — per-edit undo/redo, including Ctrl/Cmd+Z and Ctrl/Cmd+Y.
- **Local autosave** — edits save automatically in browser localStorage.
- **World import/export** — download a JSON world pack as backup or to share with friends. Import a pack to load it. Sprite PNG export is available in the artwork editors.

In the artwork editors: drag to draw, right-click to erase, select a palette color, use fill or color pick, and enable horizontal mirroring. In the room editor, switch layers to place tiles, enemies, props, spawn and exit.

**Play your world** starts with your selected room. Following levels continue through the room library. For the next playtest, make sure you have a valid floor path from spawn to exit.

## Architecture

Plain HTML + CSS + JavaScript, with a pixel-canvas engine:

- index.html — app shell, HUD, menus and editor markup
- style.css — responsive arcade UI and mobile touch layouts
- data.js — built-in pixel art, editable asset schema, storage and file import/export
- game.js — collision, enemy AI, melee combat, projectiles, dash, particles, levels, audio
- editor.js — tile map and pixel sprite editing, asset inspector and undo/redo
- .github/workflows/pages.yml — GitHub Pages deployment from main

Designed for no build system, no packages and no server-side services. Modern browsers required for Canvas 2D, Pointer Events, Web Audio and localStorage.

## Run locally

Open index.html in a browser. If local file security rules interfere with scripts, serve the directory with:

    python -m http.server 8080

Then visit http://localhost:8080.

## Publishing

Push to the main branch. GitHub Actions runs the Pages deployment workflow. If the deployment doesn't activate automatically, in repository **Settings → Pages**, select **GitHub Actions** as the build/deployment source and re-run the workflow.

## Data and privacy

Your game world and records are stored **on your device**. They don't automatically sync between browsers or devices. Export your pack before clearing browser data.
