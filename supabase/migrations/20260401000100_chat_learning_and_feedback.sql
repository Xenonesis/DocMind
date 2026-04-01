-- Chat learning and feedback schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.user_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.user_chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model_provider TEXT,
    model_name TEXT,
    tokens_used INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_response_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    response_style TEXT NOT NULL DEFAULT 'balanced',
    highlight_enabled BOOLEAN NOT NULL DEFAULT true,
    reference_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    feedback_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_learned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.message_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope TEXT NOT NULL CHECK (scope IN ('dashboard', 'public')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.user_chat_sessions(id) ON DELETE SET NULL,
    chatbot_session_id UUID REFERENCES public.chatbot_sessions(id) ON DELETE SET NULL,
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE SET NULL,
    app_message_id TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
    feedback_reason TEXT,
    query_text TEXT,
    response_text TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_response_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own user chat sessions" ON public.user_chat_sessions;
CREATE POLICY "Users can manage own user chat sessions" ON public.user_chat_sessions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own user chat messages" ON public.user_chat_messages;
CREATE POLICY "Users can manage own user chat messages" ON public.user_chat_messages
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own response preferences" ON public.user_response_preferences;
CREATE POLICY "Users can manage own response preferences" ON public.user_response_preferences
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own memory profiles" ON public.user_memory_profiles;
CREATE POLICY "Users can manage own memory profiles" ON public.user_memory_profiles
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own feedback" ON public.message_feedback;
CREATE POLICY "Users can read own feedback" ON public.message_feedback
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.message_feedback;
CREATE POLICY "Users can insert own feedback" ON public.message_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_user_chat_sessions_user_id ON public.user_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_messages_session_id ON public.user_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_messages_user_id ON public.user_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_scope_created_at ON public.message_feedback(scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id ON public.message_feedback(user_id);

INSERT INTO public.user_response_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_memory_profiles (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
