// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Calendar Export Helpers
//  No OAuth: deep-link to Google Calendar + downloadable .ics
// ─────────────────────────────────────────────────────────────

import type { ScheduledMeeting } from '../types/ces'

function toGoogleUTC(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  // Google Calendar wants YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICSText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

export function googleCalendarEventUrl(meeting: ScheduledMeeting): string {
  const start = toGoogleUTC(meeting.startAt)
  const end = toGoogleUTC(meeting.endAt)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meeting.title,
    dates: `${start}/${end}`,
  })
  if (meeting.location) params.set('location', meeting.location)
  if (meeting.notes) params.set('details', meeting.notes)
  if (meeting.timeZone) params.set('ctz', meeting.timeZone)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function generateICS(meeting: ScheduledMeeting): string {
  const now = toGoogleUTC(new Date().toISOString())
  const start = toGoogleUTC(meeting.startAt)
  const end = toGoogleUTC(meeting.endAt)
  const statusMap: Record<ScheduledMeeting['status'], string> = {
    proposed: 'TENTATIVE',
    confirmed: 'CONFIRMED',
    completed: 'CONFIRMED',
    rescheduled: 'TENTATIVE',
    cancelled: 'CANCELLED',
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Heartlight Collective//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@heartlight-collective.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICSText(meeting.title)}`,
    `STATUS:${statusMap[meeting.status] || 'TENTATIVE'}`,
  ]

  if (meeting.location) lines.push(`LOCATION:${escapeICSText(meeting.location)}`)
  if (meeting.notes) lines.push(`DESCRIPTION:${escapeICSText(meeting.notes)}`)
  if (meeting.timeZone) lines.push(`X-WR-TIMEZONE:${meeting.timeZone}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(meeting: ScheduledMeeting): void {
  const blob = new Blob([generateICS(meeting)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${meeting.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function formatMeetingTime(meeting: ScheduledMeeting): string {
  const start = new Date(meeting.startAt)
  const end = new Date(meeting.endAt)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Time TBD'
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}`
}
