// 各功能之间的状态管理

import { activateHighlight, deactivateHighlight } from './features/mouseHighlight.js';
import { activateSpotlight, deactivateSpotlight } from './features/spotlight.js';

function changeFunction(name){

    if(name=='mouseHighlight'){
        activateHighlight()
        deactivateSpotlight()
    }else if(name=='spotlight'){
        activateSpotlight()
        deactivateHighlight()
    }else{
        deactivateHighlight()
        deactivateSpotlight()
    }
        
    
}



const store = {
  active: null, // 'mouseHighlight' | 'spotlight' | 'magnifier' | null
  setActive(name) {
    this.active = name;
    changeFunction(name)
    console.log("目前启用的功能是",name)
  },
};
export default store;
