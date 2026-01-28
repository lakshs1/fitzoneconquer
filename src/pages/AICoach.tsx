import { useState } from 'react';
import { Bot, Send, Sparkles, Dumbbell, Moon, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  { icon: Dumbbell, text: "Today's workout plan" },
  { icon: Moon, text: "Am I resting enough?" },
  { icon: Zap, text: "How to level up faster?" },
  { icon: Heart, text: "Improve my stamina" },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hey Champion! 💪 I'm your AI fitness coach. Based on your activity, you're doing great with a 3-day streak! Today I recommend a moderate 3km run to maintain your momentum without overtraining. What would you like to know?",
  },
];

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const mockResponses: Record<string, string> = {
    "Today's workout plan": "Based on your fitness level and recent activity, here's your plan:\n\n🏃 **Warm-up:** 5 min light jog\n💪 **Main:** 3km run at moderate pace\n🧘 **Cool-down:** 5 min stretching\n\nThis should earn you ~180 XP and help defend your zones!",
    "Am I resting enough?": "Looking at your data, you've been active 5 of the last 7 days. That's good! But I notice your sleep time varies. Try to maintain a consistent 7-8 hours. Tomorrow would be a good rest day to optimize recovery. 😴",
    "How to level up faster?": "Great question! Here are the fastest ways to earn XP:\n\n⚡ **Zone captures:** +500 XP each\n🎯 **Daily goals:** +250 XP\n🔥 **Streaks:** Bonus multiplier\n🏆 **Playground wins:** +300 XP\n\nFocus on capturing nearby zones for quick gains!",
    "Improve my stamina": "To build stamina, try this 4-week plan:\n\n**Week 1-2:** Increase run distance by 10% weekly\n**Week 3-4:** Add interval training (30s sprint, 90s jog)\n\nYour current pace is 5:30/km. Let's aim for 5:00/km in 4 weeks! 🚀",
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = mockResponses[text] || "That's a great question! In the full version, I'll connect to an AI model to give you personalized advice based on your activity data, goals, and progress. For now, try asking about your workout plan or how to level up faster!";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        {/* Header */}
        <header className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold">AI Coach</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zone-owned animate-pulse" />
                Online • Personalized for you
              </p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border rounded-bl-sm'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-accent">AI Coach</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {suggestions.map(({ icon: Icon, text }) => (
              <Button
                key={text}
                variant="secondary"
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => handleSend(text)}
              >
                <Icon className="w-4 h-4" />
                {text}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your coach..."
              className="flex-1"
            />
            <Button type="submit" variant="neon" size="icon" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
