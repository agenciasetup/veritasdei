import Link from 'next/link'
import {
  LegalDocumentShell,
  LegalSection,
  LegalSubheading,
  LegalHighlight,
  LegalCallout,
} from '@/components/legal/LegalDocumentShell'
import { LEGAL_OPERATOR } from '@/lib/legal/versions'

export const metadata = {
  title: 'Termos de Uso | Veritas Dei',
  description: 'Termos de Uso do aplicativo Veritas Dei.',
}

export default function TermosPage() {
  return (
    <LegalDocumentShell documentKey="terms" title="Termos de Uso">
      <LegalSection title="1. Quem somos e aceite dos termos">
        <p>
          O <LegalHighlight>Veritas Dei</LegalHighlight> (&quot;aplicativo&quot;, &quot;plataforma&quot;
          ou &quot;serviço&quot;) é uma plataforma digital católica que combina conteúdo devocional,
          ferramentas de formação, comunidade e assinatura paga. Estes Termos de Uso formam um contrato
          vinculante entre você (&quot;usuário&quot;) e a equipe operadora do Veritas Dei (&quot;nós&quot;).
        </p>
        <p>
          Ao criar uma conta, marcar o aceite no cadastro ou continuar usando o serviço, você declara que
          leu, compreendeu e concorda com estes Termos, com a{' '}
          <Link href="/privacidade" style={{ color: '#C9A84C' }}>
            Política de Privacidade
          </Link>{' '}
          e com as{' '}
          <Link href="/diretrizes" style={{ color: '#C9A84C' }}>
            Diretrizes da Comunidade
          </Link>
          . Se não concordar, não utilize o aplicativo.
        </p>
        <LegalCallout>
          <p>
            <LegalHighlight>Operador:</LegalHighlight> {LEGAL_OPERATOR.displayName} —{' '}
            {LEGAL_OPERATOR.legalStatus}.
          </p>
          <p>Contato geral: {LEGAL_OPERATOR.contactEmail}</p>
          <p>Encarregado (DPO): {LEGAL_OPERATOR.privacyEmail}</p>
          <p>Notificações extrajudiciais e judiciais: enviar para {LEGAL_OPERATOR.contactEmail}</p>
        </LegalCallout>
      </LegalSection>

      <LegalSection title="2. Definições">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <LegalHighlight>Plataforma</LegalHighlight>: aplicação web e PWA Veritas Dei, acessível em
            veritasdei.com.br e domínios correlatos.
          </li>
          <li>
            <LegalHighlight>Usuário</LegalHighlight>: pessoa física maior de 14 anos que cria conta e
            acessa a plataforma.
          </li>
          <li>
            <LegalHighlight>Conteúdo do Usuário</LegalHighlight>: qualquer texto, imagem, GIF, link,
            carta, intenção, pedido de oração, graça ou testemunho publicado pelo usuário.
          </li>
          <li>
            <LegalHighlight>Conteúdo Doutrinal</LegalHighlight>: orações, catecismos, textos bíblicos,
            vidas de santos e demais materiais do patrimônio da Igreja Católica reproduzidos na
            plataforma com finalidade educacional.
          </li>
          <li>
            <LegalHighlight>Clérigo Verificado</LegalHighlight>: usuário identificado como diácono,
            padre, bispo ou cardeal cuja condição foi confirmada manualmente pela equipe.
          </li>
          <li>
            <LegalHighlight>Paróquia Verificada</LegalHighlight>: perfil de instituição religiosa cuja
            titularidade foi comprovada por documento.
          </li>
          <li>
            <LegalHighlight>Assinatura</LegalHighlight>: plano pago que libera funcionalidades
            adicionais (trilhas de estudo, recursos de comunidade, etc.).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Quem pode usar o Veritas Dei">
        <LegalSubheading>3.1 Idade mínima</LegalSubheading>
        <p>
          É exigida idade mínima de <LegalHighlight>14 anos</LegalHighlight>. O cadastro de menores de
          14 é expressamente vedado. Se identificarmos conta de menor de 14, ela será excluída
          imediatamente sem aviso prévio.
        </p>

        <LegalSubheading>3.2 Consentimento parental (14 a 17 anos)</LegalSubheading>
        <p>
          Usuários com idade entre 14 e 17 anos completos somente poderão acessar as funcionalidades
          sociais, de comunidade, carta pessoal, pedido de oração, graça e assinatura paga após{' '}
          <LegalHighlight>
            consentimento expresso e específico de pelo menos um dos pais ou responsável legal
          </LegalHighlight>
          , na forma do art. 14, §1º, da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
        <p>
          O consentimento parental é coletado enviando-se um link assinado ao e-mail do responsável
          informado pelo menor. Enquanto não confirmado, a conta permanece em estado suspenso. O
          responsável pode revogar o consentimento a qualquer tempo pelo e-mail{' '}
          {LEGAL_OPERATOR.privacyEmail}.
        </p>

        <LegalSubheading>3.3 Veracidade das informações</LegalSubheading>
        <p>
          Ao se cadastrar, você declara que as informações fornecidas são verdadeiras, precisas e
          atuais. Declarações falsas, especialmente sobre vocação clerical ou condição de responsável
          legal, são violações graves e podem configurar o crime previsto no art. 299 do Código Penal
          (falsidade ideológica).
        </p>
      </LegalSection>

      <LegalSection title="4. Cadastro, conta e segurança">
        <LegalSubheading>4.1 Credenciais</LegalSubheading>
        <p>
          Você é responsável por manter em sigilo suas credenciais de acesso (e-mail e senha) e por
          toda atividade realizada em sua conta. Notifique-nos imediatamente caso suspeite de acesso
          não autorizado, em {LEGAL_OPERATOR.contactEmail}.
        </p>

        <LegalSubheading>4.2 Autenticação via terceiros</LegalSubheading>
        <p>
          A plataforma aceita login por Google, Facebook, Apple e Magic Link (link de acesso por
          e-mail). Ao optar por um desses provedores, você também se sujeita às políticas deles.
        </p>

        <LegalSubheading>4.3 Verificação de e-mail e segundo fator</LegalSubheading>
        <p>
          A confirmação do e-mail é requisito para funcionalidades sociais. Recomendamos fortemente
          ativar a autenticação em dois fatores (2FA) quando disponível.
        </p>

        <LegalSubheading>4.4 Uma conta por pessoa</LegalSubheading>
        <p>
          É vedado compartilhar credenciais, revender acesso ou operar múltiplas contas com intenção de
          contornar sanções. Contas criadas para evadir banimento anterior serão removidas.
        </p>
      </LegalSection>

      <LegalSection title="5. Descrição do serviço">
        <p>O Veritas Dei oferece, entre outras funcionalidades:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Referência católica: dogmas, sacramentos, mandamentos, preceitos, orações e santos.</li>
          <li>Liturgia diária, novenas, rosário individual e em grupos.</li>
          <li>Trilhas de formação e estudos (disponíveis em plano pago).</li>
          <li>
            Comunidade Veritas: feed público com posts, respostas, reposts, citações, curtidas,
            hashtags, menções, seguidores, silenciamento e bloqueio.
          </li>
          <li>Cartas privadas ao santo de devoção, intenções pessoais e pedidos públicos de oração.</li>
          <li>Graças recebidas: testemunhos públicos moderados antes de publicação.</li>
          <li>Cadastro e busca de paróquias com perfil público e verificação de titularidade.</li>
          <li>Recursos de inteligência artificial para explicação de passagens bíblicas e reflexão da liturgia.</li>
          <li>Geolocalização opcional para sugerir comunidades próximas.</li>
          <li>Notificações push para lembretes devocionais e eventos da comunidade.</li>
        </ul>
        <p>
          O serviço é oferecido em caráter contínuo, podendo ser modificado, pausado ou descontinuado
          no todo ou em parte. Alterações relevantes serão comunicadas com antecedência razoável.
        </p>
      </LegalSection>

      <LegalSection title="6. Conteúdo do Usuário e licença de uso">
        <LegalSubheading>6.1 Titularidade</LegalSubheading>
        <p>
          Você mantém a titularidade de todo Conteúdo do Usuário que publicar. Para que possamos
          operar a plataforma, você nos concede uma <LegalHighlight>licença não-exclusiva, gratuita,
          mundial, revogável pela exclusão do conteúdo</LegalHighlight>, para armazenar, exibir,
          transmitir, reproduzir tecnicamente e gerar versões derivadas estritamente operacionais
          (miniaturas, pré-visualizações, compressões), enquanto o conteúdo permanecer na plataforma.
        </p>

        <LegalSubheading>6.2 Responsabilidade pelo que você publica</LegalSubheading>
        <p>
          Você é o único responsável pelo Conteúdo do Usuário que publicar, inclusive pelo respeito a
          direitos autorais, direito de imagem, privacidade de terceiros e legislação aplicável. Ao
          publicar, você declara possuir os direitos necessários e que o conteúdo não viola estes
          Termos nem as{' '}
          <Link href="/diretrizes" style={{ color: '#C9A84C' }}>
            Diretrizes da Comunidade
          </Link>
          .
        </p>

        <LegalSubheading>6.3 Remoção</LegalSubheading>
        <p>
          Você pode excluir seu conteúdo a qualquer momento. A exclusão remove o conteúdo da visão
          pública imediatamente; cópias em backups operacionais podem persistir por até 30 dias por
          razões técnicas, sem circulação pública.
        </p>

        <LegalSubheading>6.4 Conteúdo proibido</LegalSubheading>
        <p>
          Conteúdo em violação das{' '}
          <Link href="/diretrizes" style={{ color: '#C9A84C' }}>
            Diretrizes da Comunidade
          </Link>{' '}
          pode ser removido sem aviso prévio. Categorias de{' '}
          <LegalHighlight>tolerância zero</LegalHighlight> (pornografia, nudez, teor sexual, links
          pornográficos, exploração infantil, discurso de ódio, ameaças, doxxing) resultam em banimento
          imediato e, quando cabível, comunicação às autoridades competentes.
        </p>
      </LegalSection>

      <LegalSection title="7. Conduta do usuário">
        <p>Ao usar o Veritas Dei, você concorda em não:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Publicar pornografia, nudez (total ou parcial), teor sexual, erotismo ou links a sites desse gênero.</li>
          <li>Divulgar conteúdo que exponha menores a risco, contenha imagem de criança sem consentimento do responsável ou configure aliciamento.</li>
          <li>Incitar ódio, violência, automutilação, suicídio ou qualquer forma de discriminação.</li>
          <li>Assediar, perseguir, ameaçar ou praticar stalking (Lei 14.132/2021) contra outros usuários.</li>
          <li>Divulgar dados pessoais de terceiros sem consentimento (doxxing).</li>
          <li>Impersonar clérigos, paróquias ou figuras públicas sem verificação oficial.</li>
          <li>Declarar falsamente condição clerical, religiosa, vocacional ou de responsável legal.</li>
          <li>Fazer proselitismo ativo de outras religiões (o diálogo respeitoso é permitido).</li>
          <li>Difundir heterodoxia deliberada contra o Magistério católico.</li>
          <li>Praticar simonia (venda de sacramentos, indulgências ou coisas sagradas).</li>
          <li>Aplicar golpes, fraudes, pirâmides, vaquinhas falsas ou uso indevido de nome de paróquias.</li>
          <li>Usar bots, scrapers ou automação para extrair conteúdo, contatar usuários ou inflar engajamento.</li>
          <li>Tentar acessar contas alheias, sistemas internos, banco de dados ou burlar medidas de segurança.</li>
          <li>Fazer engenharia reversa do serviço ou copiar a interface/elementos visuais proprietários.</li>
          <li>Utilizar a plataforma para atividades comerciais não autorizadas.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Verificação de clérigos e paróquias">
        <p>
          Perfis que se identifiquem como Diácono, Padre, Bispo, Cardeal ou Papa estão sujeitos a
          verificação manual da equipe. Perfis de paróquia exigem comprovante documental de
          titularidade, que é armazenado com acesso restrito e retenção limitada.
        </p>
        <p>
          Falsidade na declaração clerical ou de titularidade de paróquia resulta em exclusão
          permanente e pode ensejar responsabilização civil e criminal, inclusive por falsidade
          ideológica (CP, art. 299).
        </p>
      </LegalSection>

      <LegalSection title="9. Inteligência artificial e limitações">
        <p>
          Algumas funcionalidades usam inteligência artificial (provedor OpenAI) para produzir
          explicações bíblicas, reflexões litúrgicas e material de apoio. Esses resultados podem conter
          imprecisões ou interpretações não definitivas.
        </p>
        <p>
          O conteúdo gerado por IA tem <LegalHighlight>caráter informativo e educacional</LegalHighlight>,
          não substitui direção espiritual, confissão, catequese presencial ou aconselhamento
          pastoral. Em questões de fé e moral, consulte sempre um sacerdote.
        </p>
        <p>
          O texto que você envia a funcionalidades de IA é processado conforme descrito na Política de
          Privacidade. Não utilizamos seu conteúdo para treinar modelos próprios.
        </p>
      </LegalSection>

      <LegalSection title="10. Assinaturas, pagamentos e reembolso">
        <LegalSubheading>10.1 Planos</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <LegalHighlight>Gratuito:</LegalHighlight> acesso básico a conteúdo de referência.
          </li>
          <li>
            <LegalHighlight>Estudos (pago):</LegalHighlight> trilhas de formação, conteúdos exclusivos
            e ferramentas avançadas.
          </li>
        </ul>
        <p>
          Valores, periodicidades e benefícios estão na página de planos. Podemos alterar preços e
          benefícios com <LegalHighlight>aviso prévio de 30 dias</LegalHighlight>; mudanças não se
          aplicam a ciclos já pagos.
        </p>

        <LegalSubheading>10.2 Provedores de pagamento</LegalSubheading>
        <p>
          Processamos pagamentos por meio de Stripe e podemos utilizar provedores alternativos
          (Kirvano, Hotmart, Eduzz e similares). Os dados de cartão de crédito não são armazenados por
          nós — eles são tratados diretamente pelo provedor.
        </p>

        <LegalSubheading>10.3 Renovação automática</LegalSubheading>
        <p>
          Assinaturas são renovadas automaticamente ao fim do ciclo, salvo cancelamento pelo próprio
          usuário, que pode ser feito a qualquer tempo em {'"'}Perfil › Assinatura{'"'}. O cancelamento
          passa a valer ao fim do ciclo já pago.
        </p>

        <LegalSubheading>10.4 Direito de arrependimento (CDC art. 49)</LegalSubheading>
        <p>
          Você pode se arrepender da contratação em até <LegalHighlight>7 dias corridos</LegalHighlight>{' '}
          a contar da data da primeira cobrança, solicitando reembolso integral pelo e-mail{' '}
          {LEGAL_OPERATOR.contactEmail}, sem necessidade de justificativa. O estorno é feito na mesma
          forma de pagamento em até 10 dias úteis.
        </p>

        <LegalSubheading>10.5 Após o período de arrependimento</LegalSubheading>
        <p>
          Passados os 7 dias, não há reembolso proporcional, salvo em caso de falha de nossa parte na
          prestação do serviço. Cancelar impede cobranças futuras.
        </p>

        <LegalSubheading>10.6 Cobrança indevida</LegalSubheading>
        <p>
          Cobranças indevidas serão estornadas. Nos termos do parágrafo único do art. 42 do Código de
          Defesa do Consumidor, cobrança em má-fé gera direito a restituição em dobro.
        </p>
      </LegalSection>

      <LegalSection title="11. Moderação e sanções">
        <p>
          Aplicamos moderação por denúncia de usuários, por algoritmos automáticos e por revisão
          humana, conforme descrito nas{' '}
          <Link href="/diretrizes" style={{ color: '#C9A84C' }}>
            Diretrizes da Comunidade
          </Link>
          . Sanções possíveis:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Remoção do conteúdo com aviso (warn).</li>
          <li>Silenciamento temporário (mute por 24 horas).</li>
          <li>Suspensão (7 dias).</li>
          <li>Banimento permanente, inclusive bloqueio de novos cadastros usando o mesmo e-mail.</li>
        </ul>
        <p>
          Violações de tolerância zero (definidas nas Diretrizes) resultam em banimento imediato.
        </p>
        <p>
          Você tem <LegalHighlight>direito à apelação em até 7 dias</LegalHighlight>, pelo e-mail
          {' '}{LEGAL_OPERATOR.contactEmail}. A revisão é feita por membro da equipe diferente do que
          aplicou a sanção.
        </p>
      </LegalSection>

      <LegalSection title="12. Encerramento de conta">
        <p>
          Você pode encerrar sua conta a qualquer momento em {'"'}Perfil › Privacidade{'"'}. A exclusão
          respeita um período de graça de 30 dias, em que a conta fica oculta e pode ser restaurada.
          Após esse prazo, os dados são removidos conforme descrito na{' '}
          <Link href="/privacidade" style={{ color: '#C9A84C' }}>
            Política de Privacidade
          </Link>
          .
        </p>
        <p>
          Podemos suspender ou encerrar sua conta por violação destes Termos, por ordem legal ou em
          casos de risco à plataforma ou a outros usuários.
        </p>
      </LegalSection>

      <LegalSection title="13. Propriedade intelectual">
        <p>
          O código-fonte, design, marcas, logotipos, ícones, diagramação, trilhas autorais de estudo,
          reflexões originais e a estrutura da plataforma são de titularidade exclusiva do Veritas Dei
          e protegidos pela Lei 9.610/1998 e legislação correlata.
        </p>
        <p>
          O Conteúdo Doutrinal (catecismos, orações tradicionais, Escritura) é patrimônio da Igreja
          Católica, reproduzido com finalidade educacional. Traduções modernas podem estar sob
          direitos de terceiros (CNBB, Paulinas, Loyola), cuja citação é feita com respeito à lei.
        </p>
        <p>
          Reclamações de direitos autorais devem ser encaminhadas conforme nossa{' '}
          <Link href="/dmca" style={{ color: '#C9A84C' }}>
            Política de Direitos Autorais
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="14. Limitação de responsabilidade">
        <p>
          O Veritas Dei é oferecido no estado em que se encontra (&quot;as is&quot;). Buscamos a máxima
          disponibilidade, mas não garantimos operação ininterrupta e livre de falhas.
        </p>
        <p>
          Nos limites permitidos pela legislação, não nos responsabilizamos por (i) lucros cessantes,
          (ii) danos indiretos, (iii) perdas decorrentes de interpretações pessoais de conteúdo
          doutrinal ou gerado por IA, (iv) atos de terceiros, (v) conteúdo publicado por usuários e
          (vi) força maior. As responsabilidades devidas ao consumidor não são excluídas nem limitadas
          além do permitido pelo Código de Defesa do Consumidor.
        </p>
        <p>
          O aplicativo não substitui orientação espiritual, pastoral, psicológica, médica, jurídica ou
          financeira.
        </p>
      </LegalSection>

      <LegalSection title="15. Indenização">
        <p>
          Você concorda em indenizar e isentar o Veritas Dei, sua equipe e parceiros contratuais de
          quaisquer reclamações, perdas ou custos (inclusive honorários) decorrentes do seu uso do
          serviço em violação destes Termos, das Diretrizes ou da legislação aplicável, em especial por
          Conteúdo do Usuário que você tenha publicado.
        </p>
      </LegalSection>

      <LegalSection title="16. Legislação, foro e comunicações">
        <p>
          Estes Termos são regidos pela legislação da República Federativa do Brasil, incluindo Código
          de Defesa do Consumidor (Lei 8.078/1990), Marco Civil da Internet (Lei 12.965/2014), Lei
          Geral de Proteção de Dados (Lei 13.709/2018), Estatuto da Criança e do Adolescente e Lei
          9.610/1998.
        </p>
        <p>
          O foro competente para litígios consumeristas é o do domicílio do consumidor, conforme art.
          101, I, do CDC.
        </p>
        <p>
          Comunicações oficiais, notificações extrajudiciais e citações devem ser enviadas ao e-mail{' '}
          {LEGAL_OPERATOR.contactEmail}. O usuário autoriza que comunicações relativas à conta sejam
          feitas pelo e-mail cadastrado.
        </p>
      </LegalSection>

      <LegalSection title="17. Alterações dos termos">
        <p>
          Podemos atualizar estes Termos a qualquer tempo. Em caso de mudança material, daremos aviso
          prévio de no mínimo 15 dias pelo aplicativo ou e-mail, e a nova versão exigirá novo aceite.
          Alterações não materiais (correção de redação, ajuste operacional) entram em vigor na data
          de publicação.
        </p>
      </LegalSection>

      <LegalSection title="18. Contato">
        <LegalCallout>
          <p>
            <LegalHighlight>Veritas Dei</LegalHighlight> — {LEGAL_OPERATOR.legalStatus}
          </p>
          <p>Dúvidas e suporte: {LEGAL_OPERATOR.contactEmail}</p>
          <p>Privacidade e LGPD: {LEGAL_OPERATOR.privacyEmail}</p>
          <p>Direitos autorais / DMCA: {LEGAL_OPERATOR.dmcaEmail}</p>
        </LegalCallout>
      </LegalSection>
    </LegalDocumentShell>
  )
}
