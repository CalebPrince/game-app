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

## Tech stack

- React and TypeScript
- Vite
- React Router
- Tailwind CSS
- Zustand
- Recharts
