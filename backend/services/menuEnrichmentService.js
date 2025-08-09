/**
 * Menu Enrichment Service
 * Enriches extracted menu items with images, prices, and additional details
 */

const fetch = require('node-fetch');
const Anthropic = require('@anthropic-ai/sdk');

class MenuEnrichmentService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  }

  /**
   * Enrich menu items with additional data
   * @param {Array} menuItems - Extracted menu items from Claude
   * @param {Object} restaurantData - Full restaurant data from Google Places
   * @returns {Array} Enriched menu items with images, prices, etc.
   */
  async enrichMenuData(menuItems, restaurantData) {
    if (!menuItems || menuItems.length === 0) {
      return [];
    }

    console.log(`🔧 Enriching ${menuItems.length} menu items...`);

    const enrichedItems = [];
    const usedImageUrls = new Set(); // 이미 사용된 이미지 URL 추적

    for (const item of menuItems) {
      try {
        const enriched = {
          ...item,
          images: [],
          enrichedPrice: null,
          enrichedDescription: null,
          matchConfidence: {},
          dataQuality: 'basic'
        };

        // Step 1: Try Google Custom Search first for specific menu images
        // Skip if API is blocked (403 error)
        if (this.searchEngineId && process.env.ENABLE_IMAGE_SEARCH !== 'false') {
          try {
            const searchResult = await this.searchMenuImage(
              item.name,
              restaurantData.restaurant.name,
              restaurantData.restaurant.address,
              usedImageUrls // 이미 사용된 이미지 URL 전달
            );

            if (searchResult && searchResult.images && searchResult.images.length > 0) {
              // Store all images for frontend selection
              enriched.allImages = searchResult.images;
              console.log(`   📦 Storing ${searchResult.images.length} images in allImages for ${item.name}`);

              // Use the best scored image as default
              const bestImage = searchResult.images[0];
              if (bestImage && bestImage.score >= 0) {
                enriched.images.push({
                  url: bestImage.url,
                  source: 'google_search',
                  confidence: Math.min(bestImage.score / 100, 0.95),
                  title: bestImage.title,
                  warnings: bestImage.warnings
                });
                enriched.matchConfidence.photo = Math.min(bestImage.score / 100, 0.95);
                usedImageUrls.add(bestImage.url); // Mark best image as used
                console.log(`   ✅ Selected best image for ${item.name}: ${bestImage.url.substring(0, 50)}...`);
              }
            }
          } catch (error) {
            // Silently skip if image search fails
            console.log(`⚠️ Image search skipped for ${item.name}`);
          }
        }

        // Step 2: If no image found via search, try to use Google Places photos as fallback
        if (enriched.images.length === 0) {
          const matchedPhoto = await this.matchMenuToExistingPhotos(
            item.name,
            restaurantData.photos,
            restaurantData.restaurant.types
          );

          if (matchedPhoto) {
            enriched.images.push(matchedPhoto);
            enriched.matchConfidence.photo = matchedPhoto.confidence;
          }
        }

        // Step 3: Extract price from reviews if not already found
        if (!item.priceHint && restaurantData.rawReviews) {
          enriched.enrichedPrice = await this.extractPriceFromReviews(
            item.name,
            restaurantData.rawReviews
          );
        } else {
          enriched.enrichedPrice = item.priceHint;
        }

        // Step 4: Enrich description based on cuisine type
        enriched.enrichedDescription = this.enhanceDescription(
          item.name,
          item.description,
          restaurantData.restaurant.types,
          item.ingredients
        );

        // Step 5: Calculate data quality score
        enriched.dataQuality = this.calculateDataQuality(enriched);

        enrichedItems.push(enriched);

      } catch (error) {
        console.error(`⚠️ Failed to enrich ${item.name}:`, error.message);
        // Add item even if enrichment fails
        enrichedItems.push({
          ...item,
          images: [],
          dataQuality: 'basic'
        });
      }
    }

    console.log(`✅ Enrichment complete. ${enrichedItems.filter(i => i.images.length > 0).length} items have images`);

    return enrichedItems;
  }

  /**
   * Try to match menu item with existing restaurant photos
   */
  async matchMenuToExistingPhotos(menuName, photos, restaurantTypes) {
    // Don't use Google Places photos for specific menu items
    // They are usually general restaurant photos, not specific dishes
    // Only use if explicitly the restaurant exterior or interior

    if (menuName === 'Restaurant Exterior' && photos.exterior) {
      return {
        url: photos.exterior,
        source: 'google_places',
        confidence: 1.0,
        type: 'exterior'
      };
    }

    if (menuName === 'Restaurant Interior' && photos.interior) {
      return {
        url: photos.interior,
        source: 'google_places',
        confidence: 1.0,
        type: 'interior'
      };
    }

    // Don't assign food photos to specific menu items
    // It's misleading to show wrong food photos
    return null;
  }

  /**
   * Search for menu images using Google Custom Search API
   * Returns ALL found images for frontend selection
   */
  async searchMenuImage(dishName, restaurantName, location, usedImageUrls = new Set()) {
    if (!this.searchEngineId || !this.googleApiKey) {
      console.log('⚠️ Google Custom Search not configured');
      return null;
    }

    try {
      // Clean location for better search - use full address for better results

      // Use consistent search query for all restaurants
      const searchQuery = `"${dishName}" restaurant "${restaurantName}" ${location}`;

      console.log(`🔍 Searching image for: ${dishName}`);
      console.log(`   Query: ${searchQuery}`);

      // 첫 번째 페이지 (1-10)
      const searchUrl1 = 'https://www.googleapis.com/customsearch/v1?' +
        `key=${this.googleApiKey}&` +
        `cx=${this.searchEngineId}&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        'searchType=image&' +
        'num=10&' +
        'start=1&' +
        'safe=active';

      // 두 번째 페이지 (11-20)
      const searchUrl2 = 'https://www.googleapis.com/customsearch/v1?' +
        `key=${this.googleApiKey}&` +
        `cx=${this.searchEngineId}&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        'searchType=image&' +
        'num=10&' +
        'start=11&' +
        'safe=active';

      // 병렬로 두 페이지 요청
      const [response1, response2] = await Promise.all([
        fetch(searchUrl1),
        fetch(searchUrl2)
      ]);

      if (!response1.ok) {
        const errorText = await response1.text();
        console.error(`❌ Image search failed (page 1): ${response1.status}`);
        console.error(`   Error: ${errorText.substring(0, 200)}`);
        return null;
      }

      const data1 = await response1.json();
      let allItems = data1.items || [];

      // 두 번째 페이지가 성공했으면 추가
      if (response2.ok) {
        const data2 = await response2.json();
        if (data2.items) {
          allItems = allItems.concat(data2.items);
        }
      }

      console.log(`   Found ${allItems.length} images total`);

      if (allItems.length === 0) {
        return null;
      }

      // Prefer images from food-related domains
      const foodDomains = ['yelp.com', 'tripadvisor.com', 'grubhub.com', 'doordash.com', 'ubereats.com', 'opentable.com'];

      // Domains to avoid (often have hotlinking protection or not accessible)
      const avoidDomains = ['facebook.com', 'fbsbx.com', 'fbcdn.net', 'instagram.com', 'cdninstagram.com', 'tiktok.com'];

      // Return ALL images with scoring for frontend selection
      const allImages = allItems.map(item => {
        let score = 0;
        const warnings = [];

        // Check if already used
        if (usedImageUrls.has(item.link)) {
          warnings.push('Already used for another dish');
          score -= 100;
        }

        // Check domain quality
        if (foodDomains.some(domain => item.link.includes(domain))) {
          score += 50; // High score for food domains
        } else if (avoidDomains.some(domain => item.link.includes(domain))) {
          score -= 30; // Penalty for problematic domains
          warnings.push('May not display due to hotlinking protection');
        } else {
          score += 20; // Neutral domains
        }

        // Check if title/snippet contains dish name
        const contextText = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
        const dishWords = dishName.toLowerCase().split(' ');

        dishWords.forEach(word => {
          if (contextText.includes(word)) {
            score += 10; // Bonus for matching words in context
          }
        });

        // Check if it's specifically about this restaurant
        if (contextText.includes(restaurantName.toLowerCase())) {
          score += 15; // Bonus for restaurant-specific images
        }

        return {
          url: item.link,
          title: item.title || '',
          snippet: item.snippet || '',
          displayLink: item.displayLink || '',
          score: score,
          warnings: warnings,
          source: 'google_search'
        };
      });

      // Sort by score but return ALL images
      const sortedImages = allImages.sort((a, b) => b.score - a.score);

      console.log(`   ✓ Found ${sortedImages.length} images for ${dishName}`);
      console.log(`   📸 Image URLs for ${dishName}:`);
      sortedImages.forEach((img, idx) => {
        console.log(`      ${idx + 1}. Score: ${img.score}, URL: ${img.url.substring(0, 50)}...`);
      });

      // Return array of all images instead of single best image
      return {
        images: sortedImages,
        source: 'google_search',
        originalQuery: searchQuery,
        dishName: dishName
      };

    } catch (error) {
      console.error('❌ Image search error:', error.message);
      return null;
    }
  }

  /**
   * Extract price information from reviews
   */
  async extractPriceFromReviews(menuName, reviews) {
    if (!reviews || reviews.length === 0) {
      return null;
    }

    // Look for price mentions near the menu item
    const menuNameLower = menuName.toLowerCase();

    for (const review of reviews) {
      const text = review.text.toLowerCase();

      // Check if menu is mentioned
      if (!text.includes(menuNameLower)) {
        continue;
      }

      // Look for price pattern within 50 characters of menu mention
      const menuIndex = text.indexOf(menuNameLower);
      const contextStart = Math.max(0, menuIndex - 50);
      const contextEnd = Math.min(text.length, menuIndex + menuName.length + 50);
      const context = review.text.substring(contextStart, contextEnd);

      // Price patterns
      const priceMatches = context.match(/\$\d+(?:\.\d{2})?|\d+\s*(?:dollars?|bucks)/gi);

      if (priceMatches && priceMatches.length > 0) {
        // Clean and return the price
        let price = priceMatches[0];
        if (!price.startsWith('$')) {
          price = '$' + price.match(/\d+/)[0];
        }
        return price;
      }
    }

    return null;
  }

  /**
   * Enhance menu description based on cuisine type and ingredients
   */
  enhanceDescription(menuName, basicDescription, restaurantTypes, ingredients = []) {
    const cuisineType = this.detectCuisineType(restaurantTypes);

    // Start with basic description or menu name
    let enhanced = basicDescription || menuName;

    // Add ingredients if available
    if (ingredients && ingredients.length > 0) {
      const ingredientStr = ingredients.slice(0, 3).join(', ');
      enhanced += ` - featuring ${ingredientStr}`;
    }

    // Add cuisine-specific enhancements
    const enhancements = {
      'Italian': {
        'pizza': 'wood-fired, authentic Italian style',
        'pasta': 'fresh, homemade pasta',
        'risotto': 'creamy Arborio rice'
      },
      'American': {
        'burger': 'juicy beef patty on brioche bun',
        'sandwich': 'served on artisan bread',
        'wings': 'crispy fried to perfection'
      },
      'Asian': {
        'noodle': 'hand-pulled noodles',
        'rice': 'fragrant jasmine rice',
        'soup': 'slow-simmered broth'
      }
    };

    if (enhancements[cuisineType]) {
      const menuLower = menuName.toLowerCase();
      for (const [key, value] of Object.entries(enhancements[cuisineType])) {
        if (menuLower.includes(key)) {
          enhanced += ` (${value})`;
          break;
        }
      }
    }

    return enhanced;
  }

  /**
   * Detect cuisine type from restaurant types
   */
  detectCuisineType(types = []) {
    const cuisineMap = {
      'italian_restaurant': 'Italian',
      'chinese_restaurant': 'Asian',
      'japanese_restaurant': 'Asian',
      'korean_restaurant': 'Asian',
      'thai_restaurant': 'Asian',
      'mexican_restaurant': 'Mexican',
      'indian_restaurant': 'Indian',
      'american_restaurant': 'American',
      'seafood_restaurant': 'Seafood',
      'pizza_restaurant': 'Italian'
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    return 'Restaurant';
  }

  /**
   * Calculate data quality score for enriched item
   */
  calculateDataQuality(item) {
    let score = 0;
    let factors = 0;

    // Has image: +30%
    if (item.images && item.images.length > 0) {
      score += 30;
      factors++;
    }

    // Has price: +25%
    if (item.enrichedPrice || item.priceHint) {
      score += 25;
      factors++;
    }

    // Has description: +20%
    if (item.enrichedDescription && item.enrichedDescription !== item.name) {
      score += 20;
      factors++;
    }

    // Has ingredients: +15%
    if (item.ingredients && item.ingredients.length > 0) {
      score += 15;
      factors++;
    }

    // Multiple mentions: +10%
    if (item.mentions > 1) {
      score += 10;
      factors++;
    }

    if (score >= 70) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 30) return 'fair';
    return 'basic';
  }

  /**
   * Format enriched menu data for Claude
   */
  formatForClaude(enrichedItems) {
    return enrichedItems.map(item => ({
      name: item.name,
      price: item.enrichedPrice || item.priceHint || 'Price not specified',
      description: item.enrichedDescription || item.description || '',
      mentions: `Mentioned ${item.mentions} times in reviews`,
      sentiment: item.customerSentiment || 'positive',
      hasImage: item.images.length > 0,
      imageUrl: item.images[0]?.url || null,
      quality: item.dataQuality,
      portionInfo: item.portionInfo || null
    }));
  }
}

module.exports = new MenuEnrichmentService();