# The Becoming Room — V1.2 Guided Path Rebuild

## What changed from V1.1
- Rebuilt the app around one connected guided path.
- Removed confusing clinical language like “old wiring” and “fact vs meaning.”
- Renamed “Triggered” into softer language: “When I feel pulled.”
- Fixed the step behavior so clicking choices does not reset the flow.
- Entries can now be opened and fully reviewed, not only deleted/exported.
- Becoming is connected to the guided check-ins and can also create its own pages.
- Prompts are rewritten in a more reflective, poetic-but-clear voice.
- Professional darker cool palette, no beige/orange.

## Current storage behavior
- Written entries save locally and, if Firebase login is connected, sync to Firestore.
- Photos are local-only in V1.2 because Firebase Storage requires Blaze billing.

## Files required at GitHub repo root
- index.html
- app.js
- styles.css
- firebase-config.js
- manifest.webmanifest
- README.md

## Firebase
firebase-config.js already uses the Becoming Room Firebase project config provided in setup.
Firestore rules are in firebase-rules.txt.
