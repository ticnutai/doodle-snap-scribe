-- Create drawing_templates table
CREATE TABLE public.drawing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  thumbnail_path TEXT,
  canvas_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.drawing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON public.drawing_templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON public.drawing_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON public.drawing_templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.drawing_templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for templates
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', false);

-- Storage RLS policies
CREATE POLICY "Users can upload own templates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own templates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own templates"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);