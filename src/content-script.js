
import store from './store.js';
import {activateScrollProgress} from './features/scrollProgress.js'
import {activateDraggablePanel} from './features/draggablePanel.js'


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

window.addEventListener('keydown', (e) => {
	keydown(e,'h','mouseHighlight')
	keydown(e,'s','spotlight')
});

activateScrollProgress()
activateDraggablePanel()

