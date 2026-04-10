<template>
  <div class="site-shell">
    <!-- 16Personalities-style Header -->
    <header v-if="$route.path !== '/quiz'" class="site-header">
      <RouterLink class="brand-lockup" to="/">
        <div class="brand-logo" aria-hidden="true">
          <span class="dot dot-1"></span>
          <span class="dot dot-2"></span>
          <span class="dot dot-3"></span>
          <span class="dot dot-4"></span>
        </div>
        <span class="brand-name">ACGTI</span>
      </RouterLink>

      <nav class="site-nav">
        <RouterLink to="/quiz">Personality Test</RouterLink>
        <RouterLink to="/intro">Personality Types</RouterLink>
        <RouterLink to="/about">Resources</RouterLink>
        <a href="#">Log In</a>
        <RouterLink to="/quiz" class="button button-primary nav-cta">Take the Test</RouterLink>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="site-main">
      <RouterView />
    </main>

    <!-- 16Personalities-style Footer (only show on non-quiz pages) -->
    <footer v-if="$route.path !== '/quiz'" class="site-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">Products</h3>
          <a href="/quiz" class="footer-link">Premium Career Suite</a>
          <a href="/quiz" class="footer-link">Team Assessments</a>
          <a href="/intro" class="footer-link">Personality Types</a>
        </div>
        <div class="footer-section">
          <h3 class="footer-title">Resources</h3>
          <a href="/quiz" class="footer-link">Personality Test</a>
          <a href="/intro" class="footer-link">Our Framework</a>
          <a href="/about" class="footer-link">Articles</a>
        </div>
        <div class="footer-section">
          <h3 class="footer-title">Help</h3>
          <a href="/about" class="footer-link">Contact Us</a>
          <a href="/about" class="footer-link">FAQ</a>
          <a href="/about" class="footer-link">Report an Issue</a>
        </div>
        <div class="footer-section">
          <h3 class="footer-title">Our Creations</h3>
          <a href="#" class="footer-link">NPQE</a>
          <a href="#" class="footer-link">MindTrackers</a>
          <a href="#" class="footer-link">Leadership by ACGTI</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copyright">©2011-2026 ACGTI Analytics Limited</p>
        <div class="footer-social">
          <a href="#" title="Bookmark">BK</a>
          <a href="#" title="Facebook">FB</a>
          <a href="#" title="Instagram">IG</a>
          <a href="#" title="Twitter">TW</a>
        </div>
      </div>
    </footer>
  </div>
</template>
