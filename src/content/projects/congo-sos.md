---
title: Congo River Basin System of Systems
summary: A system-of-systems architecture for the Congo River Basin, delivered as an interactive 3D concept of operations instead of a static slide deck.
category: software
tags: [systems engineering, system of systems, ov-1, conops, functional flow, interactive]
featured: true
date: 2026-09-29 # first commit of the repo; TODO: confirm
status: complete
cover: /uploads/congo-sos/cover.jpg
coverAlt: "Congo River Basin concept-of-operations app: title screen with a 3D globe centered on Africa"
links:
  demo: https://corrigk.github.io/congo-river-basin/
  repo: https://github.com/corrigk/congo-river-basin
# TODO: the demo URL goes live once the repo's work is on main and GitHub Pages (Source: GitHub Actions) is enabled.
demo:
  url: https://corrigk.github.io/congo-river-basin/
  height: 720
specSheet:
  - { label: "Core views", value: "Functional flow · OV-1 CONOPS" }
  - { label: "Process", value: "Nine-stage loop" }
  - { label: "My role", value: "ConOps + visual functional flow" }
  - { label: "Course", value: "AAE 35103, Purdue" }
  - { label: "Instructor", value: "Kevin Parsons" }
  - { label: "Timeline", value: "Two weeks" }
  - { label: "Data", value: "Real public orbit + weather data, illustrative" }
specs:
  - JavaScript + Vite
  - CesiumJS (3D globe)
  - satellite.js (orbits)
---
A systems architecture for the Congo River Basin that you explore instead of flip through. It was our team's System of Systems Architecture Review for AAE 35103 at Purdue, taught by Kevin Parsons: two weeks to design the architecture and present it.

I was in charge of the **concept of operations (ConOps)** and the **visual functional flow**, which became the two centerpieces: an OV-1-style operational concept you can fly around in 3D, and a functional flow you can click through.

It shows how satellites, aircraft and UAVs, ground stations, river assets, community reporting and governance institutions could monitor hazards across the basin and turn observations into action through one nine-stage loop.

## Inside the app

- **System Overview:** the all-hazards flow from what's monitored, to data collection, to forecasting, to action and feedback. Click a hazard, source or stage to highlight everything it connects to.
- **Mission Map:** a 3D globe with the basin, focus zones, deployed assets and toggleable overlays (data flow, satellites, weather, river flow, coverage gaps).
- **Process & Gaps:** each stage with its requirements, capability gaps and stakeholders.
- **A worked example:** an illustrative flood on the Upper Ubangi, walked through the same nine stages.
- **Presenter mode:** a guided briefing you can drive with arrow keys or a clicker.

It's a concept visualization, not a live monitoring system. The satellite and weather layers use real public data for illustration only.

<!-- TODO: optionally name your teammates (with their permission). -->
<!-- TODO: add screenshots of the System Overview and the functional flow / OV-1 to public/uploads/congo-sos/ -->
