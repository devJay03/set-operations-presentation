// Dependency-free checks: run `node verify.cjs`. No browser or network required.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('script.js','utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(0,source.indexOf('const deck ='))+';globalThis.lesson={slides,traces,makeSteps,codePanel,results};',context);
const {slides,traces,makeSteps,codePanel,results} = context.lesson;
assert.equal(slides.length,20);
assert(slides[0].html.includes('Jay-ar Mesquiola'));
for (const [op,expected] of Object.entries({union:[1,2,3,4,5,6],intersection:[3,4],difference:[1,2],complement:[1,3,5,7]})) {
  const frames=traces[op].steps;
  assert.deepEqual(Array.from(frames.at(-1).result),expected);
  assert.deepEqual(Array.from(results[op]),expected);
  assert.equal(frames.length,op==='union'||op==='complement'?10:6);
  for(const frame of frames) assert.equal(new Set(frame.result).size,frame.result.length);
}
assert.deepEqual(Array.from(makeSteps('difference',true).at(-1).result),[5,6]);
assert.deepEqual(Array.from(makeSteps('difference',true).slice(1,-1),frame=>frame.source),['B','B','B','B']);
assert(codePanel('difference',true).includes('for each x in B:'));
assert(codePanel('difference',true).includes('if not A.contains(x):'));
assert.equal(traces.union.steps.filter(x=>x.status==='duplicate').length,2);
for(const slide of slides.filter(x=>x.html.includes('data-operation='))) assert.equal((slide.html.match(/data-source=/g)||[]).length,2);
// Exercise the actual navigation function and keyboard listener against lightweight control doubles.
const elements = {};
function element(){return {disabled:false,style:{},attrs:{},handlers:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,fn){this.handlers[k]=fn;}};}
const menu=slides.map(element), sections=slides.map(element);
context.document={getElementById(id){return elements[id] ||= element();},addEventListener(key,fn){this[key]=fn;},title:''};
context.history={replaceState(){}};
context.menu=menu;context.sections=sections;
vm.runInContext("const deck={children:sections};const links={querySelectorAll:()=>menu};const dialog={open:false};let current=0;",context);
vm.runInContext(source.slice(source.indexOf('function navigate('),source.indexOf("document.getElementById('previous').addEventListener")),context);
vm.runInContext(source.slice(source.indexOf("document.addEventListener('keydown'"),source.indexOf('const full =')),context);
const key=(key,editable=false,button=false)=>context.document.keydown({key,target:{isContentEditable:editable,closest(selector){return selector==='button,a'?button:editable;}},preventDefault(){}});
vm.runInContext('navigate(0)',context);
assert(elements.previous.disabled);key('ArrowLeft');assert.equal(vm.runInContext('current',context),0);
key('End');assert.equal(vm.runInContext('current',context),19);assert(elements.next.disabled);
key('ArrowRight');assert.equal(vm.runInContext('current',context),19);
key('Home');key('ArrowRight');assert.equal(vm.runInContext('current',context),1);
key('End',true);assert.equal(vm.runInContext('current',context),1);
key(' ',false,true);assert.equal(vm.runInContext('current',context),1);
key('PageDown');key('PageUp');assert.equal(vm.runInContext('current',context),1);
assert.equal(sections.filter(x=>!x.hidden).length,1);
// Exercise renderTrace and real delegated step/direction click handler.
const roots={};
for(const op of Object.keys(traces)) {
 const controls={};const codeLines=Array.from({length:op==='union'?6:5},(_,i)=>({...element(),dataset:{line:String(i)},classList:{current:false,toggle(name,value){this[name]=value;}}}));const rows=(op==='complement'?['U','A']:['A','B']).map(name=>({dataset:{source:name},children:(name==='U'?[1,2,3,4,5,6,7,8]:name==='A'?(op==='complement'?[2,4,6,8]:[1,2,3,4]):[3,4,5,6]).map(x=>({...element(),textContent:String(x)}))}));
 roots[op]={...element(),querySelector(selector){return controls[selector] ||= element();},querySelectorAll(selector){return selector==='[data-source]'?rows:selector==='[data-direction]'?this.directions:selector==='[data-line]'?codeLines:[];},directions:[]};
}
context.roots=roots;context.document.querySelector=selector=>roots[selector.match(/"(\w+)"/)[1]];
vm.runInContext(source.slice(source.indexOf('function renderTrace('),source.indexOf('Object.keys(traces).forEach(renderTrace)')),context);
context.clickHandlers={};vm.runInContext('deck.addEventListener=(event,fn)=>clickHandlers[event]=fn;',context);
vm.runInContext(source.slice(source.indexOf("deck.addEventListener('click'"),source.indexOf('const dialog =')),context);
for(const op of Object.keys(traces)){
 context.op=op;vm.runInContext('renderTrace(op)',context);
 const click=action=>context.clickHandlers.click({target:{closest(selector){return selector==='[data-action]'?{dataset:{action},closest(){return {dataset:{operation:op}};}}:null;}}});
 assert(roots[op].querySelector('[data-action="back"]').disabled);
 for(let i=0;i<traces[op].steps.length+2;i++)click('forward');
 assert(roots[op].querySelector('[data-action="forward"]').disabled);
 assert.equal(traces[op].position,traces[op].steps.length-1);
 click('back');assert.equal(traces[op].position,traces[op].steps.length-2);
 click('reset');assert.equal(traces[op].position,0);
}
const direction={dataset:{direction:'reverse'},closest(){return roots.difference;},setAttribute(){}};roots.difference.directions=[direction];
context.clickHandlers.click({target:{closest(){return direction;}}});
assert.deepEqual(Array.from(vm.runInContext('traces.difference.steps.at(-1).result',context)),[5,6]);
assert.equal(vm.runInContext('traces.difference.position',context),0);
assert(roots.difference.querySelector('.code-content').innerHTML.includes('if not A.contains(x):'));
// Assert the visible source, decision, output delta, and exact highlighted code line.
function show(op,position){context.testOp=op;context.testPosition=position;vm.runInContext('traces[testOp].position=testPosition;renderTrace(testOp)',context);return roots[op];}
let root=show('union',1);
assert.equal(root.attrs['data-active-source'],'A');
assert(root.querySelector('[data-panel="A"]').className.includes('scanning'));
assert(root.querySelector('.output').innerHTML.includes('newly-inserted'));
assert(root.querySelector('.decision').innerHTML.includes('Insert 1 into C'));
assert(root.querySelectorAll('[data-line]')[2].classList.current);
root=show('union',5);
assert.equal(root.attrs['data-active-source'],'B');
assert(root.querySelector('[data-panel="B"]').className.includes('scanning'));
assert(!root.querySelector('[data-panel="A"]').className.includes('scanning'));
assert.equal(root.querySelector('.result-change').textContent,'No change');
assert(!root.querySelector('.output').innerHTML.includes('newly-inserted'));
assert(root.querySelector('.decision').innerHTML.includes('3 already exists'));
assert(root.querySelectorAll('[data-source]')[0].children.every(x=>x.className.includes('processed')));
assert(root.querySelectorAll('[data-line]')[4].classList.current);
assert.equal(root.querySelectorAll('[data-line]').filter(x=>x.classList.current).length,1);
root=show('union',0);
assert.equal(root.attrs['data-active-source'],'none');
assert(!root.querySelector('[data-panel="B"]').className.includes('scanning'));
assert(root.querySelectorAll('[data-source]').every(row=>row.children.every(x=>!x.className.includes('processed'))));
root=show('intersection',3);
assert(root.querySelector('[data-panel="B"]').className.includes('checking'));
assert(root.querySelectorAll('[data-source]')[1].children[0].className.includes('match'));
assert(root.querySelector('.decision').innerHTML.includes('belongs to both sets'));
root=show('complement',1);
assert.equal(root.attrs['data-active-source'],'U');
assert(root.querySelector('.output').innerHTML.includes('>1</span>'));
root=show('complement',2);
assert.equal(root.querySelector('.result-change').textContent,'No change');
assert(root.querySelectorAll('[data-source]')[1].children[0].className.includes('match'));
const complementOperand=slides[14].html.split('data-source="A"')[1].split('</div>')[0];
assert(complementOperand.includes('>2</span>') && !complementOperand.includes('>1</span>'));
assert(slides[16].html.includes('2  4  6'));
assert(slides[16].html.includes('{1, 3, 5, 7}'));
assert(slides[1].html.includes('Set operations are fundamental computational procedures'));
assert(slides[1].html.includes('A set stores unique elements only — duplicates are ignored.'));
const overviewCards=slides[1].html.split('<div class="cards overview-cards">')[1].split('<p class="overview-emphasis">')[0];
assert(!overviewCards.includes('<p'));
assert.equal((overviewCards.match(/class="symbol"/g)||[]).length,4);
const assets=['index.html','styles.css','script.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
assert(!/https?:\/\/|@import|fetch\(/.test(assets));
console.log('PASS: 20 slides, all results and iterations, reverse difference, paired operands, step forward/back/reset/bounds, direction reset, navigation keys/bounds/editable focus, source highlights, processed states, output deltas, exact pseudocode line, complement consistency, symbol-only overview, offline dependencies.');

vm.runInContext('globalThis.analysis=complexityTraces',context);
for(const [op,t] of Object.entries(context.analysis)){
 const last=t.steps.at(-1);
 assert.deepEqual(Array.from(last.result),Array.from(results[op]));
 assert.equal(last.insertions,op==='union'?8:4);
 assert.equal(last.checks,op==='union'?0:op==='complement'?8:4);
 assert.equal(last.accepted,op==='union'?6:op==='complement'?4:2);
 assert.equal(last.skipped,op==='complement'?4:2);
 assert.equal(last.processed,op==='complement'?12:8);
 for(const f of t.steps){assert.equal(f.result.length,f.accepted);assert.equal(f.processed,f.insertions+f.checks);}
}
assert.deepEqual(Array.from(slides.filter(s=>s.title.includes('Complexity Analysis')),s=>s.bookmark),[6,10,14,18]);
assert(!slides.some(s=>/Why Sets Matter|Set ADT/.test(s.title)));
console.log('PASS: complexity accounting, shared results, phase counts, and slide order.');
