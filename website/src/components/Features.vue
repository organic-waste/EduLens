<script setup>
import { onMounted } from 'vue';
import { PhPencilCircle, PhUsersThree, PhBookOpen, PhCloudCheck, PhCamera, PhLightning, PhTarget } from '@phosphor-icons/vue';
import gsap from 'gsap';

const features = [
  { 
    id: 'cloud', 
    title: '云同步与国际化', 
    desc: '云端 + 本地双存储；内置中英日德西多语言，学习无国界。', 
    icon: PhCloudCheck, 
    size: 'small',
    bullets: ['断网自动回落本地，恢复后再次同步', '配置文件与页面数据安全缓存']
  },
  { 
    id: 'workflow', 
    title: '快捷启动与面板', 
    desc: '右下角可拖拽气泡，点击展开工具栏；可记忆显示/隐藏偏好。', 
    icon: PhTarget, 
    size: 'small',
    mediaNote: '放工具面板截屏或快捷键演示',
    bullets: ['Alt+E 快捷唤起，面板可拖拽到任意位置', '内置滚动进度条，随页面变化实时更新']
  },
  { 
    id: 'reading', 
    title: '阅读进度 + 书签', 
    desc: '左侧竖条实时显示阅读百分比，书签可命名、跳转并跨页面保存。', 
    icon: PhBookOpen, 
    size: 'small',
    bullets: ['点击书签圆点平滑回到位置', '实时同步其他协作者的标记']
  },
  { 
    id: 'collab', 
    title: '多人实时协作', 
    desc: '房间 / 分享码机制，即时同步标注与光标；未连接服务器时自动切换本地模式。', 
    icon: PhUsersThree, 
    size: 'large',
    mediaNote: '这里放多人协作录屏/GIF（展示多光标与房间切换）',
    bullets: ['房间列表一键创建/加入/切换', '书签、涂鸦、图片等操作实时同步']
  },
  { 
    id: 'annotation', 
    title: '标注工具箱', 
    desc: '涂鸦、框选批注、便利贴、挂图等多种形式，适配课堂讲解与个人笔记。', 
    icon: PhPencilCircle, 
    size: 'large',
    mediaNote: '插入标注工具动图：画笔/直线/橡皮擦/一键清除',
    bullets: ['矩形批注双击可输入文字，悬停查看', '图片可拖拽、缩放、旋转，支持固定或随滚动']
  },
  { 
    id: 'screenshot', 
    title: '三种截图模式', 
    desc: 'DOM 元素截图、区域截图、滚动长截图，长文档也能一键导出。', 
    icon: PhCamera, 
    size: 'large',
    mediaNote: '放滚动截屏演示或导出的长图示例',
    bullets: ['悬停高亮取景，单击即可截图', '自动滚动拼接，可随时提前结束']
  },
  { 
    id: 'focus', 
    title: '专注与提醒', 
    desc: '聚光灯、鼠标高亮、阅读聚焦与倒计时，保持节奏不分心。', 
    icon: PhLightning, 
    size: 'large',
    bullets: ['快捷键 Alt+S / Alt+H / Alt+R 快速切换', '倒计时结束弹窗提醒']
  }
];

