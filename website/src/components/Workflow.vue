<script setup>
import { onMounted } from 'vue';
import gsap from 'gsap';

onMounted(() => {
  const steps = gsap.utils.toArray('.step-item');
  
  steps.forEach((step, i) => {
    gsap.from(step, {
      scrollTrigger: {
        trigger: step,
        start: "top 80%",
      },
      x: i % 2 === 0 ? -50 : 50, // 左右交替进入
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });
  });
});
</script>

<template>
  <section class="workflow-section">
    <div class="container">
      <h2>三步开启高效学习</h2>
      <div class="steps-wrapper">
        <!-- Step 1 -->
        <div class="step-item">
          <div class="step-num">01</div>
          <div class="step-content">
            <h3>一键安装</h3>
            <p>访问 Chrome 商店，点击“添加至 Chrome”，插件即刻生效。</p>
          </div>
        </div>
        
        <!-- Step 2 -->
        <div class="step-item right">
          <div class="step-num">02</div>
          <div class="step-content">
            <h3>任意页启动</h3>
            <p>在浏览网页时，点击右下角悬浮气泡或使用快捷键 `Alt+E` 唤起工具栏。</p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="step-item">
          <div class="step-num">03</div>
          <div class="step-content">
            <h3>开始协作</h3>
            <p>生成分享链接发给队友，即刻开启多人同屏标注模式。</p>
          </div>
        </div>
        
        <div class="line"></div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;

.workflow-section {

  .container {
    width: min(90vw, 1000px);
    margin: 0 auto;
    text-align: center;
    h2 { font-size: 2.5rem; margin-bottom: 4rem; }
  }

  .steps-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4rem;

    .line {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #eee;
      transform: translateX(-50%);
      z-index: 0;
    }

    .step-item {
      position: relative;
      z-index: 1;
      width: 45%;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      text-align: right;

      &.right {
        align-self: flex-end;
        flex-direction: row-reverse;
        text-align: left;
        
        .step-num { background: $theme-gradient-end; }
      }

      .step-num {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: $theme-gradient-start;
        color: white;
        font-weight: 700;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 5px 15px rgba($theme-gradient-start, 0.3);
      }

      .step-content {
        h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: $text-secondary; }
      }
    }
  }

  @media (max-width: 768px) {
    .steps-wrapper {
      .line { left: 30px; }
      .step-item {
        width: 100%;
        text-align: left;
        flex-direction: row !important; // 强制统一方向
        
        &.right { align-self: flex-start; }
      }
    }
  }
}
</style>