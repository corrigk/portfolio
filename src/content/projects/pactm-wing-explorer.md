---
title: PACTM Wing Explorer
summary: An interactive lifting-line wing and spar design tool I built to pick the airfoil for the PACTM RC airplane.
category: software
tags: [aerodynamics, lifting line, python, javascript, rc aircraft, design tool]
featured: true
date: 2026-10-08 # first commit of the repo; TODO: confirm the date you want shown
status: complete
cover: /uploads/pactm-wing-explorer/cover.jpg
coverAlt: "The PACTM Wing Explorer dashboard: S7062 airfoil selected, wing metrics, requirement checks and the wing planform"
links:
  demo: "https://corrigk.github.io/pactm-wing-explorer/docs/#airfoil=S7062&AR=12.8805408015&lam=0.65"
  repo: https://github.com/corrigk/pactm-wing-explorer
demo:
  url: "https://corrigk.github.io/pactm-wing-explorer/docs/#airfoil=S7062&AR=12.8805408015&lam=0.65"
  height: 780
specSheet:
  - { label: "Method", value: "Prandtl lifting line" }
  - { label: "Spanwise stations", value: "40" }
  - { label: "Wing", value: "Untwisted, linear taper" }
  - { label: "Wing area", value: "Sized from stall speed" }
  - { label: "Spar", value: "Solid-wood cantilever" }
  - { label: "Spar limit", value: "Tip deflection" }
  - { label: "Course", value: "AAE 334 (Prof. Canino)" }
specs:
  - Python (reference model)
  - JavaScript (browser app)
  - Runs entirely in the browser
---
I built this for an AAE 334 homework assignment (Prof. Canino): design the wing and spar for PACTM, an RC airplane. It turns the whole wing design space into something you can explore live in the browser.

## What it does

- **Live lift distributions** as you change the wing.
- **Spar sizing** and **requirement checks** that update instantly.
- A **feasible-region map** you can click and drag across.
- A **ranked table of every airfoil**, with the best design for the current settings.
- **Side-by-side comparison** of two designs.
- A **3D view of the wing at design load** and **airfoil polar plots**.
- **Bring your own airfoil:** upload a `.dat` file and polar, and everything stays in your browser.

## The model

An untwisted, linearly tapered wing analyzed with Prandtl lifting-line theory at 40 spanwise stations. Wing area comes from the stall-speed requirement, drag from a component build-up, and the spar is a solid-wood cantilever sized to a tip-deflection limit. It's a conceptual-design tool, not a certified analysis.

## Outcome

It helped me choose an airfoil that met all of the requirements, and I'll be relying on it heavily for my Design/Build/Fly (DBF) senior design project.

<!-- TODO: add a screenshot or two of the Compare view and the 3D view to the gallery (public/uploads/pactm-wing-explorer/) -->
