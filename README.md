# Set Operations — classroom presentation

Open `index.html` in a modern browser. Keep `styles.css` and `script.js` beside it. No installation, server, framework, or internet connection is needed.

## Controls

- Left / Right arrows: previous / next slide.
- Home / End: first / last slide. PageUp / PageDown and Space also work.
- Keyboard shortcuts leave editable fields alone. Space activates a focused button.
- Compact arrow buttons and a slide counter sit beside Contents / Present at the top-right. Escape closes Contents.
- Present toggles fullscreen when the browser supports it.
- Algorithm Previous Step / Next Step / Reset controls are separate from slide navigation.
- Difference has A − B and B − A buttons. Switching direction restarts the trace and updates pseudocode, highlights, and result.
- The concatenation example has Next Step / Reset controls.
- Each walkthrough preserves its state when you leave and return. The slide URL fragment survives refresh.

## Slide sequence

1. Cover — Presented by: Jay-ar Mesquiola
2. Set operations in computing
3. Why Sets Matter in Computing — array concatenation versus set union
4. Sets as an Abstract Data Type
5–7. Union: concept, walkthrough, Venn diagram
8–10. Intersection: concept, walkthrough, Venn diagram
11–13. Difference: concept, direction-switchable walkthrough, Venn diagrams
14–16. Complement: concept, walkthrough, Venn diagram
17. Complexity comparison
18. Practical applications, with a brief DSU distinction
19. Summary with matching examples

Union, intersection, and difference use A = {1, 2, 3, 4} and B = {3, 4, 5, 6}. Complement uses U = {1, 2, 3, 4, 5, 6, 7, 8} and its own A = {2, 4, 6, 8}, so Aᶜ = {1, 3, 5, 7}. Edit `EXAMPLES.complementA` for this independent example.

## Visual states

Set A uses rust, Set B uses muted teal, and U uses olive. The scanning panel and active element use the source accent, as does the executing pseudocode line. Completed cells have check marks; rejected cells are dashed and duplicates hatched. A matching value in the lookup operand is outlined. New result values receive an amber highlight; non-inserting steps explicitly say “No change.” Reset and Previous Step reconstruct the entire visible state. Reduced-motion preferences disable insertion animation.

## Editing

- `script.js`: `EXAMPLES` controls inputs; `lessons` controls definitions, notation and explanations; `slides` controls ordering. Change example-specific prose too when changing values. SVG layouts are intended for small numeric classroom examples.
- `script.js`: `definitions`, `makeSteps`, and `codePanel` control pseudocode and generated algorithm traces.
- `styles.css`: `:root` contains colors. The final viewport presentation shell controls responsive typography, spacing, and compact walkthrough zones. The body fills 100dvh (with a 100vh fallback); slides keep content in normal flow without internal scrolling. CSS recalculates on resize and fullscreen changes.
- `index.html`: shared presentation header with compact navigation and Contents dialog. There is no footer or reserved footer height.

## Verification

Run `node verify.cjs` if Node is installed. Node is only used for optional development checks; the presentation itself does not require it.

Checks cover all operation results and input iterations, reverse difference, matching concept results, paired operand displays, step navigation and reset, direction switching, keyboard navigation and bounds, editable-focus protection, concatenation states, and offline dependencies. The test uses lightweight control doubles and does not verify browser rendering.

Rendered validation: `node verify-layout.cjs` uses Playwright with Microsoft Edge (optional development tools, not runtime dependencies). It checks all 19 slides at 1920 × 1080, 1366 × 768, 1280 × 720, and 1100 × 650; all algorithm steps and reverse difference; motivation states; bounds and overflow; Contents, hashes, reload, arrow navigation, editable focus, and fullscreen entry/exit. Screenshots are saved to the system temporary directory. These desktop sizes were verified in headless Edge; representative screenshots were visually reviewed. Phone-sized portrait layouts are outside these desktop checks.
