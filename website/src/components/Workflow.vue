<script setup>
import { PhDownloadSimple, PhPushPin, PhPower } from '@phosphor-icons/vue';
import { ref, onMounted } from 'vue';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const numberPaths = [
  // 1
  "M 22 18 L 28 12 L 28 38", 
  // 2
  "M 16 16 C 22 8, 36 8, 34 20 C 32 32, 16 38, 16 38 L 36 38",
  // 3
  "M 16 14 C 26 8, 36 14, 26 24 C 36 28, 32 40, 16 38"
]

const stepRefs = ref([]);
const workflowSection = ref(null);

onMounted(() => {
  if (!workflowSection.value) return;

  ScrollTrigger.create({
    trigger: workflowSection.value,
    start: 'top 70%',
    once: true,
    onEnter: animateStepNumbers
  });
});

// 步骤顺序手写动画
function animateStepNumbers() {
  stepRefs.value.forEach((stepEl, index) => {
    const path = stepEl.querySelector('.number-path');
    if (!path) return;
    
    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length+1,
      strokeDashoffset: length+1
    });
    
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1,
      delay: index * 0.8,
      ease: "ease-in-out"
    });
  });
}

// 设置步骤引用
function setStepRef(el) {
  if (el) {
    stepRefs.value.push(el);
  }
}
</script>

<template>
  <section class="workflow" id="workflow" ref="workflowSection">
    <div class="container">
      <div class="section-title">
        <h2>30 秒快速上手</h2>
        <p>简单三步，开启你的网页标注之旅</p>
      </div>

      <div class="steps-row">
        <!-- Step 1 -->
        <div class="step" :ref="setStepRef">
          <div class="step-icon glass-icon">
            <PhDownloadSimple :size="32" weight="bold" />
            <svg 
              viewBox="0 0 50 50" 
              fill="none" 
              class="handwritten-svg"
            >
              <path 
                :d="numberPaths[0]" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                class="number-path"
              />
            </svg>
          </div>
          <h3>添加到 Chrome</h3>
          <p>前往商店，点击"Add to Chrome"</p>
        </div>
        
        <div class="connector"></div>

        <!-- Step 2 -->
        <div class="step" :ref="setStepRef">
          <div class="step-icon glass-icon">
            <PhPushPin :size="32" weight="bold" />
            <svg 
              viewBox="0 0 50 50" 
              fill="none" 
              class="handwritten-svg"
            >
              <path 
                :d="numberPaths[1]" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                class="number-path"
              />
            </svg>
          </div>
          <h3>固定图标</h3>
          <p>点击右上角扩展拼图图标，找到 EduLens 并点击大头针</p>
        </div>

        <div class="connector"></div>

        <!-- Step 3 -->
        <div class="step" :ref="setStepRef">
          <div class="step-icon glass-icon">
            <PhPower :size="32" weight="bold" />
            <svg 
              viewBox="0 0 50 50" 
              fill="none" 
              class="handwritten-svg"
            >
              <path 
                :d="numberPaths[2]" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                class="number-path"
              />
            </svg>
          </div>
          <h3>一键使用</h3>
          <p>点击右下角气泡即可展开工具面板</p>
        </div>
      </div>

      <!-- 安装指引-->
      <div class="cta-banner">
        <div class="banner-content">
          <h2>准备好体验了吗？</h2>
          <p>加入高效学习者的行列，让 Web 成为你的知识库。</p>
          <div class="banner-btns">
            <button class="dl-btn">
              <span>前往 Chrome 商店下载</span>
              <div class="glow"></div>
            </button>
            <span class="version-info">当前版本 v1.0.1 • 免费开源</span>
          </div>
        </div>
        <div class="banner-bg"></div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss'as *;
@use '../styles/main.scss'as *;

.workflow {
  padding: 8vh 0 10vh;

  .container {
    width: min(90vw, 1000px);
    margin: 0 auto;
  }

  .section-title {
    text-align: center;
    margin-bottom: 4rem;
    h2 { font-size: 2.8rem; color: $text-primary; margin-bottom: 0.5rem; }
    p { color: $text-secondary; }
  }

  .steps-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 6rem;
    position: relative;

    .step {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 2;

      .step-icon {
        width: 80px;
        height: 80px;
        background: rgba(255,255,255,0.6);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255,255,255,0.8);
        border-radius: 20px;
        
        display: flex;
        align-items: center;
        justify-content: center;
        color: $text-primary;
        margin-bottom: 1.5rem;
        position: relative;
        box-shadow: 0 10px 20px rgba(0,0,0,0.03);

        .handwritten-svg {
          position: absolute;
          top: -20px;
          right: -15px;
          width: 50px;
          height: 50px;
          pointer-events: none;
          filter: drop-shadow(1px 3px 2px rgba(#5b5e78, 0.3));

          .number-path {
            fill: none;
            stroke: #3bd3e1;
            stroke-width: 4;
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
          }
        }
      }

      h3 { font-size: 1.1rem; margin-bottom: 0.5rem; color: $text-primary; }
      p { font-size: 0.9rem; color: $text-secondary; max-width: 200px; }
    }

    .connector {
      flex: 1;
      height: 2px;
      background: rgba($text-secondary, 0.2); 
      margin-top: 40px; 
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba($text-secondary, 0.4);
      }
    }
  }

  .cta-banner {
    position: relative;
    border-radius: 24px;
    padding: 4rem;
    text-align: center;
    overflow: hidden;
    background: $text-primary; 
    color: white;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);

    .banner-content {
      position: relative;
      z-index: 2;
      
      h2 { font-size: 2.5rem; margin-bottom: 1rem; }
      p { opacity: 0.8; margin-bottom: 2.5rem; font-size: 1.1rem; }
      
      .banner-btns {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;

        .dl-btn {
          padding: 1rem 3rem;
          border-radius: 50px;
          border: none;
          background: $theme-gradient;
          color: white;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;

          span {
            position: relative;
            z-index: 2;
          }

          .glow {
            position: absolute;
            top: 0;
            left: -120%;
            width: 60%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
            transform: skewX(-20deg);
            opacity: 0.8;
            transition: left 0.6s ease;
          }
          
          &:hover {
            transform: scale(1.05);
            .glow { left: 120%; }
          }
        }

        .version-info {
          font-size: 0.85rem;
          opacity: 0.6;
        }
      }
    }

    .banner-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      background: radial-gradient(circle at top right, rgba($theme-gradient-end, 0.2), transparent 40%),
                  radial-gradient(circle at bottom left, rgba($theme-gradient-start, 0.2), transparent 40%);
    }
  }
}
</style>
