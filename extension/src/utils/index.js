// 统一导出所有工具函数
export { 
  preventPageInteraction, 
  restorePageInteraction, 
  disableUserScroll, 
  enableUserScroll 
} from './controlInteraction.js';

export { getId, getPageKey } from './getIdentity.js';

export { injectIcon, injectStyles } from './injectAssets.js';

export { default as MonitorSPARoutes } from './monitorSPARoutes.js';

export { createEl, getOffsetPos } from './operateEl.js';
