
// 监听标签页切换
chrome.tabs.onActivated.addListener(async(activePage)=>{
  try {
    const tab = await chrome.tabs.get(activePage.tabId);
    if(tab.url && tab.url.startsWith('http')){  // 过滤掉 chrome://、edge://、扩展自带页等无效协议
        chrome.tabs.sendMessage(activePage.tabId,{
            type:'LOAD_BOOKMARK'
        })
    }
  }catch(error){
    console.log(error);
  }
})

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId,tab)=>{
  if(tab.active && tab.url.startsWith('http')){  // tab.active 只处理当前窗口的活跃标签，避免后台标签无意义刷新
    chrome.tabs.sendMessage(tabId,{
        type:'LOAD_BOOKMARK'
    })
  }
})

//监听截屏请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>{
  if(request.type === 'SCREENSHOT'){
    chrome.tabs.query({ active: true, currentWindow: true },(tabs) =>{
      chrome.tabs.captureVisibleTab(tabs[0].windowId,{format: 'png'},(dataUrl) => {
        sendResponse({ image: dataUrl});
      })
    })
    return true; //告诉 Chrome 异步调用 sendResponse，否则会造成 await sendMessage 会永远 pending 而卡死
  }
})