/* DUNGEON//RUN Workshop — rooms, textures, enemies and props */
(() => {
'use strict';
const D=window.DR,$=D.$,M=['room','texture','enemy','prop'],esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class Workshop {
 constructor(){
  this.mode='room';this.selected={};this.tool='pencil';this.layer='tile';this.brush='wall';this.color=D.PALETTE[6];this.showGrid=true;this.mirror=false;this.painting=false;
  this.history=[];this.future=[];this.hover=null;this.canvas=$('editorCanvas');this.ctx=this.canvas.getContext('2d');
  for(const m of M)this.selected[m]=D.assets[m][0]?.id;
  this.hook();this.refresh(true);
 }
 asset(){return D.find(this.mode,this.selected[this.mode])||D.assets[this.mode][0];}
 historyEntry(){return {mode:this.mode,id:this.asset().id,data:D.clone(this.asset())};}
 checkpoint(){this.history.push(this.historyEntry());if(this.history.length>60)this.history.shift();this.future=[];}
 restore(entry){const list=D.assets[entry.mode],index=list.findIndex(a=>a.id===entry.id);if(index>=0){list[index]=D.clone(entry.data);D.clearCache();D.save();this.refresh();}}
 undo(){if(!this.history.length)return;const e=this.history.pop(),list=D.assets[e.mode],current=list.find(a=>a.id===e.id);if(current)this.future.push({mode:e.mode,id:e.id,data:D.clone(current)});this.mode=e.mode;this.selected[e.mode]=e.id;this.restore(e);this.refresh(true);}
 redo(){if(!this.future.length)return;const e=this.future.pop(),list=D.assets[e.mode],current=list.find(a=>a.id===e.id);if(current)this.history.push({mode:e.mode,id:e.id,data:D.clone(current)});this.mode=e.mode;this.selected[e.mode]=e.id;this.restore(e);this.refresh(true);}
 hook(){
  document.querySelectorAll('.workshop-tab').forEach(b=>b.addEventListener('click',()=>this.setMode(b.dataset.mode)));
  $('newAssetBtn').onclick=()=>this.create();
  $('duplicateAssetBtn').onclick=()=>this.duplicate();
  $('deleteAssetBtn').onclick=()=>this.remove();
  $('resetPackBtn').onclick=()=>{if(confirm('Restore all built-in rooms and sprites? Custom changes will be lost unless exported.')){D.assets=D.defaults();D.clearCache();D.save();this.history=[];this.future=[];this.refresh(true);D.toast('DEFAULT WORLD RESTORED');}};
  $('undoBtn').onclick=()=>this.undo();$('redoBtn').onclick=()=>this.redo();
  $('gridBtn').onclick=()=>{this.showGrid=!this.showGrid;$('gridBtn').classList.toggle('active-tool',this.showGrid);this.draw();};
  $('assetNameInput').addEventListener('change',e=>{const val=e.target.value.trim();if(!val)return;this.checkpoint();this.asset().name=val.slice(0,32);this.changed();this.renderAssets();this.syncTitle();});
  $('paletteRow').addEventListener('click',e=>{const sw=e.target.closest('[data-color]');if(!sw)return;this.color=sw.dataset.color;this.renderPalette();});
  $('customColor').addEventListener('input',e=>{this.color=e.target.value;this.renderPalette();});
  $('eyedropperBtn').onclick=()=>{this.tool='picker';this.renderControls();D.toast('CLICK A PIXEL TO PICK ITS COLOR');};
  const cv=this.canvas;
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('pointerdown',e=>{
   if(e.button!==0&&e.button!==2)return;e.preventDefault();cv.setPointerCapture(e.pointerId);
   this.painting=true;this.paintButton=e.button;this.lastCoord=null;const c=this.coords(e);this.hover=c;
   if(this.tool!=='picker')this.checkpoint();
   this.apply(c.x,c.y,e.button);this.draw();
  });
  cv.addEventListener('pointermove',e=>{
   const c=this.coords(e);this.hover=c;$('editorCoord').textContent='X: '+String(c.x).padStart(2,'0')+'  Y: '+String(c.y).padStart(2,'0');
   if(this.painting&&this.tool!=='bucket'&&this.tool!=='picker')this.apply(c.x,c.y,this.paintButton);
   this.draw();
  });
  const release=()=>{if(this.painting){this.painting=false;this.changed();this.renderAssets();}};
  cv.addEventListener('pointerup',release);cv.addEventListener('pointercancel',release);cv.addEventListener('pointerleave',()=>{this.hover=null;this.draw();});
  window.addEventListener('keydown',e=>{
   if(!$('workshopView').classList.contains('active')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?this.redo():this.undo();}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();this.redo();}
   if(e.key==='b'){this.tool='pencil';this.renderControls();}
   if(e.key==='e'){this.tool='eraser';this.renderControls();}
  });
  $('playCustomBtn').onclick=()=>{D.game.previewRoomId=this.selected.room;D.openView('play');D.game.start();};
 }
 changed(){D.clearCache();D.save();this.draw();}
 setMode(mode){
  if(!M.includes(mode))return;this.mode=mode;this.tool='pencil';this.hover=null;
  document.querySelectorAll('.workshop-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  this.refresh();
 }
 refresh(reset=false){
  if(reset){for(const m of M)if(!D.find(m,this.selected[m]))this.selected[m]=D.assets[m][0]?.id;}
  else if(!this.asset())this.selected[this.mode]=D.assets[this.mode][0]?.id;
  document.querySelectorAll('.workshop-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===this.mode));
  this.canvas.width=this.mode==='room'?560:320;this.canvas.height=this.mode==='room'?340:320;
  $('editorArtboard').classList.toggle('pixel-mode',this.mode!=='room');
  $('paletteSection').style.display=this.mode==='room'?'none':'';
  const titles={room:'ROOMS',texture:'TEXTURES',enemy:'ENEMIES',prop:'PROPS'};
  $('assetTitle').textContent=titles[this.mode];
  $('assetCount').textContent=String(D.assets[this.mode].length).padStart(2,'0')+' ASSETS';
  $('assetNameInput').value=this.asset()?.name||'';
  $('editorHint').textContent=this.mode==='room'?'DRAG TO PAINT • SWITCH LAYERS TO PLACE ENEMIES & PROPS':'16 × 16 PIXELS • DRAG TO DRAW • RIGHT CLICK TO ERASE';
  $('paletteNote').textContent='16 × 16 / TRUE PIXEL ART';
  this.syncTitle();this.renderAssets();this.renderControls();this.renderPalette();this.draw();
 }
 syncTitle(){
  const asset=this.asset();$('editorTitle').textContent=asset?.name||'UNTITLED';
  $('editorContextTag').textContent=this.mode.toUpperCase()+' / '+String(D.assets[this.mode].findIndex(a=>a.id===asset?.id)+1).padStart(2,'0');
 }
 renderAssets(){
  const list=$('assetList');list.replaceChildren();const kind=this.mode;
  for(const a of D.assets[kind]){
   const button=document.createElement('button');button.type='button';button.className='asset-item'+(a.id===this.selected[kind]?' active':'');
   const thumb=document.createElement('canvas');thumb.width=thumb.height=35;thumb.className='asset-thumb';const ctx=thumb.getContext('2d');
   if(kind==='room'){
    const t=35/D.W;
    for(let y=0;y<D.H;y++)for(let x=0;x<D.W;x++){
     const id=a.tiles[y*D.W+x];const tex=D.find('texture',id);ctx.fillStyle=tex?.solid?'#6b8072':id==='lava'?'#d5673d':id==='water'?'#3b8e9c':'#354e4b';ctx.fillRect(x*t,y*(35/D.H),t+1,35/D.H+1);
    }
   }else D.draw(ctx,a.pixels,0,0,35,35);
   const labels={room:'EDIT ROOM',texture:'16 × 16 TEXTURE',enemy:'16 × 16 SPRITE',prop:'16 × 16 SPRITE'};
   const body=document.createElement('span');body.className='asset-name';body.textContent=a.name.toUpperCase();
   const sub=document.createElement('span');sub.className='asset-sub';sub.textContent=labels[kind];body.appendChild(sub);
   button.append(thumb,body);button.onclick=()=>{this.selected[kind]=a.id;this.tool='pencil';this.hover=null;this.refresh();};
   list.appendChild(button);
  }
  $('assetCount').textContent=String(D.assets[kind].length).padStart(2,'0')+' ASSETS';
  $('deleteAssetBtn').disabled=D.assets[kind].length<=1;
 }
 renderPalette(){
  const container=$('paletteRow');container.replaceChildren();
  for(const c of D.PALETTE){
   const b=document.createElement('button');b.className='palette-swatch'+(this.color.toLowerCase()===c.toLowerCase()?' selected':'');
   b.dataset.color=c;b.style.background=c;b.title=c;container.appendChild(b);
  }
  $('customColor').value=this.color;
 }
 makeSection(label){const el=document.createElement('div');el.className='control-section';const h=document.createElement('div');h.className='pane-title';h.textContent=label;el.append(h);return el;}
 makeToolGrid(target,options,current,callback,cls='tool-btn'){
  const el=document.createElement('div');el.className=cls==='brush-btn'?'brush-list':'tool-row';
  for(const opt of options){const b=document.createElement('button');b.type='button';b.className=cls+(current===opt.value?' active':'');b.textContent=opt.label;b.onclick=()=>{callback(opt.value);this.renderControls();};el.appendChild(b);}
  target.appendChild(el);
 }
 makeBrushes(section,kind){
  const items=D.assets[kind],box=document.createElement('div');box.className='brush-list';
  if(!items.find(a=>a.id===this.brush))this.brush=items[0]?.id;
  for(const a of items){
   const b=document.createElement('button');b.className='brush-btn'+(this.brush===a.id?' active':'');b.title=a.name;
   const cv=document.createElement('canvas');cv.width=cv.height=24;
   D.draw(cv.getContext('2d'),a.pixels,0,0,24,24);
   const span=document.createElement('span');span.textContent=a.name;
   b.append(cv,span);b.onclick=()=>{this.brush=a.id;this.renderControls();};box.appendChild(b);
  }
  section.appendChild(box);
 }
 range(section,label,key,min,max,step,unit=''){
  const a=this.asset(),row=document.createElement('label');row.className='range-label';row.textContent=label;
  const num=document.createElement('strong');num.textContent=(a[key]??min)+unit;row.append(num);
  const input=document.createElement('input');input.type='range';input.className='range-field';input.min=min;input.max=max;input.step=step;input.value=a[key]??min;
  let snapshot=false;
  input.addEventListener('pointerdown',()=>{this.checkpoint();snapshot=true;});
  input.addEventListener('input',()=>{if(!snapshot){this.checkpoint();snapshot=true;}a[key]=Number(input.value);num.textContent=a[key]+unit;this.changed();});
  input.addEventListener('change',()=>snapshot=false);
  section.append(row,input);
 }
 toggle(section,label,key){
  const a=this.asset(),row=document.createElement('label');row.className='toggle-row';const title=document.createElement('span');title.textContent=label;
  const check=document.createElement('input');check.type='checkbox';check.checked=!!a[key];check.onchange=()=>{this.checkpoint();a[key]=check.checked;this.changed();};row.append(title,check);section.append(row);
 }
 select(section,label,key,values){
  const a=this.asset(),lab=document.createElement('label');lab.className='field-label';lab.textContent=label;
  const s=document.createElement('select');s.className='select-field';
  for(const [value,text] of values){const o=document.createElement('option');o.value=value;o.textContent=text;s.appendChild(o);}
  s.value=a[key]||values[0][0];s.onchange=()=>{this.checkpoint();a[key]=s.value;this.changed();};section.append(lab,s);
 }
 renderControls(){
  const root=$('modeControls');root.replaceChildren();const mode=this.mode;
  if(mode==='room'){
   const section=this.makeSection('PAINT LAYER');
   this.makeToolGrid(section,[{value:'tile',label:'▦ TILES'},{value:'enemy',label:'♟ ENEMIES'},{value:'prop',label:'✤ PROPS'},{value:'spawn',label:'⌖ SPAWN'},{value:'exit',label:'↗ EXIT'},{value:'erase',label:'⌫ ERASE'}],this.layer,v=>{this.layer=v;this.brush=v==='tile'?'wall':D.assets[v]?.[0]?.id;},'tool-btn');root.appendChild(section);
   if(['tile','enemy','prop'].includes(this.layer)){const brush=this.makeSection(this.layer==='tile'?'TILE MATERIAL':this.layer==='enemy'?'ENEMY TYPE':'PROP TYPE');this.makeBrushes(brush,this.layer==='tile'?'texture':this.layer);root.appendChild(brush);}
   if(['tile','erase'].includes(this.layer)){
    const tools=this.makeSection('BRUSH TOOL');
    this.makeToolGrid(tools,[{value:'pencil',label:'✎ DRAW'},{value:'bucket',label:'◈ FILL'}],this.tool,v=>this.tool=v);
    root.append(tools);
   }
   const hint=document.createElement('p');hint.className='small-note';hint.textContent='Place the spawn and exit markers on walkable tiles. Defeat all enemies to unlock the exit. Rooms are played in the order shown on the left.';root.append(hint);
  }else{
   const tools=this.makeSection('PIXEL TOOLS');this.makeToolGrid(tools,[{value:'pencil',label:'✎ PENCIL'},{value:'eraser',label:'⌫ ERASER'},{value:'bucket',label:'◈ FILL'},{value:'picker',label:'⌾ PICK'}],this.tool,v=>this.tool=v);root.append(tools);
   const mirror=this.makeSection('SYMMETRY');const row=document.createElement('label');row.className='toggle-row';row.textContent='MIRROR HORIZONTALLY';const inp=document.createElement('input');inp.type='checkbox';inp.checked=this.mirror;inp.onchange=()=>{this.mirror=inp.checked;};row.append(inp);mirror.append(row);root.append(mirror);
   const settings=this.makeSection(mode==='texture'?'TILE PHYSICS':mode==='enemy'?'ENEMY BEHAVIOR':'PROP BEHAVIOR');
   if(mode==='texture'){this.toggle(settings,'BLOCKS MOVEMENT','solid');this.range(settings,'CONTACT DAMAGE','damage',0,50,1);}
   if(mode==='enemy'){this.select(settings,'MOVEMENT AI','ai',[['chase','Pursue player'],['ranged','Keep distance + shoot'],['charge','Charge attacks']]);this.range(settings,'HEALTH','hp',1,300,1);this.range(settings,'MOVE SPEED','speed',.5,6,.1);this.range(settings,'ATTACK DAMAGE','damage',1,50,1);this.range(settings,'SOUL REWARD','points',0,500,10);}
   if(mode==='prop'){this.toggle(settings,'SOLID / COLLIDABLE','solid');this.toggle(settings,'DESTRUCTIBLE','breakable');this.range(settings,'DURABILITY','hp',1,150,1);this.range(settings,'SOUL DROP','loot',0,150,5);}
   root.append(settings);
   const preview=this.makeSection('QUICK ACTIONS');
   const button=document.createElement('button');button.className='secondary-btn full';button.textContent='↓ SAVE SPRITE PNG';button.onclick=()=>{
    const asset=this.asset(),c=D.sprite(asset.pixels),a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=asset.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.png';a.click();
   };preview.appendChild(button);root.append(preview);
   const hint=document.createElement('p');hint.className='small-note';hint.textContent='Every pixel maps directly to the sprite used in the game. Transparent pixels stay transparent. Right-click erases; paint with your finger on mobile.';root.append(hint);
  }
 }
 coords(e){
  const r=this.canvas.getBoundingClientRect();
  const xx=(e.clientX-r.left)*this.canvas.width/r.width,yy=(e.clientY-r.top)*this.canvas.height/r.height;
  const x=Math.floor(xx/20),y=Math.floor(yy/20);
  return{x:D.clamp(x,0,(this.mode==='room'?D.W:16)-1),y:D.clamp(y,0,(this.mode==='room'?D.H:16)-1)};
 }
 apply(x,y,button){
  const asset=this.asset(),right=button===2;
  if(this.mode==='room'){
   const index=y*D.W+x;
   const layer=right?'erase':this.layer;
   if(this.tool==='bucket'&&(layer==='tile'||layer==='erase')){
    const dest=layer==='erase'?'floor':this.brush,old=asset.tiles[index];if(old!==dest){
     const queue=[[x,y]],seen=new Set();
     while(queue.length){const p=queue.pop(),cx=p[0],cy=p[1],key=cy*D.W+cx;if(cx<0||cy<0||cx>=D.W||cy>=D.H||seen.has(key)||asset.tiles[key]!==old)continue;seen.add(key);asset.tiles[key]=dest;queue.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);}
    }
   }else if(layer==='tile'){asset.tiles[index]=this.brush;}
   else if(layer==='spawn'||layer==='exit'){asset[layer]={x,y};if(D.find('texture',asset.tiles[index])?.solid)asset.tiles[index]='floor';}
   else if(layer==='enemy'||layer==='prop'){
    if(this.lastCoord===index)return;
    const list=asset[layer==='enemy'?'enemies':'props'];const found=list.findIndex(p=>p.x===x&&p.y===y);
    if(found>=0)list.splice(found,1);list.push({kind:this.brush,x,y});
    if(D.find('texture',asset.tiles[index])?.solid)asset.tiles[index]='floor';
   }else if(layer==='erase'){
    const enemy=asset.enemies.findIndex(p=>p.x===x&&p.y===y),prop=asset.props.findIndex(p=>p.x===x&&p.y===y);
    if(enemy>=0)asset.enemies.splice(enemy,1);else if(prop>=0)asset.props.splice(prop,1);else asset.tiles[index]='floor';
   }
   this.lastCoord=index;
  }else{
   const pixels=asset.pixels,i=y*16+x;
   if(this.tool==='picker'&&!right){if(pixels[i]){this.color=pixels[i];this.renderPalette();}this.tool='pencil';this.renderControls();return;}
   const v=right||this.tool==='eraser'?null:this.color;
   if(this.tool==='bucket'){
    const old=pixels[i];if(old===v)return;const stack=[i],seen=new Set();
    while(stack.length){const j=stack.pop();if(j<0||j>=256||seen.has(j)||pixels[j]!==old)continue;seen.add(j);pixels[j]=v;
     const px=j%16,py=Math.floor(j/16);if(px>0)stack.push(j-1);if(px<15)stack.push(j+1);if(py>0)stack.push(j-16);if(py<15)stack.push(j+16);
    }
   }else{
    pixels[i]=v;
    if(this.mirror)pixels[y*16+(15-x)]=v;
   }
  }
  D.clearCache();
 }
 draw(){
  const a=this.asset();if(!a)return;
  const ctx=this.ctx;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
  const p=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  if(this.mode==='room'){
   for(let y=0;y<D.H;y++)for(let x=0;x<D.W;x++){
    const tex=D.find('texture',a.tiles[y*D.W+x]);if(tex){D.draw(ctx,tex.pixels,x*20,y*20,20,20);if(tex.solid){p(x*20,y*20,20,2,'#ffffff20');p(x*20,y*20+17,20,3,'#00000065');}}
    else p(x*20,y*20,20,20,'#233637');
   }
   for(const item of a.props){const spr=D.find('prop',item.kind);if(spr)D.draw(ctx,spr.pixels,item.x*20,item.y*20,20,20);}
   for(const item of a.enemies){const spr=D.find('enemy',item.kind);if(spr)D.draw(ctx,spr.pixels,item.x*20,item.y*20,20,20);}
   const mark=(pos,color,symbol)=>{
    if(!pos)return;const x=pos.x*20,y=pos.y*20;
    p(x,y,20,20,color+'66');ctx.strokeStyle=color;ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,18,18);ctx.fillStyle='#fff';ctx.font='bold 15px monospace';ctx.fillText(symbol,x+5,y+15);
   };
   mark(a.spawn,'#82e5b4','S');mark(a.exit,'#f6bd74','↗');
   if(this.showGrid){ctx.strokeStyle='#b1d0b016';ctx.lineWidth=.5;ctx.beginPath();for(let x=0;x<=D.W;x++){ctx.moveTo(x*20+.5,0);ctx.lineTo(x*20+.5,340);}for(let y=0;y<=D.H;y++){ctx.moveTo(0,y*20+.5);ctx.lineTo(560,y*20+.5);}ctx.stroke();}
  }else{
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const c=a.pixels[y*16+x];p(x*20,y*20,20,20,c||((x+y)%2?'#27363b':'#1c292e'));
   }
   if(this.showGrid){ctx.beginPath();ctx.strokeStyle='#d0e2df35';ctx.lineWidth=.6;for(let i=0;i<=16;i++){ctx.moveTo(i*20+.5,0);ctx.lineTo(i*20+.5,320);ctx.moveTo(0,i*20+.5);ctx.lineTo(320,i*20+.5);}ctx.stroke();}
  }
  if(this.hover){
   const {x,y}=this.hover;ctx.lineWidth=2;ctx.strokeStyle='#ffcf81';ctx.strokeRect(x*20+1,y*20+1,18,18);
   if(this.mode!=='room'&&this.mirror){ctx.strokeStyle='#80c7bc';ctx.strokeRect((15-x)*20+2,y*20+2,16,16);}
  }
 }
 create(){
  let asset;
  if(this.mode==='room'){
   const tiles=Array(D.W*D.H).fill('floor');for(let y=0;y<D.H;y++)for(let x=0;x<D.W;x++)if(x===0||y===0||x===D.W-1||y===D.H-1)tiles[y*D.W+x]='wall';
   asset={id:D.uid(),name:'Untitled Room',tiles,spawn:{x:2,y:8},exit:{x:25,y:8},enemies:[],props:[]};
  }else{
   const src=D.assets[this.mode][0];asset=D.clone(src);asset.id=D.uid();asset.name='New '+({texture:'Texture',enemy:'Enemy',prop:'Prop'}[this.mode]);
   asset.pixels=this.mode==='texture'?Array(256).fill('#2a3c44'):Array(256).fill(null);
  }
  D.assets[this.mode].push(asset);this.selected[this.mode]=asset.id;D.save();this.refresh();D.toast('NEW ASSET CREATED');
 }
 duplicate(){
  const a=D.clone(this.asset());a.id=D.uid();a.name=('Copy of '+a.name).slice(0,32);D.assets[this.mode].push(a);this.selected[this.mode]=a.id;D.save();this.refresh();D.toast('ASSET DUPLICATED');
 }
 remove(){
  const list=D.assets[this.mode];if(list.length<=1)return;
  if(!confirm('Delete '+this.asset().name+'? This cannot be undone.'))return;
  const index=list.findIndex(a=>a.id===this.selected[this.mode]);if(index<0)return;
  list.splice(index,1);this.selected[this.mode]=list[Math.max(0,index-1)].id;
  D.save();D.clearCache();this.refresh();D.toast('ASSET DELETED');
 }
}
D.editor=new Workshop();
})();