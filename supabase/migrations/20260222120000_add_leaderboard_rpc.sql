-- Public leaderboard RPC for authenticated users.
-- Uses SECURITY DEFINER to read profiles + user_stats while exposing only leaderboard-safe fields.
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  name text,
  avatar_url text,
  xp integer,
  level integer,
  zones_owned integer,
  total_distance numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.name,
    p.avatar_url,
    COALESCE(s.xp, 0) AS xp,
    COALESCE(s.level, 1) AS level,
    COALESCE(s.zones_owned, 0) AS zones_owned,
    COALESCE(s.total_distance, 0) AS total_distance
  FROM public.profiles p
  LEFT JOIN public.user_stats s ON s.user_id = p.user_id
  ORDER BY COALESCE(s.level, 1) DESC, COALESCE(s.xp, 0) DESC, p.created_at ASC
  LIMIT GREATEST(COALESCE(limit_count, 10), 1);
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
