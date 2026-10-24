# Add weather, traffic and road delay info from Google Maps

## What the patient will see
A new "Your trip" step after the questionnaire (optional, can be skipped):
- Type the clinic name (picked from a search list) and a home ZIP code or nearby cross streets. No exact home address, nothing saved.
- Results page gets a "Trip conditions" card:
  - Weather at appointment time (for example "Snow expected 9 am. Allow extra time and dress warm while waiting for pickup.").
  - Expected drive time with current traffic, compared to normal ("Usually 18 min, today about 31 min").
  - Delay warnings when Google's route shows heavy slowdowns or a road problem on the way.
  - A suggested "be ready by" time, for example 60 min before the appointment when there are delays (rides like DAAA give a 20-minute pickup window).
  - Bus option travel time, for people who can ride the bus.
- These tips are added to the printable checklist.

## Honest limits to know
- Google does not give a separate list of road closures. Closures and crashes show up as slower drive times and route warnings, so the app will say "Delays on your route" rather than naming each closure.
- Traffic and weather are forecasts. For appointments a week away the app shows "Check again the day before" instead of a forecast.
- Each lookup has a small Google usage cost. Because the app has no login, anyone could trigger lookups; the plan limits it to one lookup per results page and adds a daily cap.

## Steps
1. Connect Google Maps Platform (managed, no key needed from you).
2. Add the "Your trip" step: clinic search + ZIP/cross streets, with "Skip" button.
3. Add the "Trip conditions" card and checklist tips.
4. Test with three Detroit trips (snowy day, rush hour, skipped step) and update your plan document and prompt with this feature.

## Technical details
- Server functions only (credentials stay server-side), via the connector gateway:
  - Places API (New) `places:autocomplete` / details for the clinic, biased to Detroit, debounced, session token.
  - Geocoding for ZIP/cross streets.
  - Routes API `computeRoutes` with `TRAFFIC_AWARE_OPTIMAL`, `departureTime`, returning `duration` vs `staticDuration` and `travelAdvisory`; second call with `TRANSIT` when bus is possible.
  - Weather API hourly forecast at the clinic location for the appointment window (only when within ~2 days).
- Pure helper in `src/lib/trip.ts` turns raw data into plain-language tips and a "be ready by" time; unit tests for delay thresholds and ready-by rules.
- Input validation, one combined call per results view, simple in-memory cache, and a 403 branch that explains key problems.
- Location inputs held in page state only, never stored or logged.
