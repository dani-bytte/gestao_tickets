const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

const ICONS = {
  DARK: '☀️',
  LIGHT: '🌙'
};

document.addEventListener("DOMContentLoaded", () => {
  const toggleThemeButton = document.getElementById("toggle-theme");
  
  if (!toggleThemeButton) {
    console.error("Toggle theme button not found!");
    return;
  }

  // Theme management
  const updateTheme = (isDark) => {
    document.body.classList.toggle('dark-theme', isDark);
    toggleThemeButton.textContent = isDark ? ICONS.DARK : ICONS.LIGHT;
    localStorage.setItem('theme', isDark ? THEMES.DARK : THEMES.LIGHT);
  };

  // Initial theme setup
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme === THEMES.DARK) {
    updateTheme(true);
  } else if (currentTheme === THEMES.LIGHT) {
    updateTheme(false);
  }

  // System preference detection
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const handlePrefersDarkChange = (e) => {
    if (!localStorage.getItem('theme')) {
      updateTheme(e.matches);
    }
  };
  prefersDark.addListener(handlePrefersDarkChange);

  // Theme toggle handler
  toggleThemeButton.addEventListener("click", () => {
    const isDark = !document.body.classList.contains('dark-theme');
    updateTheme(isDark);
  });

  // Cleanup event listeners on unload
  window.addEventListener('unload', () => {
    prefersDark.removeListener(handlePrefersDarkChange);
  });
});