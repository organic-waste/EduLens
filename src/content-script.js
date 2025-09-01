
import store from './store.js';


//统一的键盘管理
window.addEventListener('keydown', (e) => {
	if (e.altKey && e.key === 'h') {
		if (store.active === 'mouseHighlight') {
			store.setActive(null);
		} else {
			store.setActive('mouseHighlight');
		}
	}
	if (e.altKey && e.key === 's') {
		if (store.active === 'spotlight') {
			store.setActive(null);
		} else {
			store.setActive('spotlight');
		}
	}
	if (e.altKey && e.key === 'm') {
		if (store.active === 'magnifier') {
			store.setActive(null);
		} else {
			store.setActive('magnifier');
		}
	}
});


