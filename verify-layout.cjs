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
  assert.equal(await page.locator('.slide').count(),15);
  assert.equal(await page.locator('#index-links button').count(),15);
  assert.equal(await page.getByText('Sets as an Abstract Data Type',{exact:true}).count(),0);
  for(let i=0;i<15;i++) {
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
   if([7,10,13].includes(i)) {
    const root=page.locator('.slide:not([hidden]) [data-venn-operation]');
    const op=await root.getAttribute('data-venn-operation');
    for(const reverse of op==='difference'?[false,true,false,true]:[false]) {
     if(op==='difference')await root.locator('[data-venn-direction="'+(reverse?'reverse':'forward')+'"]').click();
     const symbol=op==='intersection'?'A ∩ B':op==='complement'?'Aᶜ = U − A':reverse?'B − A':'A − B';
     const result=op==='intersection'?'{3, 4}':op==='complement'?'{1, 3, 5, 7}':reverse?'{5, 6}':'{1, 2}';
     const selected=op==='intersection'?'1':op==='complement'?'0':reverse?'2':'0';
     async function state(step) {
      assert.equal(await root.locator('.step-count').textContent(),'Step '+step+' of 4');
      assert.equal(await root.locator('.union-venn-formula').textContent(),symbol+' = '+(step>=3?result:'∅'));
      assert.equal(await root.locator('[data-venn-action="back"]').isDisabled(),step===0);
      assert.equal(await root.locator('[data-venn-action="forward"]').isDisabled(),step===4);
      assert.equal(await root.locator('[data-venn-action="reset"]').isDisabled(),step===0);
      assert.deepEqual(await root.locator('.selected').evaluateAll(els=>els.map(el=>el.dataset.region)),step>=3?[selected]:[]);
      assert.equal(await root.locator('.inspecting').count(),step===1?(op==='intersection'?1:2):step===2?1:0);
      await check(page,width+'x'+height+' '+op+' reverse='+reverse+' step '+step);
     }
     await state(0);
     for(let step=1;step<=4;step++){await root.locator('[data-venn-action="forward"]').click();await state(step);}
     if(width===1280)await page.screenshot({path:path.join(process.env.TEMP,'venn-'+op+'-'+reverse+'.png')});
     await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>current),i+1);
     await page.keyboard.press('ArrowLeft');await state(4);
     for(let step=3;step>=0;step--){await root.locator('[data-venn-action="back"]').click();await state(step);}
     await root.locator('[data-venn-action="forward"]').click();await root.locator('[data-venn-action="reset"]').click();await state(0);
     if(op==='difference') {await root.locator('[data-venn-action="forward"]').click();await root.locator('[data-venn-direction="'+(reverse?'forward':'reverse')+'"]').click();assert.equal(await root.locator('.step-count').textContent(),'Step 0 of 4');}
    }
   }
   if(i===4) {
    const venn=page.locator('#slide-5 .union-venn-walkthrough');
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

   if(width===1280&&[0,1,2,5,11,13,14].includes(i))await page.screenshot({path:path.join(process.env.TEMP,`set-slide-${i+1}.png`)});
  }
  await page.evaluate(()=>navigate(2));await page.keyboard.press('ArrowRight');assert.match(page.url(),/#slide-4$/);
  await page.keyboard.press('ArrowLeft');assert.match(page.url(),/#slide-3$/);
  await page.evaluate(()=>location.hash='slide-4');await page.waitForFunction(()=>current===3);
  await page.evaluate(()=>location.hash='slide-15');await page.waitForFunction(()=>current===14);
  await page.reload();assert.equal(await page.evaluate(()=>current),14);
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
