const {Engine,Runner,Bodies,Body,Composite,Vector} = Matter;

const $ = s => document.querySelector(s);
const canvas = $('#game'), ctx = canvas.getContext('2d');
const W=900,H=1200;
const STORAGE='marbleRace2D.v1';

const palette=['#ff5d6c','#5ee7ff','#ffd35e','#8dff7a','#bd7cff','#ff9f5e','#55a8ff','#ff78c8','#70e0b5','#d8e66b','#a88cff','#ff806e','#6ce0ff','#f4a7ff','#9de86d'];
const state = {
  racers: Array.from({length:15},(_,i)=>({id:i,name:'Racer '+(i+1),image:null,color:palette[i]})),
  map: {walls:[],finish:{x:450,y:1090,w:360},spawn:{x:450,y:55}},
  gravity:1,size:19,speed:1
};
let engine=null, runner=null, bodies=[], racing=false, winner=null, editor=false, editingWall=null, drawStart=null;
let selectedRacer=0, sound=true;

function saveState(){localStorage.setItem(STORAGE,JSON.stringify(state)); flash('Saved');}
function loadState(){
  try{const x=JSON.parse(localStorage.getItem(STORAGE));if(x){Object.assign(state,x);flash('Loaded');}}catch(e){}
}
function flash(t){$('#status').textContent=t;setTimeout(()=>{if(!racing)$('#status').textContent='Ready'},1100)}

function defaultWalls(){
  const w=70;
  return [
    {x1:105,y1:0,x2:105,y2:250,w},{x1:795,y1:0,x2:795,y2:250,w},
    {x1:105,y1:250,x2:370,y2:380,w},{x1:795,y1:250,x2:530,y2:380,w},
    {x1:370,y1:380,x2:370,y2:520,w},{x1:530,y1:380,x2:530,y2:520,w},
    {x1:370,y1:520,x2:170,y2:650,w},{x1:530,y1:520,x2:730,y2:650,w},
    {x1:170,y1:650,x2:170,y2:810,w},{x1:730,y1:650,x2:730,y2:810,w},
    {x1:170,y1:810,x2:360,y2:930,w},{x1:730,y1:810,x2:540,y2:930,w},
    {x1:360,y1:930,x2:360,y2:1080,w},{x1:540,y1:930,x2:540,y2:1080,w},
    {x1:80,y1:1080,x2:360,y2:1080,w},{x1:540,y1:1080,x2:820,y2:1080,w}
  ];
}
if(!state.map.walls.length)state.map.walls=defaultWalls();

function renderRacers(){
  const list=$('#racerList'); list.innerHTML='';
  state.racers.slice(0,15).forEach((r,i)=>{
    const el=document.createElement('div');el.className='racer';
    el.innerHTML='<button class="avatar" data-avatar="'+i+'">'+(r.image?'<img src="'+r.image+'">':'<span style="color:'+r.color+'">●</span>')+'</button><div><div class="racer-name">'+escapeHtml(r.name)+'</div><div class="racer-num">#'+(i+1)+'</div></div><button class="edit-mini" data-edit="'+i+'">✎</button>';
    list.appendChild(el);
  });
  $('#slotCount').textContent=state.racers.length+'/15';
  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openRacer(+b.dataset.edit));
  list.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>openRacer(+b.dataset.avatar));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

function openRacer(i){
  selectedRacer=i;const r=state.racers[i];
  $('#nameInput').value=r.name;$('#editRacerTitle').textContent='Racer #'+(i+1);
  $('#avatarButton').innerHTML=r.image?'<img src="'+r.image+'" style="width:100%;height:100%;object-fit:cover">':'＋';
  $('#racerDialog').showModal();
}
$('#avatarButton').onclick=()=>$('#imagePicker').click();
$('#imagePicker').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const reader=new FileReader();reader.onload=()=>{$('#avatarButton').innerHTML='<img src="'+reader.result+'" style="width:100%;height:100%;object-fit:cover">';$('#avatarButton').dataset.image=reader.result};reader.readAsDataURL(f);
};
$('#saveRacerBtn').onclick=e=>{
  e.preventDefault();const r=state.racers[selectedRacer];r.name=$('#nameInput').value.trim()||'Racer '+(selectedRacer+1);
  r.image=$('#avatarButton').dataset.image || r.image; $('#racerDialog').close();renderRacers();saveState();
};

