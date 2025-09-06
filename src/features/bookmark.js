//创建定位书签

let addDiv = null;
let btnDiv = null;
let cardDiv = null;
let inputDiv = null;         

// 生成唯一id标识符
function getId(){
  let date=Date.now().toString(36);
  let random=Math.random().toString(36).slice(0,3);
  return date+random;
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

  bookmarkDiv.addEventListener('mouseenter',()=>{
    tooltip.style.display='block';
  })

  bookmarkDiv.addEventListener('mouseleave',()=>{
    setTimeout(()=>{
      tooltip.style.display="none";
    },800)
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

function removeBookmark(el){
  el.remove();
}

function createBookmark() {
  const val = inputDiv.value.trim(); 
  if(!val) return;  //当输入为空的时候直接返回，不创建新的书签
  console.log('输入的内容：', val);
  createBookmarkEle(window.scrollY,val,getId()) ;
  inputDiv.value = '';
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

  cardDiv = document.getElementsByClassName('card-content')[0];
  cardDiv.appendChild(addDiv);
}


