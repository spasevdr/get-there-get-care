# Detroit Ride Navigator: final plan (Part 1 + Part 2 data and matching)

## Goal
A patient who has an appointment but no reliable ride answers a short questionnaire. In about a minute they see the ride options that may fit, why each one may fit, what they still need to confirm, who to call, and what to have ready. They can print it as an action plan. There is no login and no patient records.

## What stays from the current app
- Welcome screen with the 911 warning, then one question per screen. Every question has a "Not sure" or "Prefer not to answer" choice.
- Spanish, Arabic and Bengali language questions, plus the hearing and phone-access tips.
- Program records use Open Referral HSDS 3.0 field names, and there are download buttons for clinic staff.
- The printable checklist and the call script.
- The optional "Trip conditions" box (Google Maps traffic, weather and bus time). See Decision 2.

## What Part 2 adds
1. **One data file** holds everything: 59 Detroit-area ZIP codes, 23 organizations, 26 ride services, 12 tips, the checklist and 7 test scenarios. No program facts are written into the screens. Any missing value shows as "Contact the program to confirm."
2. **Data-status label on every card**, which also prints:
   - Grey "Source checked {date}": 9 verified programs.
   - Amber "Rules not yet verified, confirm by phone": DDOT bus, SMART bus, SMART Connector, Medicare Advantage and 6 Medicaid plans.
   - Purple "Demo program (fictional)": 9 made-up nonprofits. Their 555 numbers are shown with the call button turned off.
3. **Two new optional questions:**
   - Starting ZIP code. It comes right after "Lives in Detroit?" and has a Skip button. If the ZIP is not in the list, the app says "We don't have neighborhood data for this ZIP yet" and shows area-wide programs.
   - Which Medicaid plan. It is only asked when the answer is Medicaid or Both. The choices are the 7 plans or "Not sure."
4. **New answer codes** that match your spec exactly (rider_for, age_band, zip, medicaid_plan and the rest), so the test scenarios plug straight in.
5. **Scoring engine** with your 17 rules in order (Rule 0 to Rule 16). A definite "No" can remove a program. "Not sure" never removes one: it lowers the score and adds a "still needs confirming" line. Each card gets a second label: "Strong potential", "Possible — needs confirming" or "Backup". The words "eligible" and "you qualify" never appear.
6. **The results page has 3 sections:**
   - Potential options, best match first.
   - Apply for next time: MetroLift, when the rider isn't certified yet.
   - Backup, always available: 2-1-1, plus any low-scoring options.
   Then come the tips, the checklist and a print page that shows the top 3 options with phone numbers. An empty result never shows a blank page.
7. **Test page (/test)** with the 7 scenarios. Each has a "Load these answers" button and a pass/fail check. All 7 must pass.
8. **Privacy footer** with your exact wording. Answers are kept only on the open page and are not saved or tracked.

## Decisions needed before building
1. **Missing files.** Your prompt mentions `programs.json` and `matcher_reference.py`, but you uploaded only two summary tables (the ZIP list and the services overview). The services table is missing these fields:
   - age rules, helper riding along, interpreter, TTY, online booking, referral or patient-only rules, bus-route distance
   - the organizations, the 12 tips with their triggers, the checklist, and the 7 test scenarios with expected results

   Option A: you upload the two files, and I use them exactly. Option B: I build the full file from your two tables and the current verified data. I would fill unknown fields with "unknown → confirm", write the tips and the 7 scenarios from your rule list, and mark everything I write so you can check it.
2. **Trip conditions vs. "nothing leaves the browser."** The Google Maps box sends the clinic name, the ZIP and the time to our server to look up traffic and weather. The options are:
   - Keep it, and change the footer to say it is used only if you tap it.
   - Remove it.
3. **Blue Cross Complete.** Your table has a generic Medicaid card and a separate BCC card. When the plan is BCC, only the BCC card shows, as your Rule 7 says.

## Build order
1. Load the data file and add its data types. Replace the current program list with it, and keep the HSDS export working.
2. Update the questions and answer codes, and add the ZIP and Medicaid-plan questions.
3. Port the matcher rules and add one automated test per key rule:
   - DAAA never shows for evening or Sunday appointments.
   - Only same-day programs show for "today."
   - Suburban ZIP plus "not in Detroit" hides Detroit-only programs.
   - MetroLift goes to "Apply" when the rider isn't certified.
   - 2-1-1 is always shown.
4. Results page: the 3 sections, the labels, the banners and the print page.
5. Build the /test page and run all 7 scenarios.
6. Click through the 7 scenarios in the browser, print-preview them, then publish for the demo.

## Technical details
- `src/data/programs.json` (typed import) is the single source. `src/lib/hsds.ts` becomes a view over it for the HSDS export. The answers follow a FHIR QuestionnaireResponse shape and the services a FHIR HealthcareService shape, noted in comments only.
- A pure, deterministic `src/lib/matcher.ts` returns `{options, apply, backup}`. Haversine distance is used for radius coverage. Each tip trigger is a small predicate.
- `src/lib/matcher.test.ts` runs all 7 scenarios plus the key-rule assertions. The old `navigator.ts` matching is removed, and the `AGENTS.md` matching rule is updated to point to the matcher.
- The `/test` route has its own head() metadata.
