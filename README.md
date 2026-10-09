# Set Operations — classroom presentation

Open `index.html` in a modern browser. Keep `styles.css` and `script.js` beside it. No installation, server, framework, or internet connection is needed.

## Controls

- Left / Right arrows: previous / next slide.
- Home / End: first / last slide. PageUp / PageDown and Space also work.
- Keyboard shortcuts leave editable fields alone. Space activates a focused button.
- Compact arrow buttons and a slide counter sit beside Contents / Present at the top-right. Escape closes Contents.
- Present toggles fullscreen when supported. On phones, Start Presentation attempts fullscreen, then a landscape orientation lock. Unsupported or denied APIs fall back to manual rotation; portrait shows a rotate prompt. Exiting fullscreen releases a successful orientation lock.
- Swipe blank slide surfaces or tap the arrow buttons to navigate. Walkthroughs and other widgets do not trigger swipe navigation.
- Algorithm Previous Step / Next Step / Reset controls are separate from slide navigation.
- Difference has A − B and B − A buttons. Switching direction restarts the trace and updates pseudocode, highlights, and result.
- The concatenation example has Next Step / Reset controls.
- Each walkthrough preserves its state when you leave and return. The slide URL fragment survives refresh.

## Slide sequence

1. Cover — Presented by: Jay-ar Mesquiola
2. Set operations in computing
3. Why Sets Matter in Computing — array concatenation versus set union
4–6. Union: concept, walkthrough, Venn diagram
7–9. Intersection: concept, walkthrough, Venn diagram
10–12. Difference: concept, direction-switchable walkthrough, Venn diagrams
13–15. Complement: concept, walkthrough, Venn diagram
16. Complexity comparison
17. Practical applications, with a brief DSU distinction
18. Summary with matching examples

Union, intersection, and difference use A = {1, 2, 3, 4} and B = {3, 4, 5, 6}. Complement uses U = {1, 2, 3, 4, 5, 6, 7, 8} and its own A = {2, 4, 6, 8}, so Aᶜ = {1, 3, 5, 7}. Edit `EXAMPLES.complementA` for this independent example.

## Visual states

Set A uses rust, Set B uses muted teal, and U uses olive. The scanning panel and active element use the source accent, as does the executing pseudocode line. Completed cells have check marks; rejected cells are dashed and duplicates hatched. A matching value in the lookup operand is outlined. New result values receive an amber highlight; non-inserting steps explicitly say “No change.” Reset and Previous Step reconstruct the entire visible state. Reduced-motion preferences disable insertion animation.

## Editing

- `script.js`: `EXAMPLES` controls inputs; `lessons` controls definitions, notation and explanations; `slides` controls ordering. Change example-specific prose too when changing values. SVG layouts are intended for small numeric classroom examples.
- `script.js`: `definitions`, `makeSteps`, and `codePanel` control pseudocode and generated algorithm traces.
- `styles.css`: `:root` contains colors. The presentation uses one intrinsic 1600 × 900 canvas. `fitCanvas()` in `script.js` uniformly scales it by min(usable width / 1600, usable height / 900), centers it, and accounts for safe areas and visualViewport. Resize, rotation, fullscreen, and visual viewport changes recalculate the fit. Neutral letterboxing sits outside the cream grid canvas. Concept and walkthrough layouts have separate spacing.
- `index.html`: shared presentation header with compact navigation and Contents dialog. There is no footer or reserved footer height.

## Verification

Run `node verify.cjs` if Node is installed. Node is only used for optional development checks; the presentation itself does not require it.

Checks cover all operation results and input iterations, reverse difference, matching concept results, paired operand displays, step navigation and reset, direction switching, keyboard navigation and bounds, editable-focus protection, concatenation states, and offline dependencies. The test uses lightweight control doubles and does not verify browser rendering.

Rendered validation: `node verify-layout.cjs` uses Playwright with Microsoft Edge (optional development tools, not runtime dependencies). All 18 slides and all walkthrough states are checked at 1920 × 1080, 1366 × 768, 1280 × 720, 1440 × 900, and 844 × 390. The 390 × 844 portrait case checks the rotation overlay and then rotates to landscape to exercise the deck. Checks cover aspect ratio, canvas bounds, descendant overflow, algorithm controls, Contents, legacy bookmarks, keyboard navigation, fullscreen entry/exit, swipe isolation, and API rejection. Screenshots are saved to the system temporary directory and representative slides were visually reviewed.

Phone tests emulate touch and viewport geometry in Chromium; they do not establish real iOS Safari or Android Chrome API support. Fullscreen and orientation locking remain browser-dependent. A normal website cannot override OS rotation lock. Native mobile device testing remains outstanding.

## Bookmarks and complexity

The standalone ADT slide is removed. Existing `#slide-N` bookmarks preserve their original topics: `#slide-4` redirects to Why Sets Matter (`#slide-3`); Union starts at `#slide-5`, while its displayed slide number is 4. The counter and Contents use consecutive numbers 1–18. Invalid bookmarks normalize to the cover.

Hash sets are introduced in the array-versus-set example. Union time and output-space complexity are integrated into its walkthrough; the comparison slide retains construction costs and expected-performance qualifications for all operations.

## Union Venn walkthrough

Slide 6 (legacy bookmark `#slide-7`) begins with an unshaded diagram. Its independent Previous Step / Next Step / Reset controls include A-only values, then the overlap, then B-only values, and finally emphasize the complete union. The accumulating result is labeled C; only the completed step states the final A ∪ B equality. Rust, gold, and teal distinguish the three contributions, with region names and underlined active values as non-color cues. Region and result animations last 280 ms and honor reduced-motion preferences. Leaving the slide retains its step; resetting returns to the initial state.

The rendered checks cover all five Venn states at every tested viewport, forward/backward/reset controls, result values, region shading, global arrows, touch taps, swipe isolation, and state retention. Existing algorithm traces are tested independently.
