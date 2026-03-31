# Changelog

## Initial Release (2026-01-31)

HRTversaryBot is born! 🏳️‍⚧️💉

### Commands Added
- `/add_hrtversary` — Set your HRT start date and timezone so the bot can celebrate with you every year.
- `/change_hrtversary` — Update your HRT start date or timezone if something needs correcting.
- `/show_hrtversary` — View the anniversary date and timezone you have saved.

### How it works
- The bot checks once an hour and sends a celebration message in your server channel at 9 AM on your anniversary, in your own timezone.
- Dates are entered in `DD/MM/YYYY` format.

---

## Update 1 (2026-02-16)

### New Commands
- `/verify_timezone` — Check whether the timezone you saved is valid.
- `/check_anniversary` — Manually trigger the anniversary check right now instead of waiting for the hourly run.

### Improvements
- **Timezone autocomplete** — The timezone field in `/add_hrtversary` and `/change_hrtversary` now shows suggestions as you type, making it much easier to find the right timezone.
- **Smarter announcements** — The bot now checks that you're actually still a member of the server before sending your anniversary message, so it won't post in servers you've left.

---

## Update 2 (2026-03-31)

### New Features
- **Multiple date formats** — You no longer have to use `DD/MM/YYYY`. When using `/add_hrtversary` or `/change_hrtversary`, you can now pick your preferred format:
  - `DD/MM/YYYY` (e.g. 25/06/2021)
  - `MM/DD/YYYY` (e.g. 06/25/2021)
  - `YYYY-MM-DD` (e.g. 2021-06-25)
  - `DD-MM-YYYY` (e.g. 25-06-2021)
- **Timezone offset display** — Timezones are now shown with their UTC offset (e.g. `America/New_York (UTC-5)`) in `/show_hrtversary` and `/verify_timezone`.

### Fixes & Polish
- Invalid timezones now show a clear error message on the spot instead of failing silently.
- Invalid dates now tell you exactly what went wrong based on the format you chose.
- Cleaned up leftover placeholder commands and example code from the original bot template.
