#!/usr/bin/env node

/**
 * Test script for real restaurant scraping functionality
 * Tests actual web scraping without mock data
 */

require('dotenv').config();
const restaurantScraperService = require('../services/restaurantScraperService');

async function testRestaurantScraping() {
  console.log('🧪 Testing Real Restaurant Scraping\n');
  console.log('=' .repeat(50));

  // Test cases for different types of restaurants
  const testCases = [
    {
      name: 'Ocean',
      address: '333 Bayville Ave, Bayville, NY 11709',
      expectedCuisine: 'Italian or Seafood'
    },
    {
      name: 'Olive Garden',
      address: 'Huntington, NY',
      expectedCuisine: 'Italian'
    },
    {
      name: 'P.F. Chang\'s',
      address: 'Walt Whitman Mall, Huntington Station, NY',
      expectedCuisine: 'Chinese'
    },
    {
      name: 'Sushi Palace',
      address: 'Great Neck, NY',
      expectedCuisine: 'Japanese'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📍 Testing: ${testCase.name}`);
    console.log(`   Address: ${testCase.address}`);
    console.log(`   Expected: ${testCase.expectedCuisine}`);
    console.log('-'.repeat(50));

    try {
      // Collect restaurant data
      const data = await restaurantScraperService.collectRestaurantData(
        testCase.name,
        testCase.address
      );

      // Display results
      console.log('\n📊 Results:');
      
      // Google Maps results
      if (data.sources.google) {
        console.log('\n  Google Maps:');
        console.log(`    - Cuisine: ${data.sources.google.cuisine || '❓ Not detected'}`);
        console.log(`    - Rating: ${data.sources.google.rating || 'N/A'}`);
        console.log(`    - Reviews: ${data.sources.google.reviewCount || 0}`);
      }

      // Yelp results
      if (data.sources.yelp) {
        console.log('\n  Yelp:');
        console.log(`    - Cuisine: ${data.sources.yelp.cuisine || '❓ Not detected'}`);
        console.log(`    - Categories: ${data.sources.yelp.categories?.join(', ') || 'None'}`);
        console.log(`    - Rating: ${data.sources.yelp.rating || 'N/A'}`);
        console.log(`    - Menu items: ${data.sources.yelp.menu?.length || 0}`);
      }

      // Grubhub results
      if (data.sources.grubhub) {
        console.log('\n  Grubhub:');
        console.log(`    - Menu items: ${data.sources.grubhub.menu?.length || 0}`);
      }

      // Combined menu
      console.log('\n  📝 Combined Menu:');
      if (data.menu.length > 0) {
        data.menu.slice(0, 5).forEach(item => {
          console.log(`    - ${item.name}: ${item.price || 'Price N/A'}`);
        });
      } else {
        console.log('    No menu items found');
      }

      // Test specific menu recommendations
      const analysisPrompt = restaurantScraperService.formatForClaudeAnalysis(data);
      console.log('\n  🤖 Claude Analysis Prompt Length:', analysisPrompt.length, 'chars');

      // Success indicator
      const detectedCuisine = data.sources.google?.cuisine || 
                             data.sources.yelp?.cuisine || 
                             'Unknown';
      
      const success = detectedCuisine !== 'Unknown' && detectedCuisine !== 'Chinese';
      console.log(`\n  ✅ Status: ${success ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
      console.log(`     Detected: ${detectedCuisine}`);
      console.log(`     Expected: ${testCase.expectedCuisine}`);

    } catch (error) {
      console.error(`\n  ❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50));
  }

  // Test image scraping
  console.log('\n🖼️  Testing Image Scraping');
  console.log('-'.repeat(50));
  
  try {
    const imageResult = await restaurantScraperService.searchDishImage(
      'Ocean',
      'Margherita Pizza',
      'Bayville NY'
    );
    
    console.log('Image search result:');
    console.log(`  - URL: ${imageResult.url ? imageResult.url.substring(0, 50) + '...' : 'None'}`);
    console.log(`  - Is Reference: ${imageResult.isReference}`);
  } catch (error) {
    console.error(`  ❌ Image scraping error: ${error.message}`);
  }

  console.log('\n✅ Test completed!');
}

// Run the test
testRestaurantScraping().catch(console.error);