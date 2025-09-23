import { injectStyles, injectIcon}from './utils/injectAssets.js';
import store from './stores/functions.js';
import {activateDraggablePanel} from './features/draggablePanel.js'
import eventManager from './utils/eventManager.js';


//统一的键盘管理
function keydown(e,key,name){
  if (e.altKey && e.key === key) {
	if (store.active === name) {
		store.setActive(null);
	} else {
		store.setActive(name);
	}
  }
}

eventManager.on(window,'keydown', (e) => {
  keydown(e,'h','mouseHighlight');
  keydown(e,'s','spotlight');
  keydown(e, 'r', 'readingSpotlight');
});

(async function activatePlugin() {
  await injectStyles();
  // injectIcon();
  activateDraggablePanel();
})()







