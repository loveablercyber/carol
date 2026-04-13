type CalendarInput = {
  serviceName: string
  customerName: string
  scheduledAt: string
  durationMinutes?: number
  notes?: string | null
}

function toGoogleDateTime(value: Date) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function buildGoogleCalendarUrl(input: CalendarInput) {
  const start = new Date(input.scheduledAt)
  if (Number.isNaN(start.getTime())) return null
  const duration = Number(input.durationMinutes || 60)
  const end = new Date(start.getTime() + duration * 60 * 1000)

  const title = `Agendamento CarolSol - ${input.serviceName}`
  const detailsLines = [
    `Cliente: ${input.customerName}`,
    `Servico: ${input.serviceName}`,
    input.notes ? `Observacoes: ${input.notes}` : '',
  ].filter(Boolean)

  const search = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toGoogleDateTime(start)}/${toGoogleDateTime(end)}`,
    details: detailsLines.join('\n'),
  })

  return `https://calendar.google.com/calendar/render?${search.toString()}`
}

