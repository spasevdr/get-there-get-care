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
- Matching rules live in src/lib/navigator.ts (pure, tested) so program data can be swapped without touching screens.
- Google Maps calls run only in src/lib/trip.functions.ts (server, gateway, daily cap + cache) because the app has no login; plain-language trip rules live in src/lib/trip.ts (tested).
