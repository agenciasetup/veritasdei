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
  title: 'Excluir conta | Veritas Dei',
  description:
    'Como solicitar a exclusão da sua conta Veritas Dei e dos dados pessoais associados, em conformidade com a LGPD e a política do Google Play.',
}

export default function ExcluirContaPage() {
  return (
    <LegalDocumentShell version="1.0.0" lastUpdated="2026-04-28" title="Excluir conta">
      <LegalSection title="1. Sobre esta página">
        <p>
          Esta página explica como solicitar a exclusão permanente da sua conta no aplicativo{' '}
          <LegalHighlight>Veritas Dei</LegalHighlight> e dos dados pessoais associados, em
          conformidade com a LGPD (Lei nº 13.709/2018) e com a política de transparência do
          Google Play.
        </p>
        <p>
          Operador da plataforma: {LEGAL_OPERATOR.displayName} — {LEGAL_OPERATOR.legalStatus}.
        </p>
      </LegalSection>

      <LegalSection title="2. Como excluir pelo aplicativo">
        <p>
          O caminho mais rápido é dentro do próprio app, em qualquer dispositivo:
        </p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Faça login com a sua conta.</li>
          <li>
            Toque em <LegalHighlight>Perfil</LegalHighlight> (canto inferior direito).
          </li>
          <li>
            Abra <LegalHighlight>Privacidade e dados</LegalHighlight>.
          </li>
          <li>
            Toque em <LegalHighlight>Excluir conta</LegalHighlight> e confirme.
          </li>
        </ol>
        <p>
          A exclusão é processada imediatamente. Você recebe uma confirmação por e-mail e a
          conta deixa de ser acessível na hora.
        </p>
      </LegalSection>

      <LegalSection title="3. Como excluir sem acesso ao aplicativo">
        <p>
          Se você não consegue mais entrar no app (perdeu acesso ao e-mail de login,
          desinstalou o app, etc.), envie um pedido por e-mail para:
        </p>
        <p>
          <LegalHighlight>{LEGAL_OPERATOR.privacyEmail}</LegalHighlight>
        </p>
        <p>O e-mail precisa conter:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Assunto: <LegalHighlight>Exclusão de conta — Veritas Dei</LegalHighlight></li>
          <li>O e-mail cadastrado na sua conta (para localizá-la);</li>
          <li>Seu nome completo;</li>
          <li>
            Uma confirmação no corpo do e-mail: <em>&ldquo;Solicito a exclusão definitiva
            da minha conta Veritas Dei e dos dados pessoais associados.&rdquo;</em>
          </li>
        </ul>
        <p>
          Respondemos em até <LegalHighlight>15 dias corridos</LegalHighlight>, conforme prazo
          previsto pela ANPD para resposta a titular de dados (LGPD, art. 19).
        </p>
      </LegalSection>

      <LegalSection title="4. Dados que são excluídos">
        <p>Quando a exclusão é confirmada, removemos permanentemente:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Sua conta de autenticação (e-mail, senha, vínculo com Google/Facebook/Apple);</li>
          <li>Seu perfil público (nome, handle, foto, biografia, links, cidade, paróquia, diocese);</li>
          <li>
            Conteúdo que você publicou: intenções, pedidos de oração, graças recebidas, cartas
            ao santo, posts, respostas, comentários, reposts, citações;
          </li>
          <li>Denúncias que você abriu e apelações suas;</li>
          <li>Fotos enviadas (perfil, capa, anexos de posts);</li>
          <li>Dados de devoção (santo de padroeiro, vocação, sacramentos, novenas em andamento);</li>
          <li>
            Token de notificação push do dispositivo (deixa de receber qualquer notificação do app);
          </li>
          <li>Suas preferências de consentimento e configurações pessoais.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Dados que ficam retidos por exigência legal">
        <LegalCallout>
          A LGPD permite (art. 16) a retenção de dados pessoais após a exclusão da conta
          quando há obrigação legal, regulatória ou exercício regular de direitos. Mesmo após
          excluir sua conta, mantemos por tempo limitado os itens abaixo:
        </LegalCallout>

        <LegalSubheading>5.1 Registros financeiros e fiscais — 5 anos</LegalSubheading>
        <p>
          Recibos, notas fiscais e dados de assinatura premium (valor pago, data, método de
          pagamento mascarado, status) são mantidos por <LegalHighlight>5 anos</LegalHighlight>{' '}
          após o encerramento da conta. Base legal: art. 195, §1º do Código Tributário Nacional
          e Lei nº 9.430/96. Esses registros são pseudonimizados (desvinculados do seu perfil)
          e mantidos exclusivamente para fins fiscais.
        </p>

        <LegalSubheading>5.2 Logs de acesso à aplicação — 6 meses</LegalSubheading>
        <p>
          Logs de aplicação (IP, data, hora, ação) são mantidos por{' '}
          <LegalHighlight>6 meses</LegalHighlight>, conforme art. 15 do Marco Civil da Internet
          (Lei nº 12.965/2014). Após esse prazo são apagados automaticamente.
        </p>

        <LegalSubheading>5.3 Registros de moderação e segurança</LegalSubheading>
        <p>
          Quando uma conta é encerrada após decisão de moderação por violação dos Termos
          (banimento, fraude, abuso), mantemos um registro pseudonimizado da decisão pelo prazo
          mínimo necessário para impedir reabertura sob outra identidade. Esse registro não
          contém dados pessoais identificáveis após pseudonimização.
        </p>

        <LegalSubheading>5.4 Conteúdo público com interação de terceiros</LegalSubheading>
        <p>
          Posts e comentários públicos que receberam respostas de outros usuários podem ser
          mantidos visíveis com seu nome substituído por <em>&ldquo;Usuário desativado&rdquo;</em>{' '}
          para preservar o contexto da conversa. Você pode pedir a remoção total desse conteúdo
          também — basta especificar no pedido.
        </p>
      </LegalSection>

      <LegalSection title="6. Reativação não é possível">
        <p>
          A exclusão é <LegalHighlight>definitiva e irreversível</LegalHighlight>. Após
          confirmada, não é possível recuperar a conta, o histórico de devoção, intenções,
          graças nem qualquer outro conteúdo. Se mudar de ideia depois, será necessário criar
          uma conta nova do zero.
        </p>
        <p>
          Se você só quer pausar o uso, considere apenas{' '}
          <LegalHighlight>desinstalar o aplicativo</LegalHighlight> — sua conta fica intacta
          e você pode retomar quando quiser.
        </p>
      </LegalSection>

      <LegalSection title="7. Dúvidas sobre privacidade">
        <p>
          Para outras solicitações relacionadas a dados pessoais (exportação, retificação,
          oposição, anonimização), acesse a{' '}
          <Link
            href="/privacidade"
            style={{ color: '#C9A84C', textDecoration: 'underline' }}
          >
            Política de Privacidade
          </Link>{' '}
          ou escreva para <LegalHighlight>{LEGAL_OPERATOR.privacyEmail}</LegalHighlight>.
        </p>
      </LegalSection>
    </LegalDocumentShell>
  )
}
