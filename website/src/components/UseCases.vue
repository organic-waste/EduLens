<script setup>
const cases = [
  {
    tag: '自学 / 读书会',
    title: '边看边记，沉浸阅读',
    desc: '通过聚光灯与书签进度，快速整理长文档、论文和教程。',
    points: ['阅读进度条 + 书签跳转', 'Alt+R 阅读聚焦与倒计时提醒'],
    placeholder: '放个人学习标注截图 / GIF'
  },
  {
    tag: '在线授课',
    title: '实时多人标注，课堂互动',
    desc: '创建房间并分享加入码，师生同屏标注、截图和挂图演示。',
    points: ['实时同步涂鸦与矩形批注', '面板可拖拽，随页滚动不挡内容'],
    placeholder: '放课堂讲解录屏 / 多人协作 GIF'
  },
  {
    tag: '录屏 / 视频制作',
    title: '截图+聚光灯，突出重点',
    desc: '滚动长截图、DOM 高亮取景，搭配聚光灯/鼠标高亮快速突出重点。',
    points: ['DOM/区域/滚动三种截图', '聚光灯与鼠标高亮用于演示'],
    placeholder: '放录屏片段或长截图示例'
  },
];
</script>

<template>
  <section class="cases-section" id="usecases">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">场景 & 证据</p>
        <h2>把 EduLens 带入真实课堂与学习流</h2>
        <p class="sub">下面位置可以补充实际素材：Chrome 商店链接、课堂 GIF、滚动截屏等。</p>
      </div>

      <div class="cases-grid">
        <article v-for="item in cases" :key="item.title" class="case-card">
          <div class="case-meta">
            <span class="pill">{{ item.tag }}</span>
            <h3>{{ item.title }}</h3>
            <p class="desc">{{ item.desc }}</p>
          </div>
          <ul class="points">
            <li v-for="point in item.points" :key="point">
              <span class="bullet"></span>
              <span>{{ point }}</span>
            </li>
          </ul>
          <div class="case-media">
            <span>{{ item.placeholder }}</span>
          </div>
        </article>
      </div>

      <div class="cta-banner" id="chrome-store">
        <div>
          <p class="eyebrow">安装指引</p>
          <h3>把链接换成你自己的 Chrome 商店地址，或内测包下载链接。</h3>
          <p class="desc">如果有教学视频、GIF、截图，请放在上方卡片的占位区域。</p>
        </div>
        <a class="cta-btn" href="#">替换这里为实际安装链接</a>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;

.cases-section {
  padding: 11vh 0;

  .container {
    width: min(92vw, 1200px);
    margin: 0 auto;
    display: grid;
    gap: 4vh;
  }

  .section-head {
    .eyebrow {
      display: inline-block;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      background: rgba($theme-gradient-end, 0.18);
      color: $theme-gradient-start;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: 0.8vh;
    }
    h2 { font-size: clamp(2rem, 3.6vw, 2.6rem); color: $text-primary; margin-bottom: 0.6vh; }
    .sub { color: $text-secondary; max-width: 70ch; }
  }

  .cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: clamp(1.2rem, 1.4vw, 1.6rem);
  }

  .case-card {
    @include glass-effect;
    border-radius: 20px;
    padding: clamp(1.2rem, 1.6vw, 1.8rem);
    min-height: 28vh;
    display: grid;
    gap: 1rem;
    background: linear-gradient(180deg, rgba($theme-gradient-start,0.05) 0%, rgba(255,255,255,0.9) 100%);
  }

  .case-meta {
    display: grid;
    gap: 0.5rem;

    .pill {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      background: rgba($theme-gradient-start, 0.12);
      color: $theme-gradient-start;
      font-weight: 700;
    }
    h3 { font-size: clamp(1.2rem, 1.6vw, 1.5rem); color: $text-primary; }
    .desc { color: $text-secondary; line-height: 1.55; }
  }

  .points {
    list-style: none;
    display: grid;
    gap: 0.6rem;

    li {
      display: grid;
      grid-template-columns: 12px 1fr;
      align-items: start;
      column-gap: 0.6rem;
      color: $text-primary;
    }

    .bullet {
      width: 12px;
      height: 12px;
      margin-top: 0.2rem;
      border-radius: 50%;
      background: $theme-gradient;
    }
  }

  .case-media {
    min-height: 16vh;
    border: 1px dashed rgba($theme-gradient-start, 0.35);
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: $text-secondary;
    background: rgba($theme-gradient-end, 0.06);
    padding: 1rem;
    text-align: center;
  }

  .cta-banner {
    @include glass-effect;
    border-radius: 24px;
    padding: clamp(1.4rem, 2vw, 2rem);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: linear-gradient(120deg, rgba($theme-gradient-start,0.12), rgba($theme-gradient-end,0.12));

    h3 { color: $text-primary; margin: 0.2rem 0; }
    .desc { color: $text-secondary; }

    .cta-btn {
      padding: 0.8rem 1.4rem;
      border-radius: 12px;
      background: $theme-gradient;
      color: white;
      text-decoration: none;
      font-weight: 700;
      white-space: nowrap;
    }
  }
}
</style>
