// Rendered regression checks: NODE_PATH must provide Playwright; Microsoft Edge is used.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const url = pathToFileURL(path.join(__dirname, 'index.html')).href;
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const failures = []; let checks = 0;
 async function check(page,label) {
  const errors = await page.evaluate(() => {
   const errors = [], canvas = document.querySelector('.slide-canvas').getBoundingClientRect();
   const slide = document.querySelector('.slide:not([hidden])');
   const header = document.querySelector('.topbar').getBoundingClientRect();
   if(Math.abs(canvas.width/canvas.height - 16/9)>0.001)errors.push('aspect ratio');
   if(canvas.left < -1 || canvas.top < -1 || canvas.right > innerWidth+1 || canvas.bottom > innerHeight+1)errors.push('canvas outside viewport');
   for(const el of [document.documentElement, document.body, slide]) {
    if(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)errors.push('overflow '+el.tagName+'.'+el.className);
   }
   for(const el of slide.querySelectorAll('*')) {
    if(el.closest('svg'))continue;
    const r=el.getBoundingClientRect(); if(!r.width||!r.height)continue;
    if(r.left<canvas.left-1||r.right>canvas.right+1||r.top<header.bottom-1||r.bottom>canvas.bottom+1)errors.push(el.tagName+'.'+el.className+' outside canvas '+JSON.stringify({top:r.top,bottom:r.bottom,right:r.right}));
    if(el.clientWidth && el.scrollWidth>el.clientWidth+2)errors.push('inner width '+el.tagName+'.'+el.className);
   }
   return errors;
  });
  checks++; if(errors.length)failures.push({label,errors});
 }
 for(const [width,height] of [[1920,1080],[1366,768],[1280,720],[1440,900],[390,844],[844,390]]) {
  const mobile=width<900;
  const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>failures.push({label:'runtime',errors:[e.message]}));
  await page.goto(url);
  if(mobile) {
   assert(await page.locator('#mobile-prompt').isVisible());
   // Test real rejection path without claiming device API support.
   await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('denied'));});
   await page.locator('#start-presentation').click();
   if(height>width) {
    assert(await page.locator('#mobile-prompt').isVisible());
    assert.match(await page.locator('#presentation-status').textContent(),/denied/);
    await check(page,'portrait canvas');
    await page.screenshot({path:path.join(process.env.TEMP,'set-portrait.png')});
    await page.setViewportSize({width:844,height:390});
   }
   await page.waitForFunction(()=>document.getElementById('mobile-prompt').hidden);
  }
  assert.equal(await page.locator('.slide').count(),20);
  assert.equal(await page.locator('#index-links button').count(),20);
  assert.equal(await page.getByText('Sets as an Abstract Data Type',{exact:true}).count(),0);
  for(let i=0;i<20;i++) {
   await page.evaluate(i=>navigate(i),i);await check(page,`${width}x${height} slide ${i+1}`);
   const root=page.locator('.slide:not([hidden]) [data-operation]');
   if(await root.count()) {
    const op=await root.getAttribute('data-operation');
    for(const direction of op==='difference'?['forward','reverse']:['forward']) {
     if(op==='difference')await root.locator(`[data-direction="${direction}"]`).click();
     let n=0;
     while(await root.locator('[data-action="forward"]').isEnabled()) {
      await root.locator('[data-action="forward"]').click();
      await check(page,`${width}x${height} ${op} ${direction} step ${++n}`);
      assert.equal(await page.evaluate(()=>current),i);
     }
     if(width===1280||width===844)await page.screenshot({path:path.join(process.env.TEMP,`set-${width}-${op}-${direction}.png`)});
     await root.locator('[data-action="back"]').click();await root.locator('[data-action="reset"]').click();
     assert.match(await root.locator('.step-count').innerText(),/^Step 0/);
    }
   }
   const replay=page.locator('.slide:not([hidden]) [data-complexity]');
   if(await replay.count()) {
    const op=await replay.getAttribute('data-complexity');
    let step=0;
    do {
     await check(page,`${width} complexity ${op} step ${step}`);
     const snapshot=await page.evaluate(op=>{const t=complexityTraces[op];return t.steps[t.position]},op);
     assert.equal(await replay.locator('.output .cell').count(),snapshot.result.length);
     assert.equal(await replay.locator('.line.current').count(),1);
     assert.equal(await replay.locator('.line.current').getAttribute('data-line'),String(snapshot.line));
     assert.deepEqual(await replay.locator('.analysis-counters b').allTextContents(),[snapshot.processed,snapshot.insertions,...(op==='union'?[]:[snapshot.checks]),snapshot.accepted,snapshot.skipped].map(String));
     if(await replay.locator('[data-analysis-action="forward"]').isDisabled())break;
     await replay.locator('[data-analysis-action="forward"]').click();step++;
     assert.equal(await page.evaluate(()=>current),i);
    }while(step<20);
    if(width===1280)await page.screenshot({path:path.join(process.env.TEMP,`complexity-${op}.png`)});
    await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
    assert.match(await replay.locator('.step-count').textContent(),new RegExp(`Step ${step} of`));
    for(let n=step-1;n>=0;n--){await replay.locator('[data-analysis-action="back"]').click();await check(page,`${width} ${op} back ${n}`);}
    await replay.locator('[data-analysis-action="forward"]').click();await replay.locator('[data-analysis-action="reset"]').click();
    assert.equal(await replay.locator('.output .cell').count(),0);
   }
   if(i===4) {
    const venn=page.locator('.union-venn-walkthrough');
    async function vennState(step) {
     assert.equal(await venn.locator('.union-region.selected').count(),Math.min(step,3));
     assert.equal(await venn.locator('.current-values').count(),step>0&&step<4?1:0);
     assert.equal(await venn.locator('[data-venn-action="back"]').isDisabled(),step===0);
     assert.equal(await venn.locator('[data-venn-action="reset"]').isDisabled(),step===0);
     assert.equal(await venn.locator('[data-venn-action="forward"]').isDisabled(),step===4);
     assert.equal(await venn.locator('.step-count').textContent(),`Step ${step} of 4`);
     assert.equal(await venn.locator('.union-venn-formula').textContent(),['C = ∅','C = {1, 2}','C = {1, 2, 3, 4}','C = {1, 2, 3, 4, 5, 6}','A ∪ B = {1, 2, 3, 4, 5, 6}'][step]);
     assert.equal(await venn.locator('.union-venn-explanation strong').textContent(),['Initial · find A ∪ B','Step 1 — Set A','Step 2 — Common elements','Step 3 — Remaining elements of B','Step 4 — Union complete'][step]);
     assert.deepEqual(await venn.locator('.union-region-values>text:first-child').allTextContents(),['1, 2','3, 4','5, 6']);
     const opacity=await venn.locator('.union-region').evaluateAll(els=>els.map(el=>getComputedStyle(el).fillOpacity));
     assert.deepEqual(opacity,[0,1,2].map(n=>n<Math.min(step,3)?'1':'0'));
     assert.equal(await venn.locator('.union-venn-result').evaluate(el=>el.classList.contains('complete')),step===4);
     await check(page,`${width}x${height} union Venn step ${step}`);
    }
    async function action(name) {
     const button=venn.locator(`[data-venn-action="${name}"]`);
     if(mobile)await button.tap();else await button.click();
     await page.waitForTimeout(50);
     assert.equal(await page.evaluate(()=>current),4);
    }
    await vennState(0);
    for(let step=1;step<=4;step++) {
     await action('forward');await vennState(step);
     if(width===1280||width===844)await page.screenshot({path:path.join(process.env.TEMP,`set-union-venn-${width}-step-${step}.png`)});
    }
    await venn.locator('[data-venn-action="forward"]').dispatchEvent('click');await vennState(4);
    await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>current),5);
    await page.keyboard.press('ArrowLeft');await vennState(4);
    for(let step=3;step>=0;step--){await action('back');await vennState(step);}
    await action('forward');
    assert.equal(await venn.locator('.new-region').evaluate(el=>getComputedStyle(el).animationName),'none');
    await action('forward');await action('reset');await vennState(0);
    await venn.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:1,clientX:500,clientY:200});
    await venn.dispatchEvent('pointerup',{pointerType:'touch',pointerId:1,clientX:400,clientY:200});
    assert.equal(await page.evaluate(()=>current),4);await vennState(0);
    await page.locator('#next').click();assert.equal(await page.evaluate(()=>current),5);
    await page.locator('#previous').click();await vennState(0);
   }

   if(width===1280&&[0,1,2,5,15,16,17].includes(i))await page.screenshot({path:path.join(process.env.TEMP,`set-slide-${i+1}.png`)});
  }
  await page.evaluate(()=>navigate(2));await page.keyboard.press('ArrowRight');assert.match(page.url(),/#slide-4$/);
  await page.keyboard.press('ArrowLeft');assert.match(page.url(),/#slide-3$/);
  await page.evaluate(()=>location.hash='slide-4');await page.waitForFunction(()=>current===3);
  await page.evaluate(()=>location.hash='slide-20');await page.waitForFunction(()=>current===19);
  await page.reload();assert.equal(await page.evaluate(()=>current),19);
  if(mobile){await page.locator('#continue-presentation').click();}
  await page.locator('#contents').click();
  assert(await page.locator('#index-dialog').evaluate(el=>el.scrollHeight<=el.clientHeight+1));
  await page.locator('[data-slide="2"]').click();assert.match(page.url(),/#slide-3$/);
  if(!mobile) {
   await page.locator('#fullscreen').click();assert(await page.evaluate(()=>!!document.fullscreenElement));
   await check(page,`${width} fullscreen`);await page.locator('#fullscreen').click();assert(!await page.evaluate(()=>!!document.fullscreenElement));
  } else {
   await page.evaluate(()=>navigate(1));
   const slide=page.locator('.slide:not([hidden])');
   await slide.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:1,clientX:500,clientY:200});
   await slide.dispatchEvent('pointerup',{pointerType:'touch',pointerId:1,clientX:400,clientY:200});
   assert.equal(await page.evaluate(()=>current),2);
   await page.evaluate(()=>navigate(3));
   const widget=page.locator('.slide:not([hidden]) .walkthrough');
   await widget.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:1,clientX:500,clientY:200});
   await widget.dispatchEvent('pointerup',{pointerType:'touch',pointerId:1,clientX:400,clientY:200});
   assert.equal(await page.evaluate(()=>current),3);
  }
  await context.close();
 }
 // Mock API contracts separately from real browser support.
 const apiContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const apiPage=await apiContext.newPage();
 await apiPage.addInitScript(()=>{
  window.apiCalls=[];let active=null;
  Object.defineProperty(document,'fullscreenElement',{get:()=>active});
  Element.prototype.requestFullscreen=async()=>{apiCalls.push('fullscreen');active=document.documentElement;document.dispatchEvent(new Event('fullscreenchange'));};
  document.exitFullscreen=async()=>{active=null;document.dispatchEvent(new Event('fullscreenchange'));};
  Object.defineProperty(screen.orientation,'lock',{value:async mode=>{apiCalls.push(mode);},configurable:true});
  Object.defineProperty(screen.orientation,'unlock',{value:()=>apiCalls.push('unlock'),configurable:true});
 });
 await apiPage.goto(url);assert.deepEqual(await apiPage.evaluate(()=>apiCalls),[]);
 await apiPage.locator('#start-presentation').tap();
 await apiPage.waitForFunction(()=>apiCalls.length===2);
 assert.deepEqual(await apiPage.evaluate(()=>apiCalls),['fullscreen','landscape']);
 await apiPage.evaluate(()=>document.exitFullscreen());
 assert.deepEqual(await apiPage.evaluate(()=>apiCalls),['fullscreen','landscape','unlock']);
 await apiPage.evaluate(()=>{document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined;Object.defineProperty(screen.orientation,'lock',{value:undefined});});
 await apiPage.locator('#start-presentation').tap();
 await apiPage.waitForFunction(()=>document.getElementById('presentation-status').textContent.includes('Fullscreen is unavailable'));
 assert.match(await apiPage.locator('#presentation-status').textContent(),/Fullscreen is unavailable/);
 assert.match(await apiPage.locator('#presentation-status').textContent(),/landscape lock is unsupported/);
 await apiContext.close();
 console.log(JSON.stringify({checks,failures},null,2));await browser.close();if(failures.length)process.exitCode=1;
})();
