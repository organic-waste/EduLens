<template>
  <nav class="navbar">
    <div class="nav-container">
      <a class="logo" href="https://edu-lens.netlify.app/" target="_blank" rel="noopener">EduLens</a>
      <div class="links">
        <a class="github-link" href="https://github.com/organic-waste/EduLens" target="_blank" rel="noopener">GitHub</a>
        <a class="btn-dl" href="https://chromewebstore.google.com/detail/jnncboomobahpjpkkhjoekacjogmphhc?utm_source=item-share-cb" target="_blank" rel="noopener">安装插件</a>
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
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

    .github-link {
      position: relative;
      text-decoration: none;
      color: $text-secondary;
      font-weight: 500;
      transition: color 0.3s ease;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -2px;
        width: 0;
        height: 2px;
        background: $theme-gradient-start;
        transition: width 0.3s ease;
      }

      &:hover {
        color: $theme-gradient-start;
        &::after {
          width: 100%;
        }
      }
    }

    .btn-dl {
      padding: 0.5rem 1.2rem;
      border-radius: 30px;
      border: none;
      background: $theme-gradient-start;
      color: white;
      font-weight: 600;
      cursor: pointer;
      background-size: 200% 100%;
      background-position: 0% 0;
      transition: transform 0.3s ease, box-shadow 0.3s ease, background-position 0.4s ease;

      &:hover {
        background-position: 100% 0;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(66, 66, 75, 0.2);
      }
    }
  }
}
</style>
