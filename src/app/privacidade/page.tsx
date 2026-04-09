import Link from 'next/link'

export const metadata = {
  title: 'Politica de Privacidade | Veritas Dei',
  description: 'Politica de Privacidade do aplicativo Veritas Dei.',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen px-4 py-16 flex justify-center" style={{ background: '#0A0A0A' }}>
      <article className="max-w-3xl w-full">
        <Link
          href="/"
          className="inline-block mb-8 text-sm transition-colors hover:opacity-80"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          &larr; Voltar ao inicio
        </Link>

        <h1
          className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Politica de Privacidade
        </h1>
        <p className="text-sm mb-10" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Ultima atualizacao: 09 de abril de 2026
        </p>

        <div className="space-y-8" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', lineHeight: 1.8 }}>
          <Section title="1. Introducao">
            <p>
              A <strong style={{ color: '#C9A84C' }}>Veritas Dei</strong> (&quot;nos&quot;, &quot;nosso&quot; ou &quot;aplicativo&quot;) e uma plataforma
              de referencia catolica dedicada a promover o conhecimento da fe. Esta Politica de Privacidade descreve como
              coletamos, usamos, armazenamos e protegemos suas informacoes pessoais quando voce utiliza nossos servicos.
            </p>
            <p>
              Ao acessar ou utilizar o Veritas Dei, voce concorda com as praticas descritas nesta politica. Caso nao concorde
              com algum dos termos, pedimos que nao utilize o aplicativo.
            </p>
          </Section>

          <Section title="2. Dados que Coletamos">
            <p>Coletamos os seguintes tipos de informacoes:</p>
            <h4 className="font-semibold mt-4 mb-2" style={{ color: '#F2EDE4' }}>2.1 Dados fornecidos por voce</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome completo e endereco de e-mail (no cadastro)</li>
              <li>Informacoes de perfil: paroquia, diocese, vocacao, sacramentos recebidos</li>
              <li>Foto de perfil (avatar), caso voce opte por enviar</li>
              <li>Cidade, estado e pais de residencia</li>
              <li>Links de redes sociais (opcionals)</li>
            </ul>

            <h4 className="font-semibold mt-4 mb-2" style={{ color: '#F2EDE4' }}>2.2 Dados coletados automaticamente</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Endereco IP e informacoes do navegador</li>
              <li>Dados de uso: paginas visitadas, funcionalidades utilizadas, tempo de sessao</li>
              <li>Cookies essenciais para manter sua sessao autenticada</li>
            </ul>

            <h4 className="font-semibold mt-4 mb-2" style={{ color: '#F2EDE4' }}>2.3 Dados de autenticacao via terceiros</h4>
            <p>
              Se voce optar por se autenticar via Google, Facebook ou Apple, recebemos seu nome, e-mail e foto de perfil
              conforme disponibilizado pelo provedor. Nao armazenamos suas senhas de terceiros.
            </p>
          </Section>

          <Section title="3. Como Utilizamos seus Dados">
            <p>Seus dados pessoais sao utilizados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criar e manter sua conta no aplicativo</li>
              <li>Personalizar sua experiencia com base em sua vocacao e sacramentos</li>
              <li>Exibir estatisticas agregadas da comunidade (contadores anonimos)</li>
              <li>Permitir a verificacao de perfis de clerigos (padres, diaconos, bispos)</li>
              <li>Enviar comunicacoes relacionadas ao servico (confirmacao de conta, recuperacao de senha)</li>
              <li>Melhorar e desenvolver novas funcionalidades</li>
              <li>Garantir a seguranca e integridade da plataforma</li>
            </ul>
          </Section>

          <Section title="4. Compartilhamento de Dados">
            <p>
              <strong style={{ color: '#F2EDE4' }}>Nao vendemos, alugamos ou compartilhamos</strong> suas informacoes pessoais
              com terceiros para fins comerciais ou de marketing.
            </p>
            <p>Podemos compartilhar dados nas seguintes situacoes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong style={{ color: '#F2EDE4' }}>Provedores de servico:</strong> Utilizamos o Supabase como infraestrutura
                de backend e autenticacao, e a Vercel para hospedagem. Esses provedores acessam dados conforme necessario
                para operar o servico.</li>
              <li><strong style={{ color: '#F2EDE4' }}>Obrigacao legal:</strong> Quando exigido por lei, ordem judicial ou
                autoridade competente.</li>
              <li><strong style={{ color: '#F2EDE4' }}>Protecao de direitos:</strong> Para proteger nossos direitos, seguranca
                ou propriedade, e os de nossos usuarios.</li>
            </ul>
          </Section>

          <Section title="5. Armazenamento e Seguranca">
            <p>
              Seus dados sao armazenados em servidores seguros fornecidos pela Supabase (infraestrutura AWS), com
              criptografia em transito (TLS/SSL) e em repouso. Senhas sao armazenadas com hash bcrypt e nunca sao
              acessiveis em texto puro.
            </p>
            <p>
              Implementamos medidas tecnicas e organizacionais para proteger suas informacoes contra acesso nao
              autorizado, alteracao, divulgacao ou destruicao. No entanto, nenhum sistema e 100% seguro, e nao podemos
              garantir seguranca absoluta.
            </p>
          </Section>

          <Section title="6. Seus Direitos (LGPD)">
            <p>
              Em conformidade com a Lei Geral de Protecao de Dados (Lei 13.709/2018), voce tem direito a:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong style={{ color: '#F2EDE4' }}>Acesso:</strong> Solicitar uma copia dos dados pessoais que temos sobre voce</li>
              <li><strong style={{ color: '#F2EDE4' }}>Correcao:</strong> Corrigir dados incompletos ou desatualizados</li>
              <li><strong style={{ color: '#F2EDE4' }}>Exclusao:</strong> Solicitar a exclusao de seus dados pessoais</li>
              <li><strong style={{ color: '#F2EDE4' }}>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong style={{ color: '#F2EDE4' }}>Revogacao do consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
              <li><strong style={{ color: '#F2EDE4' }}>Oposicao:</strong> Opor-se ao tratamento de dados em determinadas circunstancias</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato pelo e-mail:{' '}
              <strong style={{ color: '#C9A84C' }}>privacidade@veritasdei.com.br</strong>
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              Utilizamos apenas cookies essenciais para manter sua sessao autenticada e garantir o funcionamento
              correto do aplicativo. Nao utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.
            </p>
          </Section>

          <Section title="8. Menores de Idade">
            <p>
              O Veritas Dei nao e direcionado a menores de 13 anos. Nao coletamos intencionalmente dados de
              criancas. Caso identifiquemos que um menor cadastrou-se sem consentimento dos responsaveis,
              excluiremos os dados imediatamente.
            </p>
          </Section>

          <Section title="9. Alteracoes nesta Politica">
            <p>
              Podemos atualizar esta Politica de Privacidade periodicamente. Alteracoes significativas serao
              comunicadas por meio do aplicativo ou por e-mail. A data de ultima atualizacao sera sempre
              exibida no topo deste documento.
            </p>
          </Section>

          <Section title="10. Contato">
            <p>
              Se voce tiver duvidas, sugestoes ou reclamacoes sobre esta Politica de Privacidade, entre em contato:
            </p>
            <div className="mt-3 p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <p><strong style={{ color: '#F2EDE4' }}>Veritas Dei</strong></p>
              <p>E-mail: privacidade@veritasdei.com.br</p>
              <p>Responsavel: Equipe Veritas Dei</p>
            </div>
          </Section>
        </div>

        <div className="mt-16 pt-8" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p className="text-xs text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            &copy; 2026 Veritas Dei. Todos os direitos reservados.
          </p>
        </div>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-lg font-bold tracking-wider uppercase mb-4"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
