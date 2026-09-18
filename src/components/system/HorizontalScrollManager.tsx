import { useEffect } from 'react';

const SELECTOR='[data-horizontal-scroll],.nmis-table-scroll,.nmis-tab-scroll,.overflow-x-auto,.overflow-x-scroll';

function editable(t:EventTarget|null){const e=t instanceof HTMLElement?t:null;return !!e&&(e.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.tagName));}
function find(t:EventTarget|null){let e=t instanceof HTMLElement?t:null;while(e&&e!==document.body){if(!e.hasAttribute('data-horizontal-scroll-proxy')&&e.scrollWidth>e.clientWidth+1&&['auto','scroll','overlay'].includes(getComputedStyle(e).overflowX))return e;e=e.parentElement;}return null;}

export default function HorizontalScrollManager(){
 useEffect(()=>{let active:HTMLElement|null=null,bar:HTMLDivElement|null=null,inner:HTMLDivElement|null=null,raf=0;
 const make=()=>{if(bar)return;bar=document.createElement('div');bar.className='nmis-horizontal-scrollbar';bar.dataset.horizontalScrollProxy='true';bar.setAttribute('role','scrollbar');bar.setAttribute('aria-label','Horizontal content navigation');bar.setAttribute('aria-orientation','horizontal');inner=document.createElement('div');inner.className='nmis-horizontal-scrollbar__track';bar.appendChild(inner);document.body.appendChild(bar);
  bar.addEventListener('scroll',()=>{if(active)active.scrollLeft=bar!.scrollLeft},{passive:true});
 };
 const update=()=>{if(!active||active.scrollWidth<=active.clientWidth+1){bar?.classList.remove('is-visible');return;}make();const width=Math.max(160,active.clientWidth),ratio=active.clientWidth/active.scrollWidth;inner!.style.width=width+'px';inner!.style.setProperty('--thumb-width',Math.max(64,width*ratio)+'px');bar!.scrollLeft=active.scrollLeft;bar!.scrollTop=0;bar!.classList.add('is-visible');bar!.setAttribute('aria-valuemin','0');bar!.setAttribute('aria-valuemax',String(active.scrollWidth-active.clientWidth));bar!.setAttribute('aria-valuenow',String(Math.round(active.scrollLeft));)};
 const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update);};
 const activate=(e:EventTarget|null)=>{const s=find(e);if(s)active=s;update();};
 const key=(e:KeyboardEvent)=>{if(e.defaultPrevented||editable(e.target))return;const s=find(e.target)||active;if(!s)return;let d=0;switch(e.key){case'PageLeft':case'PageUp':d=-s.clientWidth*.9;break;case'PageRight':case'PageDown':d=s.clientWidth*.9;break;case'ArrowLeft':d=-Math.max(80,s.clientWidth*.12);break;case'ArrowRight':d=Math.max(80,s.clientWidth*.12);break;default:return;}e.preventDefault();active=s;s.scrollBy({left:d,behavior:'smooth'});schedule();};
 const ro=new ResizeObserver(schedule),mo=new MutationObserver(()=>{document.querySelectorAll(SELECTOR).forEach(e=>e instanceof HTMLElement&&ro.observe(e));schedule();});
 document.querySelectorAll(SELECTOR).forEach(e=>e instanceof HTMLElement&&ro.observe(e));mo.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('pointerover',e=>activate(e.target),true);document.addEventListener('focusin',e=>activate(e.target),true);document.addEventListener('scroll',e=>{if(e.target===active)schedule()},true);document.addEventListener('keydown',key,true);window.addEventListener('resize',schedule);
 return()=>{cancelAnimationFrame(raf);ro.disconnect();mo.disconnect();document.removeEventListener('keydown',key,true);window.removeEventListener('resize',schedule);bar?.remove();};
 },[]);return null;
}