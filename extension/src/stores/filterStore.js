/* 页面滤镜相关功能 */
import {
  activateHighlight,
  deactivateHighlight,
} from "../features/filters/mouseHighlight.js";
import {
  activateSpotlight,
  deactivateSpotlight,
} from "../features/filters/spotlight.js";
import {
  activateReadingSpotlight,
  deactivateReadingSpotlight,
} from "../features/filters/readingSpotlight.js";

// 使用常量整理激活和取消函数
const mapper = {
  mouseHighlight: {
    activate: activateHighlight,
    deactivate: deactivateHighlight,
  },
  spotlight: {
    activate: activateSpotlight,
    deactivate: deactivateSpotlight,
  },
  readingSpotlight: {
    activate: activateReadingSpotlight,
    deactivate: deactivateReadingSpotlight,
  },
};

class FilterStore {
  constructor() {
    this.active = null; // 'mouseHighlight' | 'spotlight' | 'readingSpotlight' | null
    this.isDragging = false;
  }

  setActive(name) {
    if (!name) {
      this.deactivateCurrent();
      return;
    }

    if (this.active === name) {
      this.deactivateCurrent();
      return;
    }

    this.deactivateCurrent();
    const target = mapper[name];
    if (target) {
      target.activate();
      this.active = name;
    }
  }

  deactivateCurrent() {
    if (!this.active) return;
    const current = mapper[this.active];
    if (current) {
      current.deactivate();
    }
    this.active = null;
  }

  deactivateAll() {
    Object.values(mapper).forEach(({ deactivate }) => deactivate());
    this.active = null;
  }
}

export default new FilterStore();
