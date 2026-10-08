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
function makeSteps(operation, reverse = false) {
  const config = definitions[operation], result = new Set();
  const lookupName = operation === 'complement' || reverse ? 'A' : 'B';
  const lookup = new Set(operandValues(operation,lookupName));
  const steps = [{result:[], title:'Initially', explanation:'Create an empty HashSet C. No elements have been processed.', line:0}];
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
  return `<div class="walkthrough" data-operation="${operation}">${operation === 'difference' ? '<div class="direction" role="group" aria-label="Difference direction"><button data-direction="forward" aria-pressed="true">A − B</button><button data-direction="reverse" aria-pressed="false">B − A</button><span>Switch direction to restart the comparison.</span></div>' : ''}<div class="card-label given-label">Given · ${operation === 'complement' ? 'Aᶜ = U − A' : 'compare the two sets'}</div><div class="operands">${operandRows(operation)}</div><div class="step-layout"><div><div class="decision" aria-live="polite" aria-atomic="true"></div><div class="result-row"><div class="result-heading"><strong>Result Set C</strong><span class="result-change"></span></div><div class="cells output"></div></div><div class="state-key" aria-label="Algorithm state legend"><span class="key-active">Active</span><span class="key-inserted">Inserted</span><span class="key-duplicate">Duplicate</span><span class="key-rejected">Rejected</span><span class="key-processed">Processed</span></div></div><div class="card pseudocode"><div class="card-label">Algorithm</div><div class="code-content">${codePanel(operation)}</div></div></div><div class="step-toolbar"><button data-action="back">← Previous Step</button><button class="primary" data-action="forward">Next Step →</button><button data-action="reset">Reset</button><span class="step-count"></span></div><p class="order-note">Demonstration order only; hash sets do not guarantee sorted iteration. ${operation === 'union' ? '' : 'Membership tests use the other operand’s hash index.'}</p></div>`;
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
function diagramSlide(operation) {
const text={union:'Shade both circles, including the overlap. Shared values belong to the result once.',intersection:'Shade only the overlap: 3 and 4 belong to both A and B.',difference:'The shaded region changes when the operands change order.',complement:'Shade the part of U outside A. The universe determines what “outside” means.'};
return {title:`${definitions[operation].name} Venn Diagram`,section:'SEE THE RESULT',html:operation==='difference'?`<p class="lead">${text[operation]}</p><div class="comparison"><div class="card">${venn(operation)}<div class="formula">A − B = ${fmt(results.difference)}</div></div><div class="card">${venn(operation,true)}<div class="formula">B − A = ${fmt(results.reverse)}</div></div></div>`:`<p class="lead">${text[operation]}</p><div class="venn-lesson"><div>${venn(operation)}</div><div>${card('Given',operation==='complement'?`<p>U = ${fmt(EXAMPLES.U)}</p><p>A = ${fmt(EXAMPLES.complementA)}</p>`:given())}<div class="formula">${lessons[operation][2]}<br>= ${fmt(results[operation])}</div></div></div>`};
}
const motivation={title:'Why Sets Matter in Computing',section:'WHY SET SEMANTICS MATTER',html:`<p class="lead">Lists can contain repeated values. Merging them directly may preserve duplicates; a Set ADT enforces uniqueness.</p><div class="motivation-given">A = [${EXAMPLES.A.join(', ')}] <span>B = [${EXAMPLES.B.join(', ')}]</span></div><div class="comparison"><div class="card"><div class="card-label">Before · merge directly</div><h3>Array concatenation</h3><div id="concat-cells" class="cells"></div><p id="concat-caption"></p></div><div class="card"><div class="card-label">After · enforce uniqueness</div><h3>Set union</h3><div id="unique-cells" class="cells"></div><p id="unique-caption"></p></div></div><div class="callout" id="motivation-caption" aria-live="polite"></div><div class="step-toolbar"><button id="motivation-next" class="primary">Next Step →</button><button id="motivation-reset">Reset</button><span id="motivation-count"></span></div>`};
const adt={title:'Sets as an Abstract Data Type',section:'FROM MEANING TO IMPLEMENTATION',html:`<p class="lead">A set is a collection of <strong>unique elements</strong>. Mathematical sets have no inherent order.</p><div class="adt-operations">insert(x) · contains(x) · remove(x) · iteration</div><div class="cards adt-cards">${[['Unsorted array / list','O(n)','Scan entries to test membership. Check for duplicates when inserting.'],['Hash set','Expected O(1)','Use hashing for fast membership and insertion. Collisions can make operations slower.'],['Balanced search tree','O(log n)','Search a balanced tree for membership. Can iterate in key order.']].map(([name,cost,copy])=>`<div class="card"><h3>${name}</h3><div class="formula">${cost}</div><p>${copy}</p></div>`).join('')}</div><p class="note">These are membership costs. Implementations may differ in iteration order; hash sets do not guarantee sorted order.</p>`};
const performance={title:'Complexity Comparison',section:'THE COST OF THE IMPLEMENTATION',html:`<p class="lead">Ordinary inputs: build any needed hash index, then scan.<br>n = |A|, m = |B|, u = |U|. Hash operations take <strong>expected O(1)</strong>.</p><div class="card table-card"><table><thead><tr><th>Operation</th><th>Expected total time</th><th>Additional space, including output</th></tr></thead><tbody><tr><td>Union</td><td>O(n + m)</td><td>O(n + m)</td></tr><tr><td>Intersection</td><td>O(n + m)</td><td>O(m + min(n, m)) · index B + output</td></tr><tr><td>Difference A − B</td><td>O(n + m)</td><td>O(m + n) · index B + output</td></tr><tr><td>Complement U − A</td><td>O(u + n)</td><td>O(n + u) · index A + output</td></tr></tbody></table></div><div class="callout">If both operands are already hash sets, intersection can scan the smaller set in expected <strong>O(min(n, m))</strong> time, excluding construction.</div><p class="note">Space bounds are upper bounds for these implementations. Expected hash performance is not a worst-case guarantee.</p>`};
const summary={title:'Four questions. Four operations.',section:'SUMMARY',html:`<p class="lead">Choose the operation by what you want to keep.</p><div class="cards summary">${[['∪','Union','In A or B',results.union],['∩','Intersection','In A and B',results.intersection],['−','Difference','In A, not B',results.difference],['ᶜ','Complement','In U, not A',results.complement]].map(([symbol,name,meaning,result])=>`<div class="card"><div class="symbol">${symbol}</div><h3>${name}</h3><p>${meaning}</p><p class="summary-result">${fmt(result)}</p></div>`).join('')}</div><p class="closing">The operation determines the result.<br>The data structure determines the cost.</p>`};

const slides = [
 {title:'Set Operations',section:'01 / Collections, compared',html:`<div class="title-layout"><div><h1>SET<br>OPERATIONS</h1><div class="title-rule"></div><p class="lead">Advanced Data Structure<br>and Algorithm Analysis</p><p class="presenter">Presented by: <strong>Jay-ar Mesquiola</strong></p><p class="title-topics">Union · Intersection · Difference · Complement</p><p class="note">Use the arrow keys to explore →</p></div><div class="title-art"><div class="art-card"><div class="art-label">TWO COLLECTIONS</div><div class="cells">${cells(EXAMPLES.A)}</div><div class="art-label">∪</div><div class="cells">${cells(EXAMPLES.B)}</div><div class="art-arrow">↓</div><div class="art-label">ONE SET OF UNIQUE ELEMENTS</div><div class="cells">${cells(unique([...EXAMPLES.A,...EXAMPLES.B]))}</div></div><p class="art-note">Different questions. The right collection.</p></div></div>`},
 {title:'Set operations in computing',html:`<p class="lead overview-definition">Set operations are fundamental computational procedures used to combine, compare, and filter collections of unique elements. In computer science, they help organize data, eliminate duplicates, identify shared values, and isolate specific subsets efficiently.</p><div class="cards overview-cards">${overview.map(([symbol,name])=>`<div class="card"><div class="symbol">${symbol}</div><h3>${name}</h3></div>`).join('')}</div><p class="overview-emphasis">A set stores unique elements only — duplicates are ignored.</p>`},
 motivation, adt,
 concept('union'), {title:'Union Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('union')}, diagramSlide('union'),
 concept('intersection'), {title:'Intersection Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('intersection')}, diagramSlide('intersection'),
 concept('difference'), {title:'Difference Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('difference')}, diagramSlide('difference'),
 concept('complement'), {title:'Complement Algorithm Walkthrough',section:'STEP BY STEP',html:stepper('complement')}, diagramSlide('complement'),
 performance,
 {title:'Where these algorithms show up',section:'APPLICATIONS',html:`<p class="lead">Small membership decisions power larger systems.</p><div class="cards">${[['∪','Combine users','Merge two user-ID collections into one deduplicated audience.'],['∩','Shared neighbors','Find vertices adjacent to both graph nodes, or tags shared by two records.'],['−','Filter blocked IDs','Start with candidate IDs and remove every ID in the blocked set.'],['ᶜ','Find what’s missing','From the eligible universe, select records that have not yet been selected.']].map(([s,n,d])=>`<div class="card"><div class="symbol">${s}</div><h3>${n}</h3><p>${d}</p></div>`).join('')}</div><div class="callout"><strong>Union-Find / DSU is a different ADT.</strong> It stores partitions and supports find / union for connectivity, cycle detection, and Kruskal’s algorithm. It does not directly produce A ∪ B as a deduplicated collection.</div>`},
 summary
];
const deck = document.getElementById('deck');
deck.innerHTML = slides.map((slide,i)=>`<section class="slide" id="slide-${i+1}" aria-labelledby="title-${i+1}" ${i?'hidden':''}>${i?`<h2 id="title-${i+1}">${slide.title}</h2>`:''}${slide.html}</section>`).join('');
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
  document.getElementById('progress').style.width = `${(current+1)/slides.length*100}%`;
  document.getElementById('previous').disabled = current===0;
  document.getElementById('next').disabled = current===slides.length-1;
  links.querySelectorAll('button').forEach((button,i)=>{if(i===current)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  if(updateHash) { try {history.replaceState(null,'',`#slide-${current+1}`);} catch { /* Navigation still works in restricted file viewers. */ } }
  document.title = `${current+1}. ${slides[current].title} — Set Operations`;
}
document.getElementById('previous').addEventListener('click',()=>navigate(current-1));
document.getElementById('next').addEventListener('click',()=>navigate(current+1));
document.getElementById('contents').addEventListener('click',()=>{dialog.showModal();links.querySelector('[aria-current]').focus();});
document.getElementById('close-index').addEventListener('click',()=>dialog.close());
links.addEventListener('click',event=>{const button=event.target.closest('[data-slide]');if(button){navigate(Number(button.dataset.slide));dialog.close();}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',event=>{
  if(dialog.open || event.altKey || event.ctrlKey || event.metaKey || (event.target.isContentEditable || event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')))return;
  // Space activates a focused control; arrow/Page keys still navigate after clicks.
  if(event.key === ' ' && event.target.closest('button,a'))return;
  if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();navigate(current+1);}
  if(event.key==='Home'){event.preventDefault();navigate(0);}
  if(event.key==='End'){event.preventDefault();navigate(slides.length-1);}
  if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();navigate(current-1);}
});
const full = document.getElementById('fullscreen');
if(!document.documentElement.requestFullscreen){full.hidden=true;}else{
  full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{full.title='Fullscreen is unavailable in this viewer. Open index.html in a browser to present.';}});
  document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;full.innerHTML=active?'⛶ <span>Exit</span>':'⛶ <span>Present</span>';full.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');});
}
function readHash(){const match=location.hash.match(/^#slide-(\d+)$/);navigate(match?Number(match[1])-1:0,false);}
window.addEventListener('hashchange',readHash);
readHash();
// Concatenation and union share inputs, but apply different membership rules.
let motivationPosition = 0;
function renderMotivation() {
  const joined = [...EXAMPLES.A,...EXAMPLES.B];
  document.getElementById('concat-cells').innerHTML = motivationPosition ? joined.map((x,i)=>`<span class="cell ${joined.indexOf(x)!==i?'duplicate':''}">${x}</span>`).join('') : '<span class="empty">Ready to append A and B</span>';
  document.getElementById('unique-cells').innerHTML = motivationPosition===2 ? cells(unique(joined)) : '<span class="empty">Waiting to apply set semantics</span>';
  document.getElementById('concat-caption').textContent = motivationPosition ? '8 entries: the second 3 and 4 are repeated.' : 'Append every entry, without checking duplicates.';
  document.getElementById('unique-caption').textContent = motivationPosition===2 ? '6 unique values: repeated insertions change nothing.' : 'Insert values into a Set / HashSet.';
  document.getElementById('motivation-caption').textContent = ['Initially: compare two ways to combine the same inputs.','Concatenation alone does not remove duplicates.','Union always contains unique values. Arrays can also be deduplicated with explicit checks; a hash set is one efficient implementation.'][motivationPosition];
  document.getElementById('motivation-count').textContent = `Step ${motivationPosition} of 2`;
  document.getElementById('motivation-next').disabled = motivationPosition===2;
  document.getElementById('motivation-reset').disabled = motivationPosition===0;
}
document.getElementById('motivation-next').addEventListener('click',()=>{motivationPosition=Math.min(2,motivationPosition+1);renderMotivation();});
document.getElementById('motivation-reset').addEventListener('click',()=>{motivationPosition=0;renderMotivation();});
renderMotivation();