function drawBackground(){
  ctx.fillStyle='#72d5f5';ctx.fillRect(0,0,W,H);
  // clouds
  ctx.fillStyle='rgba(255,255,255,.7)';
  [[90,160,80],[700,300,100],[230,760,90],[650,940,75]].forEach(([x,y,s])=>{
    ctx.beginPath();ctx.arc(x,y,s*.45,0,Math.PI*2);ctx.arc(x+s*.35,y-s*.12,s*.55,0,Math.PI*2);ctx.arc(x+s*.75,y,s*.4,0,Math.PI*2);ctx.fill();
  });
}
function drawMap(){
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const wall of state.map.walls){
    ctx.strokeStyle='#07090d';ctx.lineWidth=wall.w;
    ctx.beginPath();ctx.moveTo(wall.x1,wall.y1);ctx.lineTo(wall.x2,wall.y2);ctx.stroke();
  }
  const f=state.map.finish;
  ctx.strokeStyle='#36e27a';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(f.x-f.w/2,f.y);ctx.lineTo(f.x+f.w/2,f.y);ctx.stroke();
  ctx.fillStyle='#36e27a';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText('FINISH',f.x,f.y-14);
}
function drawMarbles(){
  for(const b of bodies){
    const r=b.plugin.racer;
    const p=b.position, rad=state.size;
    ctx.save();ctx.translate(p.x,p.y);
    ctx.beginPath();ctx.arc(0,0,rad,0,Math.PI*2);
    ctx.fillStyle=r.color;ctx.fill();
    ctx.strokeStyle='#ffffffcc';ctx.lineWidth=2;ctx.stroke();
    if(r.image){
      ctx.beginPath();ctx.arc(0,0,rad-2,0,Math.PI*2);ctx.clip();
      const img=getImage(r.image);if(img&&img.complete)ctx.drawImage(img,-rad+2,-rad+2,(rad-2)*2,(rad-2)*2);
    } else {
      ctx.fillStyle='#fff9';ctx.beginPath();ctx.arc(-rad*.32,-rad*.35,rad*.2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
}
const imgCache=new Map();
function getImage(src){if(!imgCache.has(src)){const im=new Image();im.src=src;imgCache.set(src,im)}return imgCache.get(src)}

function rebuild(){
  if(engine){Runner.stop(runner);Composite.clear(engine.world,false,true);Engine.clear(engine);}
  engine=Engine.create();engine.gravity.y=state.gravity;engine.timing.timeScale=state.speed;
  runner=Runner.create(); bodies=[];
  // spawn row
  const xs=[210,245,280,315,350,385,420,455,490,525,560,595,630,665,700];
  state.racers.slice(0,15).forEach((r,i)=>{
    const b=Bodies.circle(xs[i],state.map.spawn.y, state.size,{restitution:.35,friction:.01,frictionAir:.001});
    b.plugin={racer:r};b.label='racer-'+i;b.collisionFilter.group=-1;
    bodies.push(b);Composite.add(engine.world,b);
  });
  for(const wall of state.map.walls){
    const len=Math.hypot(wall.x2-wall.x1,wall.y2-wall.y1);
    const angle=Math.atan2(wall.y2-wall.y1,wall.x2-wall.x1);
    const b=Bodies.rectangle((wall.x1+wall.x2)/2,(wall.y1+wall.y2)/2,len,wall.w,{isStatic:true,angle});
    b.label='wall';Composite.add(engine.world,b);
  }
  // top/side safety bounds
  Composite.add(engine.world,[
    Bodies.rectangle(-30,H/2,60,H,{isStatic:true}),
    Bodies.rectangle(W+30,H/2,60,H,{isStatic:true}),
    Bodies.rectangle(W/2,H+30,W,60,{isStatic:true})
  ]);
  Engine.update(engine,1);
}
function loop(){
  drawBackground();drawMap();drawMarbles();
  if(editor)drawEditor();
  requestAnimationFrame(loop);
}
function drawEditor(){
  ctx.save();
  for(let i=0;i<state.map.walls.length;i++){
    const a=state.map.walls[i],hot=editingWall===i;
    ctx.strokeStyle=hot?'#ffdc55':'#5ee7ff';ctx.lineWidth=4;ctx.setLineDash([8,7]);
    ctx.beginPath();ctx.moveTo(a.x1,a.y1);ctx.lineTo(a.x2,a.y2);ctx.stroke();
    ctx.setLineDash([]);ctx.fillStyle=hot?'#ffdc55':'#5ee7ff';
    ctx.beginPath();ctx.arc(a.x1,a.y1,6,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(a.x2,a.y2,6,0,Math.PI*2);ctx.fill();
  }
  if(drawStart){ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(drawStart.x,drawStart.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke();}
  ctx.restore();
}
let mouse={x:0,y:0};
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointermove',e=>{mouse=canvasPoint(e)});
canvas.addEventListener('pointerdown',e=>{
  if(!editor)return;const p=canvasPoint(e);
  let hit=-1;state.map.walls.forEach((w,i)=>{if(distToSeg(p,w)<10)hit=i});
  if(hit>=0){editingWall=hit;drawStart=null}else drawStart=p;
});
canvas.addEventListener('pointerup',e=>{
  if(!editor)return;const p=canvasPoint(e);
  if(drawStart && Math.hypot(p.x-drawStart.x,p.y-drawStart.y)>20){state.map.walls.push({x1:drawStart.x,y1:drawStart.y,x2:p.x,y2:p.y,w:70});justAdded=true;}
  drawStart=null;editingWall=null;saveState();
});
canvas.addEventListener('click',e=>{
  if(!editor || justAdded){justAdded=false;return;}const p=canvasPoint(e);
  for(let i=state.map.walls.length-1;i>=0;i--)if(distToSeg(p,state.map.walls[i])<9){state.map.walls.splice(i,1);saveState();break}
});
function distToSeg(p,s){const vx=s.x2-s.x1,vy=s.y2-s.y1,wx=p.x-s.x1,wy=p.y-s.y1,c1=wx*vx+wy*vy,c2=vx*vx+vy*vy,t=Math.max(0,Math.min(1,c1/(c2||1))),x=s.x1+t*vx,y=s.y1+t*vy;return Math.hypot(p.x-x,p.y-y)}

function startRace(){
  if(racing)return;
  $('#winner').classList.add('hidden');winner=null;racing=true;$('#status').textContent='Get ready…';rebuild();
  let n=3;$('#countdown').textContent=n;$('#countdown').classList.remove('hidden');
  const timer=setInterval(()=>{n--;if(n>0)$('#countdown').textContent=n;else{$('#countdown').textContent='GO!';setTimeout(()=>$('#countdown').classList.add('hidden'),350);clearInterval(timer);runRace()}},650);
}
function runRace(){Runner.run(runner,engine);$('#status').textContent='Racing…';checkWinner()}
function checkWinner(){
  if(!racing)return;
  const f=state.map.finish;
  const b=bodies.find(x=>x.position.y>=f.y && Math.abs(x.position.x-f.x)<f.w/2);
  if(b){racing=false;Runner.stop(runner);winner=b.plugin.racer;$('#winnerName').textContent=winner.name;$('#winner').classList.remove('hidden');$('#status').textContent='Winner!';return}
  requestAnimationFrame(checkWinner);
}
$('#raceBtn').onclick=startRace;$('#againBtn').onclick=startRace;
$('#resetBtn').onclick=()=>{racing=false;if(runner)Runner.stop(runner);loadState();rebuild();renderRacers()};
$('#gravityInput').oninput=e=>{state.gravity=+e.target.value;$('#gravityValue').textContent=state.gravity.toFixed(2);if(engine)engine.gravity.y=state.gravity;saveState()};
$('#sizeInput').oninput=e=>{state.size=+e.target.value;$('#sizeValue').textContent=state.size+' px';rebuild();saveState()};
$('#speedInput').oninput=e=>{state.speed=+e.target.value;$('#speedValue').textContent=state.speed.toFixed(1)+'×';if(engine)engine.timing.timeScale=state.speed;saveState()};
$('#shuffleBtn').onclick=()=>{state.racers.sort(()=>Math.random()-.5);renderRacers();saveState()};
$('#clearBtn').onclick=()=>{racing=false;if(runner)Runner.stop(runner);bodies=[];drawBackground();drawMap();$('#status').textContent='Cleared'};
$('#saveBtn').onclick=saveState;
$('#loadBtn').onclick=()=>$('#loadPicker').click();
$('#loadPicker').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{Object.assign(state,JSON.parse(r.result));renderRacers();rebuild();saveState()}catch(err){alert('Invalid JSON')}};r.readAsText(f)};
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').textContent=sound?'🔊':'🔇'};
$('#addRacerBtn').onclick=()=>{if(state.racers.length<15)openRacer(state.racers.length);else alert('There are already 15 racer slots.')};
$('#editBtn').onclick=()=>{editor=!editor;document.body.classList.toggle('editing',editor);$('#editorPanel').classList.toggle('hidden',!editor);$('#editBtn').textContent=editor?'✕ Close editor':'✎ Edit map'};
$('#closeEditor').onclick=()=>{$('#editBtn').click()};
$('#clearMapBtn').onclick=()=>{if(confirm('Clear all walls?')){state.map.walls=[];saveState()}};
$('#defaultMapBtn').onclick=()=>{state.map.walls=defaultWalls();saveState()};
$('#saveMapBtn').onclick=()=>saveState();

loadState();renderRacers();
$('#gravityInput').value=state.gravity;$('#gravityValue').textContent=state.gravity.toFixed(2);
$('#sizeInput').value=state.size;$('#sizeValue').textContent=state.size+' px';
$('#speedInput').value=state.speed;$('#speedValue').textContent=state.speed.toFixed(1)+'×';
rebuild();loop();
(()=>{const M=window.Matter,$=s=>document.querySelector(s),C=$('#newGame'),X=C.getContext('2d'),W=900,H=1200,K='marbleRace2D.v4';let S={racers:Array.from({length:15},(_,i)=>({name:'Racer '+(i+1),image:null,color:['#ff405b','#ff8d3b','#ffd52f','#9eea31','#22d7d0','#39d9ff','#8a5cff','#ff4dcc','#6f7cff','#53ef86','#d8d34a','#c18bff','#ff79a8','#67b6ff','#f1a44c'][i]})),walls:[]},E,R,bs=[],cur=[],q=[],sur=[],stage=1,running=false,edit=false,drag=null,mouse={x:0,y:0},pick=0;try{const z=JSON.parse(localStorage.getItem(K));if(z)S=z}catch(e){};function save(){localStorage.setItem(K,JSON.stringify(S))}function dw(){return[{x1:110,y1:0,x2:110,y2:190,w:58},{x1:790,y1:0,x2:790,y2:190,w:58},{x1:110,y1:190,x2:355,y2:300,w:58},{x1:790,y1:190,x2:545,y2:300,w:58},{x1:355,y1:300,x2:355,y2:465,w:58},{x1:545,y1:300,x2:545,y2:465,w:58},{x1:355,y1:465,x2:155,y2:600,w:58},{x1:545,y1:465,x2:745,y2:600,w:58},{x1:155,y1:600,x2:155,y2:790,w:58},{x1:745,y1:600,x2:745,y2:790,w:58},{x1:155,y1:790,x2:345,y2:920,w:58},{x1:745,y1:790,x2:555,y2:920,w:58},{x1:345,y1:920,x2:345,y2:1070,w:58},{x1:555,y1:920,x2:555,y2:1070,w:58}]}if(!S.walls.length)S.walls=dw();function render(){const g=$('#newGrid');g.innerHTML=S.racers.map((r,i)=>'<div class="new-card"><button class="new-avatar" data-p="'+i+'">'+(r.image?'<img src="'+r.image+'">':'<span class="new-ball" style="--c:'+r.color+'"></span>')+'</button><div class="new-info"><small>RACER '+String(i+1).padStart(2,'0')+'</small><input class="new-name" maxlength="22" value="'+r.name.replace(/"/g,'&quot;')+'" data-n="'+i+'"></div></div>').join('');g.querySelectorAll('[data-n]').forEach(x=>x.oninput=()=>{S.racers[+x.dataset.n].name=x.value||'Racer '+(+x.dataset.n+1);save()});g.querySelectorAll('[data-p]').forEach(x=>x.onclick=()=>{pick=+x.dataset.p;$('#newPicker').click()})}$('#newPicker').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{S.racers[pick].image=rd.result;render();save()};rd.readAsDataURL(f)}$('#newReset').onclick=()=>{S.racers.forEach((r,i)=>{r.name='Racer '+(i+1);r.image=null});render();save()};function draw(){X.fillStyle='#70d6f7';X.fillRect(0,0,W,H);X.fillStyle='#ffffffaa';[[100,130,90],[700,250,100],[230,730,90],[660,900,85]].forEach(a=>{X.beginPath();X.arc(a[0],a[1],a[2]*.4,0,7);X.arc(a[0]+a[2]*.35,a[1]-a[2]*.15,a[2]*.5,0,7);X.arc(a[0]+a[2]*.72,a[1],a[2]*.36,0,7);X.fill()});X.lineCap='round';S.walls.forEach(w=>{X.strokeStyle='#05080c';X.lineWidth=w.w;X.beginPath();X.moveTo(w.x1,w.y1);X.lineTo(w.x2,w.y2);X.stroke()});X.fillStyle='#39d9ff';X.fillRect(250,1090,400,40);X.fillStyle='#06131b';X.font='bold 18px system-ui';X.textAlign='center';X.fillText('BLUE → NEXT',450,1116);X.fillStyle='#ff405b';X.fillRect(55,1045,135,38);X.fillRect(710,1045,135,38);X.fillStyle='#fff';X.font='bold 13px system-ui';X.fillText('RED = RESET',122,1070);X.fillText('RED = RESET',778,1070);if(edit){X.strokeStyle='#39d9ff';X.lineWidth=4;X.setLineDash([8,7]);S.walls.forEach(w=>{X.beginPath();X.moveTo(w.x1,w.y1);X.lineTo(w.x2,w.y2);X.stroke()});X.setLineDash([])}}const imgs=new Map();function im(s){if(!imgs.has(s)){const i=new Image();i.src=s;imgs.set(s,i)}return imgs.get(s)}function balls(){bs.forEach(b=>{const r=b.plugin.r,p=b.position;X.save();X.translate(p.x,p.y);X.beginPath();X.arc(0,0,19,0,7);X.fillStyle=r.color;X.fill();X.strokeStyle='#fff';X.lineWidth=2;X.stroke();if(r.image){const i=im(r.image);if(i.complete){X.beginPath();X.arc(0,0,17,0,7);X.clip();X.drawImage(i,-17,-17,34,34)}}X.restore()})}function build(){if(R)M.Runner.stop(R);if(E)M.Engine.clear(E);E=M.Engine.create();E.gravity.y=1;R=M.Runner.create();bs=[];const xs=cur.length===2?[320,580]:[270,450,630];cur.forEach((r,i)=>{const b=M.Bodies.circle(xs[i],55,19,{restitution:.25,friction:.01,frictionAir:.001});b.plugin={r};bs.push(b);M.Composite.add(E.world,b)});S.walls.forEach(w=>{const l=Math.hypot(w.x2-w.x1,w.y2-w.y1),a=Math.atan2(w.y2-w.y1,w.x2-w.x1);M.Composite.add(E.world,M.Bodies.rectangle((w.x1+w.x2)/2,(w.y1+w.y2)/2,l,w.w,{isStatic:true,angle:a}))});M.Composite.add(E.world,[M.Bodies.rectangle(-30,H/2,60,H,{isStatic:true}),M.Bodies.rectangle(W+30,H/2,60,H,{isStatic:true}),M.Bodies.rectangle(W/2,H+30,W,60,{isStatic:true})])}function list(){const p=$('#newPlayers');p.innerHTML=cur.map(r=>'<div class="new-player"><div class="new-mini">'+(r.image?'<img src="'+r.image+'">':'<span style="--c:'+r.color+'"></span>')+'</div><div><b>'+r.name+'</b><small>Racer</small></div></div>').join('')}function stageGo(){if(!cur.length){winner();return}$('#newSetup').classList.add('new-hidden');$('#newRace').classList.remove('new-hidden');$('#newRound').textContent='Round '+stage;$('#newCount').textContent=cur.length+' racers';$('#newStage').textContent='Stage '+stage;list();build();let n=3;$('#newCountdown').textContent=n;$('#newCountdown').classList.remove('new-hidden');const t=setInterval(()=>{n--;if(n)$('#newCountdown').textContent=n;else{clearInterval(t);$('#newCountdown').textContent='GO!';setTimeout(()=>{$('#newCountdown').classList.add('new-hidden');running=true;M.Runner.run(R,E)},300)}},600)}function next(){if(q.length){cur=q.splice(0,Math.min(3,q.length));stage++;stageGo();return}if(sur.length>1){q=sur.splice(0);cur=q.splice(0,Math.min(3,q.length));stage++;stageGo();return}winner()}function winner(){const r=sur[0]||cur[0];$('#newRace').classList.add('new-hidden');$('#newWinner').classList.remove('new-hidden');$('#newWinnerName').textContent=r.name}function check(){if(!running)return;for(const b of bs){const p=b.position;if(p.y>1040&&(p.x<200||p.x>700)){M.Body.setPosition(b,{x:p.x<450?320:580,y:55});M.Body.setVelocity(b,{x:0,y:0})}if(p.y>1080&&p.x>245&&p.x<655){running=false;M.Runner.stop(R);sur.push(b.plugin.r);$('#newMessage').innerHTML='<b>'+b.plugin.r.name+' ADVANCES</b><small>2 racers eliminated</small>';$('#newMessage').classList.remove('new-hidden');setTimeout(()=>{$('#newMessage').classList.add('new-hidden');next()},1100);break}}requestAnimationFrame(check)}$('#newStart').onclick=()=>{q=[...S.racers];sur=[];cur=q.splice(0,3);stage=1;stageGo();check()};$('#newRestart').onclick=()=>{running=false;stageGo()};$('#newBack').onclick=()=>{$('#newRace').classList.add('new-hidden');$('#newSetup').classList.remove('new-hidden');running=false;if(R)M.Runner.stop(R)};$('#newAgain').onclick=()=>{$('#newWinner').classList.add('new-hidden');$('#newSetup').classList.remove('new-hidden')};$('#newMapBtn').onclick=()=>{$('#newEditor').classList.remove('new-hidden');edit=true};$('#newDone').onclick=()=>{$('#newEditor').classList.add('new-hidden');edit=false;save()};$('#newDefault').onclick=()=>{S.walls=dw();save()};$('#newClear').onclick=()=>{S.walls=[];save()};C.onpointermove=e=>{const r=C.getBoundingClientRect();mouse={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};C.onpointerdown=()=>{if(edit)drag={...mouse}};C.onpointerup=()=>{if(edit&&drag&&Math.hypot(mouse.x-drag.x,mouse.y-drag.y)>25){S.walls.push({x1:drag.x,y1:drag.y,x2:mouse.x,y2:mouse.y,w:58});save()}drag=null};function loop(){draw();balls();requestAnimationFrame(loop)}render();loop()})();