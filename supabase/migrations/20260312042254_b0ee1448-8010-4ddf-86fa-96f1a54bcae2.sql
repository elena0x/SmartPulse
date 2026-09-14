
-- HCP 专家基础信息表
CREATE TABLE public.hcp_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gender TEXT DEFAULT '',
  province TEXT DEFAULT '',
  city TEXT DEFAULT '',
  institution TEXT DEFAULT '',
  hospital_category TEXT DEFAULT '',
  raw_department TEXT DEFAULT '',
  standard_department TEXT DEFAULT '',
  professional_title TEXT DEFAULT '',
  admin_title TEXT DEFAULT '',
  education TEXT DEFAULT '',
  supervisor_title TEXT DEFAULT '',
  resume TEXT DEFAULT '',
  expertise TEXT DEFAULT '',
  official_website TEXT DEFAULT '',
  other_institutions TEXT DEFAULT '',
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hcp_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required for now)
CREATE POLICY "Anyone can read hcp_profiles"
  ON public.hcp_profiles FOR SELECT
  USING (true);

-- Public insert access
CREATE POLICY "Anyone can insert hcp_profiles"
  ON public.hcp_profiles FOR INSERT
  WITH CHECK (true);

-- Public update access
CREATE POLICY "Anyone can update hcp_profiles"
  ON public.hcp_profiles FOR UPDATE
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER hcp_profiles_updated_at
  BEFORE UPDATE ON public.hcp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
