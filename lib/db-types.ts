export interface Project {
  id: string;
  name: string;
  hld_text: string | null;
  lld_text: string | null;
  created_at: string;
}

export interface Understanding {
  id: string;
  project_id: string;
  developer_name: string;
  change_description: string | null;
  module_name: string;
  understanding_text: string;
  confidence_score: number | null;
  embedding: number[] | null;
  created_at: string;
}

// Insert types (without auto-generated fields)
export interface ProjectInsert {
  name: string;
  hld_text?: string | null;
  lld_text?: string | null;
}

export interface UnderstandingInsert {
  project_id: string;
  developer_name: string;
  change_description?: string | null;
  module_name: string;
  understanding_text: string;
  confidence_score?: number | null;
  embedding?: number[] | null;
}
