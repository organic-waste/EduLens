<template>
    <nav class="navbar">
      <div class="nav-container">
        <div class="logo">EduLens</div>
        <div class="links">
          <a href="https://github.com/organic-waste/EduLens" target="_blank">GitHub</a>
          <button class="btn-dl">安装插件</button>
        </div>
      </div>
    </nav>
  </template>
  
  <style lang="scss" scoped>
  @use '../styles/variables.scss' as *;
  
  .navbar {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 100;
    @include glass-effect;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.3);
    background: rgba(255, 255, 255, 0.1);
    
    .nav-container {
      width: min(95vw, 1600px);
      margin: 0 auto;
      height: 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
    }
  
    .logo {
      font-family: $font-display;
      font-weight: 700;
      font-size: 1.5rem;
      color: $text-primary;
    }
  
    .links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      
      a {
        text-decoration: none;
        color: $text-secondary;
        font-weight: 500;
        &:hover { color: $theme-gradient-start; }
      }
  
      .btn-dl {
        padding: 0.5rem 1.2rem;
        border-radius: 30px;
        border: none;
        background: $text-primary;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
    }
  }
  </style>