# Set Operations — classroom presentation

Open `index.html` in a modern browser. Keep `styles.css` and `script.js` beside it. No installation, server, framework, or internet connection is needed.

## Controls

- Left / Right arrows: previous / next slide.
- Home / End: first / last slide. PageUp / PageDown and Space also work.
- Keyboard shortcuts leave editable fields alone. Space activates a focused button.
- Visible Previous / Next controls and Contents navigate the deck; Escape closes Contents.
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
- `styles.css`: `:root` contains colors. The classroom revision section controls larger text and operand layouts. Main body text is approximately 27–32px at 1600–1920px widths.
- `index.html`: shared presentation header, footer, and Contents dialog.

## Verification

Run `node verify.cjs` if Node is installed. Node is only used for optional development checks; the presentation itself does not require it.

Checks cover all operation results and input iterations, reverse difference, matching concept results, paired operand displays, step navigation and reset, direction switching, keyboard navigation and bounds, editable-focus protection, concatenation states, and offline dependencies. The test uses lightweight control doubles and does not verify browser rendering.

Local-file browser preview was blocked by the preview tool's security policy. Visual layout at projector/mobile sizes and actual fullscreen behavior require a check in your own browser.
