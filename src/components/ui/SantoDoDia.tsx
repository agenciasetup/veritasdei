'use client'

import { useMemo } from 'react'
import { Crown, Calendar, BookOpen } from 'lucide-react'

interface Santo {
  nome: string
  titulo: string
  data: string // MM-DD
  resumo: string
  citacao?: string
}

// Sample saints for each day of the year (abbreviated - key saints)
const SANTOS: Santo[] = [
  { nome: 'Maria, Mãe de Deus', titulo: 'Solenidade', data: '01-01', resumo: 'A Santíssima Virgem Maria, Mãe de Deus e da Igreja, é celebrada no primeiro dia do ano como sinal de esperança.' },
  { nome: 'São Basílio Magno', titulo: 'Doutor da Igreja', data: '01-02', resumo: 'Bispo de Cesareia, grande defensor da fé contra o arianismo e pai da vida monástica no Oriente.' },
  { nome: 'Santa Genoveva', titulo: 'Padroeira de Paris', data: '01-03', resumo: 'Virgem consagrada que protegeu Paris dos hunos pela força da oração e penitência.' },
  { nome: 'São Tomás de Aquino', titulo: 'Doutor Angélico', data: '01-28', resumo: 'O maior teólogo da Igreja, autor da Suma Teológica, unindo fé e razão na mais alta expressão filosófica cristã.' },
  { nome: 'São José', titulo: 'Esposo da Virgem Maria', data: '03-19', resumo: 'Pai adotivo de Jesus e protetor da Sagrada Família. Modelo de silêncio, obediência e trabalho.', citacao: '"José, filho de Davi, não temas receber Maria, tua esposa." — Mt 1,20' },
  { nome: 'São Jorge', titulo: 'Mártir', data: '04-23', resumo: 'Soldado romano e mártir da fé, símbolo de coragem e combate espiritual contra o mal.' },
  { nome: 'Santo Antônio de Pádua', titulo: 'Doutor Evangélico', data: '06-13', resumo: 'Franciscano português, pregador eloquente e taumaturgo. Um dos santos mais populares do mundo.' },
  { nome: 'São Pedro e São Paulo', titulo: 'Apóstolos', data: '06-29', resumo: 'As duas colunas da Igreja: Pedro, a rocha; Paulo, o apóstolo dos gentios.' },
  { nome: 'São Bento de Núrsia', titulo: 'Pai do Monaquismo Ocidental', data: '07-11', resumo: 'Fundador da Ordem Beneditina e autor da Regra de São Bento: "Ora et Labora".' },
  { nome: 'Nossa Senhora do Carmo', titulo: 'Rainha do Carmelo', data: '07-16', resumo: 'Devoção carmelita à Virgem Maria, que prometeu o escapulário como sinal de salvação.' },
  { nome: 'Santa Maria Madalena', titulo: 'Apóstola dos Apóstolos', data: '07-22', resumo: 'Primeira testemunha da Ressurreição, modelo de conversão e amor a Cristo.' },
  { nome: 'São Tiago Maior', titulo: 'Apóstolo', data: '07-25', resumo: 'Um dos doze apóstolos, primeiro mártir entre eles. Padroeiro da Espanha e dos peregrinos.' },
  { nome: 'São Domingos de Gusmão', titulo: 'Fundador dos Dominicanos', data: '08-08', resumo: 'Fundou a Ordem dos Pregadores e propagou a devoção do Santo Rosário.' },
  { nome: 'Nossa Senhora da Assunção', titulo: 'Dogma Mariano', data: '08-15', resumo: 'A gloriosa Assunção de Maria ao Céu em corpo e alma, dogma proclamado em 1950 por Pio XII.' },
  { nome: 'Santa Rosa de Lima', titulo: 'Primeira santa das Américas', data: '08-23', resumo: 'Virgem dominicana peruana, modelo de penitência e vida mística na América Latina.' },
  { nome: 'Santo Agostinho', titulo: 'Doutor da Graça', data: '08-28', resumo: 'Bispo de Hipona, convertido por Santa Mônica. Autor das Confissões e A Cidade de Deus.', citacao: '"Fizeste-nos para Ti, Senhor, e o nosso coração está inquieto enquanto não repousa em Ti."' },
  { nome: 'Nossa Senhora Aparecida', titulo: 'Padroeira do Brasil', data: '10-12', resumo: 'A Imaculada Conceição aparecida nas águas do Rio Paraíba, padroeira e Rainha do Brasil.' },
  { nome: 'Santa Teresa de Ávila', titulo: 'Doutora da Igreja', data: '10-15', resumo: 'Reformadora do Carmelo, mística e escritora. Autora de "O Castelo Interior" e "Caminho de Perfeição".' },
  { nome: 'São Francisco de Assis', titulo: 'O Poverello', data: '10-04', resumo: 'Fundador dos franciscanos, o santo mais amado da cristandade. Recebeu os estigmas de Cristo.', citacao: '"Senhor, fazei-me instrumento de vossa paz."' },
  { nome: 'Todos os Santos', titulo: 'Solenidade', data: '11-01', resumo: 'Celebração de todos os santos conhecidos e desconhecidos que alcançaram a glória do Céu.' },
  { nome: 'Santa Cecília', titulo: 'Padroeira dos Músicos', data: '11-22', resumo: 'Virgem e mártir romana, padroeira da música sacra e dos músicos.' },
  { nome: 'São Francisco Xavier', titulo: 'Padroeiro das Missões', data: '12-03', resumo: 'Jesuíta espanhol, missionário na Ásia. Batizou milhares no Japão, Índia e além.' },
  { nome: 'Nossa Senhora de Guadalupe', titulo: 'Padroeira das Américas', data: '12-12', resumo: 'Aparição da Virgem ao indígena Juan Diego no México, com a tilma milagrosa.' },
  { nome: 'Santa Teresinha do Menino Jesus', titulo: 'Doutora da Igreja', data: '10-01', resumo: 'Carmelita francesa do "Caminho da Infância Espiritual". Padroeira das missões.', citacao: '"Minha vocação é o Amor! No coração da Igreja, eu serei o Amor."' },
  { nome: 'São Pio de Pietrelcina', titulo: 'Padre Pio', data: '09-23', resumo: 'Capuchinho estigmatizado, confessor incansável e místico do século XX.' },
  { nome: 'São João Maria Vianney', titulo: 'Cura d\'Ars', data: '08-04', resumo: 'Padroeiro dos sacerdotes, modelo de santidade sacerdotal e vida dedicada ao confessionário.' },
  { nome: 'Imaculada Conceição', titulo: 'Dogma Mariano', data: '12-08', resumo: 'Solenidade do dogma que proclama que Maria foi concebida sem pecado original.' },
  { nome: 'Natividade do Senhor', titulo: 'Natal', data: '12-25', resumo: 'O Verbo se fez carne e habitou entre nós. Celebração do nascimento de Nosso Senhor Jesus Cristo.' },
]

