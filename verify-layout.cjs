// Optional rendered checks: requires Playwright and Microsoft Edge.
const { chromium } = require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.join(__dirname,'index.html')).href;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'});
 const failures=[];let checks=0;
 async function check(label){
  const errors=await page.evaluate(()=>{
   const out=[],s=document.querySelector('.slide:not([hidden])'),h=document.querySelector('.topbar').getBoundingClientRect();
   for(const el of [document.documentElement,document.body,s])if(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)out.push('overflow '+el.tagName+' '+el.className+' '+el.scrollHeight+'/'+el.clientHeight);
   for(const el of s.querySelectorAll('*')){
    if(el.closest('svg'))continue;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
    if(r.left<0||r.right>innerWidth+1||r.top<h.bottom-1||r.bottom>innerHeight+1)out.push(el.tagName+'.'+el.className+' outside '+JSON.stringify({top:r.top,bottom:r.bottom,right:r.right}));
    if(el.scrollWidth>el.clientWidth+2&&el.clientWidth>0)out.push('inner width '+el.tagName+'.'+el.className);
   }
   return out;
  });checks++;if(errors.length)failures.push({label,errors});
 }
 for(const [width,height] of [[1920,1080],[1366,768],[1280,720],[1100,650]]){
  await page.setViewportSize({width,height});await page.goto(url);
  assert.equal(await page.locator('footer').count(),0);
  for(let i=1;i<=19;i++){
   await page.evaluate(i=>navigate(i-1),i);await check(`${width}x${height} slide ${i}`);
   const root=page.locator('.slide:not([hidden]) [data-operation]');
   if(await root.count()){
    const operation=await root.getAttribute('data-operation');
    for(const direction of operation==='difference'?['forward','reverse']:['forward']){
     if(operation==='difference')await root.locator(`[data-direction="${direction}"]`).click();
     let n=0;
     while(await root.locator('[data-action="forward"]').isEnabled()){
      await root.locator('[data-action="forward"]').click();await check(`${width}x${height} ${operation} ${direction} step ${++n}`);
     }
     await root.locator('[data-action="back"]').click();await check('back');await root.locator('[data-action="reset"]').click();
     assert.match(await root.locator('.step-count').innerText(),/^Step 0/);
    }
    if(width===1280)await page.screenshot({path:`${process.env.TEMP}/set-${operation}.png`});
   }
   if(i===3){for(let n=0;n<2;n++){await page.locator('#motivation-next').click();await check(`${width} motivation ${n+1}`);}if(width===1280)await page.screenshot({path:`${process.env.TEMP}/set-motivation.png`});}
   if(width===1280&&[4,17,18,19].includes(i))await page.screenshot({path:`${process.env.TEMP}/set-slide-${i}.png`});
  }
  await page.locator('#contents').click();await page.screenshot({path:`${process.env.TEMP}/set-contents-${width}.png`});
  assert.equal(await page.locator('#index-links button').count(),19);
  await page.locator('[data-slide="2"]').click();assert.match(page.url(),/#slide-3$/);
  await page.keyboard.press('ArrowRight');assert.match(page.url(),/#slide-4$/);
  await page.keyboard.press('ArrowLeft');assert.match(page.url(),/#slide-3$/);
  await page.reload();assert.equal(await page.locator('.slide:not([hidden])').getAttribute('id'),'slide-3');
  for(const tag of ['input','textarea','div']){
   await page.evaluate(tag=>{const el=document.createElement(tag);el.id='typing-check';if(tag==='div')el.contentEditable='true';document.querySelector('.slide:not([hidden])').append(el);el.focus();},tag);
   await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');assert.match(page.url(),/#slide-3$/);
   await page.locator('#typing-check').evaluate(el=>el.remove());
  }
  await page.locator('#fullscreen').click();
  assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
  for(let i=1;i<=19;i++){await page.evaluate(i=>navigate(i-1),i);await check(`${width} fullscreen slide ${i}`);}
  await page.locator('#fullscreen').click();assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
  await check(`${width} fullscreen exit`);

 }
 console.log(JSON.stringify({checks,failures},null,2));await browser.close();
 if(failures.length)process.exitCode=1;
})();
