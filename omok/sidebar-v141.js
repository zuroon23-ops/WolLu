/* WolLu 1.4.2 — only local UI state; no Firebase or gameplay changes. */
(()=>{
 'use strict';
 const byId=id=>document.getElementById(id), side=byId('commonSide');
 const panels=[byId('peoplePanel'),byId('lobbySide'),byId('gameSide')];
 const bodies=[byId('people'),byId('lobbyChatBody'),byId('gameChatBody')];
 const handles=[byId('splitPeople'),byId('splitChat')];
 const gamePanel=byId('gamePanel'), tools=side.querySelector('.sideTools');
 const KEY='wollu-omok-sidebar-v141';
 const defaults=()=>({lobby:[0.27,0.73],room:[0.2,0.4,0.4]});
 let weights=defaults(),frame=0,drag=null,layout=null;
 try{const saved=JSON.parse(localStorage.getItem(KEY));for(const k of ['lobby','room'])if(Array.isArray(saved?.[k])&&saved[k].length===weights[k].length&&saved[k].every(x=>Number.isFinite(x)&&x>0))weights[k]=saved[k];}catch{}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(weights));}catch{}};
 const isRoom=()=>!gamePanel.hidden&&!panels[2].hidden;
 const mode=()=>isRoom()?'room':'lobby';
 const size=el=>el.getBoundingClientRect().height;
 const collapsed=i=>bodies[i].hidden;
 // Preserve a usable header and input at the smallest size, with independent message scrolling.
 function minimum(i){const p=panels[i],ps=getComputedStyle(p),body=bodies[i],density=Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'))||1;const px=(style,key)=>parseFloat(style[key])||0;const edges=px(ps,'paddingTop')+px(ps,'paddingBottom')+px(ps,'borderTopWidth')+px(ps,'borderBottomWidth');const head=size(p.querySelector('.sideHead'));if(collapsed(i))return Math.ceil(head+edges);if(i===0)return Math.ceil(Math.max(84*density,head+edges+px(ps,'gap')+24*density));const log=body.querySelector('.chatLog');const other=[...body.children].filter(e=>e!==log&&!e.hidden);const gap=px(getComputedStyle(body),'gap');return Math.ceil(head+edges+px(ps,'gap')+other.reduce((a,e)=>a+size(e),0)+gap*other.length+32*density); }
 function allocate(total, mins, ws, expanded){const out=[...mins];let remainder=Math.max(0,total-mins.reduce((a,b)=>a+b,0));let active=[...expanded];if(!active.length)return out;let pool=remainder+active.reduce((a,i)=>a+mins[i],0);while(active.length){const sum=active.reduce((a,i)=>a+ws[i],0);const clamped=active.filter(i=>pool*ws[i]/sum<mins[i]);if(!clamped.length){active.forEach(i=>out[i]=pool*ws[i]/sum);break;}clamped.forEach(i=>{out[i]=mins[i];pool-=mins[i];});active=active.filter(i=>!clamped.includes(i));}return out;}
 function render(){frame=0;const room=isRoom(),k=room?'room':'lobby',n=room?3:2;side.classList.toggle('in-room',room);const mins=Array.from({length:n},(_,i)=>minimum(i)), expanded=Array.from({length:n},(_,i)=>i).filter(i=>!collapsed(i));const available=Math.max(0,side.clientHeight-size(tools)-handles.slice(0,n-1).reduce((a,e)=>a+size(e),0));const total=Math.max(available,mins.reduce((a,b)=>a+b,0));const heights=allocate(total,mins,weights[k],expanded);
 panels.slice(0,n).forEach((p,i)=>{p.style.height=heights[i]+'px';p.style.flexBasis=heights[i]+'px';});
 handles.forEach((h,i)=>{const disabled=i>=n-1||collapsed(i)||collapsed(i+1)||heights[i]+heights[i+1]-mins[i]-mins[i+1]<1;h.setAttribute('aria-disabled',String(disabled));h.tabIndex=disabled?-1:0;if(i<n-1){h.setAttribute('aria-valuemin',String(Math.round(mins[i])));h.setAttribute('aria-valuemax',String(Math.round(heights[i]+heights[i+1]-mins[i+1])));h.setAttribute('aria-valuenow',String(Math.round(heights[i])));h.setAttribute('aria-valuetext',Math.round(heights[i])+' 픽셀');}});
 layout={k,n,mins,expanded,heights,total};}
 function schedule(){if(!frame)frame=requestAnimationFrame(render);}
 function change(i,delta,base){if(!base||mode()!==base.k||collapsed(i)||collapsed(i+1))return;const heights=[...base.heights];const move=Math.max(base.mins[i]-heights[i],Math.min(delta,heights[i+1]-base.mins[i+1]));heights[i]+=move;heights[i+1]-=move;const ws=weights[base.k];const sum=base.expanded.reduce((a,j)=>a+ws[j],0);const hsum=base.expanded.reduce((a,j)=>a+heights[j],0);base.expanded.forEach(j=>{ws[j]=Math.max(.0001,sum*heights[j]/hsum);});render();}
 for(const [i,h] of handles.entries()){
 h.addEventListener('pointerdown',e=>{if(e.button!==0||h.getAttribute('aria-disabled')==='true'||drag)return;e.preventDefault();drag={i,id:e.pointerId,start:e.clientY,base:layout};h.setPointerCapture(e.pointerId);h.classList.add('dragging');document.documentElement.classList.add('sidebar-dragging');});
 h.addEventListener('pointermove',e=>{if(drag?.i===i&&drag.id===e.pointerId)change(i,e.clientY-drag.start,drag.base);});
 const finish=e=>{if(drag?.i!==i||drag.id!==e.pointerId)return;drag=null;h.classList.remove('dragging');document.documentElement.classList.remove('sidebar-dragging');save();schedule();};
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])h.addEventListener(ev,finish);
 h.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown'].includes(e.key)||h.getAttribute('aria-disabled')==='true')return;e.preventDefault();change(i,(e.key==='ArrowUp'?-1:1)*(e.shiftKey?40:12),layout);save();});
 }
 byId('togglePeople').addEventListener('click',()=>{bodies[0].hidden=!bodies[0].hidden;const b=byId('togglePeople');b.textContent=bodies[0].hidden?'펼치기':'접기';b.setAttribute('aria-expanded',String(!bodies[0].hidden));schedule();});
 byId('resetSidebar').addEventListener('click',()=>{weights=defaults();save();if(bodies[0].hidden)byId('togglePeople').click();for(const [i,t] of [[1,'toggleLobbyChat'],[2,'toggleGameChat']])if(bodies[i].hidden)byId(t).click();schedule();});
 const observer=new MutationObserver(schedule);for(const e of [...bodies,gamePanel,panels[2],byId('lobbyNew'),byId('gameNew')])observer.observe(e,{attributes:true,attributeFilter:['hidden']});
 if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(schedule);ro.observe(side);ro.observe(document.querySelector('header'));}
 window.addEventListener('resize',schedule);schedule();
})();
