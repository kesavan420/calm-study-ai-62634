-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#4A90E2',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subtopics table
CREATE TABLE public.subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY "Users can view their own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for subtopics (via subject ownership)
CREATE POLICY "Users can view subtopics of their subjects"
  ON public.subtopics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = subtopics.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create subtopics for their subjects"
  ON public.subtopics FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = subtopics.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update subtopics of their subjects"
  ON public.subtopics FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = subtopics.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete subtopics of their subjects"
  ON public.subtopics FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.subjects
    WHERE subjects.id = subtopics.subject_id
    AND subjects.user_id = auth.uid()
  ));

-- RLS Policies for study_sessions
CREATE POLICY "Users can view their own study sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);