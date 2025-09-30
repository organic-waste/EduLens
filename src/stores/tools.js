//页面工具相关功能
class ToolStore {
  constructor() {
    this.isDrawing = false;
    this.isDragging = false;

    this.isEraser = false;
    this.isPen = false;
    this.isLine = false;  
    this.isRectangle = false;
    this.isDOM = false;
    this.isRegion = false;
    this.isScroll = false;

    this.currentColor = '#FF0000';
    this.penBrushSize = 5;
    this.eraserBrushSize = 10;

    this.currentHoveredRectId = null;
    this.hoverTimeout = null;
  }

  updateState(state) {
    const oldVal = this[state];
    let newState ={
      isEraser : false,
      isPen : false,
      isLine : false,  
      isRectangle : false,
      isDOM : false,
      isRegion : false,
      isScroll : false,
    }
    if(state) {
      newState[state] = !oldVal;
    }

    Object.assign(this, newState);
    this.updateUI();
  }

  //保证各功能之间互斥
  updateUI() {
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    const penBtn = shadowRoot.getElementById('pen-btn');
    const eraserBtn = shadowRoot.getElementById('eraser-btn');
    const rectangleBtn = shadowRoot.getElementById('rectangle-btn');
    const lineBtn = shadowRoot.getElementById('line-btn');

    if (!penBtn || !eraserBtn || !rectangleBtn || !lineBtn) return;

    penBtn.classList.toggle('active', this.isPen);
    eraserBtn.classList.toggle('active', this.isEraser);
    rectangleBtn.classList.toggle('active', this.isRectangle);
    lineBtn.classList.toggle('active', this.isLine);
  }
}

export default new ToolStore();