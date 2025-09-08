
//创建定位书签

// 监听 SPA 路由变化
(function initSPAMonitoring() {

  let lastURL = window.location.href;

  const observer = new MutationObserver((mutations) => {
    const currentURL = window.location.href;
    
    if (currentURL !== lastURL) {
      lastURL = currentURL;
      console.log('URL变化:', currentURL);
      loadBookmarks();
    }
  });

  // 监听整个document的变化
  observer.observe(document, {
    subtree: true,
    childList: true,
  });

  window.addEventListener('popstate', () => {
    console.log('popstate');
    setTimeout(loadBookmarks, 0);
  });

  window.addEventListener('hashchange', () => {
    console.log('hashchange');
    setTimeout(loadBookmarks, 0);
  });
})();


let addDiv = null;
let btnDiv = null;
let cardDiv = null;
let inputDiv = null; 
let oldPageKey=null;        

// 生成唯一id标识符
function getId(){
  let date=Date.now().toString(36);
  let random=Math.random().toString(36).slice(0,3);
  return date+random;
}

//用页面URL来作为切换页面时的key
function getPageKey(){
  return window.location.origin+window.location.pathname;
}


function createBookmarkEle(scrollTop,text,id){
  const bookmarkDiv=document.createElement('div');
  bookmarkDiv.className='bookmark-marker';
  const docHeight   = document.documentElement.scrollHeight;
  const winHeight   = window.innerHeight;
  const progressPct = (scrollTop / (docHeight - winHeight)) * 100;
  const percent = Math.round(progressPct);  
  bookmarkDiv.style.top=percent-2+'%';
  bookmarkDiv.dataset.id=id;

  const tooltip=document.createElement('div');
  tooltip.className='bookmark-tooltip';
  tooltip.textContent=text;
  tooltip.style.top=percent-2+'%';

  const deleteBtn=document.createElement('button');
  deleteBtn.className='bookmark-delete';
  deleteBtn.textContent='删除';
  deleteBtn.addEventListener('click',(e)=>{
    e.stopPropagation(); //防止冒泡被面板上的其他事件捕获
    removeBookmark(bookmarkDiv);
  })

  tooltip.appendChild(deleteBtn);
  bookmarkDiv.appendChild(tooltip);

  let closePanel=null;

  function switchPanel(method){
    if(!method){
      closePanel=setTimeout(()=>{
        tooltip.style.opacity="0";
        tooltip.style.pointerEvents='none';
      },500)
    }else{
      if(closePanel){
        clearTimeout(closePanel);
      }
    }
  }

  bookmarkDiv.addEventListener('mouseenter',()=>{
    tooltip.style.opacity='1';
    tooltip.style.pointerEvents='all';
    switchPanel(true);
  })

  bookmarkDiv.addEventListener('mouseleave',()=>{
    switchPanel(false);
  })

  tooltip.addEventListener('mouseover',()=>{
    switchPanel(true);
  })
  
  tooltip.addEventListener('mouseleave',()=>{
    switchPanel(false);
  })

  bookmarkDiv.addEventListener('click',()=>{
    window.scrollTo({
      top:scrollTop,
      behavior:'smooth'
    })
  })

  const scrollDiv=document.getElementsByClassName('scroll-percent')[0];
  scrollDiv.appendChild(bookmarkDiv);
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

export async function loadBookmarks(){
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
  addDiv = document.createElement('div');
  addDiv.className = 'add-bookmark';

  inputDiv = document.createElement('input'); 
  inputDiv.type = 'text';
  inputDiv.className = 'bookmark-input';
  addDiv.appendChild(inputDiv);

  btnDiv = document.createElement('button');
  btnDiv.className = 'bookmark-button';
  btnDiv.textContent = '添加书签';
  btnDiv.addEventListener('click', createBookmark); 
  addDiv.appendChild(btnDiv)

  cardDiv = document.getElementsByClassName('functions')[0];
  cardDiv.appendChild(addDiv);

  loadBookmarks();

  chrome.runtime.onMessage.addListener((message)=>{
    if(message.type==='LOAD_BOOKMARK'){
      loadBookmarks();
      console.log('load bookmarks from service_worker');
    }
  })

}