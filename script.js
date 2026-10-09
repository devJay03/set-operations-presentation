'use strict';
// EDIT EXAMPLES HERE. Shared examples drive both diagrams and algorithm traces.
const EXAMPLES = { A: [1, 2, 3, 4], B: [3, 4, 5, 6], U: [1, 2, 3, 4, 5, 6, 7, 8], complementA: [2, 4, 6, 8] };
// Complement uses its own A; the other three operations retain the shared A/B example.
const operandValues = (operation, source) => operation === 'complement' && source === 'A' ? EXAMPLES.complementA : EXAMPLES[source];
const unique = values => [...new Set(values)];
const fmt = values => `{${values.join(', ')}}`;
const cells = values => values.map(x => `<span class="cell">${x}</span>`).join('');
const card = (label, content) => `<div class="card"><div class="card-label">${label}</div>${content}</div>`;
const given = () => `<div class="given">A = ${fmt(EXAMPLES.A)}<br>B = ${fmt(EXAMPLES.B)}</div>`;
let diagramId = 0;
// SVG masks make the shaded regions exact, including overlap and complements.
function venn(operation, reverse = false) {
  const id = `venn-${++diagramId}`;
  if (operation === 'complement') {
    const outside = EXAMPLES.U.filter(x => !EXAMPLES.complementA.includes(x));
    return `<svg class="venn" viewBox="0 0 560 310" role="img" aria-label="Complement: shade the universal set outside A"><defs><mask id="${id}"><rect x="20" y="25" width="520" height="270" fill="white"/><ellipse cx="340" cy="160" rx="140" ry="105" fill="black"/></mask></defs><rect x="20" y="25" width="520" height="270" rx="12" fill="#fffefb" stroke="#292523" stroke-width="1.5"/><rect x="20" y="25" width="520" height="270" fill="#e9c6aa" mask="url(#${id})"/><ellipse cx="340" cy="160" rx="140" ry="105" fill="none" stroke="#292523" stroke-width="1.5"/><text x="38" y="57" class="set-label">U</text><text x="330" y="88" class="set-label">A</text><text x="340" y="155" text-anchor="middle">${EXAMPLES.complementA.slice(0,3).join('  ')}</text><text x="340" y="194" text-anchor="middle">${EXAMPLES.complementA.slice(3).join('  ')}</text><text x="112" y="130" text-anchor="middle">${outside.slice(0,3).join('  ')}</text><text x="112" y="174" text-anchor="middle">${outside.slice(3).join('  ')}</text><text x="112" y="234" text-anchor="middle" class="set-label">Aᶜ</text></svg>`;
  }
  const aOnly = EXAMPLES.A.filter(x => !EXAMPLES.B.includes(x));
  const both = EXAMPLES.A.filter(x => EXAMPLES.B.includes(x));
  const bOnly = EXAMPLES.B.filter(x => !EXAMPLES.A.includes(x));
  const left = '<circle cx="215" cy="160" r="115"';
  const right = '<circle cx="345" cy="160" r="115"';
  let shading = operation === 'union' ? `${left} fill="#e9c6aa"/>${right} fill="#e9c6aa"/>` : operation === 'intersection' ? `${left} fill="#e9c6aa" clip-path="url(#${id}-clip)"/>` : `${reverse ? right : left} fill="#e9c6aa" mask="url(#${id}-mask)"/>`;
  return `<svg class="venn" viewBox="0 0 560 310" role="img" aria-label="${operation} of A and B${reverse ? ', B minus A' : ''}"><defs><clipPath id="${id}-clip">${right}/></clipPath><mask id="${id}-mask"><rect width="560" height="310" fill="white"/>${reverse ? left : right} fill="black"/></mask></defs>${shading}${left} fill="none" stroke="#292523" stroke-width="1.5"/>${right} fill="none" stroke="#292523" stroke-width="1.5"/><text x="165" y="33" class="set-label">A</text><text x="390" y="33" class="set-label">B</text><text x="166" y="168" text-anchor="middle">${aOnly.join(', ')}</text><text x="280" y="168" text-anchor="middle">${both.join(', ')}</text><text x="398" y="168" text-anchor="middle">${bOnly.join(', ')}</text></svg>`;
}
const definitions = {
  union: {name:'Union', args:'A, B', sources:['A','B'], code:['C = empty HashSet','for each x in A:','    C.insert(x)','for each x in B:','    C.insert(x)','return C'], time:'O(n + m)', space:'O(n + m)', assumption:'Scan n + m items. Each insertion takes expected O(1). The result is the only growing structure.', extra:'No temporary membership index is needed.'},
  intersection: {name:'Intersection', args:'A, B', sources:['A'], code:['C = empty HashSet','for each x in A:','    if B.contains(x):','        C.insert(x)','return C'], time:'O(n)', space:'O(min(n, m))', assumption:'B is already hashed: scan A in expected O(n). Build B first for ordinary inputs: O(n + m) overall.', extra:'A new B index needs O(m) temporary space.'},
  difference: {name:'Difference', args:'A, B', sources:['A'], code:['C = empty HashSet','for each x in A:','    if not B.contains(x):','        C.insert(x)','return C'], time:'O(n)', space:'O(n)', assumption:'B is already hashed: scan A in expected O(n). Build B first for ordinary inputs: O(n + m) overall.', extra:'A new B index needs O(m) temporary space.'},
  complement: {name:'Complement', args:'U, A', sources:['U'], code:['C = empty HashSet','for each x in U:','    if not A.contains(x):','        C.insert(x)','return C'], time:'O(u)', space:'O(u)', assumption:'A is already hashed: scan U in expected O(u). Build A first for ordinary inputs: O(u + n) overall.', extra:'A new A index needs O(n) temporary space.'}
};
// Generate every iteration from actual membership tests; no hand-written trace frames.
function makeSteps(operation, reverse = false, buildIndex = false) {
  const config = definitions[operation], result = new Set();
  const lookupName = operation === 'complement' || reverse ? 'A' : 'B';
  const lookup = new Set(buildIndex ? [] : operandValues(operation,lookupName));
  const steps = [{result:[], title:'Initially', explanation:'Create an empty HashSet C. No elements have been processed.', line:0}];
  if (buildIndex && operation !== 'union') operandValues(operation,lookupName).forEach((x,index) => {
    lookup.add(x);
    steps.push({source:lookupName,index,x,status:'indexed',result:[],indexValues:[...lookup],title:`Index ${x} in ${lookupName}`,explanation:`Insert ${x} into the temporary ${lookupName} index: one hash insertion.`,line:1,building:true});
  });
  for (const source of (reverse ? ['B'] : config.sources)) EXAMPLES[source].forEach((x, index) => {
    const found = operation === 'union' ? result.has(x) : lookup.has(x);
    const accepted = operation === 'union' ? !found : operation === 'intersection' ? found : !found;
    if (accepted) result.add(x);
    const status = accepted ? 'accepted' : operation === 'union' ? 'duplicate' : 'skipped';
    const check = operation === 'union' ? `${x} ${found ? '∈' : '∉'} C` : `${lookupName}.contains(${x}) → ${found ? 'Yes' : 'No'}`;
    steps.push({source,index,x,status,lookupName,found,result:[...result],title:check,explanation:accepted ? `Insert ${x} into C. ${operation === 'intersection' ? 'It occurs in both sets.' : operation === 'union' ? 'It is a new unique element.' : `It is not in ${lookupName}.`}` : found && operation === 'union' ? `${x} already exists; skip duplicate. C stays unchanged.` : `Skip ${x}. ${operation === 'intersection' ? 'It is absent from B.' : `It belongs to ${lookupName}.`} C stays unchanged.`,line:operation === 'union' ? source === 'A' ? 2 : 4 : accepted ? 3 : 2});
  });
  steps.push({result:[...result], title:'Complete · return C', explanation:`Result: ${fmt([...result])}. Every input item has been examined.`,line:config.code.length-1});
  return steps;
}
const traces = Object.fromEntries(Object.keys(definitions).map(key => [key, {steps:makeSteps(key),position:0}]));
function operandRows(operation) {
  return (operation === 'complement' ? ['U','A'] : ['A','B']).map(source => `<div class="operand source-${source}" data-panel="${source}"><div class="operand-heading"><div class="source-label">${source === 'U' ? 'Universal set U' : `Set ${source}`}</div><span class="panel-status" data-panel-status="${source}"></span></div><div class="cells" data-source="${source}">${cells(operandValues(operation,source))}</div></div>`).join('');
}
function codePanel(operation, reverse = false) {
  const config = definitions[operation];
  const code = config.code.map(line => reverse ? line.replace(/\bA\b/g,'TEMP').replace(/\bB\b/g,'A').replace(/TEMP/g,'B') : line);
  return `<pre>${config.name}(${reverse ? 'B, A' : config.args}):\n${code.map((line,i)=>`<span class="line" data-line="${i}">  ${line}</span>`).join('')}</pre>`;
}
function stepper(operation) {
  return `<div class="walkthrough" data-operation="${operation}">${operation === 'difference' ? '<div class="direction" role="group" aria-label="Difference direction"><button data-direction="forward" aria-pressed="true">A − B</button><button data-direction="reverse" aria-pressed="false">B − A</button><span>Switch direction to restart the comparison.</span></div>' : ''}<div class="card-label given-label">Given · ${operation === 'complement' ? 'Aᶜ = U − A' : 'compare the two sets'}</div><div class="operands">${operandRows(operation)}</div><div class="step-layout"><div><div class="decision" aria-live="polite" aria-atomic="true"></div><div class="result-row"><div class="result-heading"><strong>Result Set C</strong><span class="result-change"></span></div><div class="cells output"></div></div><div class="state-key" aria-label="Algorithm state legend"><span class="key-active">Active</span><span class="key-inserted">Inserted</span><span class="key-duplicate">Duplicate</span><span class="key-rejected">Rejected</span><span class="key-processed">Processed</span></div></div><div class="card pseudocode"><div class="card-label">Algorithm</div><div class="code-content">${codePanel(operation)}</div></div></div><div class="step-toolbar"><button data-action="back">← Previous Step</button><button class="primary" data-action="forward">Next Step →</button><button data-action="reset">Reset</button><span class="step-count"></span></div><p class="order-note">Demonstration order only; hash sets do not guarantee sorted iteration. ${operation === 'union' ? 'Expected time O(n + m); output space O(n + m). Hash insertion is expected O(1), not guaranteed worst-case.' : definitions[operation].assumption}</p></div>`;
}
const overview = [['∪','Union'],['∩','Intersection'],['−','Difference'],['Aᶜ','Complement']];
// EDIT CONTENT / ORDER HERE. Each entry is one slide; numbering and menu are automatic.
const results = {union:unique([...EXAMPLES.A,...EXAMPLES.B]),intersection:EXAMPLES.A.filter(x=>EXAMPLES.B.includes(x)),difference:EXAMPLES.A.filter(x=>!EXAMPLES.B.includes(x)),reverse:EXAMPLES.B.filter(x=>!EXAMPLES.A.includes(x)),complement:EXAMPLES.U.filter(x=>!EXAMPLES.complementA.includes(x))};
const lessons = {
union:['Union of Sets','The union of two sets combines every unique element from both sets into one result. An element is included if it belongs to A, B, or both.','A ∪ B','A union B','1 and 2 come from A; 5 and 6 come from B. The shared values 3 and 4 are included once.'],
intersection:['Intersection of Sets','The intersection of two sets contains only the elements common to both sets. An element is included only when it exists in A and in B.','A ∩ B','A intersection B','3 and 4 are in both sets. The values 1, 2, 5, and 6 belong to only one set, so they are excluded.'],
difference:['Difference of Sets','The difference A − B contains the elements found in A but not in B. Changing the order of the sets can change the result.','A − B','A minus B','A − B keeps 1 and 2. B − A keeps 5 and 6. Both directions exclude the shared elements 3 and 4.'],
complement:['Complement of a Set','The complement of A contains all elements in the universal set U that are not members of A. Therefore, Aᶜ is the same as U − A.','Aᶜ = U − A','A complement equals U minus A','1, 3, 5, and 7 belong to U but not A. The even values 2, 4, 6, and 8 are excluded because they belong to A.']
};
function concept(operation) {
const [title,definition,symbol,read,why]=lessons[operation];
return {title,section:'MEANING & EXAMPLE',html:`<div class="definition"><span class="card-label">Definition</span><p>${definition}</p></div><div class="notation"><strong>${symbol}</strong><span>Read as “${read}.”</span></div><div class="operands concept-operands">${operandRows(operation)}</div><div class="answer"><div class="formula">${symbol} = ${fmt(results[operation])}</div>${operation==='difference'?`<div class="reverse-result">B − A = ${fmt(results.reverse)}</div>`:''}<p>${why}</p></div>`};
}
// Union's three disjoint regions share the same inputs as the algorithm trace.
const unionRegions = [
  {name:'A only', values:EXAMPLES.A.filter(x=>!EXAMPLES.B.includes(x)), x:165},
  {name:'Overlap', values:EXAMPLES.A.filter(x=>EXAMPLES.B.includes(x)), x:280},
  {name:'B only', values:EXAMPLES.B.filter(x=>!EXAMPLES.A.includes(x)), x:395}
];
const unionVennSteps = [
  ['Initial · find A ∪ B', 'Find A ∪ B by including the distinct elements from all three regions.'],
  ['Step 1 — Set A', 'Begin with elements found only in Set A.'],
  ['Step 2 — Common elements', 'Include the shared elements. Each value is counted once.'],
  ['Step 3 — Remaining elements of B', 'Add the elements found only in Set B.'],
  ['Step 4 — Union complete', 'The union includes all three regions, with no repeated elements.']
];
function unionVennSlide() {
  return {title:'Union Venn Diagram', html:`<p class="lead union-venn-description">A Venn diagram helps visualize how the union operation combines elements from two sets. Every element belonging to Set A, Set B, or both is included in the union.</p>
  <div class="union-venn-walkthrough" aria-label="Union Venn walkthrough">
    <div class="union-venn-layout">
      <div class="union-venn-visual">
        <div class="union-venn-given"><span>A = ${fmt(EXAMPLES.A)}</span><span>B = ${fmt(EXAMPLES.B)}</span></div>
        <svg class="union-venn-svg" viewBox="80 0 400 300" role="img" aria-labelledby="union-venn-title union-venn-description">
          <title id="union-venn-title">Three regions of A union B</title>
          <desc id="union-venn-description">A only contains ${unionRegions[0].values.join(', ')}; the overlap contains ${unionRegions[1].values.join(', ')}; B only contains ${unionRegions[2].values.join(', ')}. Initially no regions are selected.</desc>
          <defs>
            <mask id="union-only-a"><rect width="560" height="310" fill="white"/><circle cx="345" cy="160" r="115" fill="black"/></mask>
            <mask id="union-only-b"><rect width="560" height="310" fill="white"/><circle cx="215" cy="160" r="115" fill="black"/></mask>
            <clipPath id="union-overlap"><circle cx="345" cy="160" r="115"/></clipPath>
          </defs>
          <circle class="union-region region-a" data-region="0" cx="215" cy="160" r="115" mask="url(#union-only-a)"/>
          <circle class="union-region region-shared" data-region="1" cx="215" cy="160" r="115" clip-path="url(#union-overlap)"/>
          <circle class="union-region region-b" data-region="2" cx="345" cy="160" r="115" mask="url(#union-only-b)"/>
          <circle class="union-outline outline-a" cx="215" cy="160" r="115"/><circle class="union-outline outline-b" cx="345" cy="160" r="115"/>
          <text class="union-set-label label-a" x="165" y="32" text-anchor="middle">A</text><text class="union-set-label label-b" x="395" y="32" text-anchor="middle">B</text>
          ${unionRegions.map((region,i)=>`<g class="union-region-values" data-values="${i}"><text x="${region.x}" y="155" text-anchor="middle">${region.values.join(', ')}</text><text class="union-region-name" x="${region.x}" y="184" text-anchor="middle">${region.name}</text></g>`).join('')}
        </svg>
      </div>
      <div class="union-venn-details">
        <div class="union-venn-why"><h3>Why use a Venn diagram?</h3><p>It shows which regions contribute to the result. For union, both circles, including the overlapping region, belong to the output.</p></div>
        <div class="union-venn-explanation" aria-live="polite" aria-atomic="true"><strong></strong><p></p></div>
        <div class="union-venn-result"><div class="card-label">Result so far</div><div class="union-venn-formula"></div></div>
      </div>
    </div>
    <div class="step-toolbar"><button data-venn-action="back" disabled>← Previous Step</button><button data-venn-action="forward" class="primary">Next Step →</button><button data-venn-action="reset" disabled>Reset</button><span class="step-count"></span></div>
  </div><p class="union-venn-note">Elements ${unionRegions[1].values.join(' and ')} belong to both sets, but appear only once in the result because sets contain unique elements.</p>`};
}
function diagramSlide(operation) {
if (operation === 'union') return unionVennSlide();
const text={union:'Shade both circles, including the overlap. Shared values belong to the result once.',intersection:'Shade only the overlap: 3 and 4 belong to both A and B.',difference:'The shaded region changes when the operands change order.',complement:'Shade the part of U outside A. The universe determines what “outside” means.'};
return {title:`${definitions[operation].name} Venn Diagram`,section:'SEE THE RESULT',html:operation==='difference'?`<p class="lead">${text[operation]}</p><div class="comparison"><div class="card">${venn(operation)}<div class="formula">A − B = ${fmt(results.difference)}</div></div><div class="card">${venn(operation,true)}<div class="formula">B − A = ${fmt(results.reverse)}</div></div></div>`:`<p class="lead">${text[operation]}</p><div class="venn-lesson"><div>${venn(operation)}</div><div>${card('Given',operation==='complement'?`<p>U = ${fmt(EXAMPLES.U)}</p><p>A = ${fmt(EXAMPLES.complementA)}</p>`:given())}<div class="formula">${lessons[operation][2]}<br>= ${fmt(results[operation])}</div></div></div>`};
}
const performance={title:'Complexity Comparison',section:'THE COST OF THE IMPLEMENTATION',html:`<p class="lead">Ordinary inputs: build any needed hash index, then scan.<br>n = |A|, m = |B|, u = |U|. Hash operations take <strong>expected O(1)</strong>.</p><div class="card table-card"><table><thead><tr><th>Operation</th><th>Expected total time</th><th>Additional space, including output</th></tr></thead><tbody><tr><td>Union</td><td>O(n + m)</td><td>O(n + m)</td></tr><tr><td>Intersection</td><td>O(n + m)</td><td>O(n + m)</td></tr><tr><td>Difference A − B</td><td>O(n + m)</td><td>O(n + m)</td></tr><tr><td>Complement U − A</td><td>O(u + n)</td><td>O(u + n)</td></tr></tbody></table></div><div class="callout">If both operands are already hash sets, intersection can scan the smaller set in expected <strong>O(min(n, m))</strong> time, excluding construction.</div><p class="note">These are expected-time bounds, not unconditional worst-case hash-table guarantees. Space includes newly created outputs and temporary hash indexes. u is the universal-set size.</p>`};

