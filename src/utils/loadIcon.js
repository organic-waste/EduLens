
export default function loadIcon(){
  if (!document.querySelector('#fa-content-script')) {
  const fa = document.createElement('link');
  fa.id = 'fa-content-script'; //加 `id` 是为了避免重复注入
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  (document.head || document.documentElement).appendChild(fa);
  }
}
