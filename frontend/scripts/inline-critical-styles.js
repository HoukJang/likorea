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
}
body {
  margin: 0;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
/* Banner critical styles */
.banner {
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: #f5f5f5;
}
.banner-image {
  width: 100%;
  height: auto;
  display: block;
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
}
/* Responsive container */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
/* Hide elements until JS loads */
.js-loading {
  visibility: hidden;
}
/* Font loading optimization */
.fonts-loading body {
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
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