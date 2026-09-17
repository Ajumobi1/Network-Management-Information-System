# Provider Enrichment Checkpoints (Aug 18, 2026)

## Verified Findings

### Aduloju Memorial Hospital, Akungba Akoko
- **LGA**: Akoko North East (in database), but often cited as Akoko South West (local knowledge).
- **Official Address**: 70, Iwaro Road, Akungba Akoko, Ondo State.
- **Source**: [adulojuhospital.com/contact-us/](https://adulojuhospital.com/contact-us/)
- **Navigation Issue**: Previous name-based fallback resolved to an unrelated "AnuOlu Hospital" in Osun.
- **Fix**: Applied official street address to database; cleared unverified coordinates; enforced coordinate-only navigation in frontend.

## Navigation Safety Rules
1. **Coordinate-First**: Live map navigation (`latitude`, `longitude`) is only allowed when both values are valid finite numbers.
2. **Address Display**: The `address` field is displayed as descriptive text but not used for unreliable name-based map searches.
3. **Fail Closed**: If no verified coordinates exist, navigation buttons are disabled with a "Location pending verification" message to prevent citizen misdirection.
4. **Public RPC**: The `nmis_public_provider_directory` RPC now returns `address`, `latitude`, and `longitude` securely.

## Inventory for Next Research Phase
- Need to audit all 80+ active providers.
- Priority: Facilities with "Access restricted" or NULL address/coordinates.
- Objective: Find official street addresses and, where possible, exact GPS pins.
