<script setup>
import { onMounted, ref } from 'vue';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  PhTarget, 
  PhBookOpen, 
  PhUsersThree, 
  PhPencilCircle, 
  PhCamera, 
  PhLightning,
  PhCaretLeft,
  PhCaretRight,
  PhArrowCounterClockwise
} from '@phosphor-icons/vue';

gsap.registerPlugin(ScrollTrigger);

const activeIndex = ref(0);
const sectionHead = ref(null);
const underlinePath = ref(null);

// 介绍文案
const features = [
  { 
    id: 'workflow', 
    title: '快捷启动与面板', 
    desc: '可拖拽气泡工具栏，保障无遮挡网页内容；可记忆显示/隐藏面板偏好。', 
    icon: PhTarget, 
    video: '/videos/panel.mp4',
    bullets: ['点击气泡展开工具面板，可拖拽到任意位置', '点击右上角图标可切换面板隐藏状态']
  },
  { 
    id: 'focus', 
    title: '专注与提醒', 
    desc: '聚光灯、鼠标高亮、阅读聚焦与倒计时，保持学习节奏不分心。', 
    icon: PhLightning, 
    video: '/videos/focus.mp4',
    bullets: ['快捷键 Alt/Option + S·H·R 快速切换', '倒计时结束弹窗提醒']
  },
  { 
    id: 'reading', 
    title: '阅读进度与书签', 
    desc: '左侧竖条实时显示阅读百分比，书签可命名、跳转并跨页面保存。', 
    icon: PhBookOpen, 
    video: '/videos/bookmark.mp4',
    bullets: ['自定义书签标题并记忆阅读进度', '点击书签圆点平滑返回相应书签位置']
  },
  { 
    id: 'annotation', 
    title: '标注工具箱', 
    desc: '涂鸦、直线、框选、图片等多种形式，适配课堂讲解与个人笔记。', 
    icon: PhPencilCircle, 
    video: '/videos/annotation.mp4',
    bullets: ['矩形批注双击可输入文字内容', '矩形批注和图片可拖拽、缩放，支持切换固定或跟随页面滚动']
  },
  { 
    id: 'screenshot', 
    title: '三种截图模式', 
    desc: 'DOM 元素截图、区域截图、滚动长截图，长文档也能一键导出。', 
    icon: PhCamera, 
    video: '/videos/screenshot.mp4',
    bullets: ['悬停DOM高亮取景，单击即可停止截图', '长截图自动滚动拼接，可随时结束截取']
  },
  { 
    id: 'collab', 
    title: '多人实时协作', 
    desc: '共享房间机制，即时同步标注数据；未连接服务器时自动切换本地模式。', 
    icon: PhUsersThree, 
    video: '/videos/collaboration.mp4',
    bullets: ['本地和云端双重存储，保障数据不丢失', '书签、涂鸦、批注、图片等操作实时同步']
  },
];

onMounted(() => {
  const steps = gsap.utils.toArray('.text-step');
  // 控制Features的切换
  steps.forEach((step, index) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top center", 
      end: "bottom center",
      onEnter: () => activeIndex.value = index,
      onEnterBack: () => activeIndex.value = index,
    });
  });

  if (underlinePath.value && sectionHead.value) {
    const totalLength = underlinePath.value.getTotalLength();   // 返回整条SVG路径的像素长度
    gsap.set(underlinePath.value, {
      strokeDasharray: totalLength,
      strokeDashoffset: totalLength,
      opacity: 0
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: sectionHead.value,
        start: 'top 50%',
        once: true
      }
    })
    .to(underlinePath.value, { opacity: 1, duration: 0.2 })  // 一边淡入一边描线
    .to(underlinePath.value, {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: 'power2.out'
    }, '<');
  }
});
</script>

<template>
  <section class="sticky-features">
    <div class="container">
              <div class="section-head" ref="sectionHead">
          <p class="eyebrow">核心功能演示</p>
          <h2>用一个插件完成知识整理</h2>
          <svg class="headline-underline" viewBox="0 0 360 60" preserveAspectRatio="none">
            <path ref="underlinePath" d="M5 40 C 80 10, 160 50, 250 25 C 300 5, 340 35, 355 20" />
          </svg>
          <!-- <p class="sub">一体化学习协助、课堂互动工具</p> -->
        </div>
      
      <!-- 文字 -->
      <div class="text-column">
        <div 
          v-for="(feature, index) in features" 
          :key="index"
          class="text-step"
        >
          <div class="step-card" :class="{ active: activeIndex === index }">
            <div class="card-head">
              <div class="icon-box">
                <component :is="feature.icon" :size="28" weight="duotone" />
              </div>
              <h3>{{ feature.title }}</h3>
            </div>
            
            <p class="desc">{{ feature.desc }}</p>
            
            <ul class="feature-bullets">
              <li v-for="(bullet, bIndex) in feature.bullets" :key="bIndex">
                {{ bullet }}
              </li>
            </ul>
          </div>
        </div>
        <div class="spacer"></div>
      </div>

      <!-- 视频 -->
      <div class="visual-column">
        <div class="sticky-wrapper">
          <div class="video-container glass-frame">
            <transition-group name="fade">
              <div 
                v-for="(feature, index) in features" 
                :key="feature.id"
                v-show="activeIndex === index"
                class="video-item"
              >
                <div class="browser-content">
                  <div class="address-bar">
                    <div class="browser-controls">
                      <PhCaretLeft class="ctrl-icon" size="18" weight="bold" aria-label="Back" />
                      <PhCaretRight class="ctrl-icon" size="18" weight="bold" aria-label="Forward" />
                      <PhArrowCounterClockwise class="ctrl-icon" size="18" weight="bold" aria-label="Refresh" />
                    </div>
                    <div class="url">edulens://{{ feature.id }}</div>
                  </div>
                  
                  <div class="media-content">
                     <video 
                       v-if="feature.video" 
                       :src="feature.video" 
                       autoplay 
                       loop 
                       muted 
                       playsinline
                     ></video>
                     
                     <div v-else class="placeholder-info">
                       <component :is="feature.icon" :size="48" weight="duotone" class="ph-icon"/>
                       <p>{{'演示视频' }}</p>
                     </div>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss'as *;
