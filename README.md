# Life Changer

A local-only interview preparation tracker. No login, no backend — everything runs and stays on your own machine.

```
cd frontend
npm install
npm run dev
```

Then open the printed `localhost` URL. It includes dashboard priorities and study streaks, motivation CRUD, a calendar with notes and domain activity dots, reusable Behaviour/Java/DDIA question reviews, and DSA spaced reviews with checkboxes, urgency labels, LeetCode links, and problem detail notes. Functional Coding and System Design task detail screens are also included.

## Data storage & backup

All data is saved to the browser's `localStorage` under `lifeChanger.react.v1`, scoped to the origin (host + port) you open the app from. Use **Reset sample data** in the sidebar and confirm the dialog to restore the original sample data.

Because `localStorage` only lives inside one browser, use the **Backup** page in the sidebar to protect your data:

- **Choose backup folder** (Chrome/Edge only) — picks a folder on disk. Once granted, the app automatically writes a backup there roughly once a day, rotating between `backup-1.json`, `backup-2.json`, and `backup-3.json` so old backups don't pile up.
- **Backup now** — writes an immediate backup to the chosen folder, or downloads a dated JSON file if the folder-based API isn't available (e.g. Firefox/Safari).
- **Import backup** — replaces all current data with a previously exported/backed-up JSON file. Use this to restore after clearing browser data or to move data to another machine.

Automatic backups are best-effort and silent: if the folder permission was revoked or the browser doesn't support it, nothing breaks — use **Backup now** to back up manually at any time.
