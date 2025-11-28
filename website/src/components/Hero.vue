<script setup>
import { onMounted, ref } from 'vue';
import gsap from 'gsap';

const heroContent = ref(null);

onMounted(() => {
  const tl = gsap.timeline();
  tl.from(heroContent.value.children, {
    y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out'
  });
});
</script>

<template>
  <section class="hero-section">
    <div class="container" ref="heroContent">
      <div class="badge">🚀 v1.0 Chrome 商店现已上架</div>
      
      <h1 class="hero-title">
        网页即笔记 <br />
        <span class="highlight">知识无边界</span>
      </h1>
      
      <p class="hero-desc">
        EduLens 是一款基于 Chrome 的沉浸式学习插件。<br>
        无需切换应用，直接在网页上实现专注学习、笔记标注与团队协作。
      </p>
      
      <div class="slogan-row">
        <span>开源免费</span>
        <span class="dot">•</span>
        <span>隐私安全</span>
        <span class="dot">•</span>
        <span>多语言支持</span>
      </div>
      
      <div class="btn-group">
        <a href="#workflow" class="btn primary">
          <span>免费安装</span>
        </a>
        <a href="https://github.com/organic-waste/EduLens" target="_blank" class="btn secondary">
          <span>GitHub 仓库</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;
@use '../styles/main.scss'as *;

.hero-section {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 80px;
  text-align: center;

  .container {
    width: min(90vw, 1000px);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .badge {
    background: rgba(255, 255, 255, 0.5); 
    backdrop-filter: blur(4px);
    color: #4a7ab5;
    padding: 0.5rem 1.2rem;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255,255,255,0.6);
  }

  .hero-title {
    font-size: clamp(3rem, 6vw, 5rem);
    line-height: 1.1;
    margin-bottom: 1.5rem;
    font-weight: 800;
    color: $text-primary;
    
    .highlight {
      font-size: clamp(2.8rem, 5.5vw, 4.5rem);
      background: $theme-gradient;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .hero-desc {
    font-size: 1.4rem;
    color: $text-secondary;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .slogan-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: $text-secondary;
    font-weight: 500;
    font-size: 1rem;
    margin-bottom: 3rem;
    letter-spacing: 1px;
    text-transform: uppercase;

    .dot { color: $theme-gradient-start; font-weight: bold; }
  }

  .btn-group {
    display: flex;
    gap: 1.5rem;

    .btn {
      text-decoration: none;
      padding: 0.8rem 2.5rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s;
      
      &.primary {
        background: $theme-gradient;
        color: white;
        box-shadow: 0 10px 20px rgba($theme-gradient-start, 0.3);
        &:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba($theme-gradient-start, 0.4); }
      }

      &.secondary {
        background: rgba(255,255,255,0.6);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255,255,255,1);
        box-shadow: 0 10px 20px rgba($theme-gradient-start, 0.2);
        color: $text-primary;
        &:hover { border-color: $theme-gradient-start; color: $theme-gradient-start; }
      }
    }
  }
}
</style>