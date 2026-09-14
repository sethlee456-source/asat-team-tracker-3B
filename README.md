# asat-team-tracker-3B

Dark castle RPG-themed ASAT tracker for Team 3B with GitHub Pages hosting and Firebase live updates.

## Local run

```bash
npm start
```

Then open `http://localhost:4173`.

## Shareable HTML link

After GitHub Pages is enabled for this repository, the tracker URL is:

`https://sethlee456-source.github.io/asat-team-tracker-3B/`

## Live update setup

1. Create a Firebase project.
2. Enable **Google Authentication** in Firebase Authentication.
3. Create a **Cloud Firestore** database.
4. Update `/home/runner/work/asat-team-tracker-3B/asat-team-tracker-3B/firebase-config.js`:
   - set `enabled` to `true`
   - replace the `firebaseConfig` placeholders
   - replace `editorEmails` with the Google email addresses allowed to edit
5. Update `/home/runner/work/asat-team-tracker-3B/asat-team-tracker-3B/firestore.rules` with the same editor email addresses.
6. Deploy the Firestore rules:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

7. Push the updated files. The included GitHub Pages workflow will publish the site.

## Notes

- Everyone with the GitHub Pages link can view live updates.
- Only Google accounts listed in `editorEmails` and `firestore.rules` should be able to edit.
- Firebase web config values are public for browser apps; the protection comes from Firestore rules and Google sign-in.

## Tests

```bash
npm test
```
