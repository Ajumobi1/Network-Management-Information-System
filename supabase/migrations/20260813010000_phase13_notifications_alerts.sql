-- ============================================================================
-- NMIS Phase 13: Notifications, Alerts & Expiry Monitoring Module Migration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('expiry', 'inspection', 'complaint', 'financial', 'system')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link_url VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for user notifications" ON public.system_notifications;
CREATE POLICY "Enable read access for user notifications" ON public.system_notifications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network'])
  );

DROP POLICY IF EXISTS "Enable update for user notifications" ON public.system_notifications;
CREATE POLICY "Enable update for user notifications" ON public.system_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Secure RPC to list notifications
CREATE OR REPLACE FUNCTION public.nmis_list_notifications(
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  message TEXT,
  category VARCHAR,
  severity VARCHAR,
  is_read BOOLEAN,
  link_url VARCHAR,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.category,
    n.severity,
    n.is_read,
    n.link_url,
    n.created_at
  FROM public.system_notifications n
  WHERE (n.user_id = auth.uid() OR n.user_id IS NULL)
    AND (NOT p_unread_only OR n.is_read = FALSE)
  ORDER BY n.created_at DESC;
END;
$$;

-- Secure RPC to mark notification read
CREATE OR REPLACE FUNCTION public.nmis_mark_notification_read(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.system_notifications
  SET is_read = TRUE
  WHERE id = p_notification_id AND (user_id = auth.uid() OR user_id IS NULL);

  RETURN FOUND;
END;
$$;
