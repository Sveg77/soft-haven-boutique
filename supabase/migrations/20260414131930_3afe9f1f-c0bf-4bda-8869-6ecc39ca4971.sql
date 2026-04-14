
-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Public can create and read their own sessions
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view chat sessions" ON public.chat_sessions FOR SELECT TO public USING (true);
-- Authenticated full access
CREATE POLICY "Authenticated can update chat sessions" ON public.chat_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete chat sessions" ON public.chat_sessions FOR DELETE TO authenticated USING (true);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create chat messages" ON public.chat_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can update chat messages" ON public.chat_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete chat messages" ON public.chat_messages FOR DELETE TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_sessions_updated_at();
