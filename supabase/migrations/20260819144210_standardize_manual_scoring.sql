-- Standardize all inspection items to use manual scoring as requested by ODCHC.
-- This ensures that inspectors manually award points capped at the item maximum,
-- rather than the system auto-calculating points based on observations.

UPDATE public.inspection_template_items
SET 
  scoring_method = 'manual_only',
  manual_score_allowed = true
WHERE scoring_method != 'manual_only' OR manual_score_allowed = false;
