# English Adventure

English Adventure is a front-end demo of a gamified English-learning app for children from age 4 through Grade 9. It includes separate Little Explorers and Junior Explorers learning paths, with NaCCA and international curriculum options, plus parent and teacher dashboards.

## Features

- Interactive learning worlds, missions, activities, and progress views for learners
- Early-literacy activities for letters, phonics, spelling, and sentence building
- Junior activities for reading, vocabulary, grammar, listening, speaking, and writing
- Parent views for learner history, skills, reports, and settings
- A teacher dashboard
- Sample learner profiles and content for exploring the demo

This repository contains a clickable front-end demo; the package description and demo data do not imply a production backend or live curriculum service.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite in your browser. To create and preview a production build:

```sh
npm run build
npm run preview
```

## Voice assets

The optional [`scripts/voice-lines.ts`](scripts/voice-lines.ts) script can list the app's voice lines without making API calls:

```sh
npx tsx scripts/voice-lines.ts --dry
```

Generating audio uses the ElevenLabs API and requires `ELEVENLABS_API_KEY`. Keep the key in your environment or another private local configuration; do not commit credentials.

Narration is pre-generated (voice "Alice", British educator) into `public/audio/` with a `manifest.json` keyed by line text, so no API key ever reaches the browser. Lines that are not in the manifest (for example a newly added child's name) fall back to the browser's built-in voice. Change `VOICE_ID` in the script and rerun it to re-voice the app.

## Music and sound effects

- `public/audio/music/adventure-loop.mp3`: looping background track (ElevenLabs Music, slowed to about 80 BPM). It starts on the first tap, plays quietly, ducks under narration, pauses while the microphone listens, and is off in the parent and teacher portals. Learners can mute it with the note button in the header; the choice is remembered on the device.
- `public/audio/sfx/`: `tap.mp3` (ElevenLabs sound effect, trimmed) plays on button taps in the child app; `correct`, `wrong` and `reward` are synthesised bell tones. Rebuild them with `node scripts/make-sfx.mjs "<path to the ElevenLabs pop mp3>"` (needs ffmpeg).

## Tech stack

- React and TypeScript
- Vite
- React Router
- Tailwind CSS
- Zustand
- Recharts