function getSantoDoDia(): Santo {
  const now = new Date()
  const mesdia = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const santo = SANTOS.find(s => s.data === mesdia)
  if (santo) return santo

  // Fallback: pick based on day of year
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  return SANTOS[dayOfYear % SANTOS.length]
}

export default function SantoDoDia() {
  const santo = useMemo(() => getSantoDoDia(), [])

  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })

  return (
    <div
      className="rounded-2xl p-6 md:p-7 transition-all duration-300"
      style={{
        background: 'rgba(16,16,16,0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(201,168,76,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Date */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4" style={{ color: '#C9A84C' }} />
        <span
          className="text-xs tracking-wider uppercase"
          style={{ fontFamily: 'Poppins, sans-serif', color: '#7A7368' }}
        >
          {hoje}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <Crown className="w-5 h-5" style={{ color: '#C9A84C' }} />
        </div>
        <div>
          <h3
            className="text-xs tracking-[0.15em] uppercase mb-1"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Santo do Dia
          </h3>
          <h2
            className="text-lg font-bold leading-tight"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
          >
            {santo.nome}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            {santo.titulo}
          </p>
        </div>
      </div>

      {/* Description */}
      <p
        className="text-sm leading-relaxed mb-4"
        style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
      >
        {santo.resumo}
      </p>

      {/* Quote */}
      {santo.citacao && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(201,168,76,0.04)',
            borderLeft: '3px solid rgba(201,168,76,0.3)',
          }}
        >
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              color: '#D9C077',
              fontSize: '0.95rem',
            }}
          >
            {santo.citacao}
          </p>
        </div>
      )}
    </div>
  )
}
