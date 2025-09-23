//创建定位书签
import eventManager from '../utils/eventManager.js';
import MonitorSPARoutes from '../utils/monitorSPARoutes.js'
import { getId,getPageKey } from '../utils/getIdentity.js';
import { createEl } from '../utils/operateEl.js';

let addDiv = null;
let btnDiv = null;
let funcDiv = null;
let inputDiv = null; 
let oldPageKey=null;        

function createBookmarkEle(scrollTop,text,id){
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  const docHeight   = document.documentElement.scrollHeight;
  const winHeight   = window.innerHeight;
  const progressPct = (scrollTop / (docHeight - winHeight)) * 100;
  const percent = Math.round(progressPct);  

  const bookmarkDiv=createEl('div',{class:'bookmark-marker',style:`top:${percent-2}%;`,'data-id':id});

  const tooltip=createEl('div',{class:'bookmark-tooltip',style:`top:${percent-2}%;`,textContent:text});

  const deleteBtn=createEl('button',{class:'delete-button',textContent:'×'});
  eventManager.on(deleteBtn,'click',(e)=>{
    e.stopPropagation();
    removeBookmark(bookmarkDiv);
  });

  tooltip.append(deleteBtn);
  bookmarkDiv.append(tooltip);

  let closePanel=null;
  function switchPanel(method){
    if(!method){
      closePanel=setTimeout(()=>{
        tooltip.style.opacity="0";
        tooltip.style.pointerEvents='none';
      },500)
    }else{
      if(closePanel) clearTimeout(closePanel);
    }
  }

  eventManager.on(bookmarkDiv,'mouseenter',()=>{
    tooltip.style.opacity='1';
    tooltip.style.pointerEvents='all';
    switchPanel(true);
  })
  eventManager.on(bookmarkDiv,'mouseleave',()=>{
    switchPanel(false);
  })

  eventManager.on(tooltip,'mouseover',()=>{
    switchPanel(true);
  })
  eventManager.on(tooltip,'mouseleave',()=>{
    switchPanel(false);
  })

  eventManager.on(bookmarkDiv,'click',()=>{
    window.scrollTo({
      top:scrollTop,
      behavior:'smooth'
    })
  })

  const scrollDiv = shadowRoot.querySelector('.scroll-percent');
  scrollDiv.appendChild(bookmarkDiv);
  switchPanel(true);
}

async function getBookmark(){
    // 传递 {} 作为默认值
  const result = await chrome.storage.local.get({bookmarks: {}});
  return result.bookmarks;
}

async function saveBookmark(scrollTop,text,id){
  let bookmarks= await getBookmark();
  const pageKey = getPageKey();
  
  if(!bookmarks[pageKey]){
    bookmarks[pageKey]=[];
  }
  bookmarks[pageKey].push({
    "scrollTop":scrollTop,
    "text":text,
    "id":id
  });
  await chrome.storage.local.set({bookmarks});
  createBookmarkEle(scrollTop,text,id) ;
}


async function removeBookmark(el){
  const id=el.dataset.id;
  const pageKey=getPageKey();
  let bookmarks= await getBookmark();
  
  if(bookmarks[pageKey]){
    bookmarks[pageKey]=bookmarks[pageKey].filter(item=>{
      return item.id !== id;
    });
    await chrome.storage.local.set({bookmarks});
  }
  el.remove();
}

async function loadBookmarks(){
  const pageKey=getPageKey();
  if(pageKey===oldPageKey) return;
  let bookmarks= await getBookmark();
  if(bookmarks[pageKey]){
    bookmarks[pageKey].forEach(item=>createBookmarkEle(item.scrollTop,item.text,item.id));
    oldPageKey=pageKey;
  }
}

function createBookmark() {
  const val = inputDiv.value.trim(); 
  if(!val) return;  //当输入为空的时候直接返回，不创建新的书签
  inputDiv.value = '';

  const id=getId();
  const scrollTop=window.scrollY;
  saveBookmark(scrollTop,val,id);
}




export function activateBookmark() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  addDiv = document.createElement('div');
  addDiv.className = 'function';

  inputDiv = document.createElement('input'); 
  inputDiv.type = 'text';
  inputDiv.className = 'input';
  addDiv.appendChild(inputDiv);

  btnDiv = document.createElement('button');
  btnDiv.className = 'button';
  btnDiv.textContent = '添加书签';
  eventManager.on(btnDiv,'click', createBookmark); 
  addDiv.appendChild(btnDiv)

  funcDiv = shadowRoot.querySelector('.functions');
  if(funcDiv){
    funcDiv.appendChild(addDiv);
  }

  loadBookmarks();
  MonitorSPARoutes(loadBookmarks);

  chrome.runtime.onMessage.addListener((message)=>{
    if(message.type==='LOAD_BOOKMARK'){
      loadBookmarks();
      // console.log('load bookmarks from service_worker');
    }
  })

}