'use client'
import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

type Step = 1 | 2

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || ''

export default function LeadForm({ origem = 'pagina-leads' }: { origem?: string }) {
  const [step, setStep] = useState<Step>(1)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [saving, setSaving] = useState(false)
  const searchParams = useSearchParams()
  const leadId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`)

  function maskPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  function tracking() {
    return {
      pagina: window.location.href,
      data_hora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      utm_source: searchParams.get('utm_source') || 'direto',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      utm_content: searchParams.get('utm_content') || '',
      origem,
    }
  }

  function post(payload: Record<string, string>) {
    return fetch(SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }

  function capi(event_name: string) {
    const fbp = document.cookie.match(/_fbp=([^;]+)/)?.[1] || ''
    const fbc = document.cookie.match(/_fbc=([^;]+)/)?.[1] || ''
    return fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name, lead_id: leadId.current, telefone, nome, pagina: window.location.href, fbp, fbc }),
    }).catch(() => {})
  }

  async function advanceFromStep2() {
    if (!telefone.trim()) return
    setSaving(true)
    await post({ action: 'create', lead_id: leadId.current, nome, telefone, ...tracking() })
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'Lead', {}, { eventID: leadId.current })
    }
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'generate_lead')
    }
    await capi('Lead')
    sessionStorage.setItem('lead_data', JSON.stringify({ lead_id: leadId.current, telefone, nome }))
    setSaving(false)
    window.location.href = `/obrigado?${new URLSearchParams({ nome }).toString()}`
  }

  const progress = (step / 2) * 100

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Passo {step} de 2</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1">
          <div className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#c9a96e' }} />
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Qual é o seu nome?</h2>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && nome.trim() && setStep(2)}
            placeholder="Seu nome" autoFocus autoComplete="name"
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all text-gray-900 placeholder-gray-400" />
          <button onClick={() => setStep(2)} disabled={!nome.trim()}
            style={{ backgroundColor: '#c9a96e' }}
            className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all">
            Continuar →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-gray-400 text-sm">Olá, {nome}!</p>
          <h2 className="text-xl font-semibold text-gray-900">Qual é o seu WhatsApp?</h2>
          <input type="tel" value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))}
            onKeyDown={e => e.key === 'Enter' && !saving && advanceFromStep2()}
            placeholder="(00) 00000-0000" autoFocus autoComplete="tel" inputMode="numeric" maxLength={16}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all text-gray-900 placeholder-gray-400" />
          <button onClick={advanceFromStep2} disabled={!telefone.trim() || saving}
            style={{ backgroundColor: '#c9a96e' }}
            className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all">
            {saving ? 'Salvando...' : 'Continuar →'}
          </button>
        </div>
      )}
    </div>
  )
}
