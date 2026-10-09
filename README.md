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
- Each walkthrough preserves its state when you leave and return. The slide URL fragment survives refresh.

## Slide sequence

1. Cover — Presented by: Jay-ar Mesquiola
2. Set operations in computing
3–6. Union: concept, walkthrough, Venn diagram, complexity replay
7–10. Intersection: concept, walkthrough, Venn diagram, complexity replay
11–14. Difference: concept, direction-switchable walkthrough, Venn diagrams, A − B complexity replay
15–18. Complement: concept, walkthrough, Venn diagram, complexity replay
19. Complexity comparison
20. Practical applications and conclusion

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

Checks cover all operation results and input iterations, reverse difference, matching concept results, paired operand displays, step navigation and reset, direction switching, keyboard navigation and bounds, editable-focus protection, complexity counters and phases, and offline dependencies. The test uses lightweight control doubles and does not verify browser rendering.

Rendered validation: `node verify-layout.cjs` uses Playwright with Microsoft Edge (optional development tools, not runtime dependencies). All 20 slides and all walkthrough states are checked at 1920 × 1080, 1366 × 768, 1280 × 720, 1440 × 900, and 844 × 390. The 390 × 844 portrait case checks the rotation overlay and then rotates to landscape to exercise the deck. Checks cover aspect ratio, canvas bounds, descendant overflow, algorithm controls, Contents, consecutive bookmarks, keyboard navigation, fullscreen entry/exit, swipe isolation, and API rejection. Screenshots are saved to the system temporary directory and representative slides were visually reviewed.

Phone tests emulate touch and viewport geometry in Chromium; they do not establish real iOS Safari or Android Chrome API support. Fullscreen and orientation locking remain browser-dependent. A normal website cannot override OS rotation lock. Native mobile device testing remains outstanding.

## Bookmarks and complexity

Numeric hashes match visible slide numbers: #slide-1 through #slide-20. Invalid hashes normalize to the cover. The removed motivation and ADT topics have no menu entries or legacy redirects.

Complexity replays on slides 6, 10, 14, and 18 call the shared `makeSteps` generator with index construction enabled. Normal walkthroughs use an already-hashed lookup. `complexityTraces` derives immutable counter snapshots from those same membership decisions; each replay retains its own position. Previous/reset reconstruct counters, output, index, input states, and pseudocode from the selected snapshot.

Union models 8 insertion attempts (6 new values, 2 duplicates). Intersection and difference each model 4 B-index insertions and 4 A-membership checks (2 kept, 2 excluded). Complement models 4 A-index insertions and 8 U-membership checks (4 kept, 4 excluded). Output insertions are shown separately from index insertions/checks. Input processed includes both indexing and scanning; phase bars distinguish them. Output and temporary index tiles represent stored elements, not bytes or measured allocation. Completion reveals an interpretation alongside the expected time and auxiliary-space bounds. Hash operations are expected O(1), not unconditional worst-case guarantees.

## Union Venn walkthrough

Slide 5 (`#slide-5`) begins with an unshaded diagram. Its independent Previous Step / Next Step / Reset controls include A-only values, then the overlap, then B-only values, and finally emphasize the complete union. The accumulating result is labeled C; only the completed step states the final A ∪ B equality. Rust, gold, and teal distinguish the three contributions, with region names and underlined active values as non-color cues. Region and result animations last 280 ms and honor reduced-motion preferences. Leaving the slide retains its step; resetting returns to the initial state.

The rendered checks cover all five Venn states at every tested viewport, forward/backward/reset controls, result values, region shading, global arrows, touch taps, swipe isolation, and state retention. Existing algorithm traces are tested independently.
