-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  fitness_level TEXT DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  fitness_goals TEXT[] DEFAULT '{}',
  work_start TIME,
  work_end TIME,
  sleep_time TIME,
  wake_time TIME,
  menstrual_tracking BOOLEAN DEFAULT false,
  avatar_url TEXT,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_stats table for XP and leveling
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_distance NUMERIC DEFAULT 0,
  total_calories NUMERIC DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  zones_owned INTEGER DEFAULT 0,
  zones_captured INTEGER DEFAULT 0,
  zones_lost INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create activities table for GPS tracked workouts
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('run', 'walk', 'cycle')),
  distance NUMERIC DEFAULT 0,
  duration INTEGER DEFAULT 0,
  calories NUMERIC DEFAULT 0,
  path JSONB DEFAULT '[]',
  start_coordinates JSONB,
  end_coordinates JSONB,
  loops_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  zone_created_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create zones table for territory ownership
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL DEFAULT '[]',
  center JSONB NOT NULL,
  level INTEGER DEFAULT 1,
  defense_challenge_type TEXT CHECK (defense_challenge_type IN ('pushups', 'pullups', 'sprint', 'endurance', 'plank')),
  defense_target_score INTEGER,
  captured_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create zone_captures table for capture history
CREATE TABLE public.zone_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE NOT NULL,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  previous_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  successful BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ai_coach_messages table for chat history
CREATE TABLE public.ai_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON public.activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Zones policies (anyone can view all zones for the map)
CREATE POLICY "Anyone can view zones" ON public.zones
  FOR SELECT USING (true);

CREATE POLICY "Users can insert zones" ON public.zones
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Zone owners can update their zones" ON public.zones
  FOR UPDATE USING (auth.uid() = owner_id);

-- Zone captures policies
CREATE POLICY "Users can view all captures" ON public.zone_captures
  FOR SELECT USING (true);

CREATE POLICY "Users can insert captures" ON public.zone_captures
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

-- AI coach messages policies
CREATE POLICY "Users can view their own messages" ON public.ai_coach_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON public.ai_coach_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create profile and stats on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();