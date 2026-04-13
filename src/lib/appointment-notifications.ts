import {
  AppointmentNotificationType,
  AppointmentRecord,
  markAppointmentNotificationSent,
} from '@/lib/appointments-store'
import { buildGoogleCalendarUrl } from '@/lib/appointment-calendar'

type DispatchResult = {
  sent: boolean
  emailSent: boolean
  whatsappSent: boolean
  reason?: string
  googleCalendarUrl: string | null
}

function formatDateTimeBr(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function normalizePhoneToWhatsApp(rawPhone: string) {
  const digits = String(rawPhone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length >= 10) return `55${digits}`
  return digits
}

function getTemplate(type: AppointmentNotificationType, appointment: AppointmentRecord) {
  const dateText = formatDateTimeBr(appointment.scheduledAt)
  const googleCalendarUrl = buildGoogleCalendarUrl({
    serviceName: appointment.serviceName,
    customerName: appointment.customerName,
    scheduledAt: appointment.scheduledAt,
    durationMinutes: appointment.durationMinutes,
    notes: appointment.notes,
  })

  const base = [
    `Oi, ${appointment.customerName}!`,
    `Servico: ${appointment.serviceName}`,
    `Data/Hora: ${dateText}`,
  ]

  if (type === 'confirmation') {
    return {
      subject: 'Agendamento confirmado - CarolSol Studio',
      message: [
        ...base,
        'Seu agendamento foi confirmado com sucesso.',
        googleCalendarUrl ? `Google Agenda: ${googleCalendarUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      googleCalendarUrl,
    }
  }

  if (type === 'reminder') {
    return {
      subject: 'Lembrete do seu agendamento - CarolSol Studio',
      message: [
        ...base,
        'Lembrete: seu atendimento esta proximo.',
        'Se precisar remarcar, responda esta mensagem.',
        googleCalendarUrl ? `Google Agenda: ${googleCalendarUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      googleCalendarUrl,
    }
  }

  return {
    subject: 'Agendamento cancelado - CarolSol Studio',
    message: [
      ...base,
      'Seu agendamento foi cancelado.',
      appointment.notes ? `Motivo/obs: ${appointment.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    googleCalendarUrl,
  }
}

async function sendEmailNotification(input: {
  appointment: AppointmentRecord
  subject: string
  message: string
  googleCalendarUrl: string | null
}) {
  const to = String(input.appointment.customerEmail || '').trim()
  if (!to) return false

  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFICATION_EMAIL_FROM
  if (!resendApiKey || !from) return false

  const html = [
    `<p>Ola, ${input.appointment.customerName}!</p>`,
    `<p>${input.message.replace(/\n/g, '<br/>')}</p>`,
    input.googleCalendarUrl
      ? `<p><a href="${input.googleCalendarUrl}" target="_blank" rel="noreferrer">Adicionar ao Google Agenda</a></p>`
      : '',
  ].join('')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: input.subject,
      html,
    }),
  })

  if (response.ok) return true
  const errorText = await response.text().catch(() => '')
  console.error('[notifications] Resend failed:', errorText)
  return false
}

async function sendWhatsAppNotification(input: {
  appointment: AppointmentRecord
  message: string
}) {
  const to = normalizePhoneToWhatsApp(input.appointment.customerPhone)
  if (!to) return false

  const cloudToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN
  const cloudPhoneId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID
  if (!cloudToken || !cloudPhoneId) return false

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${cloudPhoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: input.message,
          preview_url: false,
        },
      }),
    }
  )

  if (response.ok) return true
  const errorText = await response.text().catch(() => '')
  console.error('[notifications] WhatsApp cloud failed:', errorText)
  return false
}

export async function dispatchAppointmentNotification(input: {
  appointment: AppointmentRecord
  type: AppointmentNotificationType
  markAsSent?: boolean
}) {
  const { appointment, type } = input
  const markAsSent = input.markAsSent ?? true
  const template = getTemplate(type, appointment)

  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL_FROM
  )
  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN &&
      process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID
  )

  if (!emailConfigured && !whatsappConfigured) {
    console.warn('[notifications] No channels configured for appointment notifications')
    return {
      sent: false,
      emailSent: false,
      whatsappSent: false,
      reason: 'No notification channel configured',
      googleCalendarUrl: template.googleCalendarUrl,
    } satisfies DispatchResult
  }

  const [emailResult, whatsappResult] = await Promise.allSettled([
    sendEmailNotification({
      appointment,
      subject: template.subject,
      message: template.message,
      googleCalendarUrl: template.googleCalendarUrl,
    }),
    sendWhatsAppNotification({
      appointment,
      message: template.message,
    }),
  ])

  const emailSent = emailResult.status === 'fulfilled' ? Boolean(emailResult.value) : false
  const whatsappSent =
    whatsappResult.status === 'fulfilled' ? Boolean(whatsappResult.value) : false
  const sent = emailSent || whatsappSent

  if (sent && markAsSent) {
    await markAppointmentNotificationSent(appointment.id, type)
  }

  return {
    sent,
    emailSent,
    whatsappSent,
    reason: sent ? undefined : 'All channels failed',
    googleCalendarUrl: template.googleCalendarUrl,
  } satisfies DispatchResult
}
