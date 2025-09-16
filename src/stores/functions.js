// 各功能之间的状态管理

import { activateHighlight, deactivateHighlight } from '../features/mouseHighlight.js';
import { activateSpotlight, deactivateSpotlight } from '../features/spotlight.js';
import { activateReadingSpotlight, deactivateReadingSpotlight } from '../features/readingSpotlight.js';

function changeFunction(name){
    if(name === 'mouseHighlight'){
        activateHighlight();
        deactivateSpotlight();
        deactivateReadingSpotlight();
    } else if(name === 'spotlight'){
        activateSpotlight();
        deactivateHighlight();
        deactivateReadingSpotlight();
    } else if(name === 'readingSpotlight') {
        activateReadingSpotlight();
        deactivateHighlight();
        deactivateSpotlight();
    } else {
        deactivateHighlight();
        deactivateSpotlight();
        deactivateReadingSpotlight();
    }
}

const store = {
  //关于鼠标增强相关功能
  active: null, // 'mouseHighlight' | 'spotlight' | 'readingSpotlight' | null
  setActive(name) {
    this.active = name;
    changeFunction(name);
    console.log("目前启用的功能是", name);
  },
};

export default store;