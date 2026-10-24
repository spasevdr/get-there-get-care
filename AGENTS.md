<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Matching rules live in src/lib/matcher.ts (pure, tested against data-file scenarios); questions in src/lib/questions.ts.
- Google Maps calls run only in src/lib/trip.functions.ts (server, gateway, daily cap + cache) because the app has no login; plain-language trip rules live in src/lib/trip.ts (tested).
- All program facts live only in src/data/programs.json (typed in src/lib/db.ts); src/lib/hsds.ts derives the HSDS 3.0 export so data stays swappable for a 2-1-1 feed.
