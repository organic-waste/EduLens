<script setup>
import { onMounted, ref } from 'vue';
import gsap from 'gsap';

const heroContent = ref(null);

const stats = [
  { label: '标注工具', value: '9+' },
  { label: '支持语言', value: '5 种' },
  { label: '快捷键', value: 'Alt+E / Alt+S / Alt+H / Alt+R' },
];

onMounted(() => {
  const tl = gsap.timeline();
  tl.from(heroContent.value.children, {
    y: 60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out'
  });
});
</script>

<template>
  <section class="hero-section">
    <div class="container" ref="heroContent">
      <div class="badge"> v1.0.1 Chrome 插件现已发布</div>
      <h1 class="hero-title">
        网页即课堂<br />
        <span class="highlight">知识无边界</span>
      </h1>
      <p class="hero-desc">
        EduLens 是一款基于 Chrome 的沉浸式学习插件。
        无需切换应用，直接在网页上完成标注、笔记与团队协作。
        支持实时协作、长截图与专注模式，适合课堂讲解、视频录制与自学总结。
      </p>
      
      <div class="btn-group">
        <a class="btn primary" href="#chrome-store">
          <span>Chrome链接</span>
        </a>
        <a class="btn secondary" href="https://github.com/organic-waste/EduLens" target="_blank">
          <span>GitHub仓库</span>
        </a>
      </div>

      <div class="meta-row">
        <div v-for="item in stats" :key="item.label" class="meta-card">
          <div class="value">{{ item.value }}</div>
          <div class="label">{{ item.label }}</div>
        </div>
      </div>

      <div class="chip-row">
        <span class="chip">多人协作房间</span>
        <span class="chip">长截图 / DOM 截图</span>
        <span class="chip">聚光灯 + 书签进度</span>
      </div>

      <!-- <div class="hero-media">
        <div class="media-placeholder">
        </div>
      </div> -->
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;

.hero-section {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: clamp(82px, 8vh, 120px);
  padding-bottom: 7vh;

  .container {
    width: min(92vw, 1400px);
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.8vh;
  }

  .badge {
    background: rgba($theme-gradient-start, 0.12);
    color: #4a7ab5;
    padding: 0.6rem 1.6rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.95rem;
  }

  .hero-title {
    font-size: clamp(2.6rem, 5vw, 4.6rem);
    line-height: 1.05;
    font-weight: 800;
    
    .highlight {
      background: $theme-gradient;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .hero-desc {
    font-size: clamp(1.05rem, 1.2vw, 1.3rem);
    color: $text-secondary;
    max-width: 70ch;
    line-height: 1.65;
    margin-top: 0.5vh;
  }

  .btn-group {
    display: flex;
    gap: 1.3rem;
    margin: 2vh 0 1vh;

    .btn {
      padding: 0.85rem 2.7rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      
      &:hover { transform: translateY(-0.2vh); }

      &.primary {
        background: $theme-gradient;
        border: none;
        color: white;
        box-shadow: 0 12px 24px rgba($theme-gradient-start, 0.28);
      }

      &.secondary {
        background: white;
        border: 1px solid #ddd;
        color: $text-primary;
      }
    }
  }

  .hint {
    color: $text-secondary;
    font-size: 0.95rem;
  }

  .meta-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: clamp(0.8rem, 1vw, 1.2rem);
    width: min(90vw, 900px);
    margin-top: 1vh;

    .meta-card {
      @include glass-effect;
      padding: clamp(1rem, 1.2vw, 1.4rem);
      border-radius: 18px;
      display: grid;
      gap: 0.4rem;

      .value { font-size: clamp(1.2rem, 1.6vw, 1.5rem); font-weight: 800; color: $text-primary; }
      .label { color: $text-secondary; font-size: 0.98rem; }
    }
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
    margin: 1vh 0 2vh;

    .chip {
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      background: rgba($theme-gradient-end, 0.15);
      color: $text-primary;
      font-weight: 600;
      font-size: 0.95rem;
    }
  }

  .hero-media {
    width: min(92vw, 1050px);
    
    .media-placeholder {
      @include glass-effect;
      aspect-ratio: 16/9;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $text-secondary;
      background: rgba(255,255,255,0.5);
      padding: 1.6rem;
      
      .overlay { font-size: clamp(1rem, 1.4vw, 1.25rem); }
      
      img, video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 24px;
      }
    }
  }

  @media (max-width: 720px) {
    .btn-group { flex-direction: column; width: 100%; }
    .btn-group .btn { width: 100%; text-align: center; }
  }
}
</style>
