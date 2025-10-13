-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hld_text TEXT,
  lld_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Understandings table
CREATE TABLE understandings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  developer_name TEXT NOT NULL,
  change_description TEXT,
  module_name TEXT NOT NULL,
  understanding_text TEXT NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 5),
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_understandings_project_id ON understandings(project_id);
CREATE INDEX idx_understandings_module_name ON understandings(module_name);
CREATE INDEX idx_understandings_created_at ON understandings(created_at);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE understandings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (publicly accessible for prototype)
-- Projects policies
CREATE POLICY "Enable read access for all users" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON projects
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON projects
  FOR DELETE USING (true);

-- Understandings policies
CREATE POLICY "Enable read access for all users" ON understandings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON understandings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON understandings
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON understandings
  FOR DELETE USING (true);

-- Function for semantic search using pgvector
CREATE OR REPLACE FUNCTION search_understandings(
  query_embedding vector(768),
  query_project_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  developer_name TEXT,
  change_description TEXT,
  module_name TEXT,
  understanding_text TEXT,
  confidence_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    understandings.id,
    understandings.project_id,
    understandings.developer_name,
    understandings.change_description,
    understandings.module_name,
    understandings.understanding_text,
    understandings.confidence_score,
    understandings.created_at,
    1 - (understandings.embedding <=> query_embedding) AS similarity
  FROM understandings
  WHERE understandings.project_id = query_project_id
    AND understandings.embedding IS NOT NULL
    AND 1 - (understandings.embedding <=> query_embedding) >= match_threshold
  ORDER BY understandings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
