import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key: OPENAI_API_KEY');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProductDescriptionGeneration {
  shortDescription: string;
  longDescription: string;
  bulletBenefits: string[];
  suggestedUsage: string;
  seoMetaDescription: string;
}

export interface ProductRecommendation {
  productId: string;
  reason: string;
  matchScore: number;
}

export interface SearchSuggestion {
  originalQuery: string;
  suggestedQuery: string;
  reasoning: string;
}

export interface ChatResponse {
  message: string;
  suggestedActions?: {
    type: 'product_search' | 'recommendation' | 'care_tip';
    data: any;
  }[];
}

// Generate AI product descriptions
export async function generateProductDescription(
  productTitle: string,
  category: string,
  keyFeatures: string[],
  targetPet: string,
  brand?: string
): Promise<ProductDescriptionGeneration> {
  try {
    const prompt = `Write comprehensive product descriptions for the following pet product. 
    
Product: ${productTitle}
Category: ${category}
Key features: ${keyFeatures.join(', ')}
Target: ${targetPet}
Brand: ${brand || 'Premium brand'}
Tone: premium & playful

Please provide a JSON response with the following structure:
{
  "shortDescription": "40-60 words description",
  "longDescription": "150-200 words detailed description",
  "bulletBenefits": ["benefit 1", "benefit 2", "benefit 3"],
  "suggestedUsage": "How to use this product effectively",
  "seoMetaDescription": "120-character SEO-friendly meta description"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert pet product copywriter who creates compelling, informative product descriptions that highlight benefits and appeal to pet owners' emotions while maintaining a premium, trustworthy tone."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    throw new Error('Failed to generate product description: ' + (error as Error).message);
  }
}

// Generate personalized product recommendations
export async function generateProductRecommendations(
  userProfile: {
    petType?: string;
    petAge?: string;
    petSize?: string;
    previousPurchases?: string[];
    browsedProducts?: string[];
  },
  availableProducts: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    petType: string;
    price: number;
    rating: number;
  }>,
  limit = 4
): Promise<ProductRecommendation[]> {
  try {
    const prompt = `Based on the user's pet profile and available products, recommend the most suitable products.

User Profile:
- Pet Type: ${userProfile.petType || 'Not specified'}
- Pet Age: ${userProfile.petAge || 'Not specified'}
- Pet Size: ${userProfile.petSize || 'Not specified'}
- Previous Purchases: ${userProfile.previousPurchases?.join(', ') || 'None'}
- Recently Browsed: ${userProfile.browsedProducts?.join(', ') || 'None'}

Available Products:
${availableProducts.map(p => `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Pet Type: ${p.petType}, Price: $${p.price}, Rating: ${p.rating}`).join('\n')}

Please recommend up to ${limit} products and provide a JSON response with:
{
  "recommendations": [
    {
      "productId": "product_id",
      "reason": "Why this product is perfect for this pet",
      "matchScore": 95
    }
  ]
}

Match scores should be 1-100 based on relevance to the pet's needs.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert pet care advisor who understands pet needs and can match products to specific pet profiles based on age, size, breed, health considerations, and lifestyle."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.recommendations || [];
  } catch (error) {
    throw new Error('Failed to generate recommendations: ' + (error as Error).message);
  }
}

// Enhance search queries
export async function enhanceSearchQuery(query: string): Promise<SearchSuggestion> {
  try {
    const prompt = `The user searched for: "${query}"

If this search query is ambiguous or could be improved for better pet product results, suggest a more specific and helpful search query. If the query is already clear and specific, return it unchanged.

Examples:
- "best for seniors" → "best food for senior dogs 10+ years"
- "toys for cats" → "interactive toys for indoor cats"
- "dog food" → "premium dry dog food for adult dogs"

Provide a JSON response:
{
  "originalQuery": "${query}",
  "suggestedQuery": "improved search query",
  "reasoning": "Why this suggestion is better"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a search optimization expert for pet products who helps users find exactly what they need by improving their search queries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    throw new Error('Failed to enhance search query: ' + (error as Error).message);
  }
}

// AI Chat Assistant
export async function generateChatResponse(
  userMessage: string,
  context: {
    conversationHistory?: Array<{ role: string; content: string }>;
    userProfile?: any;
    availableProducts?: any[];
    currentPage?: string;
  }
): Promise<ChatResponse> {
  try {
    const systemPrompt = `You are PetLuxE AI Assistant, a knowledgeable and friendly pet care expert who helps customers find the perfect products for their pets and provides pet care advice.

Guidelines:
- Be helpful, friendly, and knowledgeable about pets
- Focus on pet wellness and matching products to specific needs
- If asked about products, provide specific recommendations when possible
- Include safety disclaimers for health-related questions
- Keep responses concise but informative
- Suggest relevant actions when appropriate

Available actions you can suggest:
- product_search: Search for specific products
- recommendation: Get personalized product recommendations  
- care_tip: Provide pet care advice

Always include a safety disclaimer for health concerns: "For health concerns, please consult your veterinarian."`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(context.conversationHistory || []),
      { role: "user", content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: messages as any,
      max_tokens: 500,
    });

    const aiMessage = response.choices[0].message.content || '';
    
    // Simple action detection (in a real app, this would be more sophisticated)
    const suggestedActions: any[] = [];
    
    if (aiMessage.toLowerCase().includes('search') || aiMessage.toLowerCase().includes('find')) {
      suggestedActions.push({
        type: 'product_search',
        data: { query: userMessage }
      });
    }
    
    if (aiMessage.toLowerCase().includes('recommend')) {
      suggestedActions.push({
        type: 'recommendation',
        data: { context: userMessage }
      });
    }

    return {
      message: aiMessage,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined
    };
  } catch (error) {
    throw new Error('Failed to generate chat response: ' + (error as Error).message);
  }
}

// Generate marketing copy variants
export async function generateMarketingCopy(
  productName: string,
  type: 'email_subject' | 'ad_headline' | 'social_caption',
  variants = 3
): Promise<string[]> {
  try {
    const typeInstructions = {
      email_subject: 'compelling email subject lines that create urgency and appeal to pet owners',
      ad_headline: 'attention-grabbing ad headlines for social media advertising',
      social_caption: 'engaging social media captions with relevant hashtags'
    };

    const prompt = `Generate ${variants} different ${typeInstructions[type]} for the pet product: "${productName}"

Each variant should be:
- Engaging and emotional (appeals to pet love)
- Different in approach/tone
- Appropriate for premium pet product marketing
- Include relevant call-to-action where appropriate

Provide a JSON response:
{
  "variants": ["variant 1", "variant 2", "variant 3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a creative marketing copywriter specializing in pet products who understands what motivates pet owners to purchase premium products for their beloved companions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.variants || [];
  } catch (error) {
    throw new Error('Failed to generate marketing copy: ' + (error as Error).message);
  }
}
