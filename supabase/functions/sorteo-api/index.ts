import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { create, getNumericDate, verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import {
  buildGanadorMessage,
  buildWhatsAppUrl,
  enrichParticipante,
} from './whatsapp.ts';

type Participante = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  celular: string;
  created_at: string;
};

const ADMIN_USER = Deno.env.get('ADMIN_USER') || 'admin';
const ADMIN_PASS = Deno.env.get('ADMIN_PASS') || 'soldada';
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://sorteo-febros.pages.dev';
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'sorteo-febros-session';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

let jwtKey: CryptoKey | null = null;

async function getJwtKey() {
  if (jwtKey) return jwtKey;

  jwtKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  return jwtKey;
}

function getApiPath(url: URL): string {
  const pathname = url.pathname;
  const apiIndex = pathname.indexOf('/api/');

  if (apiIndex >= 0) {
    return pathname.slice(apiIndex);
  }

  return pathname.replace(/^.*\/sorteo-api/, '') || '/';
}

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-admin-token, x-client-info',
  };

  if (
    origin === FRONTEND_URL ||
    origin?.endsWith('.pages.dev') ||
    origin?.includes('localhost')
  ) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function jsonResponse(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

async function createAdminToken() {
  const key = await getJwtKey();
  return await create({ alg: 'HS256', typ: 'JWT' }, { admin: true, exp: getNumericDate(60 * 60 * 24) }, key);
}

async function isAdminRequest(req: Request): Promise<boolean> {
  const token = req.headers.get('x-admin-token');
  if (!token) return false;

  try {
    const key = await getJwtKey();
    const payload = await verify(token, key);
    return Boolean((payload as Record<string, unknown>).admin);
  } catch {
    return false;
  }
}

async function handlePostParticipantes(req: Request, origin: string | null) {
  const body = await req.json();
  const nombre = String(body.nombre || '').trim();
  const direccion = String(body.direccion || '').trim();
  const ciudad = String(body.ciudad || '').trim();
  const celular = String(body.celular || '').trim();

  if (!nombre || !direccion || !ciudad || !celular) {
    return jsonResponse({ error: 'Completá todos los campos.' }, 400, origin);
  }

  const { data, error } = await supabase
    .from('participantes')
    .insert({ nombre, direccion, ciudad, celular })
    .select('id, nombre, direccion, ciudad, celular, created_at')
    .single();

  if (error) {
    console.error('Error al registrar participante:', error);
    return jsonResponse({ error: 'No se pudo registrar la participación.' }, 500, origin);
  }

  const enriched = enrichParticipante(data as Participante);

  return jsonResponse(
    {
      participante: enriched,
      whatsapp_url: enriched.whatsapp_business_url,
    },
    201,
    origin
  );
}

async function handleAdminLogin(req: Request, origin: string | null) {
  const body = await req.json();
  const usuario = String(body.usuario || '').trim();
  const clave = String(body.clave || '');

  if (usuario !== ADMIN_USER || clave !== ADMIN_PASS) {
    return jsonResponse({ error: 'Usuario o clave incorrectos.' }, 401, origin);
  }

  const token = await createAdminToken();
  return jsonResponse({ ok: true, token }, 200, origin);
}

async function handleAdminSession(req: Request, origin: string | null) {
  const authenticated = await isAdminRequest(req);
  return jsonResponse({ authenticated }, 200, origin);
}

async function handleGetParticipantes(req: Request, origin: string | null) {
  if (!(await isAdminRequest(req))) {
    return jsonResponse({ error: 'No autorizado' }, 401, origin);
  }

  const { data, error } = await supabase
    .from('participantes')
    .select('id, nombre, direccion, ciudad, celular, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al listar participantes:', error);
    return jsonResponse({ error: 'No se pudieron cargar los participantes.' }, 500, origin);
  }

  const participantes = (data || []).map((item) => enrichParticipante(item as Participante));

  return jsonResponse({ total: participantes.length, participantes }, 200, origin);
}

async function handleSorteo(req: Request, origin: string | null) {
  if (!(await isAdminRequest(req))) {
    return jsonResponse({ error: 'No autorizado' }, 401, origin);
  }

  const { count, error: countError } = await supabase
    .from('participantes')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error al contar participantes:', countError);
    return jsonResponse({ error: 'No se pudo realizar el sorteo.' }, 500, origin);
  }

  const total = count || 0;

  if (total === 0) {
    return jsonResponse({ error: 'No hay participantes registrados.' }, 400, origin);
  }

  const { data, error } = await supabase.rpc('pick_random_participante');

  if (error) {
    console.error('Error al realizar sorteo:', error);
    return jsonResponse({ error: 'No se pudo realizar el sorteo.' }, 500, origin);
  }

  const ganador = Array.isArray(data) ? data[0] : data;

  if (!ganador) {
    return jsonResponse({ error: 'No se pudo realizar el sorteo.' }, 500, origin);
  }

  const enriched = enrichParticipante(ganador as Participante);
  const mensajeGanador = buildGanadorMessage(ganador as Participante);

  return jsonResponse(
    {
      total,
      ganador: {
        ...enriched,
        whatsapp_ganador_url: buildWhatsAppUrl(String(ganador.celular), mensajeGanador),
      },
    },
    200,
    origin
  );
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const apiPath = getApiPath(new URL(req.url));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  try {
    if (req.method === 'POST' && apiPath === '/api/participantes') {
      return await handlePostParticipantes(req, origin);
    }

    if (req.method === 'POST' && apiPath === '/api/admin/login') {
      return await handleAdminLogin(req, origin);
    }

    if (req.method === 'POST' && apiPath === '/api/admin/logout') {
      return jsonResponse({ ok: true }, 200, origin);
    }

    if (req.method === 'GET' && apiPath === '/api/admin/session') {
      return await handleAdminSession(req, origin);
    }

    if (req.method === 'GET' && apiPath === '/api/participantes') {
      return await handleGetParticipantes(req, origin);
    }

    if (req.method === 'POST' && apiPath === '/api/sorteo') {
      return await handleSorteo(req, origin);
    }

    return jsonResponse({ error: 'Ruta no encontrada.' }, 404, origin);
  } catch (error) {
    console.error('Error en sorteo-api:', error);
    return jsonResponse({ error: 'Error interno del servidor.' }, 500, origin);
  }
});
