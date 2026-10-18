---
title: Hypersonic-Flight Rocket Payload
summary: A Raspberry Pi payload for a 50-G flight, in a custom-machined wedge housing that records rocket skin conditions, acceleration, temperature and pressure.
category: hardware
tags: [cad, machining, raspberry pi, sensors, systems integration, rocketry]
featured: true
date: 2025-12-01 # project ran June 2025 to December 2025
status: complete
cover: /uploads/rocket-payload/cover.jpg
coverAlt: "A rocket climbing on its exhaust plume, beside a close-up of the rocket's nose section with wedge-shaped housings mounted on the body"
gallery:
  - image: /uploads/rocket-payload/rocket.jpg
    alt: "The rocket's polished nose cone and body with two wedge-shaped housings mounted on the side"
    caption: "Wedge housings mounted on the rocket body" # TODO: confirm which housing is the payload
  - image: /uploads/rocket-payload/launch.jpg
    alt: "The rocket lifting off into a blue sky on a bright exhaust plume"
    caption: "Launch" # TODO: confirm this is the payload's flight and add the date
  - image: /uploads/rocket-payload/cad-housing.jpg
    alt: "Siemens NX model of a rocket body section with the wedge housing attached"
    caption: "Rocket body section with the wedge housing, modeled in Siemens NX"
  - image: /uploads/rocket-payload/cad-detail.jpg
    alt: "Close-up of the wedge housing in Siemens NX with one face highlighted"
    caption: "Inside the wedge housing (Siemens NX)"
specSheet:
  - { label: "Program", value: "AAE 41800 Zero Gravity Flight Experiment" }
  - { label: "Where", value: "West Lafayette, IN" }
  - { label: "When", value: "Jun – Dec 2025" }
  - { label: "Flight load", value: "50 G" }
  - { label: "CAD", value: "Siemens NX" }
  - { label: "Computer", value: "Raspberry Pi Zero" }
  - { label: "Camera", value: "Pi Camera" }
  - { label: "Measures", value: "Skin conditions, acceleration, temperature, pressure" }
  - { label: "Partners", value: "Pluto Aerospace, AETC" }
specs:
  - Siemens NX (CAD)
  - Machining
  - Raspberry Pi Zero + Pi Camera
  - Acceleration, temperature and pressure sensors
---
A payload built for a 50-G hypersonic flight, designed to ride on the rocket and record what the vehicle's skin experiences, along with acceleration, temperature and pressure. It was part of AAE 41800, the Zero Gravity Flight Experiment, with Purdue Rocket Experimental Research Video in Educational Work, from June to December 2025.

## My role

I led the **CAD**, **electronics** and **full-system integration**. I designed and prototyped the custom-machined **wedge housing** that holds a Raspberry Pi Zero, a Pi Camera and the sensors, and we worked with **Pluto Aerospace** and **AETC** on the system requirements.

<!-- TODO: what flew (or will fly), and what the data showed. Add results only if you have them. -->
<!-- TODO: team size and anything specific you're proud of (a design decision, a test, a problem you solved). -->
