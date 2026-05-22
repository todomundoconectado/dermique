import { Suspense } from 'react'
import ObrigadoContent from './ObrigadoContent'

export default function Obrigado() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Suspense>
        <ObrigadoContent />
      </Suspense>
    </main>
  )
}
