const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const db = require('./lib/db');
const {
  WHATSAPP_BUSINESS,
  buildWhatsAppUrl,
  buildParticipanteMessage,
  buildGanadorMessage,
} = require('./lib/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'soldada';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sorteo-beautymaxuy.pages.dev';

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin === FRONTEND_URL) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

function requireAdmin(req, res, next) {
  if (req.session?.admin) return next();
  res.status(401).json({ error: 'No autorizado' });
}

function enrichParticipante(participante) {
  const mensaje = buildParticipanteMessage(participante);
  return {
    ...participante,
    whatsapp_url: buildWhatsAppUrl(participante.celular, mensaje),
    whatsapp_business_url: buildWhatsAppUrl(WHATSAPP_BUSINESS, mensaje),
  };
}

function setupRoutes() {
  app.use(express.json());

  app.post('/api/participantes', async (req, res) => {
    try {
      const nombre = String(req.body.nombre || '').trim();
      const direccion = String(req.body.direccion || '').trim();
      const ciudad = String(req.body.ciudad || '').trim();
      const celular = String(req.body.celular || '').trim();

      if (!nombre || !direccion || !ciudad || !celular) {
        return res.status(400).json({ error: 'Completá todos los campos.' });
      }

      const participante = await db.createParticipante({ nombre, direccion, ciudad, celular });
      const enriched = enrichParticipante(participante);

      res.status(201).json({
        participante: enriched,
        whatsapp_url: enriched.whatsapp_business_url,
      });
    } catch (error) {
      console.error('Error al registrar participante:', error);
      res.status(500).json({ error: 'No se pudo registrar la participación.' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const usuario = String(req.body.usuario || '').trim();
    const clave = String(req.body.clave || '');

    if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
      req.session.admin = true;
      return res.json({ ok: true });
    }

    res.status(401).json({ error: 'Usuario o clave incorrectos.' });
  });

  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get('/api/admin/session', (req, res) => {
    res.json({ authenticated: Boolean(req.session?.admin) });
  });

  app.get('/api/participantes', requireAdmin, async (_req, res) => {
    try {
      const participantes = (await db.getAllParticipantes()).map(enrichParticipante);
      res.json({
        total: participantes.length,
        participantes,
      });
    } catch (error) {
      console.error('Error al listar participantes:', error);
      res.status(500).json({ error: 'No se pudieron cargar los participantes.' });
    }
  });

  app.post('/api/sorteo', requireAdmin, async (_req, res) => {
    try {
      const total = await db.getParticipantesCount();

      if (total === 0) {
        return res.status(400).json({ error: 'No hay participantes registrados.' });
      }

      const ganador = await db.pickRandomWinner();
      const enriched = enrichParticipante(ganador);
      const mensajeGanador = buildGanadorMessage(ganador);

      res.json({
        total,
        ganador: {
          ...enriched,
          whatsapp_ganador_url: buildWhatsAppUrl(ganador.celular, mensajeGanador),
        },
      });
    } catch (error) {
      console.error('Error al realizar sorteo:', error);
      res.status(500).json({ error: 'No se pudo realizar el sorteo.' });
    }
  });

  app.use(express.static(path.join(__dirname, 'public')));
}

async function start() {
  const databaseUrl = db.getDatabaseUrl();

  if (!databaseUrl) {
    console.error(
      'Falta DATABASE_URL. En Supabase: Project Settings → Database → Connection string (URI).'
    );
    process.exit(1);
  }

  await db.init();

  app.use(
    session({
      store: new pgSession({
        pool: db.pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || 'sorteo-beautymax-session',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  setupRoutes();

  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