@use '../styles/main.scss'as *;

.sticky-features {
  position: relative;
  padding-top: 5vh;

  .container {
    width: 100vw;
    margin: 10vh auto 0 auto;
    display: flex;
  }

  .section-head {
    position: absolute;
    margin-left: 5vw;
    .eyebrow {
      display: inline-block;
      padding: 0.5rem 1.2rem;
      border-radius: 999px;
      background: rgba($theme-gradient-start, 0.12);
      color: $theme-gradient-start;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: 1vh;
    }
    h2 { font-size: clamp(2.4rem, 4vw, 3rem); color: $text-primary; margin-bottom: 1vh; }
    .headline-underline {
      position: absolute;
      width: clamp(29rem, 44vw, 40rem);
      height: 50px;
      margin: -1rem 0 1.5rem;
      overflow: visible;

      path {
        fill: none;
        stroke: rgba($theme-gradient-start, 0.8);
        stroke-width: 6;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }
    .sub { color: $text-secondary; font-size: clamp(1.1rem, 1.1vw, 1.4rem);margin-top: 1rem; }
  }

  .text-column {
    width: 45%; 
    padding: 20vh 2rem 0 4rem;
    position: relative;
    z-index: 10;

    .text-step {
      min-height: 70vh; 
      display: flex;
      align-items: center;
      
      .step-card {
        opacity: 0.5;
        transform: translateX(-20px) scale(0.95);
        transition: all 0.5s ease;
        
        &.active {
          opacity: 1;
          transform: translateX(0) scale(1);
          border-color: $theme-gradient-start;
          
          .icon-box { background: $theme-gradient; color: white; }
        }

        .card-head {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;

          .icon-box {
            width: 8vh;
            height: 8vh;
            border-radius: 12px;
            background: rgba($theme-gradient-start, 0.1);
            color: $theme-gradient-start;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
          }

          h3 { font-size: 2rem; margin: 0; color: $text-primary; }
        }

        .desc {
          font-size: 1.2rem;
          color: $text-secondary;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .feature-bullets {
          list-style: none;
          padding: 0;
          
          li {
            position: relative;
            padding-left: 1.5rem;
            margin-bottom: 0.5rem;
            color: $text-primary;
            font-size: 1.1rem;

            &::before {
              content: '';
              position: absolute;
              left: 0;
              top: 8px;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: $theme-gradient-end;
            }
          }
        }
      }
    }
    
    .spacer { height: 20vh; }
  }

  .visual-column {
    width: 60%;
    height: 100vh;
    position: sticky;
    top: 5vh;
    display: flex;
    align-items: center;
    justify-content: center;
    .sticky-wrapper{
      width: 100%;
      margin-right: 4vw;
    }

    .video-container {
      width: 100%;
      aspect-ratio: 16/10;
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      
      background: rgba(255,255,255,0.3);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.6);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);

      .video-item {
        position: absolute;
        inset: 0;
        padding: 10px;
        
        .browser-content {
          width: 100%;
          height: 100%;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;

          .address-bar {
            height: 32px;
            background: #f1f3f5;
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 10px;

            .browser-controls {
              display: flex;
              align-items: center;
              gap: 8px;
              
              .ctrl-icon {
                color: #9da3b4;
                padding: 4px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.6);
              }
            }
            .url {
              font-size: 10px; color: #999; 
              background: white; padding: 2px 10px; border-radius: 4px; flex: 1;
              text-align: center;
            }
          }

          .media-content {
            flex: 1;
            background: #fafafa;
            position: relative;
            
            video { 
              position: absolute;
              top: 0;
              left: 0;
              width: 100%; 
              height: 100%; 
              object-fit: cover; 
              display: block;
              z-index: 10;
              filter: brightness(105%) contrast(103%);
            }
            
            .placeholder-info {
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: $text-secondary;
              gap: 1rem;
              padding: 2rem;
              text-align: center;
              
              .ph-icon { color: #ccc; }
              p { font-size: 0.9rem; max-width: 80%; }
            }
          }
        }
      }
    }
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
