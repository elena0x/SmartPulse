
-- Create user HCP subscriptions table
CREATE TABLE public.user_hcp_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hcp_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, hcp_id)
);

-- Enable RLS
ALTER TABLE public.user_hcp_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can read own subscriptions"
ON public.user_hcp_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can add their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
ON public.user_hcp_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
ON public.user_hcp_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
