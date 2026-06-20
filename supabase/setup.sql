-- Ejecutar todo esto en Supabase → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS participantes (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  celular TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role accede a participantes" ON participantes;

CREATE POLICY "Service role accede a participantes"
  ON participantes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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
