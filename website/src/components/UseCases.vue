<script setup>
import { PhStudent, PhChalkboardTeacher, PhVideoCamera } from '@phosphor-icons/vue';

const cases = [
  {
    title: '个人学习',
    desc: '在查阅文献或技术博客时，快速高亮重点、记录笔记。利用专注辅助模式，提升阅读专注度。',
    icon: PhStudent
  },
  {
    title: '在线教学',
    desc: '老师创建房间，学生加入。无需屏幕共享，直接在网页上进行同步演示和板书，互动性大幅提升。',
    icon: PhChalkboardTeacher
  },
  {
    title: '视频制作',
    desc: '录制教程视频时，使用涂鸦和高亮工具即时标记讲解重点，让观众视线紧跟你的思路。',
    icon: PhVideoCamera
  }
];
</script>

<template>
  <section class="use-cases">
    <div class="container">
      <div class="header">
        <h2>多场景赋能</h2>
        <p>从独自钻研到团队分享，EduLens 无缝融入你的工作流。</p>
      </div>

      <div class="grid">
        <div v-for="(item, i) in cases" :key="i" class="case-card glass-card">
          <div class="icon-wrapper">
            <component :is="item.icon" :size="42" weight="duotone" />
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../styles/variables.scss' as *;
@use '../styles/main.scss' as *;

.use-cases {
  padding-bottom: 10vh;
  .container {
    width: min(90vw, 1200px);
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 4rem;
    h2 { font-size: 2.8rem; color: $text-primary; margin-bottom: 0.5rem; }
    p { color: $text-secondary; }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;

    .case-card {
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow: 0 15px 30px rgba($theme-gradient-start, 0.1);
      
      padding: 3rem 2rem;
      border-radius: 24px;
      text-align: center;
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-8px);
        background: rgba(255, 255, 255, 0.7);
        border-color: $theme-gradient-start;
        box-shadow: 0 15px 30px rgba($theme-gradient-start, 0.3);

        .icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }
      }

      .icon-wrapper {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, rgba($theme-gradient-start, 0.1), rgba($theme-gradient-end, 0.1));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $theme-gradient-start;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      h3 { font-size: 1.35rem; margin-bottom: 1rem; color: $text-primary; }
      p { font-size: 0.95rem; color: $text-secondary; line-height: 1.6; }
    }
  }

  @media (max-width: 768px) {
    .grid { grid-template-columns: 1fr; }
  }
}
</style>