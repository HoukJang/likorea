const fs = require('fs');
const path = require('path');

// Simpler critical CSS inlining without Puppeteer
const inlineCriticalStyles = () => {
  console.log('🎨 Inlining critical styles...');
  
  try {
    const buildDir = path.join(__dirname, '../build');
    const indexPath = path.join(buildDir, 'index.html');
    
    // Read the index.html file
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Critical styles for above-the-fold content
    const criticalCSS = `
/* Critical CSS for initial render */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}
body {
  margin: 0;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
  background-color: #ffffff;
  color: #333333;
}
#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
/* Header critical styles */
header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1000;
}
/* Banner critical styles */
.banner {
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: #f5f5f5;
  min-height: 89px;
}
.banner-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}
/* Loading states */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 18px;
  color: #666;
}
/* Navigation critical styles */
nav {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.5rem 0;
}
nav ul {
  list-style: none;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
nav a {
  color: #333;
  text-decoration: none;
  padding: 0.5rem 1rem;
  transition: color 0.2s;
}
nav a:hover {
  color: #0066cc;
}
/* Responsive container */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
/* Main content area */
main {
  flex: 1;
  padding: 20px 0;
}
/* Footer */
footer {
  background-color: #f8f9fa;
  padding: 2rem 0;
  margin-top: auto;
  border-top: 1px solid #e0e0e0;
}
/* Hide elements until JS loads */
.js-loading {
  visibility: hidden;
}
/* Font loading optimization */
.fonts-loading body {
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
/* Prevent layout shift */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
}
img {
  max-width: 100%;
  height: auto;
}
/* Button defaults */
button {
  cursor: pointer;
  border: none;
  background: #0066cc;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: inherit;
}
/* Input defaults */
input, textarea, select {
  font-family: inherit;
  font-size: inherit;
}
/* Mobile styles */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  nav {
    padding: 0.25rem 0;
  }
  .banner {
    min-height: 60px;
  }
  main {
    padding: 15px 0;
  }
}
/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}
@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

    // Find the closing </head> tag and insert critical CSS before it
    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex !== -1) {
      const criticalStyleTag = `<style id="critical-css">${criticalCSS.trim()}</style>\n`;
      html = html.slice(0, headEndIndex) + criticalStyleTag + html.slice(headEndIndex);
      
      // Add script to remove critical CSS once main CSS loads
      const cleanupScript = `
<script>
// Remove critical CSS once main stylesheets load
window.addEventListener('load', function() {
  var criticalStyle = document.getElementById('critical-css');
  if (criticalStyle) {
    setTimeout(function() {
      criticalStyle.remove();
    }, 100);
  }
});
</script>
`;
      
      const bodyEndIndex = html.indexOf('</body>');
      if (bodyEndIndex !== -1) {
        html = html.slice(0, bodyEndIndex) + cleanupScript + html.slice(bodyEndIndex);
      }
      
      // Write the updated HTML
      fs.writeFileSync(indexPath, html);
      
      console.log('✅ Critical CSS inlined successfully!');
      console.log('📄 Updated: build/index.html');
      
      // Log file size
      const stats = fs.statSync(indexPath);
      console.log(`📊 HTML size: ${(stats.size / 1024).toFixed(2)} KB`);
      
    } else {
      throw new Error('Could not find </head> tag in index.html');
    }
    
  } catch (error) {
    console.error('❌ Error inlining critical CSS:', error);
    console.warn('⚠️  Build will continue without critical CSS optimization');
  }
};

// Run the inlining
inlineCriticalStyles();