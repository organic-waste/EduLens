/* 管理元素事件监听 */
class EventManager {
  constructor() {
    //使用 WeakMap 为对DOM元素的弱引用，在删除DOM后可以自动删除Map中的数据并进行自动垃圾回收
    this.listenerMap = new WeakMap();
  }

  //添加监听器
  on(element, event, handler, options = {}) {
    if (!this.listenerMap.has(element)) {
      this.listenerMap.set(element, new Map()); //由于 WeakMap 的键只能为对象或者DOM元素，而此时的键为event字符串，所以只能使用Map (并不会组织外层垃圾回收)
    }
    const eventMap = this.listenerMap.get(element);
    if (!eventMap.has(event)) {
      eventMap.set(event, new Set()); //保证可以自动去重，且增删更快
    }
    eventMap.get(event).add(handler);

    element.addEventListener(event, handler, options);
  }

  //删除特定事件中的特定回调
  off(element, event, handler) {
    const eventMap = this.listenerMap.get(element);
    if (!eventMap) return;

    const handlerSet = eventMap.get(event);
    if (handlerSet && handlerSet.has(handler)) {
      element.removeEventListener(event, handler);
      handlerSet.delete(handler);
    }
    //若已被清空则也删除父结构
    if (handlerSet.size === 0) {
      eventMap.delete(event);
    }
    if (eventMap.size === 0) {
      this.listenerMap.delete(element);
    }
  }

  //删除特定事件中的全部回调
  offEvent(element, event) {
    const eventMap = this.listenerMap.get(element);
    if (!eventMap) return;

    const handlerSet = eventMap.get(event);
    if (handlerSet) {
      handlerSet.forEach((handler) => {
        element.removeEventListener(event, handler);
      });
      eventMap.delete(event);
    }
    if (eventMap.size === 0) {
      this.listenerMap.delete(element);
    }
  }

  //删除特定对象的全部事件
  offElement(element) {
    const eventMap = this.listenerMap.get(element);
    if (!eventMap) return;

    eventMap.forEach((handlerSet, event) => {
      handlerSet.forEach((handler) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listenerMap.delete(element);
  }

  //清空全部事件监听器
  clear() {
    if (!this.listenerMap) return;
    this.listenerMap.forEach(eventMap, (element) => {
      eventMap.forEach((handlerSet, event) => {
        handlerSet.forEach((handler) => {
          element.removeEventListener(event, handler);
        });
      });
    });
    this.listenerMap = new WeakMap();
  }
}

export default new EventManager();
