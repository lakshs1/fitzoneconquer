/**
 * MODULAR AI COACH SERVICE
 * =========================
 * 
 * This service is designed to be LLM-independent. You can swap providers
 * by implementing the AIProvider interface and changing the activeProvider.
 * 
 * SUPPORTED PROVIDERS (configure your own):
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - Local LLMs (Ollama, LMStudio)
 * - Any OpenAI-compatible API
 * 
 * TO CONFIGURE:
 * 1. Add your API key to Supabase Edge Function secrets
 * 2. Create an edge function that calls your preferred LLM
 * 3. Update the callLLM function to use your edge function
 * 
 * The fallback uses rule-based responses when no LLM is configured.
 */

import { supabase } from '@/integrations/supabase/client';

// Types for the AI Coach
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UserContext {
  name: string;
  fitnessLevel: string;
  fitnessGoals: string[];
  totalDistance: number;
  totalActivities: number;
  xp: number;
  level: number;
  streak: number;
  zonesOwned: number;
  currentLocation?: { lat: number; lng: number };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  nearbyPlaces?: Array<{ name: string; type: string }>;
}

export interface CoachResponse {
  message: string;
  suggestions?: string[];
  recommendedPlace?: {
    name: string;
    type: 'gym' | 'park' | 'trail';
    reason: string;
  };
}

// AI Provider interface - implement this for any LLM
interface AIProvider {
  name: string;
  generateResponse: (messages: ChatMessage[], context: UserContext) => Promise<string>;
}

// System prompt for the AI coach
const SYSTEM_PROMPT = `You are FitZone Coach, an energetic and motivating fitness coach in a gamified territory-capture fitness app. 

Your personality:
- Enthusiastic and supportive, like a personal trainer
- Uses gaming terminology (XP, levels, conquering zones)
- Gives practical, actionable fitness advice
- Considers user's fitness level and goals
- Recommends nearby places for workouts when relevant

When responding:
- Keep responses concise (2-3 sentences max)
- Include emojis sparingly for energy
- Reference their stats and progress
- Suggest specific activities based on time of day
- If they mention a location, recommend nearby gyms or parks

Never:
- Give medical advice
- Recommend extreme diets or dangerous exercises
- Be discouraging about their progress`;

/**
 * Rule-based fallback responses when no LLM is configured
 * These provide intelligent responses based on user context
 */
