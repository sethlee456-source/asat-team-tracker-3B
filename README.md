# asat-team-tracker-3B

Dark castle RPG-themed standalone HTML ASAT tracker for Team 3B.

## Local run

```bash
npm start
```

Then open `http://localhost:4173`.

## HTML tracker features

- Edit team score, target score, and agent survey counts directly in the page
- Save changes in the current browser with local storage
- Export tracker data as JSON
- Import a previously exported JSON snapshot
- Copy/share the tracker page link

## Sharing

This tracker is now a standalone HTML tracker.

- Public GitHub Pages link: `https://sethlee456-source.github.io/asat-team-tracker-3B/`
- Share the HTML page itself, or host it anywhere that serves static files
- Export JSON after updates if you want to pass the latest data snapshot to teammates
- Imported JSON replaces the current browser copy with the shared snapshot

## GitHub Pages

This repository now includes a Pages deployment workflow.

To make the public link work for everyone:

1. In GitHub repository settings, open **Pages**
2. Set the source to **GitHub Actions**
3. Push or merge the branch so the workflow runs
4. Share `https://sethlee456-source.github.io/asat-team-tracker-3B/`

## Tests

```bash
npm test
```
