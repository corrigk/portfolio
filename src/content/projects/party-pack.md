---
title: Game Night Party Pack
summary: A Jackbox-style party game night I built. One computer drives the TV and everyone plays on their phone.
category: fun
tags: [react, typescript, supabase, realtime, party games]
featured: false
date: 2026-10-11 # first commit of the repo; TODO: confirm
status: complete # TODO: confirm
cover: /uploads/party-pack/cover.svg # TODO: replace with a photo of a game night or a screenshot
coverAlt: "Blueprint-style illustration of a TV with phones around it"
links:
  repo: https://github.com/corrigk/game-night
specSheet:
  - { label: "Big screen", value: "TV runs the game engine" }
  - { label: "Controllers", value: "Everyone's phone (room code / QR)" }
  - { label: "Host tools", value: "Prompt banks, photo uploads" }
specs:
  - Vite + React + TypeScript
  - Supabase (Realtime, Postgres, Storage, anonymous auth)
---
<!-- TODO: confirm this description. It's drafted from the project's README. -->
A party game night in the spirit of Jackbox: one computer drives the TV, everyone joins on their phone with a room code or QR, and a hidden host drawer runs the show.

## The games

Most Likely To, Weird Facts, Caption This (with an optional round where players take their own photos), Story Chain, Zillow Hunt, Talent Show, Emoji Translation, Dolphin, Hot Seat (teams), Movie Voting, Acronym Attack, Plot Twist, Fake Headlines, Mad Libs Theatre and Tap Race. The night ends with **Final Awards**: a podium plus superlatives like Best Liar, Human Lie Detector and Dream Home Hunter.

## How it's built

Vite, React and TypeScript on the front end, with Supabase for realtime game state, the database, photo storage and anonymous sign-in, so nobody has to make an account to play. An admin page lets the host edit prompt banks and upload caption photos.

<!-- TODO: anything you want to add: how many people it's been played with, a favorite moment, photos. -->
