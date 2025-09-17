//涂鸦相关状态管理
class MarkStore {
  constructor() {
    this.isDrawing = false;
    this.isDragging = false;

    this.isEraser = false;
    this.isPen = false;
    this.isRectangle = false;

    this.currentColor = '#FF0000';
    this.brushSize = 5;

    this.currentHoveredRectId = null;
    this.hoverTimeout = null;
  }

  updateState(newState) {
    Object.assign(this, newState);
    this.updateUI();
  }
  //保证各功能之间互斥
  updateUI() {
    const penBtn = document.getElementById('pen-btn');
    const eraserBtn = document.getElementById('eraser-btn');
    const rectangleBtn = document.getElementById('rectangle-btn');

    if (!penBtn || !eraserBtn || !rectangleBtn) return;

    penBtn.classList.toggle('active', this.isPen);
    eraserBtn.classList.toggle('active', this.isEraser);
    rectangleBtn.classList.toggle('active', this.isRectangle);
  }
}

export default new MarkStore();