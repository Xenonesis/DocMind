-- Chatbot-level and user-level response controls

ALTER TABLE public.chatbots
  ADD COLUMN IF NOT EXISTS response_style TEXT NOT NULL DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS include_references BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS include_highlights BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS use_chat_memory BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_regenerate_on_dislike BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chatbots_response_style_check'
  ) THEN
    ALTER TABLE public.chatbots
      ADD CONSTRAINT chatbots_response_style_check
      CHECK (response_style IN ('concise', 'balanced', 'detailed'));
  END IF;
END $$;

ALTER TABLE public.user_response_preferences
  ADD COLUMN IF NOT EXISTS memory_learning_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_regenerate_on_dislike BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preview_selection_enabled BOOLEAN NOT NULL DEFAULT true;
