# The Becoming Room — V1.1 Firebase Ready

A private, professional, evidence-based clarity and visual journal prototype.

## What changed in V1.1

- More professional visual design.
- Removed beige/orange direction.
- New palette: dark plum, violet, cool teal, silver, lilac, and slate.
- Firebase-ready architecture.
- Email/password authentication panel.
- Firestore cloud sync for entries when Firebase is connected.
- Firebase Storage support for journal photos.
- One cloud photo per day rule: each day uploads to the same date file and replaces that day's cloud photo.
- Photo compression before upload to help control Firebase cost.
- Local fallback mode: app still works before Firebase is connected.
- Visible version label: V1.1.

## Current screens

1. Today — feeling, reveal, desire, truth, power, aligned action.
2. Triggered — evidence-based rewiring loop.
3. Page — real-journal style page with cursive-style writing, photo, paper, border, and decorative elements.
4. Entries — local/cloud timeline.
5. Becoming — grounded manifestation through evidence.
6. Settings — Firebase status and login.

## How Firebase works in this build

The app works in two modes:

### Local mode

If `firebase-config.js` still has placeholder values, the app saves to the browser only.

### Cloud mode

After you paste your Firebase web app config into `firebase-config.js`, the app can use:

- Firebase Authentication for email/password login.
- Firestore for private entries.
- Firebase Storage for photos.

## Firebase setup steps

1. Go to Firebase Console.
2. Create a project.
3. Add a Web App.
4. Copy the Firebase config.
5. Open `firebase-config.js`.
6. Replace the placeholder values.
7. In Firebase, enable Authentication > Sign-in method > Email/Password.
8. Create Firestore Database.
9. Enable Firebase Storage when ready for photos.
10. Add security rules from `firebase-rules.txt`.

## Important cost control

For your intended use — one private user and one compressed photo per day — cost should be very low, but do not use SMS login. SMS can create costs. Use email/password only.

The app compresses uploaded photos and stores only one cloud photo per day under:

`users/{uid}/journalPhotos/YYYY-MM-DD.jpg`

Uploading another photo on the same date replaces that date's cloud photo.

## GitHub Pages note

This app can be hosted on GitHub Pages, Vercel, Netlify, or Firebase Hosting.

For Firebase module imports to work, the site must be served as a webpage. Do not expect Firebase imports to work by double-clicking `index.html` from Finder. Use GitHub Pages, Firebase Hosting, or a local server.

## Local test without GitHub

From the folder, you can run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

