CREATE OR REPLACE FUNCTION pick_random_participante()
RETURNS SETOF participantes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM participantes
  ORDER BY RANDOM()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION pick_random_participante() TO service_role;
