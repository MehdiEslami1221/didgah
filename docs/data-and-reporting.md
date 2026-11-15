# Data and reporting

## Questionnaire

`lib/survey.json` contains the title, introduction, section labels, options and 56 question texts. The included survey has eight factors, with seven outgoing influence questions per factor. The diagonal of the 8×8 matrix is intentionally blank because self-influence is not asked.

First and last names are required. Phone, professional details and final notes are optional. Answers are integers from 0 through 4. The server rejects incomplete or invalid questionnaires even if client-side checks are bypassed.

## Statistics

- Per-question percentages use the number of completed submissions as the denominator.
- Overall option percentages use the number of completed submissions multiplied by 56.
- A section mean averages its seven question means.
- The matrix shows the raw mean response for each directed relationship.
- No DEMATEL normalization, total-relation matrix, causal classification or pass/fail scoring is performed.

Deletion removes the selected submission permanently and the dashboard reloads its statistics. Recovery is possible only from an earlier backup. Never use participant data as public demo content.

## Persistence and drafts

Completed responses are stored in SQLite. WAL mode and a busy timeout support the intended small research workload. A unique client token makes a retry of the same submission idempotent; it is not an identity verification mechanism. The same person can submit again from a new browser or fresh draft.

Unsubmitted drafts are stored in the participant's browser local storage, not on the server. They remain until successfully submitted or cleared by the browser/user. Shared devices should be used with that behavior in mind.

## Backups

```bash
npm run backup
```

The command loads `.env.local` and uses SQLite's backup API to create a consistent snapshot under `backups/`. Do not copy just the main `.sqlite` file while the application is actively writing in WAL mode.

Backups include names, optional contact details, answers and the database fallback signing key. Keep them outside public web directories and repository history. Set an appropriate retention policy for the research. Backups taken before a deletion still contain the deleted record.

## Administration

Credentials are configured on the server. Sessions are signed JWTs stored in an HttpOnly, SameSite=Strict cookie with an eight-hour expiry. Production HTTPS deployments should set `COOKIE_SECURE=true`. Rotate `SESSION_SECRET` to invalidate existing sessions.

The application checks request origins on writes and limits login attempts to 30 per 15-minute window globally. Submission intake is limited to 300 new requests per hour globally. These limits are intended for a small study, not a public survey service at scale.

Keep `.env.local`, database files, backups and report exports out of version control. The supplied `.gitignore` excludes these paths. An ignore rule does not remove a file that has already been committed.
