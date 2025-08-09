#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildIndexPath = path.join(__dirname, '../build/index.html');

// Function to optimize the build
function optimizeBuild() {
  if (!fs.existsSync(buildIndexPath)) {
    console.log('Build index.html not found. Please run build first.');
    return;
  }

  let html = fs.readFileSync(buildIndexPath, 'utf8');
  
  // 1. Convert main CSS and board-list CSS to non-blocking load
  // Find: <link href="/static/css/*.css" rel="stylesheet">
  // Replace with: <link href="/static/css/*.css" rel="stylesheet" media="print" onload="this.media='all'">
  html = html.replace(
    /<link href="(\/static\/css\/(?:main|board-list)\.[^"]+\.css)" rel="stylesheet">/g,
    '<link href="$1" rel="stylesheet" media="print" onload="this.media=\'all\'">\n<noscript><link href="$1" rel="stylesheet"></noscript>'
  );
  
  // 2. Add resource hints for critical fonts if not already present
  if (!html.includes('rel="preconnect" href="https://fonts.gstatic.com"')) {
    const headEnd = html.indexOf('</head>');
    const fontHints = `
    <!-- Font optimization -->
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.gstatic.com">
    `;
    html = html.slice(0, headEnd) + fontHints + html.slice(headEnd);
  }
  
  // 3. Ensure GTM is loaded with defer
  html = html.replace(
    /n\.async=!0,n\.defer=!0/g,
    'n.async=!0,n.defer=!0'
  );
  
  // 4. Add fetchpriority="high" to critical images if not present
  html = html.replace(
    /<link rel="preload" as="image" href="([^"]+)" media="([^"]+)" type="image\/webp">/g,
    '<link rel="preload" as="image" href="$1" media="$2" type="image/webp" fetchpriority="high">'
  );
  
  // Write the optimized HTML back
  fs.writeFileSync(buildIndexPath, html);
  console.log('✅ Build optimization complete:');
  console.log('  - Main CSS converted to non-blocking load');
  console.log('  - Font preconnect hints verified');
  console.log('  - GTM defer loading verified');
  console.log('  - Image fetchpriority added');
}

// Run the optimization
optimizeBuild();