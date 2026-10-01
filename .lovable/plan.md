# Fix null homepage data crashes

## Changes
- Normalize every homepage query result into arrays containing only valid objects.
- Normalize the configurable section order before rendering so `.map()` is always called on a real array.
- Make event and lot conversion reject null/incomplete records before reading identifiers or nested fields.
- Keep empty-state sections working when the database returns null or partial relationships.

## Validation
- Open the homepage with the live data and confirm it renders without page errors.
- Check the current build diagnostics after the changes.
