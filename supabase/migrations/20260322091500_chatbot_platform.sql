-- Chatbot platform schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.chatbots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT,
    refusal_message TEXT NOT NULL DEFAULT 'I can only answer using the provided documents. Please ask a question related to those documents.',
    fallback_message TEXT NOT NULL DEFAULT 'I could not find that answer in the linked documents.',
    allowed_origins JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    model_override TEXT,
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.20,
    max_tokens INTEGER NOT NULL DEFAULT 1024,
    requests_per_minute_bot INTEGER NOT NULL DEFAULT 60,
    requests_per_minute_ip INTEGER NOT NULL DEFAULT 20,
    requests_per_day_bot INTEGER NOT NULL DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, slug)
);

CREATE TABLE IF NOT EXISTS public.chatbot_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (chatbot_id, document_id)
);

CREATE TABLE IF NOT EXISTS public.chatbot_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL DEFAULT 'default',
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chatbot_embed_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_name TEXT NOT NULL DEFAULT 'default',
    token_prefix TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    allowed_origins JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chatbot_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    bucket TEXT NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (chatbot_id, ip_address, bucket, window_start)
);

CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    source TEXT NOT NULL DEFAULT 'hosted',
    visitor_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chatbot_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chatbot_sessions(id) ON DELETE SET NULL,
    auth_mode TEXT NOT NULL,
    client_ip TEXT,
    query_text TEXT,
    decision TEXT NOT NULL,
    decision_reason TEXT,
    response_excerpt TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_embed_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.chatbot_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can manage own chatbot documents" ON public.chatbot_documents;
DROP POLICY IF EXISTS "Users can manage own chatbot api keys" ON public.chatbot_api_keys;
DROP POLICY IF EXISTS "Users can manage own chatbot embed tokens" ON public.chatbot_embed_tokens;
DROP POLICY IF EXISTS "Users can view own chatbot rate limits" ON public.chatbot_rate_limits;
DROP POLICY IF EXISTS "Users can view own chatbot sessions" ON public.chatbot_sessions;
DROP POLICY IF EXISTS "Users can view own chatbot messages" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Users can view own chatbot audit logs" ON public.chatbot_audit_logs;

CREATE POLICY "Users can manage own chatbots" ON public.chatbots
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chatbot documents" ON public.chatbot_documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chatbot api keys" ON public.chatbot_api_keys
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chatbot embed tokens" ON public.chatbot_embed_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chatbot rate limits" ON public.chatbot_rate_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chatbots c
            WHERE c.id = chatbot_rate_limits.chatbot_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own chatbot sessions" ON public.chatbot_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chatbots c
            WHERE c.id = chatbot_sessions.chatbot_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own chatbot messages" ON public.chatbot_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chatbots c
            WHERE c.id = chatbot_messages.chatbot_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own chatbot audit logs" ON public.chatbot_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chatbots c
            WHERE c.id = chatbot_audit_logs.chatbot_id AND c.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON public.chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_slug ON public.chatbots(slug);
CREATE INDEX IF NOT EXISTS idx_chatbot_documents_chatbot_id ON public.chatbot_documents(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_documents_document_id ON public.chatbot_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_api_keys_chatbot_id ON public.chatbot_api_keys(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_api_keys_key_hash ON public.chatbot_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_chatbot_embed_tokens_chatbot_id ON public.chatbot_embed_tokens(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_embed_tokens_token_hash ON public.chatbot_embed_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_chatbot_embed_tokens_expires_at ON public.chatbot_embed_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_rate_limits_lookup ON public.chatbot_rate_limits(chatbot_id, ip_address, bucket, window_start);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_chatbot_id ON public.chatbot_sessions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session_id ON public.chatbot_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_audit_logs_chatbot_id ON public.chatbot_audit_logs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_audit_logs_created_at ON public.chatbot_audit_logs(created_at);
