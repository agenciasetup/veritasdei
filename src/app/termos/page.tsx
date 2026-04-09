import Link from 'next/link'

export const metadata = {
  title: 'Termos de Servico | Veritas Dei',
  description: 'Termos de Servico do aplicativo Veritas Dei.',
}

export default function TermosPage() {
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
          Termos de Servico
        </h1>
        <p className="text-sm mb-10" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Ultima atualizacao: 09 de abril de 2026
        </p>

        <div className="space-y-8" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', lineHeight: 1.8 }}>
          <Section title="1. Aceitacao dos Termos">
            <p>
              Ao acessar ou utilizar o <strong style={{ color: '#C9A84C' }}>Veritas Dei</strong> (&quot;aplicativo&quot;, &quot;plataforma&quot;
              ou &quot;servico&quot;), voce declara que leu, compreendeu e concorda com estes Termos de Servico. Caso nao concorde
              com algum dos termos aqui dispostos, voce devera cessar imediatamente o uso do aplicativo.
            </p>
            <p>
              Estes termos constituem um acordo juridico vinculante entre voce (&quot;usuario&quot;) e a equipe do Veritas Dei
              (&quot;nos&quot;, &quot;nosso&quot;).
            </p>
          </Section>

          <Section title="2. Descricao do Servico">
            <p>
              O Veritas Dei e uma plataforma digital de referencia catolica que oferece acesso a conteudos como:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dogmas da fe catolica</li>
              <li>Sacramentos e seus significados</li>
              <li>Oracoes tradicionais e contemporaneas</li>
              <li>Mandamentos e preceitos da Igreja</li>
              <li>Obras de misericordia e virtudes</li>
              <li>Trilhas de formacao e catequese</li>
              <li>Perfil personalizado com informacoes de vocacao e sacramentos recebidos</li>
            </ul>
            <p>
              O aplicativo e oferecido &quot;como esta&quot; e podera ser atualizado, modificado ou descontinuado
              a qualquer momento, sem aviso previo.
            </p>
          </Section>

          <Section title="3. Cadastro e Conta">
            <h4 className="font-semibold mt-4 mb-2" style={{ color: '#F2EDE4' }}>3.1 Requisitos</h4>
            <p>
              Para utilizar o Veritas Dei, voce deve ter no minimo 13 anos de idade. Ao criar uma conta, voce
              declara que as informacoes fornecidas sao verdadeiras, precisas e completas.
            </p>

            <h4 className="font-semibold mt-4 mb-2" style={{ color: '#F2EDE4' }}>3.2 Seguranca da Conta</h4>
            <p>
              Voce e responsavel por manter a confidencialidade de suas credenciais de acesso (e-mail e senha).
              Qualquer atividade realizada em sua conta sera de sua responsabilidade. Caso suspeite de acesso
              nao autorizado, entre em contato imediatamente.
            </p>

            <h4 className="font-semibold mt-4 mb-2" style={{ color: '#F2EDE4' }}>3.3 Autenticacao via Terceiros</h4>
            <p>
              O aplicativo permite autenticacao via Google, Facebook e Apple. Ao utilizar esses servicos, voce
              tambem esta sujeito aos termos e politicas de privacidade de cada provedor.
            </p>
          </Section>

          <Section title="4. Planos e Assinaturas">
            <p>O Veritas Dei oferece os seguintes planos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong style={{ color: '#F2EDE4' }}>Gratuito:</strong> Acesso basico ao conteudo de referencia catolica,
                incluindo dogmas, oracoes, sacramentos e mandamentos.</li>
              <li><strong style={{ color: '#F2EDE4' }}>Estudos:</strong> Acesso completo a trilhas de formacao, conteudos
                exclusivos e ferramentas avancadas de estudo.</li>
            </ul>
            <p>
              Os valores, beneficios e condicoes de cada plano estao disponiveis na pagina de planos do aplicativo.
              Reservamo-nos o direito de alterar precos e beneficios com aviso previo de 30 dias.
            </p>
          </Section>

          <Section title="5. Funcoes e Verificacao de Clerigos">
            <p>
              O Veritas Dei permite que usuarios se identifiquem por vocacao (Leigo, Catequista, Diacono, Padre,
              Bispo, Cardeal). Perfis que se identifiquem como clerigos (Diacono, Padre, Bispo, Cardeal) estao
              sujeitos a verificacao manual pela equipe administradora.
            </p>
            <p>
              Declarar-se falsamente como clerigo e uma violacao grave destes termos e resultara em suspensao
              ou exclusao permanente da conta.
            </p>
          </Section>

          <Section title="6. Regras de Uso">
            <p>Ao utilizar o Veritas Dei, voce concorda em:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nao utilizar o aplicativo para fins ilegais ou contrarios a moral crista</li>
              <li>Nao publicar conteudo ofensivo, difamatorio, herege ou que promova odio</li>
              <li>Nao tentar acessar contas de outros usuarios</li>
              <li>Nao utilizar bots, scrapers ou ferramentas automatizadas para extrair conteudo</li>
              <li>Nao falsificar sua identidade, vocacao ou qualquer informacao do perfil</li>
              <li>Respeitar os demais membros da comunidade, tratando todos com caridade crista</li>
              <li>Nao reproduzir, distribuir ou comercializar conteudo do aplicativo sem autorizacao</li>
            </ul>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              Todo o conteudo disponibilizado no Veritas Dei, incluindo textos, design, logotipos, icones e
              estrutura da plataforma, e protegido por direitos autorais e propriedade intelectual.
            </p>
            <p>
              Os conteudos doutrinais (dogmas, catecismo, oracoes tradicionais) pertencem ao patrimonio da
              Igreja Catolica e sao reproduzidos com finalidade educacional e pastoral. Demais conteudos
              originais sao de propriedade exclusiva do Veritas Dei.
            </p>
          </Section>

          <Section title="8. Limitacao de Responsabilidade">
            <p>O Veritas Dei:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nao substitui orientacao espiritual, pastoral ou teologica presencial</li>
              <li>Nao se responsabiliza por interpretacoes individuais dos conteudos disponibilizados</li>
              <li>Nao garante disponibilidade ininterrupta do servico</li>
              <li>Nao se responsabiliza por perdas decorrentes do uso ou impossibilidade de uso do aplicativo</li>
              <li>Nao endossa necessariamente opinioes expressas por usuarios na plataforma</li>
            </ul>
            <p>
              O conteudo do aplicativo tem carater informativo e educacional, baseado no Magistério da
              Igreja Catolica. Para questoes de fe e moral, consulte sempre um sacerdote ou diretor espiritual.
            </p>
          </Section>

          <Section title="9. Suspensao e Encerramento">
            <p>
              Reservamo-nos o direito de suspender ou encerrar sua conta, sem aviso previo, caso:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Voce viole qualquer disposicao destes Termos de Servico</li>
              <li>Suas acoes prejudiquem outros usuarios ou a integridade da plataforma</li>
              <li>Seja detectada atividade fraudulenta ou maliciosa em sua conta</li>
            </ul>
            <p>
              Voce pode encerrar sua conta a qualquer momento atraves das configuracoes do perfil ou entrando
              em contato com nossa equipe.
            </p>
          </Section>

          <Section title="10. Alteracoes nos Termos">
            <p>
              Podemos modificar estes Termos de Servico a qualquer momento. Alteracoes significativas serao
              comunicadas por meio do aplicativo ou por e-mail com antecedencia minima de 15 dias. O uso
              continuado do aplicativo apos as alteracoes constitui aceitacao dos novos termos.
            </p>
          </Section>

          <Section title="11. Legislacao Aplicavel">
            <p>
              Estes Termos de Servico sao regidos pelas leis da Republica Federativa do Brasil. Qualquer
              disputa sera submetida ao foro da comarca de domicilio do usuario, conforme previsto no
              Codigo de Defesa do Consumidor (Lei 8.078/1990).
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Para duvidas, sugestoes ou reclamacoes sobre estes Termos de Servico:
            </p>
            <div className="mt-3 p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <p><strong style={{ color: '#F2EDE4' }}>Veritas Dei</strong></p>
              <p>E-mail: contato@veritasdei.com.br</p>
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
