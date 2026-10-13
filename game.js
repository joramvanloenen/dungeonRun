/* DUNGEON//RUN — 60fps top-down arcade engine */
(() => {
'use strict';
const D=window.DR, $=D.$, PI=Math.PI, TAU=PI*2;
const clamp=D.clamp,dist=D.dist;
class Game {
 constructor(){
  this.canvas=$('gameCanvas');this.ctx=this.canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;
  this.keys=new Set();this.pointerDown=false;this.aimFromMouse=false;this.aim=0;this.gamepadMove={x:0,y:0};this.touchAttacking=false;this.touchDash=false;
  this.running=false;this.paused=false;this.dead=false;this.depth=1;this.score=0;this.kills=0;this.combo=0;this.comboClock=0;
  this.shake=0;this.flash=0;this.time=0;this.frame=0;this.fps=60;this.timer=performance.now();this.last=this.timer;
  this.particles=[];this.floaters=[];this.projectiles=[];this.enemies=[];this.props=[];this.room=null;this.player={x:2.5,y:8.5,hp:100,maxHp:100,dx:0,dy:0,invuln:0,dashTime:0,dashCooldown:0,attackCooldown:0,slash:0,damageOnLava:0,level:1};
  this.best=JSON.parse(localStorage.getItem('dungeonrun.records.v1')||'{"depth":0,"score":0}');
  this.createEvents();this.enterRoom(1);this.updateHUD();
  requestAnimationFrame(t=>this.loop(t));
 }
 createEvents(){
  $('startBtn').onclick=()=>this.start();
  $('restartBtn').onclick=()=>this.start();
  $('againBtn').onclick=()=>this.start();
  $('resumeBtn').onclick=()=>this.pause(false);
  $('pauseQuitBtn').onclick=()=>this.end(true);
  $('playCustomBtn').onclick=()=>{D.openView('play');this.start();};
  const block=[' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  window.addEventListener('keydown',e=>{
   if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||$('helpDialog').open)return;
   if(e.key==='Escape'){if(this.running)this.pause(!this.paused);return;}
   if(!$('playView').classList.contains('active'))return;
   const key=e.key.toLowerCase();this.keys.add(key);
   if(block.includes(e.key)&&this.running)e.preventDefault();
   if(e.key==='Shift'&&!e.repeat)this.dash();
   if(key==='r'&&this.dead)this.start();
   if(e.key===' '&&!e.repeat)this.attack();
  });
  window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{this.keys.clear();this.pointerDown=false;this.touchAttacking=false;});
  const canvas=this.canvas;
  const moveAim=e=>{
   const r=canvas.getBoundingClientRect();
   const x=(e.clientX-r.left)*640/r.width,y=(e.clientY-r.top)*400/r.height;
   if(e.pointerType!=='touch'){this.aim=Math.atan2(y-(D.OY+this.player.y*D.T),x-(D.OX+this.player.x*D.T));this.aimFromMouse=true;}
  };
  canvas.addEventListener('pointermove',moveAim);
  canvas.addEventListener('pointerdown',e=>{if(!this.running||this.paused)return;moveAim(e);if(e.pointerType!=='touch'){this.pointerDown=true;this.attack();}else{this.attack();}e.preventDefault();});
  window.addEventListener('pointerup',()=>this.pointerDown=false);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  // Independent, multi-touch-capable virtual thumbstick.
  const joy=$('joystick'),stick=joy.querySelector('.stick');let joyId=null;
  const updateStick=e=>{
   const b=joy.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
   const dx=e.clientX-cx,dy=e.clientY-cy,r=30,len=Math.hypot(dx,dy),k=Math.min(1,len/r),angle=Math.atan2(dy,dx);
   const x=Math.cos(angle)*k,y=Math.sin(angle)*k;this.gamepadMove={x,y};
   stick.style.transform='translate(calc(-50% + '+(x*r)+'px),calc(-50% + '+(y*r)+'px))';
  };
  joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);updateStick(e);e.preventDefault();});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)updateStick(e);});
  const release=e=>{if(e.pointerId===joyId){joyId=null;this.gamepadMove={x:0,y:0};stick.style.transform='translate(-50%,-50%)';}};
  joy.addEventListener('pointerup',release);joy.addEventListener('pointercancel',release);
  const touch=$('touchAttack');
  touch.addEventListener('pointerdown',e=>{touch.setPointerCapture(e.pointerId);this.touchAttacking=true;this.attack();e.preventDefault();});
  touch.addEventListener('pointerup',()=>this.touchAttacking=false);touch.addEventListener('pointercancel',()=>this.touchAttacking=false);
  $('touchDash').addEventListener('pointerdown',e=>{e.preventDefault();this.dash();});
 }
 start(){
  this.running=true;this.paused=false;this.dead=false;this.time=0;this.score=0;this.kills=0;this.combo=0;this.comboClock=0;
  this.player={x:2.5,y:8.5,hp:100,maxHp:100,dx:0,dy:0,invuln:0,dashTime:0,dashCooldown:0,attackCooldown:0,slash:0,damageOnLava:0,level:1};
  this.particles=[];this.floaters=[];this.projectiles=[];this.keys.clear();this.pointerDown=false;
  $('startOverlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');$('endOverlay').classList.add('hidden');
  this.enterRoom(1);$('gameStateLabel').textContent='EXPEDITION ACTIVE';this.updateHUD();this.canvas.focus({preventScroll:true});
  this.toast('FLOOR 01  •  FIND THE EXIT');
 }
 pause(value){
  if(!this.running)return;this.paused=value;$('pauseOverlay').classList.toggle('hidden',!value);
  $('gameStateLabel').textContent=value?'PAUSED':'EXPEDITION ACTIVE';this.keys.clear();
 }
 end(quit=false){
  if(!this.running)return;this.running=false;this.dead=true;this.paused=false;this.best.depth=Math.max(this.best.depth,this.depth);this.best.score=Math.max(this.best.score,this.score);
  try{localStorage.setItem('dungeonrun.records.v1',JSON.stringify(this.best));}catch(e){}
  $('pauseOverlay').classList.add('hidden');$('endOverlay').classList.remove('hidden');
  $('endSummary').textContent=(quit?'Expedition ended. ':'The crypt got you. ')+'Floor '+this.depth+' · '+this.kills+' kills · '+this.score+' souls.';
  $('gameStateLabel').textContent='EXPEDITION ENDED';this.updateHUD();
 }
 enterRoom(depth){
  this.depth=depth;
  const list=D.assets.room;
  const template=list[(depth-1)%list.length];this.room=D.clone(template);this.room.tiles=this.room.tiles.map(id=>D.find('texture',id)?id:'floor');
  // The current room's authored enemies are the core population; higher depths add a little danger.
  const extra=Math.min(7,Math.floor((depth-1)/2));
  this.props=(this.room.props||[]).filter(p=>D.find('prop',p.kind)).map(p=>({...p,x:p.x+.5,y:p.y+.5,hp:D.find('prop',p.kind).hp||1,flash:0,alive:true}));
  this.enemies=(this.room.enemies||[]).filter(p=>D.find('enemy',p.kind)).map(p=>this.createEnemy(p.kind,p.x+.5,p.y+.5,depth));
  for(let i=0;i<extra;i++){
   for(let tries=0;tries<45;tries++){
    const x=Math.floor(D.rand(8,24))+.5,y=Math.floor(D.rand(2,15))+.5;
    if(this.isClear(x,y,.42)&&this.enemies.every(e=>dist(e.x,e.y,x,y)>2)){
     const pool=D.assets.enemy;const choice=pool[Math.floor(Math.random()*pool.length)];this.enemies.push(this.createEnemy(choice.id,x,y,depth));break;
    }
   }
  }
  this.cleared=this.enemies.length===0;
  const start=this.room.spawn||{x:2,y:8};
  this.player.x=clamp(start.x+.5,1.5,26.5);this.player.y=clamp(start.y+.5,1.5,15.5);
  this.player.dashTime=0;this.player.invuln=1.1;this.player.slash=0;this.projectiles=[];
  this.particles=[];this.floaters=[];this.shake=0;this.updateHUD();
 }
 createEnemy(kind,x,y,depth){
  const def=D.find('enemy',kind),mult=1+Math.min(3,(depth-1)*.14);
  return {kind,x,y,hp:Math.ceil((def.hp||20)*mult),maxHp:Math.ceil((def.hp||20)*mult),attack:Math.random()*.4,shot:D.rand(.5,1.4),flash:0,angle:0,phase:Math.random()*7,charge:0,step:Math.random()*3};
 }
 isClear(x,y,r=.28,ignoreProp=null){
  const coords=[[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r],[x,y]];
  for(const [a,b] of coords){
   const tx=Math.floor(a),ty=Math.floor(b);
   if(tx<0||tx>=D.W||ty<0||ty>=D.H)return false;
   const tex=D.find('texture',this.room.tiles[ty*D.W+tx]);if(!tex||tex.solid)return false;
  }
  for(const p of this.props){if(!p.alive||p===ignoreProp)continue;const def=D.find('prop',p.kind);if(def?.solid&&Math.abs(x-p.x)<r+.35&&Math.abs(y-p.y)<r+.35)return false;}
  return true;
 }
 move(entity,dx,dy,r){
  if(!Number.isFinite(dx+dy))return;
  if(this.isClear(entity.x+dx,entity.y,r))entity.x+=dx;
  if(this.isClear(entity.x,entity.y+dy,r))entity.y+=dy;
 }
 getMovement(){
  let dx=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0);
  let dy=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);
  dx+=this.gamepadMove.x;dy+=this.gamepadMove.y;const l=Math.hypot(dx,dy);
  if(l>.07)return{x:dx/Math.max(1,l),y:dy/Math.max(1,l),moving:true};
  return{x:0,y:0,moving:false};
 }
 attack(){
  if(!this.running||this.paused||this.player.attackCooldown>0)return;
  const p=this.player; p.attackCooldown=.21;p.slash=.19;
  let hits=0;
  const targetHit=(t,hp,kill,rad)=>{
   const dx=t.x-p.x,dy=t.y-p.y,dd=Math.hypot(dx,dy);
   if(dd>rad)return;
   const angle=Math.atan2(dy,dx);const diff=Math.atan2(Math.sin(angle-this.aim),Math.cos(angle-this.aim));
   if(Math.abs(diff)>1.08&&dd>.67)return;
   t.hp-=hp;t.flash=.16;hits++;
   const push=dd>.01?{x:dx/dd,y:dy/dd}:{x:1,y:0};
   for(let i=0;i<10;i++)this.particle(t.x,t.y,Math.random()>.4?'#f1b779':'#ec7561',D.rand(1.5,5),.3);
   if(t.hp<=0)kill(t);
   else if(t.kind&&this.isClear(t.x+push.x*.28,t.y+push.y*.28,.32)){t.x+=push.x*.28;t.y+=push.y*.28;}
  };
  for(const e of this.enemies)if(e.hp>0)hitEnemy(e);
  function hitEnemy(e){targetHit(e,25+p.level*4,()=>this.killEnemy(e),1.8);}
  // Bound callback for the local enemy iteration above.
  // (The actual iteration is performed below with an arrow to preserve this.)
  for(const obj of this.props){if(obj.alive&&D.find('prop',obj.kind)?.breakable)targetHit(obj,27,()=>this.breakProp(obj),1.65);}
  if(hits){this.shake=Math.max(this.shake,4);this.flash=.045;this.sound('hit');}else this.sound('swing');
 }
 killEnemy(e){
  e.hp=0;const def=D.find('enemy',e.kind);this.kills++;
  if(this.comboClock>0)this.combo++;else this.combo=1;this.comboClock=2.1;
  const gain=(def?.points||50)*Math.min(5,this.combo);this.score+=gain;
  this.floater(e.x,e.y,'+'+gain,'#f7c380');
  for(let i=0;i<23;i++)this.particle(e.x,e.y,i%3?'#ee8e5a':'#f7d4a4',D.rand(2,6),D.rand(.3,.8));
  const newLevel=1+Math.floor(this.kills/7);
  if(newLevel>this.player.level){this.player.level=newLevel;this.player.maxHp+=10;this.player.hp=Math.min(this.player.maxHp,this.player.hp+25);this.toast('LEVEL UP!  •  VITALITY +10');this.sound('level');}
  this.shake=Math.max(this.shake,7);
  if(this.enemies.every(en=>en.hp<=0)){this.cleared=true;this.toast('ROOM CLEARED  •  EXIT UNLOCKED');this.sound('clear');}
  this.updateHUD();
 }
 breakProp(p){
  p.alive=false;const def=D.find('prop',p.kind);const gain=def?.loot||0;this.score+=gain;this.floater(p.x,p.y,'+'+gain,'#f5a45d');
  for(let i=0;i<18;i++)this.particle(p.x,p.y,'#d9a067',D.rand(1,5),D.rand(.25,.6));this.shake=3;this.updateHUD();
 }
 dash(){
  const p=this.player;if(!this.running||this.paused||p.dashCooldown>0)return;
  const move=this.getMovement();const a=move.moving?Math.atan2(move.y,move.x):this.aim;
  p.dx=Math.cos(a);p.dy=Math.sin(a);p.dashTime=.17;p.dashCooldown=1.25;p.invuln=.23;
  this.shake=3;this.sound('dash');
  for(let i=0;i<12;i++)this.particle(p.x,p.y,'#9edbc1',D.rand(1,3),D.rand(.2,.5));
 }
 hurt(amount){
  const p=this.player;if(p.invuln>0||!this.running)return;
  p.hp=Math.max(0,p.hp-amount);p.invuln=.85;this.shake=9;this.flash=.13;this.floater(p.x,p.y,'-'+amount,'#ff6f6a');this.sound('hurt');
  for(let i=0;i<15;i++)this.particle(p.x,p.y,'#e16a62',D.rand(1,5),D.rand(.2,.6));
  if(p.hp<=0)this.end();this.updateHUD();
 }
 projectile(x,y,angle,speed,damage){
  this.projectiles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3,damage});
 }
 floater(x,y,text,color){this.floaters.push({x,y,text,color,life:1.1});}
 particle(x,y,color,speed,life){
  const a=Math.random()*TAU;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life,max:life,color,size:Math.random()>.7?3:2});
  if(this.particles.length>280)this.particles.shift();
 }
 sound(type){
  if(!this.audio){try{this.audio=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}}
  const a=this.audio;if(a.state==='suspended')a.resume().catch(()=>{});
  const settings={swing:[190,.05,'sawtooth',.028],hit:[110,.085,'square',.045],dash:[430,.12,'triangle',.04],hurt:[92,.17,'sawtooth',.06],clear:[650,.18,'sine',.04],level:[850,.25,'sine',.04]};
  const [freq,duration,wave,volume]=settings[type]||settings.hit;
  try{const o=a.createOscillator(),g=a.createGain();o.type=wave;o.frequency.setValueAtTime(freq,a.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*(type==='clear'?1.6:.55)),a.currentTime+duration);g.gain.setValueAtTime(volume,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+duration);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+duration);}catch(e){}
 }
 toast(msg){const el=$('gameToast');el.textContent=msg;el.classList.remove('visible');void el.offsetWidth;el.classList.add('visible');}
 step(dt){
  if(!this.running||this.paused||!$('playView').classList.contains('active'))return;
  this.time+=dt;const p=this.player;
  p.invuln=Math.max(0,p.invuln-dt);p.attackCooldown=Math.max(0,p.attackCooldown-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.slash=Math.max(0,p.slash-dt);
  this.shake=Math.max(0,this.shake-dt*32);this.flash=Math.max(0,this.flash-dt);
  this.comboClock=Math.max(0,this.comboClock-dt);if(this.comboClock===0)this.combo=0;
  const mv=this.getMovement();
  if(mv.moving&&!this.aimFromMouse)this.aim=Math.atan2(mv.y,mv.x);
  if(this.pointerDown||this.touchAttacking||this.keys.has(' '))this.attack();
  if(p.dashTime>0){this.move(p,p.dx*dt*15,p.dy*dt*15,.27);p.dashTime-=dt;
   for(let i=0;i<2;i++)this.particle(p.x,p.y,'#8fc4ab',1,.2);
  }else{this.move(p,mv.x*dt*5.7,mv.y*dt*5.7,.28);}
  const cell=this.room.tiles[Math.floor(p.y)*D.W+Math.floor(p.x)],material=D.find('texture',cell);
  p.damageOnLava=Math.max(0,p.damageOnLava-dt);
  if(material?.damage&&p.damageOnLava===0){this.hurt(material.damage);p.damageOnLava=.55;}
  for(const e of this.enemies){
   if(e.hp<=0)continue;
   const def=D.find('enemy',e.kind);if(!def)continue;
   e.flash=Math.max(0,e.flash-dt);e.attack=Math.max(0,e.attack-dt);e.shot-=dt;e.phase+=dt;
   let vx=p.x-e.x,vy=p.y-e.y;const d=Math.max(.01,Math.hypot(vx,vy));e.angle=Math.atan2(vy,vx);vx/=d;vy/=d;
   let sp=def.speed||1.6;if(def.ai==='charge'){e.charge-=dt;if(e.charge< -1.7)e.charge=.45;if(e.charge>0)sp*=3;}
   if(def.ai==='ranged'){
    if(d<3.9){vx=-vx*.7;vy=-vy*.7;}else if(d<5.5){vx=.32*Math.cos(e.phase);vy=.32*Math.sin(e.phase);}
    if(e.shot<=0&&d<11){this.projectile(e.x,e.y,e.angle,5.1,def.damage||9);e.shot=D.rand(1.25,2.1);}
   }
   if(d<16){this.move(e,vx*sp*dt,vy*sp*dt,.27);}
   if(d<.67&&e.attack<=0){this.hurt(def.damage||8);e.attack=.8;}
  }
  this.enemies=this.enemies.filter(e=>e.hp>0);
  for(const pr of this.projectiles){
   pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;
   const x=Math.floor(pr.x),y=Math.floor(pr.y);
   if(x<0||x>=D.W||y<0||y>=D.H||D.find('texture',this.room.tiles[y*D.W+x])?.solid)pr.life=0;
   if(dist(pr.x,pr.y,p.x,p.y)<.43){this.hurt(pr.damage);pr.life=0;}
  }
  this.projectiles=this.projectiles.filter(a=>a.life>0);
  for(const part of this.particles){part.x+=part.vx*dt;part.y+=part.vy*dt;part.vx*=Math.max(0,1-dt*2.4);part.vy*=Math.max(0,1-dt*2.4);part.life-=dt;}
  this.particles=this.particles.filter(q=>q.life>0);
  for(const f of this.floaters){f.y-=dt*.85;f.life-=dt;}
  this.floaters=this.floaters.filter(q=>q.life>0);
  const ex=this.room.exit||{x:25,y:8};
  if(this.cleared&&dist(p.x,p.y,ex.x+.5,ex.y+.5)<.85){
    this.enterRoom(this.depth+1);this.player.hp=Math.min(this.player.maxHp,this.player.hp+13);this.toast('FLOOR '+String(this.depth).padStart(2,'0')+'  •  DESCEND');this.sound('clear');
  }
  if(this.frame%8===0)this.updateHUD();
 }
 drawRoom(ctx,room,clear=false){
  const T=D.T,ox=D.OX,oy=D.OY;
  ctx.fillStyle='#060d11';ctx.fillRect(0,0,640,400);
  for(let y=0;y<D.H;y++)for(let x=0;x<D.W;x++){
   const t=D.find('texture',room.tiles[y*D.W+x]);const sx=ox+x*T,sy=oy+y*T;
   if(t)D.draw(ctx,t.pixels,sx,sy,T,T);else{ctx.fillStyle='#293b3b';ctx.fillRect(sx,sy,T,T);}
   if(t?.solid){
    ctx.fillStyle='#06121a70';ctx.fillRect(sx,sy+T-4,T,4);
    ctx.fillStyle='#b1c9b333';ctx.fillRect(sx,sy,T,2);
   }
  }
  const exit=room.exit||{x:25,y:8},ex=ox+(exit.x+.5)*T,ey=oy+(exit.y+.5)*T;
  const flicker=.6+Math.sin(this.time*7)*.18;
  ctx.save();ctx.translate(ex,ey);
  ctx.fillStyle=clear?'#8be5b1':'#687977';
  ctx.globalAlpha=clear?flicker:.33;
  ctx.fillRect(-8,-12,16,24);ctx.globalAlpha=1;
  ctx.strokeStyle=clear?'#d5ffbd':'#869b8a';ctx.lineWidth=2;ctx.strokeRect(-9,-13,18,26);
  if(clear){ctx.fillStyle='#def6c8';for(let i=0;i<5;i++)ctx.fillRect(Math.sin(this.time*2+i*2.4)*8-1,Math.cos(this.time*3+i*3.2)*12-1,2,2);}
  else {ctx.fillStyle='#111a1c';ctx.fillRect(-5,-7,10,15);}
  ctx.restore();
  // Environmental border frame and coordinate glyphs.
  ctx.strokeStyle='#586e6570';ctx.lineWidth=1;ctx.strokeRect(ox-.5,oy-.5,D.W*T+1,D.H*T+1);
  ctx.fillStyle='#6e807e';ctx.font='8px monospace';ctx.fillText('▸ D E P T H   '+String(this.depth).padStart(2,'0'),ox,18);
  ctx.fillStyle=clear?'#a7edb8':'#f1bd85';ctx.fillText(clear?'EXIT UNLOCKED  →':'ELIMINATE ALL HOSTILES',ox+356,18);
  ctx.fillStyle='#5e7778';ctx.fillText('DUNGEON//RUN  /  UNDERCRYPT',ox,390);
  ctx.textAlign='right';ctx.fillText(String(Math.max(0,this.enemies.filter(e=>e.hp>0).length)).padStart(2,'0')+' HOSTILES',ox+D.W*T,390);ctx.textAlign='left';
 }
 render(){
  const ctx=this.ctx,p=this.player,T=D.T,ox=D.OX,oy=D.OY;ctx.setTransform(1,0,0,1,0,0);
  if(!this.room)return;
  if(this.shake>.1)ctx.translate(Math.round(D.rand(-this.shake,this.shake)),Math.round(D.rand(-this.shake,this.shake)));
  this.drawRoom(ctx,this.room,this.cleared);
  for(const pr of this.props){
   if(!pr.alive)continue;const def=D.find('prop',pr.kind);if(!def)continue;
   const x=ox+pr.x*T,y=oy+pr.y*T;
   ctx.fillStyle='#01050977';ctx.fillRect(Math.round(x-7),Math.round(y+5),14,5);
   if(pr.kind==='torch'){const glow=ctx.createRadialGradient(x,y,0,x,y,70);glow.addColorStop(0,'#f5a05237');glow.addColorStop(1,'#f5a05200');ctx.fillStyle=glow;ctx.fillRect(x-70,y-70,140,140);}
   D.draw(ctx,def.pixels,x-10,y-12,20,20);
   if(pr.flash>0){ctx.globalAlpha=pr.flash*4;ctx.fillStyle='#fff';ctx.fillRect(x-9,y-12,18,18);ctx.globalAlpha=1;pr.flash=Math.max(0,pr.flash-.03);}
  }
  for(const e of this.enemies){
   if(e.hp<=0)continue;
   const def=D.find('enemy',e.kind);if(!def)continue;const x=ox+e.x*T,y=oy+e.y*T+Math.sin(e.phase*4)*1.8;
   ctx.fillStyle='#0008';ctx.fillRect(x-8,y+7,16,4);
   if(e.flash>0){ctx.globalAlpha=.65;ctx.fillStyle='#fff';ctx.fillRect(x-11,y-11,22,22);ctx.globalAlpha=1;}
   D.draw(ctx,def.pixels,x-12,y-14,24,24);
   if(e.hp<e.maxHp){ctx.fillStyle='#160c11';ctx.fillRect(x-9,y-17,18,3);ctx.fillStyle='#d87263';ctx.fillRect(x-9,y-17,18*e.hp/e.maxHp,3);}
  }
  for(const b of this.projectiles){
   const x=ox+b.x*T,y=oy+b.y*T;ctx.fillStyle='#f8bf7e';ctx.fillRect(x-3,y-3,6,6);ctx.fillStyle='#fff0bd';ctx.fillRect(x-1,y-1,2,2);
  }
  // Pixel silhouette + dash afterimage + directional blade.
  const px=ox+p.x*T,py=oy+p.y*T;
  ctx.fillStyle='#020b0e99';ctx.fillRect(px-8,py+8,16,5);
  if(p.dashTime>0){ctx.globalAlpha=.4;D.draw(ctx,D.hero,px-10-p.dx*13,py-13-p.dy*13,23,26);ctx.globalAlpha=1;}
  if(p.invuln<=0||Math.floor(this.time*15)%2===0)D.draw(ctx,D.hero,px-11,py-15+Math.sin(this.time*13)*(.5),22,26);
  const swingProgress=p.slash/.19;
  if(p.slash>0){
   const a=this.aim,angle=a+(.5-swingProgress)*2.6;
   ctx.save();ctx.translate(px,py);ctx.rotate(angle);
   ctx.strokeStyle='#fff5cf';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,29,-.62,.62);ctx.stroke();
   ctx.strokeStyle='#f5a45dbb';ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,28,-.42,.42);ctx.stroke();
   ctx.restore();
  }else{
   ctx.save();ctx.translate(px,py);ctx.rotate(this.aim);
   ctx.fillStyle='#bbb6a0';ctx.fillRect(6,-2,14,3);ctx.fillStyle='#f3e3be';ctx.fillRect(14,-2,7,1);ctx.fillStyle='#bd8057';ctx.fillRect(6,-5,3,9);ctx.restore();
  }
  for(const particle of this.particles){
   const x=ox+particle.x*T,y=oy+particle.y*T;ctx.globalAlpha=Math.min(1,particle.life/particle.max);
   ctx.fillStyle=particle.color;ctx.fillRect(Math.round(x),Math.round(y),particle.size,particle.size);
  }ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.font='bold 9px monospace';
  for(const f of this.floaters){ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle='#061014';ctx.fillText(f.text,ox+f.x*T+1,oy+f.y*T-19+1);ctx.fillStyle=f.color;ctx.fillText(f.text,ox+f.x*T,oy+f.y*T-19);}
  ctx.globalAlpha=1;ctx.textAlign='left';
  // In-canvas combat indicators.
  if(this.combo>1&&this.comboClock>0){
   ctx.textAlign='center';ctx.fillStyle='#fac37d';ctx.font='bold 14px monospace';ctx.fillText(this.combo+'× COMBO',320,51);ctx.textAlign='left';
  }
  if(this.flash>0){ctx.fillStyle='rgba(255,193,165,'+Math.min(.22,this.flash*2)+')';ctx.fillRect(0,0,640,400);}
  const vignette=ctx.createRadialGradient(320,200,110,320,200,365);
  vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#000000a8');ctx.fillStyle=vignette;ctx.fillRect(0,0,640,400);
  ctx.setTransform(1,0,0,1,0,0);
 }
 updateHUD(){
  const p=this.player;
  $('healthLabel').textContent=Math.ceil(p.hp)+' / '+p.maxHp;
  $('hpBar').style.width=clamp(p.hp/p.maxHp*100,0,100)+'%';
  $('dashBar').style.width=clamp(100*(1-p.dashCooldown/1.25),0,100)+'%';
  $('dashLabel').textContent=p.dashCooldown<=0?'READY':p.dashCooldown.toFixed(1)+'S';
  $('heroLevel').textContent=String(p.level).padStart(2,'0');
  $('depthStat').innerHTML=String(this.depth).padStart(2,'0')+' <small>/ ∞</small>';
  $('killStat').textContent=String(this.kills).padStart(3,'0');
  $('scoreStat').textContent=String(this.score).padStart(4,'0');
  $('comboStat').textContent='×'+(this.combo||1);
  $('bestDepth').textContent=this.best.depth?String(this.best.depth).padStart(2,'0'):'—';
  $('bestScore').textContent=this.best.score||'—';
 }
 loop(now){
  const dt=Math.min(.033,(now-this.last)/1000||0);this.last=now;this.frame++;
  if(this.frame%30===0){this.fps=Math.round(1/Math.max(.001,dt));$('gameFps').textContent=this.fps+' FPS';}
  this.step(dt);this.render();
  requestAnimationFrame(t=>this.loop(t));
 }
}
D.game=new Game();
})();