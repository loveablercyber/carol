import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Heart, CalendarCheck } from 'lucide-react'

const testimonials = [
  {
    id: 'resultado-1',
    title: 'Mega Hair Natural com Volume',
    description: 'Aplicação com acabamento invisível e fios bio orgânicos.',
    before: '/images/antes1.png',
    after: '/images/depois1.png',
    quote: '“Eu sempre tive medo de alongamento, mas o resultado ficou super natural. Me senti linda e segura!”',
    client: 'Camila, Bauru - SP',
  },
  {
    id: 'resultado-2',
    title: 'Transformação Completa',
    description: 'Alongamento com ajuste de cor e tratamento de brilho.',
    before: '/images/antes2.png',
    after: '/images/depois2.png',
    quote: '“A textura ficou leve e o cabelo virou outro! Atendimento carinhoso do início ao fim.”',
    client: 'Renata, Bauru - SP',
  },
]

export default function DepoimentosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-[#FFF7FB] to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <span className="font-display font-bold text-xl text-foreground">Resultados Reais</span>
          <div className="w-10" />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Antes & Depois</span>
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
            Depoimentos e Transformações
          </h1>
          <p className="text-lg text-muted-foreground">
            Resultados reais de clientes atendidas com técnicas de mega hair, alinhamento e cuidado capilar.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">{item.title}</h2>
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-pink-700 bg-pink-50 px-3 py-2 rounded-full">
                  <Heart className="w-4 h-4" />
                  Resultado aprovado
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl overflow-hidden border border-pink-100 bg-pink-50">
                  <div className="px-4 py-2 text-xs font-semibold text-pink-700">Antes</div>
                  <div className="relative w-full h-72 md:h-80">
                    <Image
                      src={item.before}
                      alt={`${item.title} - Antes`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-pink-100 bg-pink-50">
                  <div className="px-4 py-2 text-xs font-semibold text-pink-700">Depois</div>
                  <div className="relative w-full h-72 md:h-80">
                    <Image
                      src={item.after}
                      alt={`${item.title} - Depois`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-pink-50 rounded-xl p-4 border border-pink-100">
                <p className="text-sm text-foreground italic">{item.quote}</p>
                <p className="text-xs text-muted-foreground mt-2">— {item.client}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] text-white rounded-2xl p-8 text-center shadow-xl">
          <h2 className="font-display font-bold text-3xl mb-3">Quer viver sua transformação?</h2>
          <p className="text-base mb-6">
            Agende uma avaliação personalizada e descubra o melhor método para o seu cabelo.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition"
          >
            <CalendarCheck className="w-5 h-5" />
            Agendar atendimento
          </Link>
        </div>
      </section>
    </main>
  )
}
