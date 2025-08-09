/**
 * Menu Extraction Service
 * Uses Claude AI to extract specific menu items from restaurant reviews
 */

const Anthropic = require('@anthropic-ai/sdk');

class MenuExtractionService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Extract menu items from reviews using Claude AI
   * @param {Array} reviews - Array of review objects
   * @param {String} restaurantName - Name of the restaurant
   * @param {String} cuisineType - Type of cuisine (Italian, American, etc.)
   * @returns {Array} Array of extracted menu items with metadata
   */
  async extractMenuItems(reviews, restaurantName, cuisineType = 'Restaurant') {
    if (!reviews || reviews.length === 0) {
      return [];
    }

    try {
      // Prepare review text for Claude
      const reviewTexts = reviews.map((review, idx) =>
        `Review ${idx + 1} (${review.rating}/5 stars):\n"${review.text}"`
      ).join('\n\n');

      const prompt = `You are a menu extraction expert analyzing restaurant reviews.

Restaurant: ${restaurantName}
Cuisine Type: ${cuisineType}
Number of Reviews: ${reviews.length}

CUSTOMER REVIEWS:
${reviewTexts}

TASK: Extract SPECIFIC menu items mentioned in these reviews.

IMPORTANT:
- Extract actual dish names (e.g., "Funghi Pizza", "Chicken Pesto Sandwich"), not generic categories
- Include any price mentions associated with dishes
- Note portion size descriptions (huge, small, etc.)
- Identify ingredients or special preparations mentioned
- Count how many times each dish is mentioned

Return ONLY a JSON array with this exact structure (no additional text):
[
  {
    "name": "Exact dish name as mentioned",
    "mentions": number of times mentioned,
    "priceHint": "price if mentioned or null",
    "portionInfo": "portion description or null",
    "description": "brief description from reviews",
    "ingredients": ["ingredient1", "ingredient2"],
    "customerSentiment": "positive/negative/mixed",
    "score": number between 0-100 representing overall recommendation strength
  }
]

IMPORTANT: 
- Calculate "score" based on: mentions (40%), positive sentiment (30%), specific praise (20%), recent reviews (10%)
- Order the array by score (highest first)
- Include ALL menu items found, we'll filter later

If no specific menu items are found, return an empty array: []`;

      console.log('🤖 Requesting menu extraction from Claude...');

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent extraction
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Parse the response
      const responseText = response.content[0].text.trim();

      // Clean up the response if it has markdown code blocks
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      try {
        const menuItems = JSON.parse(cleanedResponse);

        // Validate and clean the data
        const validatedItems = menuItems
          .filter(item => item.name && typeof item.name === 'string')
          .map(item => ({
            name: item.name,
            mentions: item.mentions || 1,
            priceHint: item.priceHint || null,
            portionInfo: item.portionInfo || null,
            description: item.description || null,
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
            customerSentiment: item.customerSentiment || 'positive',
            score: item.score || (item.mentions * 10) // Fallback score calculation
          }))
          .sort((a, b) => b.score - a.score); // Sort by score (highest first)

        console.log(`✅ Extracted ${validatedItems.length} menu items from reviews`);
        return validatedItems;

      } catch (parseError) {
        console.error('❌ Failed to parse Claude response:', parseError);
        console.error('Response was:', cleanedResponse);

        // Fallback: try to extract menu items with regex
        return this.fallbackExtraction(reviews);
      }

    } catch (error) {
      console.error('❌ Claude API error:', error);

      // Fallback to basic extraction
      return this.fallbackExtraction(reviews);
    }
  }

  /**
   * Fallback extraction method if Claude fails
   * Uses the existing regex-based approach
   */
  fallbackExtraction(reviews) {
    console.log('⚠️ Using fallback menu extraction...');

    const menuMentions = {};

    // Simplified patterns for fallback
    const patterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:pizza|pasta|sandwich|burger|salad|soup)\b/gi,
      /\b(?:try|recommend|order|best)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    reviews.forEach(review => {
      patterns.forEach(pattern => {
        const matches = review.text.matchAll(pattern);
        for (const match of matches) {
          const dishName = match[1] || match[0];
          if (dishName && dishName.length > 2) {
            if (!menuMentions[dishName]) {
              menuMentions[dishName] = {
                name: dishName,
                mentions: 0,
                description: null,
                priceHint: null
              };
            }
            menuMentions[dishName].mentions++;
          }
        }
      });
    });

    return Object.values(menuMentions)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);
  }

  /**
   * Validate and enrich extracted menu items
   * Ensures data quality and consistency
   */
  validateMenuItems(menuItems) {
    return menuItems.filter(item => {
      // Filter out generic terms
      const genericTerms = ['food', 'meal', 'dish', 'plate', 'order', 'item'];
      const itemLower = item.name.toLowerCase();

      // Check if it's not a generic term
      const isNotGeneric = !genericTerms.some(term => itemLower === term);

      // Check if it has sufficient length
      const hasMinLength = item.name.length >= 3;

      // Check if it's not just a single common word
      const isNotSingleCommon = !(item.name.split(' ').length === 1 &&
                                   ['good', 'great', 'nice', 'bad', 'okay'].includes(itemLower));

      return isNotGeneric && hasMinLength && isNotSingleCommon;
    });
  }
}

module.exports = new MenuExtractionService();