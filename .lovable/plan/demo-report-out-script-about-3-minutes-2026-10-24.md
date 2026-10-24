# Demo report-out script (about 3 minutes)

A speaker script saved to Files as `Detroit_Ride_Navigator_Demo_Script.md`. It has timed sections, the exact words to say, and what to click on screen at each point.

## Sections

1. **The problem (20 sec):** Patients miss appointments because they have no reliable ride. Detroit has many ride programs, but each one has different rules.
2. **What it does (20 sec):** You answer about 2 minutes of questions, with no name or sign-up. You get possible ride options with real phone numbers and sources.
3. **Live demo, 2 patients (90 sec):**
   - Patient A is on Molina Medicaid with a weekday visit. Their results show the Molina card with a working call button, a "Source checked" label, the booking rule, and the printable checklist.
   - Patient B uses a wheelchair, has a Sunday or same-day visit and no paratransit certification. Their results show the "Apply for next time" section, the backup options, and the trip box with weather and traffic.
   - Each step lists what to click and what to point out. Both patients load from the /test page so the demo can't stall.
4. **Trust and data (30 sec):** Every card shows whether its information was checked against a source. All 7 Medicaid plan numbers were verified. Program data follows the Open Referral standard so it can be shared with 2-1-1. Answers are not saved.
5. **Proof (15 sec):** The /test page shows all 7 test patients passing.
6. **What's next and the ask (15 sec):** Spanish and Arabic screens, a pilot with clinics, and a live 2-1-1 data feed.

Backup lines cover two cases: the trip box is slow, or someone asks "is this real data?"

## Technical details

- The script will use the actual names of the 7 test patients, and their real results in the app, so every line matches what's on screen.
- It's a plain Markdown file saved to Files. No app changes.
