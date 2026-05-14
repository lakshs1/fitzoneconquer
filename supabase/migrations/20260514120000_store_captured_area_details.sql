-- Store the exact single-user activity area metadata used for public map labels and sharing.
ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS capture_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS capture_distance_meters NUMERIC,
  ADD COLUMN IF NOT EXISTS capture_path JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS zones_activity_id_idx ON public.zones(activity_id);
