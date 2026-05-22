export default function PoliticaDePrivacidade() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
        <div className="flex flex-col gap-5 text-gray-600 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-800 mb-1">1. Informações coletadas</h2>
            <p>Coletamos nome e número de WhatsApp fornecidos voluntariamente no formulário de contato, além de informações de origem do acesso (página visitada, data e hora do envio).</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-800 mb-1">2. Como usamos suas informações</h2>
            <p>Os dados coletados são utilizados exclusivamente para entrar em contato com você e apresentar nossos serviços. Não compartilhamos suas informações com terceiros.</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-800 mb-1">3. Armazenamento</h2>
            <p>Suas informações são armazenadas em ambiente seguro e utilizadas somente pela equipe de atendimento.</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-800 mb-1">4. Seus direitos</h2>
            <p>Você pode solicitar a exclusão dos seus dados a qualquer momento pelo nosso WhatsApp.</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-800 mb-1">5. Contato</h2>
            <p>Dúvidas sobre esta política? Fale conosco pelo WhatsApp.</p>
          </section>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Voltar ao formulário</a>
        </div>
      </div>
    </main>
  )
}
