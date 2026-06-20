const WHATSAPP_BUSINESS = '59892331019';

function normalizePhone(celular: string): string {
  const digits = celular.replace(/\D/g, '');

  if (digits.startsWith('598') && digits.length >= 11) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `598${digits.slice(1)}`;
  }

  if (digits.length === 8 || digits.length === 9) {
    return `598${digits}`;
  }

  return digits;
}

function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const base = `https://wa.me/${normalized}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

function buildParticipanteMessage(participante: Record<string, string>): string {
  return [
    '*Participante desde web*',
    '',
    `*Nombre:* ${participante.nombre}`,
    `*Dirección:* ${participante.direccion}`,
    `*Ciudad:* ${participante.ciudad}`,
    `*Celular:* ${participante.celular}`,
  ].join('\n');
}

function buildGanadorMessage(ganador: Record<string, string>): string {
  return [
    '*¡Felicitaciones! Ganaste el sorteo Febros*',
    '',
    `Hola ${ganador.nombre},`,
    'Te contactamos porque resultaste ganador/a del sorteo.',
    'Por favor respondenos para coordinar la entrega de tu premio.',
  ].join('\n');
}

function enrichParticipante(participante: Record<string, unknown>) {
  const mensaje = buildParticipanteMessage(participante as Record<string, string>);
  return {
    ...participante,
    whatsapp_url: buildWhatsAppUrl(String(participante.celular), mensaje),
    whatsapp_business_url: buildWhatsAppUrl(WHATSAPP_BUSINESS, mensaje),
  };
}

export {
  WHATSAPP_BUSINESS,
  buildWhatsAppUrl,
  buildParticipanteMessage,
  buildGanadorMessage,
  enrichParticipante,
};
