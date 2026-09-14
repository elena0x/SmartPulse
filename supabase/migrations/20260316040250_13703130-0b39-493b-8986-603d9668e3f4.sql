
-- ═══ HCP Publications (论文) ═══
CREATE TABLE public.hcp_publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  title TEXT NOT NULL,
  journal TEXT NOT NULL,
  published_date DATE,
  impact_factor REAL,
  citations INTEGER DEFAULT 0,
  authors TEXT[] DEFAULT '{}',
  doi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_publications" ON public.hcp_publications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_publications" ON public.hcp_publications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update hcp_publications" ON public.hcp_publications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete hcp_publications" ON public.hcp_publications FOR DELETE TO authenticated USING (true);

-- ═══ HCP Clinical Trials (临床试验) ═══
CREATE TABLE public.hcp_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  registration_id TEXT,
  title TEXT NOT NULL,
  phase TEXT,
  status TEXT DEFAULT 'unknown',
  start_date TEXT,
  end_date TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_trials" ON public.hcp_trials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_trials" ON public.hcp_trials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update hcp_trials" ON public.hcp_trials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete hcp_trials" ON public.hcp_trials FOR DELETE TO authenticated USING (true);

-- ═══ HCP Grants (基金课题) ═══
CREATE TABLE public.hcp_grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  title TEXT NOT NULL,
  funding_body TEXT,
  amount TEXT,
  period TEXT,
  status TEXT DEFAULT 'unknown',
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_grants" ON public.hcp_grants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_grants" ON public.hcp_grants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update hcp_grants" ON public.hcp_grants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete hcp_grants" ON public.hcp_grants FOR DELETE TO authenticated USING (true);

-- ═══ HCP Conferences (会议) ═══
CREATE TABLE public.hcp_conferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  name TEXT NOT NULL,
  conference_date DATE,
  location TEXT,
  role TEXT,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_conferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_conferences" ON public.hcp_conferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_conferences" ON public.hcp_conferences FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update hcp_conferences" ON public.hcp_conferences FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete hcp_conferences" ON public.hcp_conferences FOR DELETE TO authenticated USING (true);

-- ═══ HCP Guidelines (指南) ═══
CREATE TABLE public.hcp_guidelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT,
  year TEXT,
  role TEXT,
  status TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_guidelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_guidelines" ON public.hcp_guidelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_guidelines" ON public.hcp_guidelines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update hcp_guidelines" ON public.hcp_guidelines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete hcp_guidelines" ON public.hcp_guidelines FOR DELETE TO authenticated USING (true);

-- ═══ HCP News (新闻) ═══
CREATE TABLE public.hcp_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  published_date DATE,
  summary TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_news" ON public.hcp_news FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_news" ON public.hcp_news FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update hcp_news" ON public.hcp_news FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete hcp_news" ON public.hcp_news FOR DELETE TO authenticated USING (true);

-- ═══ HCP Relations (关系网) ═══
CREATE TABLE public.hcp_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  related_hcp_id TEXT NOT NULL,
  related_name TEXT NOT NULL,
  related_institution TEXT,
  related_department TEXT,
  relation_type TEXT NOT NULL,
  strength INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_relations" ON public.hcp_relations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_relations" ON public.hcp_relations FOR INSERT TO authenticated WITH CHECK (true);

-- ═══ HCP Research Areas (研究领域) ═══
CREATE TABLE public.hcp_research_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  area_type TEXT NOT NULL, -- 'disease' or 'drug'
  name TEXT NOT NULL,
  level TEXT, -- '核心'/'扩展' for diseases, '在研'/'已上市' for drugs
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_research_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_research_areas" ON public.hcp_research_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_research_areas" ON public.hcp_research_areas FOR INSERT TO authenticated WITH CHECK (true);

-- ═══ HCP Activities (近期动态) ═══
CREATE TABLE public.hcp_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  activity_date DATE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hcp_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read hcp_activities" ON public.hcp_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hcp_activities" ON public.hcp_activities FOR INSERT TO authenticated WITH CHECK (true);

-- ═══ Signals (情报信号) ═══
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT NOT NULL,
  hcp_name TEXT NOT NULL,
  hospital TEXT,
  signal_type TEXT NOT NULL,
  summary TEXT,
  priority TEXT DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  publications_count INTEGER DEFAULT 0,
  trials_count INTEGER DEFAULT 0,
  affinity REAL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read signals" ON public.signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert signals" ON public.signals FOR INSERT TO authenticated WITH CHECK (true);

-- ═══ NBA Actions (行动建议) ═══
CREATE TABLE public.nba_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hcp_id TEXT,
  hcp_name TEXT NOT NULL,
  action TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  score INTEGER DEFAULT 0,
  channel TEXT,
  deadline DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nba_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read nba_actions" ON public.nba_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert nba_actions" ON public.nba_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update nba_actions" ON public.nba_actions FOR UPDATE TO authenticated USING (true);

-- ═══ Cockpit Analyses (策略分析) ═══
CREATE TABLE public.cockpit_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  query TEXT,
  category TEXT,
  category_label TEXT,
  saved_at TIMESTAMPTZ DEFAULT now(),
  last_refreshed TIMESTAMPTZ DEFAULT now(),
  has_anomaly BOOLEAN DEFAULT false,
  anomaly_message TEXT,
  chart_type TEXT DEFAULT 'line',
  chart_data JSONB DEFAULT '[]',
  summary TEXT,
  target_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cockpit_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cockpit_analyses" ON public.cockpit_analyses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert cockpit_analyses" ON public.cockpit_analyses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update cockpit_analyses" ON public.cockpit_analyses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete cockpit_analyses" ON public.cockpit_analyses FOR DELETE TO authenticated USING (true);

-- Enable realtime for signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
