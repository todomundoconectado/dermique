import { Suspense } from 'react'
import Image from 'next/image'
import LeadForm from '@/components/LeadForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Image src="/DMQ-Logo-Rgb_13.png" alt="Dermique" width={200} height={80} priority className="object-contain" />
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Suspense>
            <LeadForm origem="pagina-leads" />
          </Suspense>
        </div>
        <p className="text-xs text-gray-400">
          Ao enviar, você concorda com nossa{' '}
          <a href="/politica-de-privacidade" className="underline hover:text-gray-600 transition-colors">
            Política de Privacidade
          </a>
        </p>
      </div>
    </main>
  )
}
