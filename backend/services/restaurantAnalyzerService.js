/**
 * Restaurant Analyzer Service
 * Integrates Google Places API data with menu extraction and photo matching
 * Processes all data in English for Claude API consumption
 */

const { Client } = require('@googlemaps/google-maps-services-js');
const restaurantScraperService = require('./restaurantScraperService');
const NodeCache = require('node-cache');

class RestaurantAnalyzerService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  }

  /**
   * Main analysis function - returns structured data for Claude API
   * @param {string} restaurantName - Restaurant name
   * @param {string} address - Restaurant address
   * @returns {Object} Structured restaurant data with recommendations
   */
  async analyzeRestaurant(restaurantName, address) {
    const cacheKey = `${restaurantName}_${address}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`🔍 Analyzing: ${restaurantName} at ${address}`);

      // 1. Get basic info from Google Places
      const placeData = await this.getPlaceData(restaurantName, address);
      if (!placeData) {
        throw new Error('Restaurant not found in Google Places');
      }

      // 2. Get all reviews (Google Places only provides 5 max)
      console.log(`📝 Reviews available: ${placeData.reviews?.length || 0} (Google Places limit: 5 max)`);

      // 3. Match photos to categories
      const photos = await this.categorizePhotos(placeData.photos);

      // 4. Build structured data for Claude API
      // Claude will analyze the raw reviews directly
      const structuredData = {
        restaurant: {
          name: placeData.name,
          address: placeData.formatted_address,
          phone: placeData.formatted_phone_number,
          website: placeData.website,
          googleMapsUrl: placeData.url,
          rating: placeData.rating,
          totalReviews: placeData.user_ratings_total,
          priceLevel: this.getPriceLevel(placeData.price_level),
          types: placeData.types,
          hours: this.formatHours(placeData.opening_hours),
          services: {
            delivery: placeData.delivery || false,
            takeout: placeData.takeout || false,
            dineIn: placeData.dine_in || false
          }
        },

        // Send raw reviews to Claude for better menu extraction
        rawReviews: placeData.reviews || [],

        // Still do basic extraction as fallback
        recommendedMenuItems: await this.extractMenuRecommendations(placeData.reviews),

        photos: {
          exterior: photos.exterior,
          interior: photos.interior,
          food: photos.food,
          menu: photos.menu
        },

        metadata: {
          analyzedAt: new Date().toISOString(),
          dataSource: 'Google Places API',
          language: 'en',
          reviewCount: placeData.reviews?.length || 0,
          confidence: {
            restaurantInfo: 1.0, // Direct from API
            menuRecommendations: placeData.reviews?.length >= 3 ? 0.8 : 0.5, // Better with more reviews
            photos: 0.8 // Based on categorization
          }
        }
      };

      this.cache.set(cacheKey, structuredData);
      return structuredData;

    } catch (error) {
      console.error(`❌ Analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get place data from Google Places API with maximum reviews
   */
  async getPlaceData(restaurantName, address) {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Search for the place
    const searchResponse = await this.client.textSearch({
      params: {
        query: `${restaurantName} ${address}`,
        key: this.apiKey
      }
    });

    if (!searchResponse.data.results?.length) {
      return null;
    }

    const placeId = searchResponse.data.results[0].place_id;

    // Get detailed information with both relevant and newest reviews
    const [relevantDetails, newestDetails] = await Promise.all([
      // Get most relevant reviews
      this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: [
            'name',
            'formatted_address',
            'formatted_phone_number',
            'website',
            'url',
            'rating',
            'user_ratings_total',
            'price_level',
            'types',
            'opening_hours',
            'photos',
            'reviews',
            'delivery',
            'takeout',
            'dine_in'
          ].join(','),
          reviews_sort: 'most_relevant',
          language: 'en'
        }
      }),
      // Get newest reviews
      this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'reviews',
          reviews_sort: 'newest',
          language: 'en'
        }
      })
    ]);

    // Combine and deduplicate reviews
    const allReviews = new Map();

    // Add relevant reviews
    if (relevantDetails.data.result.reviews) {
      relevantDetails.data.result.reviews.forEach(review => {
        const key = `${review.author_name}_${review.time}`;
        allReviews.set(key, review);
      });
    }

    // Add newest reviews (will skip duplicates)
    if (newestDetails.data.result.reviews) {
      newestDetails.data.result.reviews.forEach(review => {
        const key = `${review.author_name}_${review.time}`;
        if (!allReviews.has(key)) {
          allReviews.set(key, review);
        }
      });
    }

    // Replace reviews with combined set
    const result = relevantDetails.data.result;
    result.reviews = Array.from(allReviews.values());

    console.log(`📝 Reviews collected: ${result.reviews.length} unique reviews (${relevantDetails.data.result.reviews?.length || 0} relevant + ${newestDetails.data.result.reviews?.length || 0} newest)`);

    return result;
  }

  /**
   * Extract menu recommendations from reviews
   * Analyzes review text to find frequently mentioned dishes
   */
  async extractMenuRecommendations(reviews) {
    if (!reviews || reviews.length === 0) {
      return [];
    }

    const menuMentions = {};

    // Enhanced patterns for specific menu items (not generic categories)
    const specificDishPatterns = [
      // Pizza patterns - looking for specific pizza names
      { pattern: /\b(margherita|marinara|quattro formaggi|capricciosa|diavola|prosciutto|calzone)\s*(?:pizza)?/gi },
      { pattern: /\b(pepperoni|hawaiian|veggie|vegetarian|meat lovers?|supreme)\s+pizza/gi },
      { pattern: /\b(funghi|porcini|mushroom)\s+pizza/gi },
      { pattern: /\b(bianca|white)\s+pizza/gi },
      { pattern: /\b(clam|seafood|shrimp|lobster)\s+pizza/gi },
      { pattern: /\b(bbq|barbecue)\s*(?:chicken\s+)?pizza/gi },

      // Pasta patterns - looking for specific pasta dishes
      { pattern: /\b(spaghetti|linguine|fettuccine|penne|rigatoni|ziti|ravioli|lasagna|gnocchi)\s+(?:alla\s+)?([a-z]+)/gi },
      { pattern: /\b(carbonara|amatriciana|arrabiata|puttanesca|bolognese|alfredo|marinara|pomodoro)/gi },
      { pattern: /\b(cacio e pepe|aglio e olio|primavera|vongole)/gi },

      // Sandwich patterns - specific sandwiches
      { pattern: /\b(chicken|tuna|turkey|ham|roast beef|italian|cuban|reuben|club)\s+(?:sandwich|sub|hero|hoagie)/gi },
      { pattern: /\b(meatball|sausage|eggplant|veal)\s+(?:parm(?:igiana)?|hero|sub)/gi },
      { pattern: /\b(blt|pbj|grilled cheese|panini|wrap)/gi },
      { pattern: /\b([a-z]+\s+)?pesto\s+(?:chicken\s+)?sandwich/gi },

      // Appetizers and specific dishes
      { pattern: /\b(calamari|bruschetta|caprese|antipasto|carpaccio|focaccia)/gi },
      { pattern: /\b(caesar|greek|cobb|waldorf|nicoise)\s+salad/gi },
      { pattern: /\b(minestrone|wedding|tortellini|pasta e fagioli)\s+soup/gi },

      // Meat/Seafood dishes
      { pattern: /\b(grilled|pan.?seared|roasted|braised)\s+(salmon|tuna|halibut|sea bass|branzino)/gi },
      { pattern: /\b(ribeye|sirloin|filet mignon|porterhouse|ny strip)\s*(?:steak)?/gi },
      { pattern: /\b(chicken|veal|eggplant)\s+(parm(?:igiana)?|marsala|piccata|francese)/gi },

      // Desserts
      { pattern: /\b(tiramisu|cannoli|panna cotta|gelato|tartufo|zeppole)/gi },
      { pattern: /\b(chocolate|vanilla|strawberry)\s+(cake|cheesecake|mousse)/gi }
    ];

    // Process each review
    reviews.forEach(review => {
      const text = review.text;
      const rating = review.rating;

      // Look for specific dishes
      specificDishPatterns.forEach(({ pattern }) => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Clean up the match
            let dishName = match.trim();

            // Skip generic terms without specifics
            const genericTerms = ['pizza', 'pasta', 'sandwich', 'salad', 'soup', 'steak'];
            const isGeneric = genericTerms.some(term =>
              dishName.toLowerCase() === term.toLowerCase()
            );

            if (isGeneric) return; // Skip generic terms

            // Skip if it contains common non-food words
            const skipPatterns = /\b(was|is|are|were|been|being|has|have|had|and|or|but|the|this|that|here|there)\b/i;
            if (skipPatterns.test(dishName)) return;

            // Capitalize properly
            dishName = this.capitalizeDishName(dishName);

            if (!menuMentions[dishName]) {
              menuMentions[dishName] = {
                name: dishName,
                mentions: 0,
                ratings: [],
                reviewSnippets: [],
                reasons: [],
                contexts: []
              };
            }

            menuMentions[dishName].mentions++;
            menuMentions[dishName].ratings.push(rating);

            // Extract broader context (100 chars before and after)
            const escapedDish = dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const contextPattern = new RegExp(
              `.{0,100}${escapedDish}.{0,100}`,
              'gi'
            );
            const contextMatch = text.match(contextPattern);

            if (contextMatch) {
              const context = contextMatch[0];
              menuMentions[dishName].reviewSnippets.push({
                text: context,
                rating: rating
              });

              // Extract descriptive words near the dish
              const descriptivePattern = /(delicious|amazing|fantastic|excellent|perfect|great|wonderful|best|good|tasty|fresh|authentic|homemade|crispy|creamy|tender|juicy|flavorful)/gi;
              const descriptiveWords = context.match(descriptivePattern);

              if (descriptiveWords && rating >= 4) {
                menuMentions[dishName].reasons.push(...descriptiveWords.map(w => w.toLowerCase()));
              }

              // Check for price mentions
              const pricePattern = /\$\d+(?:\.\d{2})?|\d+\s*(?:dollars?|bucks)/gi;
              const priceMatch = context.match(pricePattern);
              if (priceMatch) {
                menuMentions[dishName].price = priceMatch[0];
              }

              // Check for portion/size mentions
              const portionPattern = /\b(huge|large|big|generous|small|tiny|perfect)\s*(?:portion|serving|size)?/gi;
              const portionMatch = context.match(portionPattern);
              if (portionMatch) {
                menuMentions[dishName].portionInfo = portionMatch[0];
              }
            }
          });
        }
      });

      // Also look for menu items mentioned with "try", "recommend", "order", etc.
      const recommendPattern = /(?:try|recommend|order|get|must have|don't miss|best)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)/g;
      let recommendMatch;

      while ((recommendMatch = recommendPattern.exec(text)) !== null) {
        let dishName = recommendMatch[1].trim();

        // Skip if it's a generic term or instruction
        const skipWords = ['the', 'their', 'this', 'that', 'here', 'it', 'them', 'our', 'your'];
        if (skipWords.includes(dishName.toLowerCase())) continue;

        // Check if it looks like a real dish name (at least 2 words or known dish)
        const words = dishName.split(/\s+/);
        if (words.length >= 2 || this.isKnownDish(dishName)) {
          dishName = this.capitalizeDishName(dishName);

          if (!menuMentions[dishName]) {
            menuMentions[dishName] = {
              name: dishName,
              mentions: 0,
              ratings: [],
              reviewSnippets: [],
              reasons: [],
              contexts: []
            };
          }

          menuMentions[dishName].mentions++;
          menuMentions[dishName].ratings.push(rating);
          menuMentions[dishName].reasons.push('recommended');

          // Get context
          const contextStart = Math.max(0, recommendMatch.index - 50);
          const contextEnd = Math.min(text.length, recommendMatch.index + recommendMatch[0].length + 50);
          const context = text.substring(contextStart, contextEnd);

          menuMentions[dishName].reviewSnippets.push({
            text: context,
            rating: rating
          });
        }
      }
    });

    // Convert to array and calculate scores
    const recommendations = Object.values(menuMentions)
      .map(item => ({
        ...item,
        averageRating: item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length,
        confidence: Math.min(item.mentions / reviews.length, 1), // Percentage of reviews mentioning
        reasons: [...new Set(item.reasons)].slice(0, 3), // Unique reasons, max 3
        description: item.reviewSnippets[0]?.text || null
      }))
      .sort((a, b) => {
        // Sort by combination of mentions and average rating
        const scoreA = a.mentions * a.averageRating;
        const scoreB = b.mentions * b.averageRating;
        return scoreB - scoreA;
      });

    return recommendations;
  }

  /**
   * Categorize photos into exterior, interior, food, and menu
   */
  async categorizePhotos(photos) {
    if (!photos || photos.length === 0) {
      return { exterior: null, interior: null, food: [], menu: null };
    }

    const categorized = {
      exterior: null,
      interior: null,
      food: [],
      menu: null
    };

    photos.forEach((photo, idx) => {
      const ratio = photo.width / photo.height;
      const photoUrl = this.buildPhotoUrl(photo.photo_reference, 800);

      // Categorization logic based on aspect ratio and position
      if (idx === 0 && ratio > 1.5) {
        // First photo, landscape - likely exterior
        categorized.exterior = photoUrl;
      } else if (ratio > 0.8 && ratio < 1.3) {
        // Square-ish photos - likely food
        categorized.food.push({
          url: photoUrl,
          confidence: 0.7 // Medium confidence it's food
        });
      } else if (ratio < 0.8 && !categorized.menu) {
        // Portrait photo - might be menu
        categorized.menu = photoUrl;
      } else if (!categorized.interior && ratio > 1.2) {
        // Landscape photo - might be interior
        categorized.interior = photoUrl;
      }
    });

    // Limit food photos to 3 most likely
    categorized.food = categorized.food.slice(0, 3);

    return categorized;
  }

  /**
   * Try to find photos for specific menu items
   */
  async findMenuPhotos(restaurantName, menuItems, location) {
    const photos = {};

    for (const item of menuItems) {
      try {
        // Try to find image using our scraping service
        const imageResult = await restaurantScraperService.searchDishImage(
          restaurantName,
          item,
          location
        );

        if (imageResult && imageResult.url && !imageResult.isReference) {
          photos[item] = {
            url: imageResult.url,
            source: 'web_scraping',
            confidence: 0.5 // Lower confidence for scraped images
          };
        }
      } catch (error) {
        console.log(`⚠️ Could not find photo for ${item}`);
      }
    }

    return photos;
  }

  /**
   * Helper: Build Google Places photo URL
   */
  buildPhotoUrl(photoReference, maxWidth = 800) {
    return `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${photoReference}&key=${this.apiKey}&maxwidth=${maxWidth}`;
  }

  /**
   * Helper: Convert price level to readable format
   */
  getPriceLevel(level) {
    const levels = {
      0: 'Free',
      1: '$',
      2: '$$',
      3: '$$$',
      4: '$$$$'
    };
    return levels[level] || 'Not specified';
  }

  /**
   * Helper: Format opening hours
   */
  formatHours(openingHours) {
    if (!openingHours || !openingHours.weekday_text) {
      return 'Hours not available';
    }
    return openingHours.weekday_text.join('\n');
  }

  /**
   * Prepare data for Claude API
   * Returns a clean, structured format ready for AI analysis
   */
  prepareForClaude(analyzedData) {
    return {
      context: {
        restaurant_name: analyzedData.restaurant.name,
        cuisine_type: this.detectCuisineType(analyzedData.restaurant.types),
        location: analyzedData.restaurant.address,
        rating: `${analyzedData.restaurant.rating}/5 from ${analyzedData.restaurant.totalReviews} reviews`,
        price_range: analyzedData.restaurant.priceLevel
      },

      recommended_dishes: analyzedData.recommendedMenuItems.map(item => ({
        name: item.name,
        popularity: `Mentioned in ${item.mentions} reviews`,
        customer_rating: `${item.averageRating.toFixed(1)}/5 stars`,
        why_recommended: item.reasons.join(', '),
        photo_available: item.photo !== null
      })),

      available_photos: {
        has_exterior: analyzedData.photos.exterior !== null,
        has_interior: analyzedData.photos.interior !== null,
        food_photos_count: analyzedData.photos.food.length,
        has_menu: analyzedData.photos.menu !== null
      },

      services: analyzedData.restaurant.services,

      instruction: 'Create an engaging restaurant review post in Korean based on this data. Focus on the recommended dishes and authentic customer experiences.'
    };
  }

  /**
   * Helper: Capitalize dish name properly
   */
  capitalizeDishName(name) {
    // Words that should stay lowercase
    const lowercaseWords = ['and', 'with', 'in', 'on', 'the', 'a', 'an', 'of', 'e', 'alla', 'al', 'di'];

    return name.split(/\s+/)
      .map((word, index) => {
        // Always capitalize first word
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        // Keep lowercase for certain words
        if (lowercaseWords.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        // Capitalize others
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Helper: Check if a word is a known dish
   */
  isKnownDish(name) {
    const knownDishes = [
      'tiramisu', 'cannoli', 'bruschetta', 'calamari', 'carpaccio',
      'carbonara', 'amatriciana', 'bolognese', 'alfredo', 'marinara',
      'margherita', 'capricciosa', 'calzone', 'focaccia', 'risotto',
      'ossobuco', 'saltimbocca', 'piccata', 'marsala', 'parmigiana'
    ];

    return knownDishes.includes(name.toLowerCase());
  }

  /**
   * Helper: Detect cuisine type from Google Places types
   */
  detectCuisineType(types) {
    const cuisineMap = {
      'italian_restaurant': 'Italian',
      'chinese_restaurant': 'Chinese',
      'japanese_restaurant': 'Japanese',
      'korean_restaurant': 'Korean',
      'mexican_restaurant': 'Mexican',
      'indian_restaurant': 'Indian',
      'thai_restaurant': 'Thai',
      'american_restaurant': 'American',
      'seafood_restaurant': 'Seafood',
      'pizza_restaurant': 'Pizza'
    };

    for (const type of types || []) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    return 'Restaurant'; // Generic fallback
  }
}

module.exports = new RestaurantAnalyzerService();