onMounted(() => {
  gsap.from('.feature-card', {
    scrollTrigger: {
      trigger: '.features-grid',
      start: 'top 82%',
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12
  });
});
</script>

<template>
  <section class="features-section" id="features">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">核心功能演示</p>
        <h2>用一个插件完成课堂讲解与知识整理</h2>
        <p class="sub">保持玻璃拟态基调，但布局更规整，适配桌面与移动端。</p>
      </div>
      
      <div class="features-grid">
        <div 
          v-for="item in features" 
          :key="item.id" 
          :class="['feature-card', item.size]"
        >
          <div class="card-head">
            <div class="icon-wrap">
              <component :is="item.icon" :size="28" class="icon" weight="duotone" />
            </div>
            <div class="title-wrap">
              <p class="label">Feature</p>
              <h3>{{ item.title }}</h3>
            </div>
          </div>

          <p class="desc">{{ item.desc }}</p>

          <ul v-if="item.bullets?.length" class="bullets">
            <li v-for="point in item.bullets" :key="point">
              <span class="dot"></span>
              <span>{{ point }}</span>
            </li>
          </ul>
          
          <div v-if="item.video || item.mediaNote" class="media-area" :class="{ placeholder: !item.video }">
            <template v-if="item.video">
              <video :src="item.video" autoplay loop muted playsinline></video>
            </template>
            <template v-else>
              <span>{{ item.mediaNote }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;

.features-section {
  padding: 12vh 0 10vh;
  
  .container {
    width: min(92vw, 1400px);
    margin: 0 auto;
  }

  .section-head {
    margin-bottom: 6vh;
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
    h2 { font-size: clamp(2.2rem, 4vw, 3rem); color: $text-primary; margin-bottom: 1vh; }
    .sub { color: $text-secondary; font-size: clamp(1rem, 1.1vw, 1.15rem); }
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-auto-rows: minmax(18vh, auto);
    gap: clamp(1rem, 1.3vw, 1.8rem);

    .feature-card {
      @include glass-effect;
      border-radius: 24px;
      padding: clamp(1.2rem, 2vw, 2.2rem);
      display: flex;
      flex-direction: column;
      gap: 1vh;
      transition: transform 0.25s, box-shadow 0.25s;
      min-height: 24vh;
      grid-column: span 4;

      &:hover { transform: translateY(-0.6vh); box-shadow: 0 14px 40px rgba(0,0,0,0.06); }

      .card-head {
        display: flex;
        align-items: center;
        gap: 1.4vw;
      }

      .icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: rgba($theme-gradient-start, 0.12);
        display: grid;
        place-items: center;
        .icon { color: $theme-gradient-start; }
      }

      .title-wrap {
        .label { color: $text-secondary; font-size: 0.85rem; letter-spacing: 0.04em; text-transform: uppercase; }
        h3 { font-size: clamp(1.2rem, 1.6vw, 1.6rem); margin-top: 0.2rem; color: $text-primary; }
      }

      .desc {
        font-size: clamp(0.98rem, 1vw, 1.05rem);
        color: $text-secondary;
        line-height: 1.6;
      }

      .bullets {
        list-style: none;
        display: grid;
        gap: 0.6rem;
        margin-top: 0.5vh;

        li {
          display: grid;
          grid-template-columns: 10px 1fr;
          align-items: baseline;
          column-gap: 0.6rem;
          font-size: 0.95rem;
          color: $text-primary;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: $theme-gradient;
          margin-top: 0.2rem;
        }
      }

      .media-area {
        flex: 1;
        border-radius: 16px;
        overflow: hidden;
        background: linear-gradient(135deg, rgba($theme-gradient-start,0.12), rgba($theme-gradient-end,0.12));
        display: grid;
        place-items: center;
        text-align: center;
        padding: 1rem;
        margin-top: auto;
        color: $text-secondary;
        font-size: 0.95rem;
        
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        &.placeholder {
          border: 1px dashed rgba($theme-gradient-start, 0.3);
        }
      }

      &.large { grid-column: span 6; grid-row: span 2; }
      &.small { grid-column: span 4; grid-row: span 1; min-height: 20vh; }
    }
  }

  @media (max-width: 1100px) {
    .features-grid {
      grid-template-columns: repeat(8, minmax(0, 1fr));
      .feature-card { grid-column: span 4; }
      .feature-card.large { grid-column: span 8; }
      .feature-card.wide { grid-column: span 8; }
    }
  }

  @media (max-width: 800px) {
    .features-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      grid-auto-rows: minmax(18vh, auto);

      .feature-card {
        grid-column: span 1 !important;
        grid-row: span 1 !important;
      }
    }
  }
}
</style>
