/* DUNGEON//RUN — shared asset pack. No libraries, no build step. */
(() => {
'use strict';
const D = window.DR = {};
D.W = 28; D.H = 17; D.T = 20; D.OX = 40; D.OY = 30;
D.STORAGE = 'dungeonrun.assets.v1';
D.$ = id => document.getElementById(id);
D.clone = value => JSON.parse(JSON.stringify(value));
D.uid = () => 'a' + Math.random().toString(36).slice(2,9);
D.clamp = (v,min,max) => Math.min(max,Math.max(min,v));
D.rand = (a,b) => a+Math.random()*(b-a);
D.dist = (a,b,c,d) => Math.hypot(a-c,b-d);
D.PALETTE = ['#141d26','#2a3c44','#405b60','#648079','#9bb5a1','#f0e4bf','#f5a45d','#de714b','#a63f42','#733b59','#56456e','#8574a0','#4f85a0','#75c8c1','#b2dfb4','#ffffff','#000000','#ef6b62','#d0bd7e','#395439','#437665','#f3c585','#a2bdcb','#d7e9db'];
D.pattern = (rows,colors) => {
 const px = [];
 for(let y=0;y<16;y++){const row=(rows[y]||'').padEnd(16,'.');for(let x=0;x<16;x++)px.push(colors[row[x]]||null);}
 return px;
};
function tile(kind){
 const px=[];let colors;
 const palettes={
 floor:['#293b3b','#304444','#374b48','#223335','#465650'],
 wall:['#354646','#3c5050','#49605a','#253638','#70817a'],
 stone:['#384949','#465859','#536760','#293d3f','#6b7363'],
 moss:['#263f35','#305342','#42664a','#21382f','#62865a'],
 lava:['#572b2c','#a4472f','#e16d36','#78362f','#f4a14a'],
 water:['#234751','#2a5d67','#387684','#1d3947','#65a4a9']
 };
 colors=palettes[kind]||palettes.floor;
 const seed=kind.split('').reduce((n,c)=>n+c.charCodeAt(0),0);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
   let h=(x*37+y*127+seed*79)^((x+seed)*y*71);h=Math.abs((h*1103515245+12345)|0);
   let p=h%11;let ix=p<2?1:p<4?2:p<9?0:3;
   if(kind==='wall'||kind==='stone'){const by=Math.floor(y/5);const joint=(x+(by%2)*8)%16;const edge=(y%5===0 || joint===0);ix=edge?3:(y%5===1?4:ix);}
   if(kind==='floor'){if(y%8===0 || (x+(Math.floor(y/8)%2)*8)%16===0)ix=3;else if(x%7===0&&y%4===2)ix=2;}
   if(kind==='moss'){if((x*9+y*13+seed)%23<6)ix=4;if(y%8===0)ix=3;}
   if(kind==='lava'){const v=Math.sin(x*.75+y*.35)+Math.sin(y*.9-x*.27);ix=v>1.1?4:v>.3?2:v>-.35?1:0;}
   if(kind==='water'){const v=Math.sin(x*.65-y*.8)+Math.sin(y*.65);ix=v>1.2?4:v>.5?2:v>-.8?1:3;}
   px.push(colors[ix]);
 }
 return px;
}
const ENEMIES=[
 {id:'slime',name:'Bog Slime',hp:26,speed:1.6,damage:8,ai:'chase',points:50,pixels:D.pattern([
'................','................','................','.....gggggg.....','...ggGGGGgg.....','..gGGGGGGGGg....','..gGGGGGGGGGg...','.gGGGGGGGGGGg...','.gGGwwGGwwGGg..','.gGGkkGGkkGGg..','.gGGGGGGGGGGg..','..gGGGGGGGGg....','..gggGGGggg.....','...gggggggg.....','................','................'],{g:'#427765',G:'#7bbf88',w:'#e7e8c5',k:'#1d2930'})},
 {id:'bat',name:'Crypt Bat',hp:18,speed:3.1,damage:6,ai:'chase',points:70,pixels:D.pattern([
'................','................','................','................','pp...........pp.','pPP.pPPPPp.PPp.','pPPPPPPPPPPPPp..','pPPPppPPppPPPPp.','.pPPwwPPwwPPp..','..pPPkkPPkkPp...','...pPPPPPPp.....','....pPPPPp......','.....pPPp.......','......pp........','................','................'],{p:'#553f69',P:'#99789e',w:'#e4cbac',k:'#a33f54'})},
 {id:'skeleton',name:'Bone Guard',hp:43,speed:1.85,damage:12,ai:'chase',points:110,pixels:D.pattern([
'................','.....cccccc.....','....cCCCCCCc....','....CwCwwCwC....','....CkCkkCkC....','....cCCCCCCc....','.....cCCcC......','......ccCc......','...s..CCCC..s...','...SCCCCCCCCS...','...S.CCCCC.S....','.....CCCCCC.....','......CC.CC.....','......CC.CC.....','.....cCc.cCc....','................'],{c:'#928d75',C:'#d7d2b2',w:'#e7e4ca',k:'#29353a',S:'#807868',s:'#645c52'})},
 {id:'wisp',name:'Ember Wisp',hp:32,speed:2.1,damage:10,ai:'ranged',points:130,pixels:D.pattern([
'................','.......o........','......oOo.......','......OOOo......','.....OOYYOo.....','....OOYYYYOo....','.....OYYYOo.....','...ooOYYYOOo....','....oOOkkOOo....','.....oOkkOoo....','......oOOOo.....','.....oOOOoo.....','.......oo.......','......o.........','................','................'],{o:'#9e4236',O:'#dc653e',Y:'#f6b05b',k:'#fff1b2'})},
 {id:'brute',name:'Iron Brute',hp:112,speed:1.1,damage:19,ai:'charge',points:250,pixels:D.pattern([
'................','...hhh....hhh...','..hHHHh..hHHHh..','..hHHHHHHHHHHh..','..HHHHHHHHHHHH..','...HrrHHHHrrH...','...HkkHHHHkkH...','..hHHHHHHHHHHh..','..hHbbbbbbbbHh..','..hHbbbbbbbbHh..','...HbbbbbbbbH...','...HbbbbbbbbH...','....bb....bb....','....bb....bb....','...bbb....bbb...','................'],{h:'#574e59',H:'#8b7b83',r:'#ed9061',k:'#26232b',b:'#655b64'})}
];
const PROPS=[
 {id:'urn',name:'Clay Urn',solid:true,breakable:true,hp:18,loot:15,pixels:D.pattern([
'................','................','.....oooooo.....','....oOOOOOOo....','.....oOOOOo.....','......OOOO......','.....oOOOOo.....','....oOOOOOOo....','....OOOOOOOO....','....OOooOOOO....','....OOOOOOOO....','....oOOOOOOo....','.....oooooo.....','......oooo......','................','................'],{o:'#704d41',O:'#bc8c68'})},
 {id:'barrel',name:'Old Barrel',solid:true,breakable:true,hp:24,loot:18,pixels:D.pattern([
'................','................','....bbbbbbbb....','...bBBBBBBBBb...','...bBBhhhhBBb...','...bBBBBBBBBb...','...bBBBBBBBBb...','...hhhhhhhhhh...','...bBBBBBBBBb...','...bBBBBBBBBb...','...bBBhhhhBBb...','...bBBBBBBBBb...','...bBBBBBBBBb...','....bbbbbbbb....','................','................'],{b:'#704a37',B:'#b07a48',h:'#435459'})},
 {id:'torch',name:'Wall Torch',solid:false,breakable:false,hp:1,loot:0,pixels:D.pattern([
'.......y........','......yYy.......','......YFYy......','.....yFFYY......','......YFY.......','.......y........','......sss.......','......sSs.......','......sSs.......','......sSs.......','......sSs.......','.......s........','................','................','................','................'],{y:'#f6a14f',Y:'#ec683d',F:'#ffe3a0',s:'#69584f',S:'#c4a06c'})},
 {id:'chest',name:'Treasure Chest',solid:true,breakable:true,hp:36,loot:65,pixels:D.pattern([
'................','................','................','...bbbbbbbbbb...','..bBBBBBBBBBBb..','..bBBBBBBBBBBb..','..bhhhhhhhhhhb..','..bBBBBBBBBBBb..','..bBBBByyBBBBb..','..bBBBBYYBBBBb..','..bBBBBYYBBBBb..','..bBBBBYYBBBBb..','..bbbbbbbbbbbb..','................','................','................'],{b:'#604331',B:'#be7b3c',h:'#433b3c',y:'#f9c574',Y:'#ffe6a3'})}
];
const TEXTURES=[
 {id:'floor',name:'Dungeon Floor',solid:false,damage:0,pixels:tile('floor')},
 {id:'wall',name:'Stone Wall',solid:true,damage:0,pixels:tile('wall')},
 {id:'stone',name:'Rough Stone',solid:false,damage:0,pixels:tile('stone')},
 {id:'moss',name:'Mossy Floor',solid:false,damage:0,pixels:tile('moss')},
 {id:'lava',name:'Molten Rock',solid:false,damage:16,pixels:tile('lava')},
 {id:'water',name:'Deep Water',solid:false,damage:0,pixels:tile('water')}
];
function room(id,name,theme,variant){
 const tiles=Array(D.W*D.H).fill(theme);
 for(let y=0;y<D.H;y++)for(let x=0;x<D.W;x++){
  if(x===0||y===0||x===D.W-1||y===D.H-1)tiles[y*D.W+x]='wall';
 }
 const paint=(x,y,kind)=>{if(x>0&&y>0&&x<D.W-1&&y<D.H-1)tiles[y*D.W+x]=kind};
 const block=(x,y,w,h,kind)=>{for(let iy=y;iy<y+h;iy++)for(let ix=x;ix<x+w;ix++)paint(ix,iy,kind)};
 if(variant===0){block(8,3,2,3,'wall');block(8,12,2,2,'wall');block(17,3,2,3,'wall');block(17,12,2,2,'wall');block(12,2,4,1,'stone');block(12,14,4,1,'stone');}
 if(variant===1){block(7,4,3,2,'wall');block(7,11,3,2,'wall');block(18,4,3,2,'wall');block(18,11,3,2,'wall');block(13,6,2,5,'moss');}
 if(variant===2){for(let x=7;x<22;x++) {paint(x,3,'water');paint(x,13,'water');}block(10,6,2,5,'wall');block(18,6,2,5,'wall');block(14,2,2,3,'stone');}
 if(variant===3){for(let x=9;x<21;x++){paint(x,4,'lava');paint(x,12,'lava');}block(13,6,2,2,'wall');block(13,10,2,2,'wall');}
 // Keep start and exit corridors clear.
 for(let x=1;x<7;x++)for(let y=7;y<=9;y++)paint(x,y,theme);
 for(let x=22;x<D.W-1;x++)for(let y=7;y<=9;y++)paint(x,y,theme);
 return {id,name,tiles,spawn:{x:2,y:8},exit:{x:25,y:8},enemies:[],props:[]};
}
const entrance=room('entrance','The Entrance','floor',0);
entrance.enemies=[{kind:'slime',x:12,y:7},{kind:'slime',x:15,y:10},{kind:'bat',x:21,y:8}];
entrance.props=[{kind:'torch',x:4,y:1},{kind:'torch',x:23,y:1},{kind:'urn',x:6,y:4},{kind:'barrel',x:23,y:12},{kind:'chest',x:14,y:13}];
const catacomb=room('catacomb','Bone Hall','stone',1);
catacomb.enemies=[{kind:'skeleton',x:12,y:5},{kind:'skeleton',x:16,y:11},{kind:'bat',x:22,y:4},{kind:'slime',x:23,y:12}];
catacomb.props=[{kind:'torch',x:4,y:1},{kind:'torch',x:24,y:1},{kind:'urn',x:12,y:12},{kind:'barrel',x:5,y:13},{kind:'chest',x:23,y:13}];
const aqueduct=room('aqueduct','The Sunken Pass','moss',2);
aqueduct.enemies=[{kind:'bat',x:13,y:8},{kind:'wisp',x:22,y:5},{kind:'slime',x:6,y:12},{kind:'skeleton',x:23,y:11}];
aqueduct.props=[{kind:'torch',x:4,y:1},{kind:'torch',x:23,y:1},{kind:'urn',x:8,y:8},{kind:'chest',x:23,y:12}];
const ember=room('ember','The Ember Vault','stone',3);
ember.enemies=[{kind:'wisp',x:9,y:8},{kind:'brute',x:18,y:8},{kind:'skeleton',x:23,y:4},{kind:'wisp',x:23,y:12}];
ember.props=[{kind:'torch',x:5,y:1},{kind:'torch',x:23,y:1},{kind:'barrel',x:6,y:11},{kind:'chest',x:23,y:12}];
D.defaults=()=>({version:1,texture:D.clone(TEXTURES),enemy:D.clone(ENEMIES),prop:D.clone(PROPS),room:D.clone([entrance,catacomb,aqueduct,ember])});
D.validate=data=>{
 if(!data||!['texture','enemy','prop','room'].every(k=>Array.isArray(data[k])&&data[k].length&&data[k].length<150))throw new Error('Pack must contain rooms, textures, enemies and props.');
 for(const mode of ['texture','enemy','prop'])for(const a of data[mode]){
  if(typeof a.id!=='string'||typeof a.name!=='string'||!Array.isArray(a.pixels)||a.pixels.length!==256)throw new Error('Invalid pixel asset.');
  a.name=a.name.slice(0,32); a.pixels=a.pixels.map(c=>typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)?c:null);
 }
 for(const r of data.room){
  if(typeof r.id!=='string'||typeof r.name!=='string'||!Array.isArray(r.tiles)||r.tiles.length!==D.W*D.H)throw new Error('Invalid room.');
  r.name=r.name.slice(0,32);r.spawn=r.spawn||{x:2,y:8};r.exit=r.exit||{x:25,y:8};
  r.enemies=Array.isArray(r.enemies)?r.enemies.slice(0,100):[];
  r.props=Array.isArray(r.props)?r.props.slice(0,100):[];
 }
 return data;
};
try{D.assets=D.validate(JSON.parse(localStorage.getItem(D.STORAGE)))}catch(e){D.assets=D.defaults();}
D.save=()=>{try{localStorage.setItem(D.STORAGE,JSON.stringify(D.assets));}catch(e){D.toast('Storage full: export your pack to back it up.')}};
D.find=(kind,id)=>D.assets[kind].find(a=>a.id===id);
let cache=new WeakMap();
D.clearCache=()=>{cache=new WeakMap();};
D.sprite=pixels=>{
 if(!pixels)return null;
 let c=cache.get(pixels);if(c)return c;
 c=document.createElement('canvas');c.width=c.height=16;
 const ctx=c.getContext('2d');
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){const p=pixels[y*16+x];if(p){ctx.fillStyle=p;ctx.fillRect(x,y,1,1);}}
 cache.set(pixels,c);return c;
};
D.draw=(ctx,pixels,x,y,w,h=w)=>{const image=D.sprite(pixels);if(image){ctx.imageSmoothingEnabled=false;ctx.drawImage(image,Math.round(x),Math.round(y),Math.round(w),Math.round(h));}};
D.hero=D.pattern([
'................','.......hh.......','......hhhh......','......hHHh......','.....shwwhs.....','.....sHkkHs.....','......sHHs......','......ccCc......','.....bCCCCb.....','....bbCCCCbb....','....bbCCCCbb....','......CCCC......','......b..b......','.....bb..bb.....','.....bb..bb.....','................'],{h:'#554f50',H:'#d4b99a',s:'#b78965',w:'#eacba2',k:'#302b35',b:'#455c6b',c:'#c78b60',C:'#91b5a3'});
let toastTimer;
D.toast=msg=>{const el=D.$('notification');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);};
D.download=(name,text)=>{const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
D.openView=name=>{
 document.querySelectorAll('.view').forEach(e=>e.classList.toggle('active',e.id===(name==='play'?'playView':'workshopView')));
 document.querySelectorAll('.nav-btn').forEach(e=>e.classList.toggle('selected',e.dataset.view===name));
 if(name==='workshop'&&D.editor)D.editor.refresh();
 window.scrollTo({top:0,behavior:'instant'});
};
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>D.openView(b.dataset.view)));
D.$('openWorkshopBtn').onclick=D.$('asideWorkshopBtn').onclick=()=>D.openView('workshop');
D.$('helpBtn').onclick=()=>D.$('helpDialog').showModal();
D.$('exportBtn').onclick=()=>{D.download('dungeonrun-world.json',JSON.stringify(D.assets,null,2));D.toast('WORLD PACK EXPORTED');};
D.$('importBtn').onclick=()=>D.$('importInput').click();
D.$('importInput').addEventListener('change',async e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>3000000){D.toast('That pack is too large.');return;}
 try{const data=D.validate(JSON.parse(await f.text()));D.assets=data;D.save();D.clearCache();D.editor.refresh(true);D.toast('WORLD PACK IMPORTED');}catch(err){D.toast('Import failed: '+err.message);}
});
D.$('heroPortrait').getContext('2d').imageSmoothingEnabled=false;
D.draw(D.$('heroPortrait').getContext('2d'),D.hero,0,0,48,48);
})();