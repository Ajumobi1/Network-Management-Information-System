# Live location-button verification notes — Aug 18, 2026

- Git commit `2345661` (`fix(public): enable provider location buttons with address fallback`) was pushed to `main`.
- Vercel production deployment `dpl_45CWv6dthwvCKbh1GijuopDLLp2i` is `READY` and targets production.
- Deployment URL: https://nmis-frontend-qhxjfa4b8-ajumobi1s-projects.vercel.app
- Live Vercel response returned HTTP 200 with the ODCHC NMIS HTML bundle.
- The custom domain redirected to `https://www.odchcnmis.online/#network` and rendered the public portal shell successfully.
- The screenshot showed the provider-card pin button beside the green verified badge. Before this fix it was disabled when `latitude`/`longitude` were null.
- The new frontend target helper prefers exact coordinates and otherwise builds a full query from provider name, physical address, LGA, and `Ondo State, Nigeria`, so an address-backed card is clickable without a broad LGA-only fallback.
- The live browser page was still showing “Searching the directory…” at initial load, so provider-card click verification requires one more wait/view after data loading.

A live browser view showed address-backed card pin buttons as interactive elements with hints such as `Locate ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO on the map`; only providers with no address were still marked unavailable. The Aduloju pin was clicked in the live browser, and a follow-up map-state inspection is needed to confirm the iframe heading/query changed from ODCHC Headquarters to the facility address.

The follow-up live browser view confirmed the Aduloju icon is rendered as an enabled button (`Locate ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO on the map`). However, the visible map header still showed `ODCHC Headquarters` after the click, so the final interaction check is investigating whether the click landed on the icon or whether the map-target state needs another patch.

Final live verification: the deployed bundle contains the new address-fallback strings. The Aduloju provider-card button is enabled (`disabled: false`) with title `Search this verified facility address on map`. Triggering the button directly changed the map heading to `ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO` and changed the live Google Maps iframe target to:
`ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO, 70, Iwaro Road, Akungba Akoko, Ondo State, Akoko North East, Ondo State, Nigeria`.
This confirms the top-left provider-card location button is now clickable and no longer depends on a null coordinate pair.
