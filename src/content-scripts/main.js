// 内容脚本基础功能
const div = document.createElement('div');
div.textContent = 'EduLens 内容脚本已加载';
div.style.position = 'fixed';
div.style.top = '10px';
div.style.right = '10px';
div.style.background = 'rgba(0,0,0,0.7)';
div.style.color = '#fff';
div.style.zIndex = '9999';
div.style.padding = '8px 16px';
div.style.borderRadius = '8px';
document.body.appendChild(div);