function generateFallbackResponse(
  userMessage: string,
  context: UserContext
): CoachResponse {
  const message = userMessage.toLowerCase();
  const { timeOfDay, fitnessLevel, streak, level, zonesOwned, nearbyPlaces } = context;
  
  // Greeting responses
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    const greetings = [
      `Hey ${context.name}! 💪 Ready to conquer some territory today? You're on a ${streak}-day streak!`,
      `Welcome back, warrior! Level ${level} looking strong. What zones are we capturing today?`,
      `${context.name}! Great to see you. Your ${zonesOwned} zones are waiting for defense. Let's train!`,
    ];
    return { message: greetings[Math.floor(Math.random() * greetings.length)] };
  }
  
  // Workout suggestions based on time
  if (message.includes('workout') || message.includes('exercise') || message.includes('what should')) {
    const workouts: Record<string, string[]> = {
      morning: [
        `Morning energy! 🌅 Perfect time for a zone capture run. ${fitnessLevel === 'beginner' ? 'Start with a 15-min walk to warm up.' : 'Try a 30-min jog to claim new territory!'}`,
        `Rise and conquer! A morning workout burns more fat. Head to a nearby park for some fresh air and XP!`,
      ],
      afternoon: [
        `Afternoon power hour! 💥 Your muscles are warmed up. Perfect for ${fitnessLevel === 'advanced' ? 'an intense HIIT session' : 'a steady-paced walk or light jog'}.`,
        `Post-lunch energy! Take a 20-min walk to defend your zones. Every step counts toward XP!`,
      ],
      evening: [
        `Evening warrior mode! 🌆 Great time for a cool-down run. The zones are calling!`,
        `Sunset sessions are perfect for zone captures. Less crowded parks, more territory to claim!`,
      ],
      night: [
        `Night owl training! 🌙 Keep it light - a short walk or stretching session works great.`,
        `Late night? Focus on recovery. Light stretching helps you wake up ready to conquer tomorrow!`,
      ],
    };
    
    const suggestions = workouts[timeOfDay] || workouts.afternoon;
    return { 
      message: suggestions[Math.floor(Math.random() * suggestions.length)],
      suggestions: ['Start a run', 'Find nearby gym', 'Quick stretch routine'],
    };
  }
  
  // Location/place recommendations
  if (message.includes('where') || message.includes('gym') || message.includes('park') || message.includes('go')) {
    if (nearbyPlaces && nearbyPlaces.length > 0) {
      const place = nearbyPlaces[0];
      return {
        message: `I'd recommend ${place.name}! 📍 It's a great ${place.type} for your ${fitnessLevel} level. Perfect for capturing new zones in that area!`,
        recommendedPlace: {
          name: place.name,
          type: place.type as 'gym' | 'park' | 'trail',
          reason: `Great for ${fitnessLevel} level training`,
        },
      };
    }
    return {
      message: `Enable location to get personalized place recommendations! 📍 I can find gyms, parks, and trails near you for optimal zone conquering.`,
    };
  }
  
  // Progress and motivation
  if (message.includes('progress') || message.includes('how am i') || message.includes('stats')) {
    return {
      message: `Level ${level} warrior! 🎮 You've conquered ${context.totalDistance.toFixed(0)}m and own ${zonesOwned} zones. ${streak > 0 ? `${streak}-day streak going strong!` : 'Start a streak today!'} Keep pushing for the next level!`,
    };
  }
  
  // Goals and planning
  if (message.includes('goal') || message.includes('plan') || message.includes('today')) {
    const goalMessages = {
      beginner: `Today's mission: A 15-20 minute walk to build your base. 🎯 Focus on consistency over intensity. Every zone captured makes you stronger!`,
      intermediate: `Level up challenge: 30-min run with 2 zone captures! 💪 You've got the endurance - now show those territories who's boss!`,
      advanced: `Elite objective: Multi-zone conquest! 🔥 45-min run covering at least 3 zones. Time to expand your empire!`,
    };
    return {
      message: goalMessages[fitnessLevel as keyof typeof goalMessages] || goalMessages.beginner,
      suggestions: ['Set daily goal', 'View my zones', 'Start activity'],
    };
  }
  
  // Rest and recovery
  if (message.includes('tired') || message.includes('rest') || message.includes('recovery')) {
    return {
      message: `Rest is part of the game, warrior! 🧘 Your muscles grow during recovery. Take today easy - a light 10-min walk or stretching keeps your streak alive without overtraining.`,
    };
  }
  
  // Default motivational response
  const defaultResponses = [
    `Every step is XP, ${context.name}! 🏃 What's holding you back from conquering new zones today?`,
    `Level ${level} looks good on you! Ready to push for ${level + 1}? Let's talk strategy!`,
    `${zonesOwned} zones under your control! 🗺️ Want tips on defending them or capturing more?`,
    `Your ${streak > 0 ? streak + '-day streak' : 'journey'} is inspiring! What can I help you conquer today?`,
  ];
  
  return {
    message: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    suggestions: ['Start workout', 'See my zones', 'Get recommendations'],
  };
}

/**
 * Call LLM via Edge Function
 * 
 * TO CONFIGURE YOUR OWN LLM:
 * 1. Create an edge function named 'ai-coach'
 * 2. Add your API key to edge function secrets
 * 3. Implement the request/response format below
 * 
 * Expected request body:
 * { messages: ChatMessage[], context: UserContext }
 * 
 * Expected response:
 * { message: string, suggestions?: string[] }
 */
async function callLLM(
  messages: ChatMessage[],
  context: UserContext
): Promise<CoachResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: { messages, context },
    });
    
    if (error) {
      console.warn('LLM call failed, using fallback:', error);
      return null;
    }
    
    return data as CoachResponse;
  } catch (err) {
    console.warn('LLM service unavailable, using fallback');
    return null;
  }
}

/**
 * Main function to get AI coach response
 * Tries LLM first, falls back to rule-based if unavailable
 */
export async function getCoachResponse(
  messages: ChatMessage[],
  context: UserContext
): Promise<CoachResponse> {
  // Get the last user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (!lastUserMessage) {
    return { message: "Hey there! Ready to conquer some zones? 💪" };
  }
  
  // Try LLM first
  const llmResponse = await callLLM(
    [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    context
  );
  
  if (llmResponse) {
    return llmResponse;
  }
  
  // Fallback to rule-based
  return generateFallbackResponse(lastUserMessage.content, context);
}

/**
 * Get time of day for context
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Save chat message to database
 */
export async function saveChatMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  await supabase.from('ai_coach_messages').insert({
    user_id: userId,
    role,
    content,
  });
}

/**
 * Load chat history from database
 */
export async function loadChatHistory(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('ai_coach_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(50);
  
  if (error || !data) return [];
  
  return data.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));
}
