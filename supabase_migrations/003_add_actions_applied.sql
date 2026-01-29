-- Add actions_applied column to track which messages have had their tool actions applied
ALTER TABLE ai_chat_messages ADD COLUMN IF NOT EXISTS actions_applied BOOLEAN DEFAULT FALSE;

-- Add UPDATE policy for ai_chat_messages (was missing)
CREATE POLICY IF NOT EXISTS "Users can update messages in their sessions"
ON ai_chat_messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM ai_chat_sessions
        WHERE ai_chat_sessions.id = ai_chat_messages.session_id
        AND ai_chat_sessions.user_id = (auth.jwt() ->> 'sub')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM ai_chat_sessions
        WHERE ai_chat_sessions.id = ai_chat_messages.session_id
        AND ai_chat_sessions.user_id = (auth.jwt() ->> 'sub')
    )
);
