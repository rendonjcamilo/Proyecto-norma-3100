/**
 * Horario laboral por defecto para el envío de mensajes de WhatsApp (auditor -> prestador):
 * lunes a viernes, 7:00am - 7:00pm, hora de Bogotá. Ajustable si el equipo define otro rango.
 */
export const BUSINESS_HOURS = {
  timezone: 'America/Bogota',
  startHour: 7,
  endHour: 19,
  workDays: [1, 2, 3, 4, 5], // lunes(1) a viernes(5), domingo=0
};

function toBogota(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: BUSINESS_HOURS.timezone }));
}

export function isBusinessHours(date: Date = new Date()): boolean {
  const bogota = toBogota(date);
  const day = bogota.getDay();
  const hour = bogota.getHours();
  return BUSINESS_HOURS.workDays.includes(day) && hour >= BUSINESS_HOURS.startHour && hour < BUSINESS_HOURS.endHour;
}

/**
 * Próximo inicio de horario laboral (lunes-viernes, startHour en punto, hora Bogotá) a partir de `date`.
 * Si `date` ya está en horario laboral, retorna `date` sin cambios.
 */
export function nextBusinessHoursStart(date: Date = new Date()): Date {
  if (isBusinessHours(date)) return date;

  const bogota = toBogota(date);
  const candidate = new Date(bogota);
  candidate.setHours(BUSINESS_HOURS.startHour, 0, 0, 0);
  if (candidate <= bogota) {
    candidate.setDate(candidate.getDate() + 1);
  }
  while (!BUSINESS_HOURS.workDays.includes(candidate.getDay())) {
    candidate.setDate(candidate.getDate() + 1);
  }

  // Convertir el "candidate" (calculado en reloj de Bogotá) de vuelta a un instante UTC real,
  // corrigiendo el offset entre el reloj local del proceso y el de Bogotá.
  const offsetMs = toBogota(date).getTime() - date.getTime();
  return new Date(candidate.getTime() - offsetMs);
}
