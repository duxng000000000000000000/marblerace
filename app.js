(() => {
'use strict';
const M=window.Matter;
const $=s=>document.querySelector(s);
const canvas=$('#raceCanvas');
const ctx=canvas.getContext('2d');
const W=900,H=1200,FINISH_Y=1125,STORE='marbleRaceTournament.v1';
const COLORS=['#ff405b','#ff8d3b','#ffd52f','#9eea31','#22d7d0','#39d9ff','#8a5cff','#ff4dcc','#6f7cff','#53ef86','#d8d34a','#c18bff','#ff79a8','#67b6ff','#f1a44c'];
const KEEP=[12,9,6,3,2,1];
const MAPS=[
 {name:'PINBALL FIELD',desc:'A crowded bumper field with a spinning paddle.',sky:'#77d8f6',accent:'#ffd15a',walls:[[90,180,330,280,28],[810,180,570,280,28],[330,280,250,430,25],[570,280,650,430,25],[140,560,350,680,24],[760,560,550,680,24],[350,880,180,1000,24],[550,880,720,1000,24]],pegs:[[260,240],[420,300],[580,240],[180,400],[350,450],[550,430],[720,400],[260,620],[450,600],[640,620],[180,800],[360,820],[540,820],[720,800],[270,980],[450,950],[630,980]],moving:[{kind:'spin',x:450,y:740,len:250,thick:22,speed:1.05,angle:0,color:'#ffd15a'}],belts:[],resets:[[65,510],[835,850]]},
 {name:'ROTOR HALL',desc:'Three rotating sweepers guard the drop.',sky:'#a6b9ed',accent:'#ff9b52',walls:[[90,160,350,250,26],[810,160,550,250,26],[110,480,340,580,24],[790,480,560,580,24],[100,820,330,900,24],[800,820,570,900,24]],pegs:[[210,320],[690,320],[250,700],[650,700]],moving:[{kind:'spin',x:450,y:320,len:420,thick:24,speed:1.15,angle:0,color:'#ff9b52'},{kind:'spin',x:450,y:620,len:360,thick:24,speed:-1.35,angle:.6,color:'#ffd15a'},{kind:'spin',x:450,y:900,len:420,thick:22,speed:1.65,angle:0,color:'#ff9b52'}],belts:[],resets:[[65,720],[835,480]]},
 {name:'SLIDING GATES',desc:'Moving doors keep opening and closing the gaps.',sky:'#81d6cb',accent:'#5cfff0',walls:[[85,210,255,315,25],[815,210,645,315,25],[100,520,285,600,24],[800,520,615,600,24],[90,820,260,920,25],[810,820,640,920,25]],pegs:[[450,260],[450,530],[450,810]],moving:[{kind:'slide',x:300,y:375,len:300,thick:26,amp:105,speed:1.15,phase:0,color:'#5cfff0'},{kind:'slide',x:600,y:650,len:300,thick:26,amp:105,speed:1.35,phase:2,color:'#5cfff0'},{kind:'slide',x:300,y:950,len:300,thick:26,amp:105,speed:1.5,phase:1,color:'#5cfff0'}],belts:[],resets:[[65,650],[835,350]]},
 {name:'CONVEYOR FACTORY',desc:'Conveyor belts pull marbles sideways while rollers spin.',sky:'#e2bd83',accent:'#ff8c42',walls:[[100,170,320,250,25],[800,170,580,250,25],[100,470,310,560,24],[800,470,590,560,24],[100,780,320,860,24],[800,780,580,860,24]],pegs:[[450,320],[220,650],[680,650],[450,940]],moving:[{kind:'spin',x:450,y:500,len:210,thick:24,speed:1.4,color:'#ff8c42'},{kind:'slide',x:450,y:820,len:320,thick:22,amp:120,speed:1.1,phase:1,color:'#ffd15a'}],belts:[{x:160,y:330,w:580,h:52,force:.0018,dir:1},{x:160,y:690,w:580,h:52,force:.002,dir:-1},{x:160,y:1010,w:580,h:48,force:.0017,dir:1}],resets:[[65,900],[835,550]]},
 {name:'PENDULUM PANIC',desc:'Swinging hammers sweep across the track.',sky:'#c7a4e6',accent:'#ffe16b',walls:[[80,200,280,315,24],[820,200,620,315,24],[90,520,300,620,24],[810,520,600,620,24],[100,850,310,930,24],[800,850,590,930,24]],pegs:[[450,260],[210,700],[690,700],[450,1000]],moving:[{kind:'swing',x:450,y:390,len:300,thick:25,amp:1.05,speed:1.35,phase:0,color:'#ffe16b'},{kind:'swing',x:450,y:700,len:330,thick:25,amp:1.12,speed:1.6,phase:2,color:'#ff9c68'},{kind:'swing',x:450,y:960,len:280,thick:24,amp:1.0,speed:1.9,phase:4,color:'#ffe16b'}],belts:[],resets:[[65,560],[835,850]]},
 {name:'FINAL VORTEX',desc:'The final gauntlet: fast rotors, shifting bumpers and a narrow finish.',sky:'#273d78',accent:'#ff61d2',walls:[[75,190,300,290,25],[825,190,600,290,25],[75,500,295,590,24],[825,500,605,590,24],[100,820,330,900,24],[800,820,570,900,24]],pegs:[[210,330],[690,330],[450,570],[210,780],[690,780],[450,980]],moving:[{kind:'spin',x:450,y:360,len:390,thick:24,speed:1.65,angle:0,color:'#ff61d2'},{kind:'spin',x:450,y:700,len:340,thick:24,speed:-2.0,angle:.5,color:'#48e9ff'},{kind:'swing',x:450,y:930,len:360,thick:24,amp:1.2,speed:2.0,phase:1,color:'#ff61d2'},{kind:'slide',x:450,y:1040,len:260,thick:20,amp:135,speed:1.8,phase:2,color:'#ffd15a'}],belts:[{x:170,y:590,w:560,h:45,force:.0022,dir:-1}],resets:[[65,740],[835,460]]}
];
let data={racers:Array.from({length:15},(_,i)=>({name:'Racer '+(i+1),image:null,color:COLORS[i]})),savedWalls:{}};
let engine=null,bodies=[],dynamicBodies=[],finishers=[],participants=[],activeMap=null;
let stageIndex=0,running=false,editorOpen=false,dragStart=null,mouse={x:0,y:0},selectedImage=0;
let lastFrame=0,raceStart=0,stageTimer=0,stageFinishing=false,stageTimeout=52000;
function safeLoad(){
 try{
  const raw=localStorage.getItem(STORE)||localStorage.getItem('marbleRace2D.final')||localStorage.getItem('marbleRace2D.v4');
  if(raw){const s=JSON.parse(raw);if(Array.isArray(s.racers))data.racers=s.racers.slice(0,15).map((r,i)=>({name:r.name||'Racer '+(i+1),image:r.image||null,color:r.color||COLORS[i]}));if(s.savedWalls){data.savedWalls=s.savedWalls;for(const k of Object.keys(data.savedWalls)){data.savedWalls[k]=(data.savedWalls[k]||[]).map(w=>Array.isArray(w)?w:[w.x1,w.y1,w.x2,w.y2,w.w||24])}}if(s.map?.walls)data.savedWalls[1]=s.map.walls.map(w=>Array.isArray(w)?w:[w.x1,w.y1,w.x2,w.y2,w.w||24]);if(s.walls)data.savedWalls[1]=s.walls.map(w=>Array.isArray(w)?w:[w.x1,w.y1,w.x2,w.y2,w.w||24]);}
 }catch(e){console.warn('Could not load saved racers',e)}
 while(data.racers.length<15){const i=data.racers.length;data.racers.push({name:'Racer '+(i+1),image:null,color:COLORS[i]})}
}
function save(){try{localStorage.setItem(STORE,JSON.stringify(data))}catch(e){alert('Storage is full. Try using smaller pictures.')}} 
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderRacers(){
 const grid=$('#racerGrid');
 grid.innerHTML=data.racers.map((r,i)=>'<div class="racer-card"><button class="racer-avatar" data-image="'+i+'" aria-label="Change image">'+(r.image?'<img src="'+r.image+'">':'<span class="marble-preview" style="--marble-color:'+r.color+'"></span>')+'</button><div class="racer-name-wrap"><small>MARBLE '+String(i+1).padStart(2,'0')+'</small><input class="racer-name" maxlength="22" data-name="'+i+'" value="'+escapeHtml(r.name)+'"></div></div>').join('');
 grid.querySelectorAll('[data-name]').forEach(el=>el.addEventListener('input',()=>{data.racers[+el.dataset.name].name=el.value||'Racer '+(+el.dataset.name+1);save()}));
 grid.querySelectorAll('[data-image]').forEach(el=>el.addEventListener('click',()=>{selectedImage=+el.dataset.image;$('#imagePicker').click()}));
}
function compressImage(file,done){
 const reader=new FileReader();
 reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),max=240,scale=Math.min(1,max/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);done(c.toDataURL('image/jpeg',.82))};img.onerror=()=>done(reader.result);img.src=reader.result};
 reader.readAsDataURL(file);
}
$('#imagePicker').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;compressImage(file,src=>{data.racers[selectedImage].image=src;renderRacers();save()});e.target.value=''});
$('#resetPlayers').addEventListener('click',()=>{if(!confirm('Reset all names and pictures?'))return;data.racers.forEach((r,i)=>{r.name='Racer '+(i+1);r.image=null});save();renderRacers()});
function makeWallBodies(walls){
 const out=[];
 for(const w of walls){const dx=w[2]-w[0],dy=w[3]-w[1],len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);const b=M.Bodies.rectangle((w[0]+w[2])/2,(w[1]+w[3])/2,len,w[4]||25,{isStatic:true,angle,restitution:.45,friction:.03});M.Composite.add(engine.world,b);out.push(b)}
 return out;
}
function currentMap(){const d=MAPS[stageIndex];return {...d,walls:data.savedWalls[stageIndex+1]||d.walls}}
function buildWorld(){
 if(engine)M.Engine.clear(engine);
 engine=M.Engine.create({enableSleeping:false});engine.gravity.y=1.05;
 bodies=[];dynamicBodies=[];activeMap=currentMap();
 M.Composite.add(engine.world,[M.Bodies.rectangle(-18,H/2,36,H+300,{isStatic:true}),M.Bodies.rectangle(W+18,H/2,36,H+300,{isStatic:true}),M.Bodies.rectangle(W/2,H+145,W,35,{isStatic:true})]);
 makeWallBodies(activeMap.walls);
 for(const [x,y] of activeMap.pegs){const b=M.Bodies.circle(x,y,18,{isStatic:true,restitution:.9,friction:.01});M.Composite.add(engine.world,b)}
 for(const d of activeMap.moving){
  const b=M.Bodies.rectangle(d.x,d.y,d.len,d.thick,{isStatic:true,angle:d.angle||0,restitution:.8,friction:.01});
  M.Composite.add(engine.world,b);dynamicBodies.push({body:b,def:d});
 }
 const count=participants.length;
 const spawnXs=Array.from({length:count},(_,i)=>count===1?450:105+i*(690/(count-1)));
 participants.forEach((r,i)=>{
  const b=M.Bodies.circle(spawnXs[i],66,16,{density:.002,restitution:.48,friction:.012,frictionAir:.0016});
  b.plugin={racer:r,finished:false,resetUntil:0,progress:66};
  bodies.push(b);M.Composite.add(engine.world,b);
 });
}
function updateMoving(time){
 for(const item of dynamicBodies){
  const d=item.def,b=item.body;let x=d.x,y=d.y,a=d.angle||0;
  if(d.kind==='spin')a+=time*d.speed;
  if(d.kind==='swing')a+=Math.sin(time*d.speed+(d.phase||0))*d.amp;
  if(d.kind==='slide')x+=Math.sin(time*d.speed+(d.phase||0))*d.amp;
  if(d.kind==='bob')y+=Math.sin(time*d.speed+(d.phase||0))*d.amp;
  M.Body.setPosition(b,{x,y});M.Body.setAngle(b,a);
 }
}
function resetMarble(body){
 const x=120+Math.random()*660;
 M.Body.setPosition(body,{x,y:48});
 M.Body.setVelocity(body,{x:(Math.random()-.5)*1.5,y:0});
 M.Body.setAngularVelocity(body,0);
 body.plugin.resetUntil=performance.now()+1800;
}
function applyBelts(){
 for(const b of bodies){if(b.plugin.finished)continue;const p=b.position;
  for(const z of activeMap.belts){if(p.x>z.x&&p.x<z.x+z.w&&p.y>z.y&&p.y<z.y+z.h){M.Body.applyForce(b,p,{x:z.force*z.dir,y:0})}}
 }
}
function paintMap(){
 const d=activeMap||MAPS[stageIndex];
 ctx.fillStyle=d.sky;ctx.fillRect(0,0,W,H);
 ctx.globalAlpha=.16;ctx.fillStyle='#fff';for(let i=0;i<8;i++){ctx.beginPath();ctx.arc((i*137+47)%900,140+(i%3)*330,34+(i%3)*9,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 // background grid/texture
 ctx.strokeStyle='#ffffff22';ctx.lineWidth=1;for(let y=100;y<H;y+=100){ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(865,y);ctx.stroke()}
 // walls
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const w of d.walls){ctx.strokeStyle='#101820';ctx.lineWidth=w[4]||25;ctx.beginPath();ctx.moveTo(w[0],w[1]);ctx.lineTo(w[2],w[3]);ctx.stroke();ctx.strokeStyle='#ffffff35';ctx.lineWidth=3;ctx.stroke()}
 // bumpers
 for(const [x,y] of d.pegs){ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fillStyle=d.accent;ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#fff9';ctx.stroke();ctx.beginPath();ctx.arc(x-5,y-6,5,0,Math.PI*2);ctx.fillStyle='#fff9';ctx.fill()}
 // moving components
 for(const item of dynamicBodies){const p=item.body.position,bb=item.body.bounds,def=item.def;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(item.body.angle);
  ctx.fillStyle=def.color||d.accent;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-def.len/2,-def.thick/2,def.len,def.thick,def.thick/2);ctx.fill();ctx.stroke();
  for(let k=-2;k<=2;k++){ctx.beginPath();ctx.arc(k*def.len/6,0,Math.max(3,def.thick*.16),0,Math.PI*2);ctx.fillStyle='#ffffff9c';ctx.fill()}
  ctx.restore();
 }
 // conveyor belts
 for(const z of d.belts){ctx.fillStyle='#172b35';ctx.fillRect(z.x,z.y,z.w,z.h);ctx.strokeStyle=d.accent;ctx.lineWidth=3;ctx.strokeRect(z.x,z.y,z.w,z.h);ctx.strokeStyle='#ffffff99';ctx.lineWidth=2;for(let x=z.x+14;x<z.x+z.w;x+=34){ctx.beginPath();ctx.moveTo(x,z.y+7);ctx.lineTo(x+12*z.dir,z.y+z.h-7);ctx.stroke()}}
 // reset portals
 for(const [x,y] of d.resets){ctx.fillStyle='#ff405b';ctx.beginPath();ctx.roundRect(x-31,y-25,62,50,12);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('RESET',x,y+4)}
 // finish
 ctx.fillStyle='#10384c';ctx.fillRect(35,FINISH_Y,830,38);
 for(let x=35;x<865;x+=28){ctx.fillStyle=((x-35)/28)%2<1?'#fff':'#153c51';ctx.fillRect(x,FINISH_Y,14,38)}
 ctx.fillStyle='#063447';ctx.fillRect(35,FINISH_Y-28,830,24);ctx.fillStyle='#fff';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText('FINISH  ·  TOP '+KEEP[stageIndex]+' ADVANCE',450,FINISH_Y-10);
 // top gate
 ctx.fillStyle='#0b293b';ctx.fillRect(35,24,830,8);ctx.fillStyle='#ffffffcc';ctx.font='bold 13px system-ui';ctx.fillText('START',450,18);
}
const imageCache=new Map();
function marbleImage(src){if(!imageCache.has(src)){const im=new Image();im.src=src;imageCache.set(src,im)}return imageCache.get(src)}
function paintMarbles(){
 for(const b of bodies){const r=b.plugin.racer,p=b.position,rad=16;ctx.save();ctx.translate(p.x,p.y);
  ctx.shadowColor='#0008';ctx.shadowBlur=6;ctx.shadowOffsetY=3;ctx.beginPath();ctx.arc(0,0,rad,0,Math.PI*2);ctx.fillStyle=r.color;ctx.fill();ctx.shadowColor='transparent';ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
  if(r.image){const im=marbleImage(r.image);if(im.complete&&im.naturalWidth){ctx.save();ctx.beginPath();ctx.arc(0,0,rad-2,0,Math.PI*2);ctx.clip();ctx.drawImage(im,-rad+2,-rad+2,(rad-2)*2,(rad-2)*2);ctx.restore()}}
  else{ctx.beginPath();ctx.arc(-5,-6,4,0,Math.PI*2);ctx.fillStyle='#ffffffb0';ctx.fill()}
  if(b.plugin.finished){ctx.beginPath();ctx.arc(0,0,rad+5,0,Math.PI*2);ctx.strokeStyle='#39f4ad';ctx.lineWidth=3;ctx.stroke()}
  ctx.restore();
 }
}
function renderContestants(){
 const list=$('#contestantsList'),done=new Set(finishers.map(x=>x.id));
 list.innerHTML=participants.map((r,i)=>{const idx=data.racers.indexOf(r),isDone=done.has(r.id);return '<div class="contestant '+(isDone?'done':'')+'"><div class="contestant-avatar">'+(r.image?'<img src="'+r.image+'">':'<span style="--marble-color:'+r.color+'"></span>')+'</div><div class="contestant-text"><b>'+escapeHtml(r.name)+'</b><small>Slot '+(idx+1)+'</small></div><span class="contestant-status">'+(isDone?'ADVANCED':'RACING')+'</span></div>'}).join('');
 const keep=KEEP[stageIndex];$('#remainingCount').textContent=participants.length+' racing';$('#advanceCount').textContent=finishers.length+' / '+keep;
}
function updateTimer(){
 if(!running)return;const sec=Math.floor((performance.now()-raceStart)/1000);$('#timer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}
function startStage(){
 running=false;stageFinishing=false;finishers=[];$('#stageMessage').classList.add('hidden');
 const map=MAPS[stageIndex],keep=KEEP[stageIndex];
 $('#stageName').textContent='STAGE '+(stageIndex+1)+' / 6';
 $('#stageSubtitle').textContent=map.name;
 $('#stageRule').textContent=participants.length+' start · '+(participants.length-keep)+' eliminated';
 $('#mapDescription').textContent=map.desc;
 $('#eliminationNote').textContent=stageIndex===5?'First marble to finish wins the championship.':'First '+keep+' to finish advance. The last '+(participants.length-keep)+' are eliminated.';
 buildWorld();renderContestants();paintMap();paintMarbles();
 let n=3;$('#countdown').textContent=n;$('#countdown').classList.remove('hidden');
 const interval=setInterval(()=>{if(editorOpen){clearInterval(interval);return}n--;if(n>0){$('#countdown').textContent=n}else{clearInterval(interval);$('#countdown').textContent='GO!';setTimeout(()=>{if(stageFinishing||editorOpen)return;$('#countdown').classList.add('hidden');running=true;raceStart=performance.now();renderContestants()},360)}},650);
}
function endStage(ranked){
 if(stageFinishing)return;stageFinishing=true;running=false;
 const keep=KEEP[stageIndex];const survivors=ranked.slice(0,keep);
 participants=survivors;
 if(stageIndex===5){showWinner(survivors[0]);return}
 const eliminated=ranked.slice(keep);
 $('#stageMessage').innerHTML='<b>'+survivors.length+' ADVANCE</b><small>'+eliminated.length+' eliminated · Next map: '+MAPS[stageIndex+1].name+'</small>';
 $('#stageMessage').classList.remove('hidden');
 setTimeout(()=>{stageIndex++;startStage()},2100);
}
function resolveTimeout(){
 const finishingIds=new Set(finishers.map(r=>r.id));
 const notFinished=bodies.filter(b=>!b.plugin.finished).sort((a,b)=>b.position.y-a.position.y).map(b=>b.plugin.racer);
 const ranked=[...finishers,...notFinished.filter(r=>!finishingIds.has(r.id))];
 endStage(ranked);
}
function checkRace(){
 if(!running||stageFinishing)return;
 const now=performance.now();
 for(const b of bodies){
  const plug=b.plugin;if(plug.finished)continue;
  const p=b.position;
  if(now>plug.resetUntil&&activeMap.resets.some(([x,y])=>Math.abs(p.x-x)<34&&Math.abs(p.y-y)<29)){resetMarble(b);continue}
  if(p.y>FINISH_Y+2){
   plug.finished=true;M.Body.setStatic(b,true);finishers.push(plug.racer);renderContestants();
   if(finishers.length>=KEEP[stageIndex]){endStage([...finishers]);return}
  }
 }
 if(now-raceStart>stageTimeout){resolveTimeout();return}
 updateTimer();
}
function showWinner(racer){
 running=false;$('#raceScreen').classList.add('hidden');$('#winnerScreen').classList.remove('hidden');
 $('#winnerName').textContent=racer.name;
 $('#winnerAvatar').innerHTML=racer.image?'<img src="'+racer.image+'">':'<span style="color:'+racer.color+'">●</span>';
}
function launchTournament(){
 participants=data.racers.slice();stageIndex=0;$('#setupScreen').classList.add('hidden');$('#winnerScreen').classList.add('hidden');$('#raceScreen').classList.remove('hidden');startStage();
}
$('#startTournament').addEventListener('click',launchTournament);
$('#backToSetup').addEventListener('click',()=>{running=false;$('#raceScreen').classList.add('hidden');$('#setupScreen').classList.remove('hidden')});
$('#raceAgain').addEventListener('click',()=>{launchTournament()});
$('#editMap').addEventListener('click',()=>{running=false;editorOpen=true;$('#mapEditor').classList.remove('hidden')});
function mapWalls(){return data.savedWalls[stageIndex+1]||MAPS[stageIndex].walls}
function pointToCanvas(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointerdown',e=>{if(!editorOpen)return;dragStart=pointToCanvas(e);canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointerup',e=>{
 if(!editorOpen||!dragStart)return;const p=pointToCanvas(e),walls=mapWalls();
 if(Math.hypot(p.x-dragStart.x,p.y-dragStart.y)>24){walls.push([dragStart.x,dragStart.y,p.x,p.y,24])}
 else{let nearest=-1,best=18;walls.forEach((w,i)=>{const vx=w[2]-w[0],vy=w[3]-w[1],t=Math.max(0,Math.min(1,((p.x-w[0])*vx+(p.y-w[1])*vy)/(vx*vx+vy*vy||1))),d=Math.hypot(p.x-(w[0]+t*vx),p.y-(w[1]+t*vy));if(d<best){best=d;nearest=i}});if(nearest>=0)walls.splice(nearest,1)}
 data.savedWalls[stageIndex+1]=walls;save();dragStart=null;
});
$('#defaultMap').addEventListener('click',()=>{delete data.savedWalls[stageIndex+1];save()});
$('#clearMap').addEventListener('click',()=>{data.savedWalls[stageIndex+1]=[];save()});
$('#doneMap').addEventListener('click',()=>{editorOpen=false;$('#mapEditor').classList.add('hidden');startStage()});
function frame(now){
 const delta=Math.min(34,Math.max(0,now-(lastFrame||now)));lastFrame=now;
 if(running&&engine){
  updateMoving(now/1000);applyBelts();M.Engine.update(engine,delta||16);checkRace();
 }
 paintMap();paintMarbles();requestAnimationFrame(frame);
}
safeLoad();renderRacers();
if(!M){alert('Physics engine failed to load. Refresh the page and try again.');return}
requestAnimationFrame(frame);
})();