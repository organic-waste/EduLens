<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import gsap from 'gsap';

const heroSection = ref(null);
const scriptText = ref(null);
const mainTitle = ref(null);
const bgText = ref(null);

// 鼠标移动略微跟随动画
const handleMouseMove = (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2; 
  const y = (e.clientY / window.innerHeight - 0.5) * 2;

  // gsap.to(bgText.value, {
  //   x: -x * 15,
  //   y: -y * 15,
  //   duration: 1.5,
  //   ease: 'power2.out'
  // });

  gsap.to(scriptText.value, {
    x: x * 14,
    y: y * 14,
    rotation: -10 + (x * 3), 
    duration: 1,
    ease: 'power1.out'
  });
};

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  gsap.set(scriptText.value, { rotation: -15, opacity: 0, scale: 2 });
  gsap.set('.char-wrapper span', { y: 120, opacity: 0 });

  tl.fromTo(bgText.value, 
    { opacity: 0, x: 400 }, 
    { opacity: 0.25, x:-200, duration: 2, ease: 'power2.out' }
  );

  tl.to('.char-wrapper span', {
    y: 0,
    opacity: 1,
    duration: 1.2,
    stagger: 0.05,
    ease: 'expo.out'
  }, "-=1.5");

  tl.to(scriptText.value, {
    opacity: 1,
    scale: 0.6,
    rotation: -10,
    duration: 1.4,
    ease: 'elastic.out(1, 0.6)'
  }, "-=0.5");

  tl.from('.fade-up', {
    y: 40,
    opacity: 0,
    duration: 1,
    stagger: 0.1
  }, "-=0.8");

  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<template>
  <section class="hero-section" ref="heroSection">
    
    <!-- 背景装饰字 -->
    <div class="bg-typography" ref="bgText">
    </div>

    <div class="center-content">
      <div class="typography-container">
        <!-- 手写装饰字 -->
        <div class="script-overlay" ref="scriptText">
          EduLens
        </div>

        <h1 class="main-title" ref="mainTitle">
          <div class="title-row">
            <div class="char-wrapper"><span>网</span></div>
            <div class="char-wrapper"><span>页</span></div>
            <div class="char-wrapper"><span>即</span></div>
            <div class="char-wrapper"><span>笔</span></div>
            <div class="char-wrapper"><span>记</span></div>
          </div>
          <div class="title-row secondary">
            <div class="char-wrapper"><span>知</span></div>
            <div class="char-wrapper"><span>识</span></div>
            <div class="char-wrapper"><span>无</span></div>
            <div class="char-wrapper"><span>边</span></div>
            <div class="char-wrapper"><span>界</span></div>
          </div>
        </h1>
      </div>

      <p class="hero-desc fade-up">
        EduLens 是一款基于 Chrome 的沉浸式学习插件。<br>
        无需切换应用，直接在网页上实现专注学习、笔记标注与团队协作。
      </p>

      <div class="slogan-row fade-up">
        <span>开源免费</span>
        <span class="dot">•</span>
        <span>隐私安全</span>
        <span class="dot">•</span>
        <span>多语言支持</span>
      </div>

      <div class="floating-dock fade-up">
        <a href="#workflow" class="dock-item primary">
          <span>免费安装插件</span>
          <div class="glow"></div>
        </a>
        <div class="divider"></div>
        <a href="https://github.com/organic-waste/EduLens" target="_blank" class="dock-item">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>

    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;
@import url('https://fonts.googleapis.com/css2?family=Mr+Dafoe&display=swap');

.hero-section {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent; 
  
  .bg-typography {
    margin-top: 50vh;
    position: absolute;
    background-image: url("/images/title.png");
    background-repeat: repeat-x;
    background-size: contain;
    width: 200vw;
    height: 15vw;
    z-index: 1;
  }

  .center-content {
    position: relative;
    z-index: 10;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 2rem;
    gap: 0.5rem;
  }

  .typography-container {
    position: relative;
    margin: 2vh 0;

    .main-title {
      font-family: 'Noto Sans SC', sans-serif;
      font-weight: 900;
      font-size: clamp(3.5rem, 8vw, 7rem);
      line-height: 1.1;
      color: $text-primary;
      margin: 0;
      letter-spacing: -2px;
      position: relative;
      z-index: 2; 

      .title-row {
        display: flex;
        justify-content: center;
        gap: 0.2em; 
        
        &.secondary {
          font-size: 0.7em;
          opacity: 0.8;
          color: $text-secondary;
          margin-top: 0.2em;
        }

        .char-wrapper {
          overflow: hidden; 
          display: inline-block;
          
          span {
            display: inline-block; // 必须是 block 才能 transform
          }
        }
      }
    }

    .script-overlay {
      font-family: 'Mr Dafoe', cursive; 
      position: absolute;
      top: 55%; 
      left: 50%;
      width: 100vw;
      transform: translate(-50%, -50%) rotate(-10deg);
      font-size: clamp(6rem, 15vw, 12rem);
      z-index: 3; 
      pointer-events: none;
      letter-spacing: 1rem;
    
      background: $theme-gradient;
      background-clip: text; 
      -webkit-text-fill-color: transparent;
      
      // 稍微加一点阴影增加立体感
      filter: drop-shadow(0 10px 10px rgba($theme-gradient-start, 0.3));
    }
  }

  .hero-desc {
    font-size: 1.2rem;
    color: $text-secondary;
    margin-bottom: 2rem;
    line-height: 1.6;
    max-width: 640px;
  }

  .slogan-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: $text-secondary;
    font-weight: 500;
    font-size: 1rem;
    letter-spacing: 1px;
    text-transform: uppercase;

    .dot {
      color: $theme-gradient-start;
      font-weight: bold;
    }
  }

  .floating-dock {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    padding: 10px 10px 10px 20px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 
      0 20px 40px -10px rgba(0,0,0,0.1),
      inset 0 1px 0 rgba(255,255,255,0.8);
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 30px 60px -12px rgba(0,0,0,0.15);
    }

    .divider {
      width: 1px;
      height: 24px;
      background: rgba(0,0,0,0.1);
      margin: 0 12px;
    }

    .dock-item {
      text-decoration: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $text-primary;
      transition: all 0.2s;
      border-radius: 16px;

      &.primary {
        background: $theme-gradient; 
        color: white;
        padding: 12px 32px;
        font-weight: 600;
        position: relative;
        overflow: hidden;
        
        &:hover {
          filter: brightness(1.05);
          .glow { left: 100%; }
        }

        // 悬停流光动画
        .glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          transition: left 0.5s;
        }
      }

      &:not(.primary) {
        width: 44px;
        height: 44px;
        &:hover {
          background: rgba(0,0,0,0.05);
          color: $theme-gradient-start;
        }
        .icon { width: 24px; height: 24px; }
      }
    }
  }
}

@media (max-width: 768px) {
  .hero-section {
    .bg-typography span { font-size: 40vw; opacity: 0.05; }
    
    .typography-container {
      .main-title { font-size: 3rem; }
      .script-overlay { font-size: 5rem; top: 20%; }
      .title-row { flex-wrap: wrap; }
    }

    .hero-desc { padding: 0 20px; font-size: 1rem; }
  }
}
</style>