// Complexity replays use the same membership decisions as the normal walkthroughs.
const analysisInfo = {
 union:{sizes:'n = |A| = 4 · m = |B| = 4',time:'O(n + m)',space:'O(n + m)',output:'O(n + m)',why:'8 attempts = n + m, even though only 6 values are stored. Big O describes scaling with input size, not O(8).'},
 intersection:{sizes:'n = |A| = 4 · m = |B| = 4',time:'O(m + n)',space:'O(m + min(n, m)) ⊆ O(n + m)',output:'O(min(n, m))',why:'Build B in m insertions, then check n values of A. Shared values alone grow the output; each hash operation takes expected O(1).'},
 difference:{sizes:'n = |A| = 4 · m = |B| = 4',time:'O(m + n)',space:'O(m + n)',output:'O(n)',why:'Build B in m insertions, then check n values of A. Keep absent values. A − B ≠ B − A; this replay computes A − B.'},
 complement:{sizes:'u = |U| = 8 · n = |A| = 4',time:'O(n + u)',space:'O(n + u)',output:'O(u)',why:'Build A in n insertions, then check all u values of U. Only values in the defined universe can enter the complement.'}
};
const complexityTraces = Object.fromEntries(Object.keys(definitions).map(op=>{
 const frames=makeSteps(op,false,true), indexed=op!=='union';
 let processed=0,insertions=0,checks=0,accepted=0,skipped=0,indexValues=[];
 const steps=frames.map((frame,i)=>{
  if(frame.source){processed++;if(frame.building){insertions++;indexValues=frame.indexValues;}else{
   if(indexed)checks++;else insertions++;
   if(frame.status==='accepted')accepted++;else skipped++;
  }}
  return {...frame,indexValues:[...indexValues],processed,insertions,checks,accepted,skipped,
   line:frame.building?1:indexed && i>0?frame.line+1:frame.line,
   phase:i===0?'Ready':i===frames.length-1?'Complete':frame.building?'Build membership index':op==='union'?`Scan ${frame.source} · insert output`:'Scan input · membership check'};
 });
 return [op,{steps,position:0}];
}));
function complexitySlide(op){
 const info=analysisInfo[op],indexed=op!=='union',lookup=op==='complement'?'A':'B';
 const code=[...definitions[op].code];if(indexed)code.splice(1,0,`index ${lookup}: insert each value`);
 return {title:`${definitions[op].name} Complexity Analysis`,html:`<div class="complexity-replay" data-complexity="${op}">
 <div class="analysis-assumption">${info.sizes} <span>${indexed?`Build a new ${lookup} hash index; C starts empty.`:'New HashSet C; no temporary index.'}</span></div>
 <div class="operands">${operandRows(op)}</div>
 <div class="analysis-grid"><div class="analysis-work"><div class="analysis-live" aria-live="polite" aria-atomic="true"><strong class="analysis-phase"></strong><p class="analysis-explanation"></p></div>
 <div class="analysis-counters"></div><div class="analysis-progress"></div>
 <div class="analysis-memory"><div><strong>Output C · <span class="analysis-size"></span> stored</strong><div class="cells output"></div></div>${indexed?`<div><strong>Temporary index ${lookup}</strong><div class="cells analysis-index"></div></div>`:''}</div>
 </div><div class="analysis-theory"><div class="pseudocode card"><pre>${code.map((line,i)=>`<span class="line" data-line="${i}">${line}</span>`).join('')}</pre></div>
 <div class="analysis-bounds"><p><strong>Expected time: ${info.time}</strong><br>${indexed?`Build ${op==='complement'?'n':'m'} + scan ${op==='complement'?'u':'n'}. Already hashed? Scan only ${op==='complement'?'O(u)':'O(n)'}.`:'n + m expected O(1) insertion attempts.'}</p><p><strong>Output bound: ${info.output}</strong><br>Total extra space: ${info.space}${indexed?`<br>Includes index ${lookup} + output C.`:' · result C only.'}</p></div></div></div>
 <div class="analysis-summary">${info.why} Space counts stored elements; the bound grows with input size.</div>
 <div class="step-toolbar"><button data-analysis-action="back">← Previous Step</button><button class="primary" data-analysis-action="forward">Next Step →</button><button data-analysis-action="reset">Reset</button><span class="step-count"></span></div>
 <p class="analysis-note">Modeled operations, not measured runtime or bytes. Fixed demonstration order; hash sets do not guarantee sorted traversal.</p></div>`};
}
const slides = [
 {title:'Set Operations',section:'01 / Collections, compared',html:`<div class="title-layout"><div><h1>SET<br>OPERATIONS</h1><div class="title-rule"></div><p class="lead">Advanced Data Structure<br>and Algorithm Analysis</p><p class="presenter">Presented by: <strong>Jay-ar Mesquiola</strong></p><p class="title-topics">Union · Intersection · Difference · Complement</p><p class="note">Use the arrow keys to explore →</p></div><div class="title-art"><div class="art-card"><div class="art-label">TWO COLLECTIONS</div><div class="cells">${cells(EXAMPLES.A)}</div><div class="art-label">∪</div><div class="cells">${cells(EXAMPLES.B)}</div><div class="art-arrow">↓</div><div class="art-label">ONE SET OF UNIQUE ELEMENTS</div><div class="cells">${cells(unique([...EXAMPLES.A,...EXAMPLES.B]))}</div></div><p class="art-note">Different questions. The right collection.</p></div></div>`},
 {title:'Set operations in computing',html:`<p class="lead overview-definition">Set operations are fundamental computational procedures used to combine, compare, and filter collections of unique elements. In computer science, they help organize data, eliminate duplicates, identify shared values, and isolate specific subsets efficiently.</p><div class="cards overview-cards">${overview.map(([symbol,name])=>`<div class="card"><div class="symbol">${symbol}</div><h3>${name}</h3></div>`).join('')}</div><p class="overview-emphasis">A set stores unique elements only — duplicates are ignored.</p>`},
 concept('union'), {title:'Union Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('union')}, diagramSlide('union'), complexitySlide('union'),
 concept('intersection'), {title:'Intersection Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('intersection')}, diagramSlide('intersection'), complexitySlide('intersection'),
 concept('difference'), {title:'Difference Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('difference')}, diagramSlide('difference'), complexitySlide('difference'),
 concept('complement'), {title:'Complement Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('complement')}, diagramSlide('complement'), complexitySlide('complement'),
 performance,
 {title:'Practical Applications and Conclusion',section:'APPLICATIONS',html:`<p class="lead">Small membership decisions power larger systems.</p><div class="cards">${[['∪','Combine users','Merge two user-ID collections into one deduplicated audience.'],['∩','Shared neighbors','Find vertices adjacent to both graph nodes, or tags shared by two records.'],['−','Filter blocked IDs','Start with candidate IDs and remove every ID in the blocked set.'],['ᶜ','Find what’s missing','From the eligible universe, select records that have not yet been selected.']].map(([s,n,d])=>`<div class="card"><div class="symbol">${s}</div><h3>${n}</h3><p>${d}</p></div>`).join('')}</div><p class="closing">The operation determines the result.<br>The data structure determines the cost.</p>`}
];
// Numeric deep links match the visible slide numbers.
slides.forEach((slide, i) => { slide.bookmark = i + 1; });
const deck = document.getElementById('deck');
deck.innerHTML = slides.map((slide,i)=>`<section class="slide ${i===0?'cover-slide':i===1?'overview-slide':slide.html.includes('data-complexity=')?'complexity-slide':slide.title==='Union Venn Diagram'?'union-venn-slide':slide.html.includes('class="walkthrough"')?'walkthrough-slide':'concept-slide'}" id="slide-${slide.bookmark}" aria-labelledby="title-${i+1}" ${i?'hidden':''}>${i?`<h2 id="title-${i+1}">${slide.title}</h2>`:''}${slide.html}</section>`).join('');
deck.querySelector('h1').id = 'title-1';
function renderTrace(operation) {
  const trace = traces[operation], step = trace.steps[trace.position];
  const root = document.querySelector(`[data-operation="${operation}"]`);
  root.setAttribute('data-active-source',step.source || 'none');
  root.querySelectorAll('[data-source]').forEach(row=>{
    const source = row.dataset.source;
    const scanning = step.source === source;
    const panel = root.querySelector(`[data-panel="${source}"]`);
    panel.className = `operand source-${source}${scanning ? ' scanning' : ''}${step.source && !scanning && operation !== 'union' ? ' checking' : ''}`;
    root.querySelector(`[data-panel-status="${source}"]`).textContent = scanning ? 'Scanning ↓' : step.source && operation !== 'union' ? 'Membership check' : '';
    [...row.children].forEach((cell,index)=>{
      const processed = trace.steps.slice(1,trace.position+1).find(frame=>frame.source === source && frame.index === index);
      const active = scanning && step.index === index;
      const match = operation !== 'union' && step.x === Number(cell.textContent) && !scanning;
      cell.className = `cell${match ? ' match' : ''}${processed ? ` ${processed.status}${active ? '' : ' processed'}` : ''}${active ? ' active' : ''}`;
      cell.setAttribute('aria-label',`${cell.textContent}${active ? ', active' : ''}${processed ? `, ${processed.status}` : ''}${match ? ', membership match' : ''}`);
    });
  });
  const status = step.status === 'accepted' ? 'Inserted' : step.status === 'duplicate' ? 'Duplicate' : step.status === 'skipped' ? 'Rejected' : trace.position === 0 ? 'Ready' : 'Complete';
  const action = step.source ? step.status === 'accepted' ? `Insert ${step.x} into C` : step.status === 'duplicate' ? `${step.x} already exists — skip duplicate` : `${step.x} is not included — skip` : step.title;
  root.querySelector('.decision').innerHTML = `<div class="step-context"><span>${step.source ? `Scanning ${step.source === 'U' ? 'universal set U' : `Set ${step.source}`}` : trace.position === 0 ? 'Initially · no items processed' : 'All items processed'}</span><span class="status-badge ${step.status || ''}">${status}</span></div><strong>${action}</strong><span class="step-explanation">${step.source ? operation === 'union' ? step.explanation : `${step.lookupName}.contains(${step.x}) → ${step.found ? 'Yes' : 'No'}. ${operation === 'intersection' && step.status === 'accepted' ? `${step.x} belongs to both sets — keep it.` : step.explanation}` : step.explanation}</span>`;
  root.querySelector('.output').innerHTML = step.result.length ? step.result.map(x=>`<span class="cell output-value${step.status === 'accepted' && x === step.x ? ' newly-inserted' : ''}">${x}</span>`).join('') : '<span class="empty">∅ · empty set</span>';
  root.querySelector('.result-change').textContent = step.status === 'accepted' ? `+ ${step.x} inserted` : step.source ? 'No change' : trace.position === 0 ? 'Empty' : `${step.result.length} unique values`;
  root.querySelectorAll('[data-line]').forEach(line=>{
    const active = Number(line.dataset.line)===step.line;
    line.classList.toggle('current',active);
    if(active) line.setAttribute('aria-current','step'); else line.removeAttribute('aria-current');
  });
  root.querySelector('[data-action="back"]').disabled = trace.position === 0;
  root.querySelector('[data-action="forward"]').disabled = trace.position === trace.steps.length-1;
  root.querySelector('[data-action="reset"]').disabled = trace.position === 0;
  root.querySelector('.step-count').textContent = `Step ${trace.position} of ${trace.steps.length-1}`;
}
Object.keys(traces).forEach(renderTrace);
deck.addEventListener('click', event=>{
  const direction = event.target.closest('[data-direction]');
  if (direction) {
    const reverse = direction.dataset.direction === 'reverse';
    const root = direction.closest('[data-operation]');
    traces.difference = {steps:makeSteps('difference',reverse),position:0};
    root.querySelectorAll('[data-direction]').forEach(button=>button.setAttribute('aria-pressed',String(button===direction)));
    root.querySelector('.code-content').innerHTML = codePanel('difference',reverse);
    renderTrace('difference');
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const operation = button.closest('[data-operation]').dataset.operation, trace = traces[operation];
  trace.position = button.dataset.action === 'reset' ? 0 : Math.max(0, Math.min(trace.steps.length-1,trace.position+(button.dataset.action==='forward'?1:-1)));
  renderTrace(operation);
});
const dialog = document.getElementById('index-dialog');
const links = document.getElementById('index-links');
links.innerHTML = slides.map((slide,i)=>`<button data-slide="${i}"><span>${String(i+1).padStart(2,'0')}</span>${slide.title}</button>`).join('');
let current = 0;
function navigate(position, updateHash = true) {
  current = Math.max(0,Math.min(slides.length-1,position));
  [...deck.children].forEach((slide,i)=>{slide.hidden=i!==current;});
  document.getElementById('counter').textContent = `${String(current+1).padStart(2,'0')} / ${slides.length}`;
  document.getElementById('previous').disabled = current===0;
  document.getElementById('next').disabled = current===slides.length-1;
  links.querySelectorAll('button').forEach((button,i)=>{if(i===current)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  if(updateHash) { try {history.replaceState(null,'',`#slide-${slides[current].bookmark}`);} catch { /* Navigation still works in restricted file viewers. */ } }
  document.title = `${current+1}. ${slides[current].title} — Set Operations`;
}
document.getElementById('previous').addEventListener('click',()=>navigate(current-1));
document.getElementById('next').addEventListener('click',()=>navigate(current+1));
document.getElementById('contents').addEventListener('click',()=>{dialog.showModal();links.querySelector('[aria-current]').focus();});
document.getElementById('close-index').addEventListener('click',()=>dialog.close());
links.addEventListener('click',event=>{const button=event.target.closest('[data-slide]');if(button){navigate(Number(button.dataset.slide));dialog.close();}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',event=>{
  if(document.getElementById('stage').inert || dialog.open || event.altKey || event.ctrlKey || event.metaKey || (event.target.isContentEditable || event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')))return;
  // Space activates a focused control; arrow/Page keys still navigate after clicks.
  if(event.key === ' ' && event.target.closest('button,a'))return;
  if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();navigate(current+1);}
  if(event.key==='Home'){event.preventDefault();navigate(0);}
  if(event.key==='End'){event.preventDefault();navigate(slides.length-1);}
  if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();navigate(current-1);}
});
const full = document.getElementById('fullscreen');
const stage = document.getElementById('stage');
const canvas = document.querySelector('.slide-canvas');
const prompt = document.getElementById('mobile-prompt');
const start = document.getElementById('start-presentation');
const status = document.getElementById('presentation-status');
let started = false, orientationLocked = false, presenting = false;
const isPhone = () => matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 600;
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
function fitCanvas() {
  const viewport = window.visualViewport;
  stage.style.width = `${viewport ? viewport.width : innerWidth}px`;
  stage.style.height = `${viewport ? viewport.height : innerHeight}px`;
  stage.style.left = `${viewport ? viewport.offsetLeft : 0}px`;
  stage.style.top = `${viewport ? viewport.offsetTop : 0}px`;
  const style = getComputedStyle(stage);
  const width = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const height = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  canvas.style.transform = `translate(-50%, -50%) scale(${Math.min(width / 1600, height / 900)})`;
  canvas.style.left = `${parseFloat(style.paddingLeft) + width / 2}px`;
  canvas.style.top = `${parseFloat(style.paddingTop) + height / 2}px`;
  const portrait = height > width;
  prompt.hidden = !isPhone() || (started && !portrait);
  stage.inert = !prompt.hidden;
  document.getElementById('mobile-title').textContent = portrait ? 'Rotate your device to landscape' : 'Start Presentation';
  document.getElementById('mobile-message').textContent = portrait ? 'Turn your phone sideways. If it stays upright, turn off rotation lock in your device settings.' : 'Open the full slide canvas for the best presentation view.';
  document.getElementById('continue-presentation').hidden = portrait;
}
async function enterPresentation() {
  if (presenting) return;
  presenting = true; started = true;
  const messages = [];
  try {
    const request = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
    if (!fullscreenElement() && request) {
      try { await request.call(document.documentElement); }
      catch { messages.push('Fullscreen was denied. You can continue in your browser.'); }
    } else if (!request) messages.push('Fullscreen is unavailable in this browser.');
    if (isPhone()) {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        try { await screen.orientation.lock('landscape'); orientationLocked = true; }
        catch { messages.push('Landscape lock is unavailable. Rotate your device manually.'); }
      } else messages.push('Rotate your device manually; landscape lock is unsupported.');
    }
    status.textContent = messages.join(' ');
    full.title = status.textContent || 'Presentation mode';
    start.textContent = 'Retry Fullscreen / Landscape';
  } finally { presenting = false; fitCanvas(); }
}
full.addEventListener('click', async () => {
  if (fullscreenElement()) {
    try { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    catch { full.title = 'Use your browser’s fullscreen exit control.'; }
  } else await enterPresentation();
});
start.addEventListener('click', enterPresentation);
document.getElementById('continue-presentation').addEventListener('click', () => { started = true; fitCanvas(); });
function fullscreenChanged() {
  const active = !!fullscreenElement();
  if (!active && orientationLocked) {
    try { screen.orientation.unlock(); } catch { /* Some browsers unlock automatically. */ }
    orientationLocked = false;
  }
  full.innerHTML = active ? '⛶ <span>Exit</span>' : '⛶ <span>Present</span>';
  full.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  fitCanvas();
}
document.addEventListener('fullscreenchange', fullscreenChanged);
document.addEventListener('webkitfullscreenchange', fullscreenChanged);
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', fitCanvas);
window.visualViewport?.addEventListener('resize', fitCanvas);
window.visualViewport?.addEventListener('scroll', fitCanvas);
screen.orientation?.addEventListener('change', fitCanvas);
// Swipe only blank slide surfaces; widgets retain their own gestures.
let swipe = null;
const interactive = target => target.closest('button,a,input,select,textarea,.walkthrough,.complexity-replay,.union-venn-walkthrough,.comparison,.step-toolbar,dialog');
deck.addEventListener('pointerdown', event => {
  swipe = event.pointerType === 'touch' && !interactive(event.target) ? {x:event.clientX,y:event.clientY,id:event.pointerId} : null;
});
deck.addEventListener('pointerup', event => {
  if (!swipe || swipe.id !== event.pointerId) return;
  const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
  swipe = null;
  if (!interactive(event.target) && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(current + (dx < 0 ? 1 : -1));
});
deck.addEventListener('pointercancel', () => { swipe = null; });
function readHash() {
  const match = location.hash.match(/^#slide-(\d+)$/);
  const bookmark = match ? Number(match[1]) : 1;
  const index = slides.findIndex(slide => slide.bookmark === bookmark);
  navigate(index < 0 ? 0 : index);
}
window.addEventListener('hashchange', readHash);
readHash();
fitCanvas();
// This state is independent of algorithm traces and survives slide navigation.
let unionVennPosition = 0;
const unionVennRoot = document.querySelector('.union-venn-walkthrough');
function renderUnionVenn(animate = false) {
  const selected = Math.min(unionVennPosition, 3);
  unionVennRoot.querySelectorAll('[data-region]').forEach((region, i) => {
    region.classList.toggle('selected', i < selected);
    region.classList.toggle('new-region', animate && unionVennPosition === i + 1);
  });
  unionVennRoot.querySelectorAll('[data-values]').forEach((group, i) => {
    group.classList.toggle('current-values', unionVennPosition === i + 1);
  });
  const [title, message] = unionVennSteps[unionVennPosition];
  unionVennRoot.querySelector('.union-venn-explanation strong').textContent = title;
  unionVennRoot.querySelector('.union-venn-explanation p').textContent = message;
  const values = unionRegions.slice(0, selected).flatMap(region => region.values);
  const added = animate && unionVennPosition > 0 && unionVennPosition < 4 ? unionRegions[unionVennPosition - 1].values : [];
  unionVennRoot.querySelector('.union-venn-formula').innerHTML = values.length
    ? `${unionVennPosition === 4 ? 'A ∪ B' : 'C'} = {${values.map(x=>`<span class="${added.includes(x)?'union-new-value':''}">${x}</span>`).join(', ')}}`
    : 'C = ∅';
  unionVennRoot.querySelector('.union-venn-result').classList.toggle('complete', unionVennPosition === 4);
  unionVennRoot.querySelector('.union-venn-result .card-label').textContent = unionVennPosition === 4 ? `Final union · ${values.length} unique elements` : unionVennPosition === 0 ? 'Result so far · no elements included yet' : 'Result so far';
  unionVennRoot.querySelector('#union-venn-description').textContent = unionRegions.map((region,i)=>`${region.name}: ${region.values.join(', ')}; ${i<selected?'included':'not yet included'}.`).join(' ');
  unionVennRoot.querySelector('[data-venn-action="back"]').disabled = unionVennPosition === 0;
  unionVennRoot.querySelector('[data-venn-action="reset"]').disabled = unionVennPosition === 0;
  unionVennRoot.querySelector('[data-venn-action="forward"]').disabled = unionVennPosition === 4;
  unionVennRoot.querySelector('.step-count').textContent = `Step ${unionVennPosition} of 4`;
}
unionVennRoot.addEventListener('click', event => {
  const button = event.target.closest('[data-venn-action]');
  if (!button || button.disabled) return;
  const previous = unionVennPosition;
  unionVennPosition = button.dataset.vennAction === 'reset' ? 0 : Math.max(0, Math.min(4, previous + (button.dataset.vennAction === 'forward' ? 1 : -1)));
  renderUnionVenn(unionVennPosition > previous);
});
renderUnionVenn();

function renderComplexity(op){
 const trace=complexityTraces[op],step=trace.steps[trace.position],root=document.querySelector(`[data-complexity="${op}"]`),indexed=op!=='union';
 root.dataset.activeSource=step.source||'none';
 root.querySelectorAll('[data-source]').forEach(row=>{
  const source=row.dataset.source,active=source===step.source;
  root.querySelector(`[data-panel="${source}"]`).classList.toggle('scanning',active);
  root.querySelector(`[data-panel-status="${source}"]`).textContent=active?(step.building?'Indexing ↓':'Scanning ↓'):'';
  [...row.children].forEach((cell,i)=>{
   const done=trace.steps.slice(1,trace.position+1).find(f=>f.source===source&&f.index===i);
   cell.className=`cell${done?` ${done.status} processed`:''}${active&&step.index===i?' active':''}`;
   cell.setAttribute('aria-label',`${cell.textContent}${done?', processed':''}${active&&step.index===i?', active':''}`);
  });
 });
 root.querySelector('.analysis-phase').textContent=step.phase;
 root.querySelector('.analysis-explanation').textContent=step.building?step.explanation:step.source?op==='union'?`Insert ${step.x} from ${step.source}: one insertion attempt. ${step.status==='duplicate'?'Already present; output does not grow.':'One new output value.'}`:`Check whether ${step.x} is in ${step.lookupName}: ${step.found?'present':'absent'}. ${step.status==='accepted'?'Include it in C.':'Exclude it; C does not grow.'}`:step.explanation;
 const counters=[['Input processed',step.processed],[indexed?'Index insertions':'Insertion attempts',step.insertions],...(indexed?[['Membership checks',step.checks]]:[]),['Output insertions',step.accepted],['Skipped',step.skipped]];
 root.querySelector('.analysis-counters').innerHTML=counters.map(([label,n])=>`<div><b>${n}</b><span>${label}</span></div>`).join('');
 const phases=indexed?[{label:`Build ${op==='complement'?'A':'B'}`,total:4,value:step.insertions},{label:`Scan ${op==='complement'?'U':'A'}`,total:op==='complement'?8:4,value:step.checks}]:[{label:'Scan A',total:4,value:Math.min(step.insertions,4)},{label:'Scan B',total:4,value:Math.max(0,step.insertions-4)}];
 root.querySelector('.analysis-progress').innerHTML=phases.map(p=>`<div><span>${p.label}: ${p.value} / ${p.total}</span><progress value="${p.value}" max="${p.total}" aria-label="${p.label}"></progress></div>`).join('');
 root.querySelector('.analysis-size').textContent=step.result.length;
 root.querySelector('.output').innerHTML=step.result.length?step.result.map(x=>`<span class="cell output-value${step.status==='accepted'&&x===step.x?' newly-inserted':''}">${x}</span>`).join(''):'<span class="empty">∅</span>';
 if(indexed)root.querySelector('.analysis-index').innerHTML=step.indexValues.length?cells(step.indexValues):'<span class="empty">∅</span>';
 root.querySelectorAll('[data-line]').forEach(el=>{const active=Number(el.dataset.line)===step.line;el.classList.toggle('current',active);if(active)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 root.querySelector('.analysis-summary').classList.toggle('revealed',trace.position===trace.steps.length-1);
 root.querySelector('[data-analysis-action="back"]').disabled=trace.position===0;
 root.querySelector('[data-analysis-action="reset"]').disabled=trace.position===0;
 root.querySelector('[data-analysis-action="forward"]').disabled=trace.position===trace.steps.length-1;
 root.querySelector('.step-count').textContent=`Step ${trace.position} of ${trace.steps.length-1}`;
}
Object.keys(complexityTraces).forEach(renderComplexity);
deck.addEventListener('click',event=>{
 const button=event.target.closest('[data-analysis-action]');if(!button)return;
 const op=button.closest('[data-complexity]').dataset.complexity,trace=complexityTraces[op];
 trace.position=button.dataset.analysisAction==='reset'?0:Math.max(0,Math.min(trace.steps.length-1,trace.position+(button.dataset.analysisAction==='forward'?1:-1)));
 renderComplexity(op);
});
