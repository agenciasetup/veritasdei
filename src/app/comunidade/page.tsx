'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { MessageSquare, Heart, Share2, Users, Bell, Flame, BookOpen, Church } from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'

const SAMPLE_POSTS = [
  {
    id: 1,
    author: 'Pe. João Paulo',
    vocacao: 'padre',
    time: 'há 2 horas',
    content: 'Hoje celebramos a memória de São João Maria Vianney, padroeiro dos sacerdotes. Que seu exemplo de dedicação ao confessionário nos inspire a buscar sempre o Sacramento da Reconciliação.',
    likes: 47,
    comments: 12,
    tag: 'Santos',
  },
  {
    id: 2,
    author: 'Maria Clara',
    vocacao: 'leigo',
    time: 'há 4 horas',
    content: 'Acabei de terminar a trilha de Mariologia aqui no Veritas Dei! Recomendo muito para quem quer se aprofundar na devoção à Nossa Senhora. A parte sobre os dogmas marianos é incrível.',
    likes: 23,
    comments: 5,
    tag: 'Testemunho',
  },
  {
    id: 3,
    author: 'Diác. Marcos',
    vocacao: 'diacono',
    time: 'há 6 horas',
    content: '"Não vos conformeis com este mundo, mas transformai-vos pela renovação da vossa mente." (Rm 12,2)\n\nQue possamos ser sal e luz neste mundo.',
    likes: 89,
    comments: 18,
    tag: 'Escritura',
  },
]

export default function ComunidadePage() {
  return (
    <AuthGuard>
      <ComunidadeContent />
    </AuthGuard>
  )
}

function ComunidadeContent() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold tracking-wider uppercase mb-2"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Comunidade
          </h1>
          <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Conecte-se com católicos de todo o Brasil
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(107,29,42,0.08) 100%)',
            border: '1px solid rgba(201,168,76,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <Users className="w-8 h-8" style={{ color: '#C9A84C' }} />
          </div>
          <h2
            className="text-xl font-bold tracking-wider uppercase mb-2"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
          >
            Em Breve
          </h2>
          <p
            className="text-sm leading-relaxed max-w-md mx-auto mb-6"
            style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
          >
            Estamos construindo a maior comunidade católica digital do Brasil.
            Em breve você poderá compartilhar reflexões, testemunhos e se conectar com outros fiéis.
          </p>

          {/* Feature preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {[
              { icon: MessageSquare, label: 'Reflexões' },
              { icon: Heart, label: 'Testemunhos' },
              { icon: BookOpen, label: 'Estudos' },
              { icon: Church, label: 'Paróquias' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 p-3 rounded-xl"
                style={{
                  background: 'rgba(10,10,10,0.5)',
                  border: '1px solid rgba(201,168,76,0.08)',
                }}
              >
                <Icon className="w-5 h-5" style={{ color: '#C9A84C' }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Feed */}
        <h3
          className="text-xs tracking-[0.15em] uppercase mb-4"
          style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}
        >
          Prévia do Feed
        </h3>

        <div className="space-y-4">
          {SAMPLE_POSTS.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl p-5 md:p-6 transition-all"
              style={{
                background: 'rgba(16,16,16,0.75)',
                border: '1px solid rgba(201,168,76,0.1)',
                opacity: 0.7,
              }}
            >
              {/* Post header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
                >
                  <CrossIcon size="sm" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium block" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                    {post.author}
                  </span>
                  <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                    {post.time}
                  </span>
                </div>
                <span
                  className="text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {post.tag}
                </span>
              </div>

              {/* Post content */}
              <p
                className="text-sm leading-relaxed mb-4 whitespace-pre-line"
                style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
              >
                {post.content}
              </p>

              {/* Post actions */}
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7368' }}>
                  <Heart className="w-4 h-4" />
                  {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7368' }}>
                  <MessageSquare className="w-4 h-4" />
                  {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-xs" style={{ color: '#7A7368' }}>
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Notify me */}
        <div className="text-center mt-8 mb-4">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
            style={{
              fontFamily: 'Cinzel, serif',
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: '#0A0A0A',
            }}
          >
            <Bell className="w-4 h-4" />
            Quero ser avisado
          </button>
          <p className="text-xs mt-3" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Receba uma notificação quando a comunidade estiver disponível
          </p>
        </div>
      </div>
    </div>
  )
}
