CREATE TABLE IF NOT EXISTS participantes (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  celular TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role accede a participantes"
  ON participantes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
