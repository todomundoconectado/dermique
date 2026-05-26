import { NextRequest, NextResponse } from 'next/server'

const GA4_MEASUREMENT_ID = 'G-3P9KGMT9YE'

export async function POST(req: NextRequest) {
  try {
    const api_secret = process.env.GA4_API_SECRET
    if (!api_secret) return NextResponse.json({ ok: false, error: 'GA4_API_SECRET not configured' }, { status: 500 })

    const data = await req.json()
    const { event_name, lead_id, valor } = data

    let event: Record<string, unknown> | null = null

    if (event_name === 'Purchase') {
      event = {
        name: 'purchase',
        params: { currency: 'BRL', value: valor || 0, transaction_id: lead_id, engagement_time_msec: 100 },
      }
    } else if (event_name === 'QualifiedLead') {
      event = { name: 'qualified_lead', params: { engagement_time_msec: 100 } }
    } else if (event_name === 'DisqualifiedLead') {
      event = { name: 'disqualified_lead', params: { engagement_time_msec: 100 } }
    }

    if (!event) return NextResponse.json({ ok: false, error: 'unknown event' }, { status: 400 })

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${api_secret}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: lead_id || `server_${Date.now()}`, events: [event] }),
    })

    if (!res.ok) console.error('[GA4 MP]', res.status, await res.text())
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/ga4]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
