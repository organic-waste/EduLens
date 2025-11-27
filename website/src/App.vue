<script setup>
import { onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import Hero from './components/Hero.vue';
import Features from './components/Features.vue';
import UseCases from './components/UseCases.vue';
import Workflow from './components/Workflow.vue';
import Footer from './components/Footer.vue';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

onMounted(() => {
  // 背景光球动画
  gsap.to('.blob-1', {
    x: '15vw', y: '10vh', duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut'
  });
  gsap.to('.blob-2', {
    x: '-10vw', y: '-15vh', duration: 15, repeat: -1, yoyo: true, ease: 'sine.inOut'
  });
});
</script>

<template>
  <div class="app-root">
    <div class="bg-layer">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="content-layer">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <UseCases />
        <Workflow /> 
      </main>
      <Footer />
    </div>
  </div>
</template>

<style lang="scss">
@use './styles/variables.scss' as *;
@import './styles/main.scss';

.app-root {
  position: relative;
  width: 100%;
}

.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0; 
  pointer-events: none;
  overflow: hidden;

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
  }

  .blob-1 {
    width: 40vw;
    height: 40vw;
    background: $theme-gradient-start;
    top: -10vh;
    left: -10vw;
  }

  .blob-2 {
    width: 35vw;
    height: 35vw;
    background: $theme-gradient-end;
    bottom: -10vh;
    right: -5vw;
  }
}

.content-layer {
  position: relative;
  z-index: 1;
}
</style>
