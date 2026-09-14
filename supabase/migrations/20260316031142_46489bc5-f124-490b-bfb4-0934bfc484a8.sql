
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Create RLS policies for documents bucket
CREATE POLICY "Allow public read access on documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Allow public insert access on documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public delete access on documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- Create table for parsed document contents
CREATE TABLE public.document_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  source_id TEXT NOT NULL,
  parsed_text TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  file_size TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_contents ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this app)
CREATE POLICY "Allow public read on document_contents"
ON public.document_contents FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on document_contents"
ON public.document_contents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on document_contents"
ON public.document_contents FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on document_contents"
ON public.document_contents FOR DELETE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_document_contents_updated_at
  BEFORE UPDATE ON public.document_contents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
