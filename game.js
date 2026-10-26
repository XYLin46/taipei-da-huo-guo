'use strict';
const canvas=document.querySelector('#pot'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id), TOTAL=70;
let mode='canvas',threeView=null,loadingThree=false;
const DIFFICULTIES={
  easy:{label:'輕鬆',mergeRange:1.2,splitSpeed:2.5,minSplitMass:3,splitCooldown:.65},
  hard:{label:'挑戰',mergeRange:1.05,splitSpeed:1.6,minSplitMass:3,splitCooldown:.55}
};
let difficulty='easy',dragSpeed=0;
function settings(){return DIFFICULTIES[difficulty]}
function recordKey(){return difficulty==='easy'?'taipei-hotpot-best':'taipei-hotpot-best-hard'}
function difficultyNote(){return difficulty==='hard'?'挑戰：輕推即合，快拉易散':'輕鬆：原本手感，自在聚油'}
function chooseDifficulty(next){
  if(next===difficulty)return;
  const restart=running;
  difficulty=next;drag=null;pt=null;dragSpeed=0;
  $('difficulty-easy').setAttribute('aria-pressed',String(next==='easy'));
  $('difficulty-hard').setAttribute('aria-pressed',String(next==='hard'));
  $('difficulty-note').textContent=difficultyNote();
  if(restart){start();$('hint').textContent='已切換'+settings().label+'難度，重新開鍋！'}
}
$('difficulty-easy').onclick=()=>chooseDifficulty('easy');
$('difficulty-hard').onclick=()=>chooseDifficulty('hard');
let w,h,cx,cy,r,drops=[],running=false,left=20,last=0,drag=null,pt=null,splits=0,muted=true,audio;
const mask=document.createElement('canvas'),mc=mask.getContext('2d');
const decor=Array.from({length:55},()=>({a:Math.random()*Math.PI*2,d:Math.sqrt(Math.random())*.91,s:Math.random(),t:Math.random()*10}));
function resize(){const d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);cx=w<700?w*.5:w*.66;cy=h*(w<700?.43:.53);r=Math.min(w*(w<700?.43:.31),h*.38);mask.width=480;mask.height=480;if(threeView)threeView.resize(w,h,cx,cy,r);}
function seed(){drops=Array.from({length:TOTAL},()=>{const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*.83;return{x:Math.cos(a)*d,y:Math.sin(a)*d,vx:0,vy:0,m:1,phase:Math.random()*6.28,cool:0}});}
function best(){try{return Number(localStorage.getItem(recordKey()))||0}catch{return 0}}
function score(){return Math.round(Math.max(...drops.map(d=>d.m))/TOTAL*100)}
function start(){seed();running=true;left=20;splits=0;drag=null;pt=null;dragSpeed=0;$('difficulty-note').textContent=difficultyNote();$('intro').hidden=true;$('result').hidden=true;$('hud').hidden=false;$('reset').hidden=false;$('hint').textContent='按住一片紅油，慢慢靠近另一片。';tone(330);}
function finish(){running=false;drag=null;$('difficulty-note').textContent=difficultyNote();const s=score(),b=Math.max(best(),s);try{localStorage.setItem(recordKey(),b)}catch{}$('hud').hidden=true;$('result').hidden=false;$('final').textContent=s+'%';$('grade').textContent=s>=80?'紅油大師':s>=45?'好一鍋人情味':s>=20?'漸入佳境':'小火慢聚';$('summary').textContent=`${settings().label}模式 · 聚成 ${drops.length} 片紅油，分裂 ${splits} 次。`;$('record').textContent=`${settings().label}最佳 ${b}% · 慢一點，下鍋更有把握。`;tone(440);}
function tone(freq){if(muted)return;try{audio ||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.start();o.stop(audio.currentTime+.23)}catch{}}
function radius(d){return .043*Math.sqrt(d.m)}
function update(dt,t){dragSpeed*=Math.exp(-10*dt);for(const d of drops){d.cool=Math.max(0,d.cool-dt);if(d!==drag){d.vx+=Math.sin(t*.6+d.phase)*.004*dt;d.vy+=Math.cos(t*.5+d.phase)*.004*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=Math.exp(-2*dt);d.vy*=Math.exp(-2*dt)}const len=Math.hypot(d.x,d.y),limit=.94-radius(d);if(len>limit){d.x*=limit/len;d.y*=limit/len;d.vx*=-.3;d.vy*=-.3}}
if(!running)return;
for(let i=0;i<drops.length;i++)for(let j=i+1;j<drops.length;j++){
  const a=drops[i],b=drops[j];
  const touching=Math.hypot(a.x-b.x,a.y-b.y)<(radius(a)+radius(b))*settings().mergeRange;
  if(a.cool||b.cool||!touching)continue;
  // Contact merges immediately at a controlled speed, without a dwell timer.
  if(difficulty==='hard'&&(!(a===drag||b===drag)||dragSpeed>1.3))continue;
  const m=a.m+b.m;a.x=(a.x*a.m+b.x*b.m)/m;a.y=(a.y*a.m+b.y*b.m)/m;a.m=m;
  if(drag===b)drag=a;
  if(difficulty==='hard')a.cool=.08;
  drops.splice(j--,1);tone(180+Math.min(m,50)*8);
}
left=Math.max(0,left-dt);$('time').textContent=left.toFixed(1);$('score').textContent=score()+'%';if(left<=0||drops.length===1)finish();}
function circle(x,y,rad,fill){ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill()}
function draw(t){ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);ctx.scale(r,r);
ctx.shadowColor='#000a';ctx.shadowBlur=40;ctx.shadowOffsetY=20;circle(0,0,1.12,'#101211');ctx.shadowBlur=0;ctx.shadowOffsetY=0;
for(const side of[-1,1]){ctx.strokeStyle='#706953';ctx.lineWidth=.055;ctx.beginPath();ctx.ellipse(side*1.11,0,.18,.28,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#252823';ctx.lineWidth=.025;ctx.stroke()}
let rim=ctx.createLinearGradient(-1,-1,1,1);rim.addColorStop(0,'#bbb59c');rim.addColorStop(.23,'#4b4d43');rim.addColorStop(.55,'#99927a');rim.addColorStop(1,'#292d27');circle(0,0,1.075,rim);circle(0,0,1.01,'#161d18');let soup=ctx.createRadialGradient(-.3,-.4,.1,0,0,1);soup.addColorStop(0,'#d9a653');soup.addColorStop(.65,'#b8732f');soup.addColorStop(1,'#623c20');circle(0,0,.98,soup);
ctx.save();ctx.beginPath();ctx.arc(0,0,.97,0,6.29);ctx.clip();
for(const a of decor){const x=Math.cos(a.a)*a.d,y=Math.sin(a.a)*a.d;ctx.save();ctx.translate(x,y);ctx.rotate(a.a);if(a.s<.25){ctx.fillStyle='#4d5933';ctx.fillRect(-.025,-.035,.05,.10);ctx.fillStyle='#9aab56';ctx.fillRect(-.02,-.03,.016,.09)}else if(a.s<.55){ctx.fillStyle='#722a17';ctx.beginPath();ctx.ellipse(0,0,.055,.016,.3,0,7);ctx.fill()}else{circle(0,0,.006,'#ead294')}ctx.restore()}
// Blur and alpha threshold create a continuous, liquid-like oil surface.
mc.clearRect(0,0,480,480);mc.save();mc.filter='blur(7px)';mc.fillStyle='#e73b0c';for(const d of drops){mc.beginPath();mc.arc(240+d.x*230,240+d.y*230,radius(d)*230,0,7);mc.fill()}mc.restore();let im=mc.getImageData(0,0,480,480),data=im.data;for(let i=3;i<data.length;i+=4){const a=data[i];data[i]=a>85?Math.min(238,(a-85)*12):0;if(a>85){data[i-3]=173+Math.min(43,(a-85)*.3);data[i-2]=36+Math.min(16,(a-85)*.1);data[i-1]=8}}mc.putImageData(im,0,0);ctx.drawImage(mask,-240/230,-240/230,480/230,480/230);
for(const d of drops){ctx.strokeStyle='#ffb53b60';ctx.lineWidth=.004;ctx.beginPath();const rr=radius(d)*.6;ctx.ellipse(d.x-rr*.15,d.y-rr*.3,rr*.65,rr*.22,-.5,Math.PI,Math.PI*1.8);ctx.stroke()}
for(let i=0;i<15;i++){const a=decor[i],p=(t*.23+a.t)%1,x=Math.cos(a.a)*a.d,y=Math.sin(a.a)*a.d;ctx.strokeStyle=`rgba(255,220,145,${(1-p)*.3})`;ctx.lineWidth=.002;ctx.beginPath();ctx.arc(x,y,.004+p*.018,0,7);ctx.stroke()}
ctx.restore();ctx.strokeStyle='#e3d3a02b';ctx.lineWidth=.006;ctx.beginPath();ctx.arc(0,0,1.04,0,7);ctx.stroke();
// Chopsticks rest across the rim.
for(let i=0;i<2;i++){ctx.save();ctx.translate(.65+i*.075,-.62);ctx.rotate(.48);let g=ctx.createLinearGradient(0,0,.035,0);g.addColorStop(0,'#111510');g.addColorStop(.5,'#4b4c3d');g.addColorStop(1,'#141711');ctx.fillStyle=g;ctx.fillRect(0,-.93,.027,1.5);ctx.fillStyle='#c2a66a';ctx.fillRect(0,-.76,.027,.009);ctx.restore()}
ctx.restore();}
function position(e){if(mode==='three')return threeView.position(e);return{x:(e.clientX-cx)/r,y:(e.clientY-cy)/r,t:performance.now()}}
for(const surface of [canvas,$('pot-three')]){
surface.addEventListener('pointerdown',e=>{if(!running)return;const p=position(e);if(!p)return;drag=drops.filter(d=>Math.hypot(p.x-d.x,p.y-d.y)<radius(d)+.055).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0]||null;pt=p;dragSpeed=0;if(drag)surface.setPointerCapture(e.pointerId)});
surface.addEventListener('pointermove',e=>{
  if(!drag||!running)return;const p=position(e);if(!p)return;
  const dt=Math.max(.016,(p.t-pt.t)/1000),dx=p.x-pt.x,dy=p.y-pt.y,speed=Math.hypot(dx,dy)/dt;
  dragSpeed=speed;drag.x=p.x;drag.y=p.y;
  const rules=settings();
  if(speed>rules.splitSpeed&&drag.m>=rules.minSplitMass&&drag.cool<=0){
    const m=Math.floor(drag.m/2);drag.m-=m;drag.cool=rules.splitCooldown;
    let x=p.x-.09,y=p.y+.08,vx=-.12,vy=.10;
    if(difficulty==='hard'){
      const length=Math.hypot(dx,dy)||1,nx=dx/length,ny=dy/length;
      const separation=(radius(drag)+.043*Math.sqrt(m))*1.5;
      x=p.x-nx*separation;y=p.y-ny*separation;vx=-nx*.35;vy=-ny*.35;
    }
    drops.push({x,y,vx,vy,m,phase:Math.random()*6,cool:rules.splitCooldown});
    splits++;$('hint').textContent='紅油散開了，手再慢一點。';tone(110);
  }else if(speed<(difficulty==='hard'?1.3:1.5))$('hint').textContent='就是這個步調，慢慢聚。';
  pt=p;
});
function release(){drag=null;pt=null;dragSpeed=0}surface.addEventListener('pointerup',release);surface.addEventListener('pointercancel',release);}
$('start').onclick=start;$('again').onclick=start;$('reset').onclick=start;$('sound').onclick=()=>{muted=!muted;$('sound').textContent='音效 '+(muted?'關':'開');$('sound').setAttribute('aria-pressed',String(!muted));tone(330)};
async function switchMode(next){
  if(loadingThree||next===mode)return;
  if(next==='three'&&!threeView){
    loadingThree=true;$('use-three').disabled=true;$('render-status').textContent='載入立體鍋…';
    try{
      const {createThreeView}=await import('./three-view.js');
      threeView=createThreeView($('pot-three'),decor);threeView.resize(w,h,cx,cy,r);
      // Render once before hiding the working Canvas view.
      threeView.draw(drops,performance.now()/1000);
    }catch(error){
      console.error('Three.js unavailable:',error);threeView=null;
      $('render-status').textContent='3D 無法啟用，請使用 Canvas';
      loadingThree=false;$('use-three').disabled=false;return;
    }
    loadingThree=false;$('use-three').disabled=false;
  }
  drag=null;pt=null;mode=next;canvas.hidden=mode!=='canvas';$('pot-three').hidden=mode!=='three';
  $('use-canvas').setAttribute('aria-pressed',String(mode==='canvas'));
  $('use-three').setAttribute('aria-pressed',String(mode==='three'));
  $('render-status').textContent=mode==='three'?'立體光影':'平面手繪';
}
$('use-canvas').onclick=()=>switchMode('canvas');$('use-three').onclick=()=>switchMode('three');
document.addEventListener('visibilitychange',()=>{last=0});window.addEventListener('resize',resize);resize();seed();function frame(ts){const dt=last?Math.min((ts-last)/1000,.05):0;last=ts;update(dt,ts/1000);if(mode==='three')threeView.draw(drops,ts/1000);else draw(ts/1000);requestAnimationFrame(frame)}requestAnimationFrame(frame);
if(new URLSearchParams(location.search).get('renderer')==='three')switchMode('three');

