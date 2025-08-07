const critical = require('critical');
const path = require('path');
const fs = require('fs');

// Critical CSS extraction configuration
const extractCriticalCSS = async () => {
  console.log('🎨 Extracting critical CSS...');
  
  try {
    // Generate critical CSS for the main page
    const { html, uncritical } = await critical.generate({
      // Source files
      base: path.join(__dirname, '../build'),
      src: 'index.html',
      
      // Output configuration
      inline: true,
      extract: true,
      
      // Viewport dimensions for above-the-fold content
      dimensions: [
        {
          height: 900,
          width: 1300
        },
        {
          height: 900,
          width: 768
        },
        {
          height: 812,
          width: 375
        }
      ],
      
      // CSS options
      penthouse: {
        timeout: 30000,
        puppeteerOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
      
      // Don't minify (already done by CRA)
      minify: false,
      
      // Include @font-face rules
      inlineImages: false,
      fonts: true
    });
    
    // Write the updated HTML with inlined critical CSS
    const outputPath = path.join(__dirname, '../build/index.html');
    fs.writeFileSync(outputPath, html);
    
    // Save uncritical CSS to a separate file (optional)
    if (uncritical) {
      const uncriticalPath = path.join(__dirname, '../build/static/css/uncritical.css');
      fs.writeFileSync(uncriticalPath, uncritical);
    }
    
    console.log('✅ Critical CSS extracted and inlined successfully!');
    console.log('📄 Updated: build/index.html');
    
    // Log file sizes for debugging
    const stats = fs.statSync(outputPath);
    console.log(`📊 HTML size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error extracting critical CSS:', error);
    // Don't fail the build, just log the error
    console.warn('⚠️  Build will continue without critical CSS optimization');
  }
};

// Run the extraction
extractCriticalCSS();