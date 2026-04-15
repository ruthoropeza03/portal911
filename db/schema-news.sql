-- Tabla `news` — alineada con app/api/news (POST, PUT, GET) y páginas /, /noticias/[id], /dashboard/noticias
-- Ejecutar en Neon (PostgreSQL). Ajusta el nombre de la FK a tu tabla `users` si difiere.

CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  -- Texto: JSON { "v": 1, "raw": "...", "blocks": [...] } generado por lib/formateadorNoticia.js, o texto plano legado
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  author_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_visible_published ON news (visible, published_at DESC);
