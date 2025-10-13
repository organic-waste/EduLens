//页面滤镜相关功能
import eventManager from '../utils/eventManager.js';
import { activateHighlight, deactivateHighlight } from '../features/filters/mouseHighlight.js';
import { activateSpotlight, deactivateSpotlight } from '../features/filters/spotlight.js';
import { activateReadingSpotlight, deactivateReadingSpotlight } from '../features/filters/readingSpotlight.js';

class FilterStore {
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

export default new FilterStore();