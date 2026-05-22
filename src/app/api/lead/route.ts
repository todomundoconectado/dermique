import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const PIXEL_ID = process.env.META_PIXEL_ID || ''
const CAPI_URL = PIXEL_ID ? `https://graph.facebook.com/v21.0/${PIXEL_ID}/events` : ''

function sha256(value: string) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

async function sendCapiEvent(payload: {
  event_name: string; event_id: string; event_source_url: string
  phone?: string; nome?: string; client_ip?: string; client_user_agent?: string; fbp?: string; fbc?: string
}) {
  const token = process.env.META_CAPI_TOKEN
  if (!token || !PIXEL_ID) return
  const user_data: Record<string, string | string[]> = {}
  if (payload.phone) user_data.ph = sha256(payload.phone.replace(/\D/g, ''))
  if (payload.event_id) user_data.external_id = sha256(payload.event_id)
  if (payload.nome) {
    const parts = payload.nome.trim().split(/\s+/)
    user_data.fn = sha256(parts[0])
    if (parts.length > 1) user_data.ln = sha256(parts.slice(1).join(' '))
  }
  if (payload.client_ip) user_data.client_ip_address = payload.client_ip
  if (payload.client_user_agent) user_data.client_user_agent = payload.client_user_agent
  if (payload.fbp) user_data.fbp = payload.fbp
  if (payload.fbc) user_data.fbc = payload.fbc
  const body = { data: [{ event_name: payload.event_name, event_time: Math.floor(Date.now() / 1000),
    event_id: payload.event_id, event_source_url: payload.event_source_url,
    action_source: 'website', user_data }] }
  try {
    const res = await fetch(`${CAPI_URL}?access_token=${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (!res.ok) console.error('[CAPI] erro:', res.status, await res.text())
  } catch (err) { console.error('[CAPI] exception:', err) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const client_ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || undefined
    const client_user_agent = req.headers.get('user-agent') || undefined
    if (data.event_name && data.lead_id) {
      await sendCapiEvent({ event_name: data.event_name, event_id: data.lead_id,
        event_source_url: data.pagina || '', phone: data.telefone, nome: data.nome,
        client_ip, client_user_agent, fbp: data.fbp, fbc: data.fbc })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/lead] erro:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
