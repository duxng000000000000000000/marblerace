# Marble Race 2D

A mobile-friendly, browser-based marble elimination tournament using Matter.js physics.

## Tournament format

All remaining marbles start together on every stage:

| Stage | Start | Advance | Eliminated |
| --- | ---: | ---: | ---: |
| 1 | 15 | 12 | 3 |
| 2 | 12 | 9 | 3 |
| 3 | 9 | 6 | 3 |
| 4 | 6 | 3 | 3 |
| 5 | 3 | 2 | 1 |
| 6 — Final | 2 | 1 champion | 1 |

The first marbles to cross the finish are safe. The required number of finishers advances; everyone else is eliminated. If a round reaches its time limit, the order is resolved by finishers first, then by the marbles' current progress.

## Six different maps

1. **Pinball Field** — bumper field and a rotating paddle.
2. **Rotor Hall** — three rotating sweepers.
3. **Sliding Gates** — moving gates that open and close.
4. **Conveyor Factory** — directional conveyor zones, rollers and a moving platform.
5. **Pendulum Panic** — three swinging hammers.
6. **Final Vortex** — faster rotors, a moving flipper and a conveyor.

Each map has reset portals that send a marble back to the top. Moving parts are animated and collide with marbles through Matter.js. The map editor lets you add or remove fixed walls for the current stage; edits are saved locally in the browser.

## Map and obstacle inspiration

The obstacle themes are original 2D layouts inspired by public marble-run and obstacle-course references, rather than copied TikTok video frames. The references include the rotating fan modules, gears and plank layouts shown in [Marble Run 2D on Steam](https://steamcommunity.com/app/807140/) and [its track screenshots](https://steamdb.info/app/807140/info/), plus the rotating walls, hammers and moving obstacles discussed in this [level-design breakdown](https://www.ljohnknee.com/level-design-breakdowns.html).

## Run

Open `index.html` or deploy the repository with GitHub Pages. Matter.js is loaded from jsDelivr, so an internet connection is needed.

## Saved data

Racer names, compressed profile pictures and custom wall edits are stored in this browser's localStorage. They do not automatically sync to another device or browser.
