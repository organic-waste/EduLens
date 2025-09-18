// 各功能之间的状态管理
import eventManager from '../utils/eventManager.js';
import { activateHighlight, deactivateHighlight } from '../features/mouseHighlight.js';
import { activateSpotlight, deactivateSpotlight } from '../features/spotlight.js';
import { activateReadingSpotlight, deactivateReadingSpotlight } from '../features/readingSpotlight.js';

class FunctionStore {
  constructor() {
    this.active = null; // 'mouseHighlight' | 'spotlight' | 'readingSpotlight' | null
  }

  changeFunction(name) {
    if (name === 'mouseHighlight') {
      activateHighlight();
      deactivateSpotlight();
      deactivateReadingSpotlight();
    } else if (name === 'spotlight') {
      activateSpotlight();
      deactivateHighlight();
      deactivateReadingSpotlight();
    } else if (name === 'readingSpotlight') {
      activateReadingSpotlight();
      deactivateHighlight();
      deactivateSpotlight();
    } else {
      deactivateHighlight();
      deactivateSpotlight();
      deactivateReadingSpotlight();
    }
  }

  setActive(name) {
    this.active = name;
    this.changeFunction(name);
    // console.log("目前启用的功能是", name);
  }
}

export default new FunctionStore();