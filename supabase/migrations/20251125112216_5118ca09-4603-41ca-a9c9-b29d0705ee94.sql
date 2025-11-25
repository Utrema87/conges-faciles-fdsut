-- Table pour les règles de conflits par service
CREATE TABLE IF NOT EXISTS public.conflict_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  min_employees_required INTEGER NOT NULL DEFAULT 1,
  max_concurrent_leaves INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end IS NULL OR period_end >= period_start),
  CONSTRAINT valid_min_employees CHECK (min_employees_required >= 0)
);

-- Table pour les remplacements temporaires
CREATE TABLE IF NOT EXISTS public.service_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID NOT NULL,
  substitute_user_id UUID NOT NULL,
  department TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_substitution_period CHECK (end_date >= start_date),
  CONSTRAINT different_users CHECK (original_user_id != substitute_user_id)
);

-- Enable RLS
ALTER TABLE public.conflict_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_substitutions ENABLE ROW LEVEL SECURITY;

-- Policies for conflict_rules
CREATE POLICY "Admins and HR can manage conflict rules"
ON public.conflict_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Managers can view conflict rules"
ON public.conflict_rules
FOR SELECT
USING (
  has_role(auth.uid(), 'service_chief'::app_role) OR 
  has_role(auth.uid(), 'cell_manager'::app_role)
);

-- Policies for service_substitutions
CREATE POLICY "Admins and HR can manage substitutions"
ON public.service_substitutions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Managers can view substitutions"
ON public.service_substitutions
FOR SELECT
USING (
  has_role(auth.uid(), 'service_chief'::app_role) OR 
  has_role(auth.uid(), 'cell_manager'::app_role)
);

CREATE POLICY "Users can view their own substitutions"
ON public.service_substitutions
FOR SELECT
USING (auth.uid() = original_user_id OR auth.uid() = substitute_user_id);

-- Trigger for updated_at on conflict_rules
CREATE TRIGGER update_conflict_rules_updated_at
BEFORE UPDATE ON public.conflict_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_conflict_rules_department ON public.conflict_rules(department);
CREATE INDEX idx_conflict_rules_period ON public.conflict_rules(period_start, period_end) WHERE is_active = true;
CREATE INDEX idx_substitutions_dates ON public.service_substitutions(start_date, end_date);
CREATE INDEX idx_substitutions_users ON public.service_substitutions(original_user_id, substitute_user_id);