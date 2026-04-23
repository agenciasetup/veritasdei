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
  title: 'Política de Privacidade | Veritas Dei',
  description: 'Política de Privacidade do Veritas Dei, em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <LegalDocumentShell documentKey="privacy" title="Política de Privacidade">
      <LegalSection title="1. Quem é o controlador e quem é o encarregado">
        <p>
          O <LegalHighlight>Veritas Dei</LegalHighlight> é o controlador dos dados pessoais tratados
          por sua plataforma. Operador: {LEGAL_OPERATOR.displayName} — {LEGAL_OPERATOR.legalStatus}.
        </p>
        <p>
          O encarregado pelo tratamento de dados (DPO), nos termos do art. 41 da LGPD, pode ser
          contatado em <LegalHighlight>{LEGAL_OPERATOR.privacyEmail}</LegalHighlight>.
        </p>
      </LegalSection>

      <LegalSection title="2. Princípios">
        <p>
          Esta política segue os princípios da Lei nº 13.709/2018 (LGPD): finalidade, adequação,
          necessidade, livre acesso, qualidade, transparência, segurança, prevenção, não-discriminação
          e responsabilização.
        </p>
      </LegalSection>

      <LegalSection title="3. Dados que coletamos">
        <LegalSubheading>3.1 Dados fornecidos por você</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>E-mail, senha (armazenada com hash bcrypt), nome e, quando aplicável, data de nascimento.</li>
          <li>Foto de perfil e foto de capa (opcionais).</li>
          <li>Handle público, biografia, links externos (Instagram, WhatsApp, TikTok, YouTube, site).</li>
          <li>Cidade, estado, paróquia, diocese e comunidade local.</li>
          <li>CPF (opcional hoje; obrigatório apenas quando necessário para emissão fiscal).</li>
          <li>Conteúdo que você publica: posts, respostas, reposts, citações, hashtags, menções, cartas ao santo, intenções, pedidos de oração, graças, fotos e GIFs.</li>
          <li>Denúncias que você abriu, apelações e comunicações com a equipe.</li>
          <li>Dados de paróquia (quando você cadastra ou gerencia): CNPJ, tipo de igreja, horários, fotos, documento de verificação de titularidade.</li>
        </ul>

        <LegalSubheading>3.2 Dados sensíveis (LGPD, art. 5, II)</LegalSubheading>
        <p>
          Reconhecemos expressamente que informações sobre{' '}
          <LegalHighlight>convicção religiosa</LegalHighlight> são dados pessoais sensíveis. Tratamos
          como sensíveis: vocação (leigo, catequista, diácono, padre, bispo, cardeal), sacramentos
          recebidos, santo de devoção, paróquia/diocese, religião anterior (quando você informa
          conversão), intenções, cartas ao santo, pedidos de oração e graças recebidas.
        </p>
        <p>
          Esses dados são tratados com base em seu consentimento específico e destacado (art. 11, I,
          LGPD), revogável a qualquer tempo.
        </p>

        <LegalSubheading>3.3 Dados coletados automaticamente</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Endereço IP, user-agent, data e hora de acesso (logs de aplicação).</li>
          <li>Histórico de eventos de login (para detecção de acesso suspeito).</li>
          <li>Cookies essenciais (veja a{' '}
            <Link href="/cookies" style={{ color: '#C9A84C' }}>
              Política de Cookies
            </Link>
            ).
          </li>
          <li>Dados de uso agregados e anônimos para melhoria do serviço.</li>
        </ul>

        <LegalSubheading>3.4 Geolocalização</LegalSubheading>
        <p>
          A geolocalização só é coletada com sua autorização explícita no navegador, para fins de
          sugerir comunidades e paróquias próximas. Você pode revogar a permissão a qualquer tempo nas
          configurações do navegador ou do aplicativo.
        </p>

        <LegalSubheading>3.5 Push notifications</LegalSubheading>
        <p>
          Quando você ativa notificações, armazenamos o endpoint do navegador (padrão Web Push VAPID),
          chaves públicas (p256dh, auth) e user-agent técnico. Finalidade: enviar lembretes devocionais
          e eventos da comunidade. Você pode desativar a qualquer tempo em {'"'}Perfil › Notificações{'"'}.
        </p>

        <LegalSubheading>3.6 Dados de autenticação por terceiros</LegalSubheading>
        <p>
          Se optar por Google, Facebook, Apple ou Magic Link, recebemos do provedor apenas os dados
          essenciais (nome, e-mail, foto). Nunca recebemos ou armazenamos senhas desses provedores.
        </p>
      </LegalSection>

      <LegalSection title="4. Para que usamos seus dados — finalidades e bases legais">
        <LegalCallout>
          <p>
            Cada operação tem uma base legal específica. Nunca utilizamos seus dados para
            finalidades estranhas às declaradas aqui sem seu consentimento adicional.
          </p>
        </LegalCallout>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <LegalHighlight>Cadastro, autenticação e manutenção da conta</LegalHighlight> — base
            legal: execução de contrato (art. 7, V).
          </li>
          <li>
            <LegalHighlight>Tratamento de dados religiosos sensíveis (vocação, sacramentos, santo,
            intenções, cartas, graças)</LegalHighlight> — base legal: consentimento específico e
            destacado (art. 11, I).
          </li>
          <li>
            <LegalHighlight>Publicação de conteúdo na comunidade</LegalHighlight> — base legal:
            execução de contrato (você pede para publicar) e consentimento (para dados sensíveis).
          </li>
          <li>
            <LegalHighlight>Moderação e segurança</LegalHighlight> (denúncias, detecção de fraude,
            filtro de conteúdo) — base legal: legítimo interesse (art. 7, IX) e cumprimento de
            obrigação legal (art. 7, II), inclusive Marco Civil e ECA.
          </li>
          <li>
            <LegalHighlight>Notificações essenciais</LegalHighlight> (confirmação, recuperação de
            senha, avisos de login suspeito) — execução de contrato e legítimo interesse.
          </li>
          <li>
            <LegalHighlight>Notificações devocionais e de comunidade</LegalHighlight> — consentimento,
            revogável em {'"'}Perfil › Notificações{'"'}.
          </li>
          <li>
            <LegalHighlight>Pagamentos e obrigações fiscais</LegalHighlight> — cumprimento de
            obrigação legal e execução de contrato.
          </li>
          <li>
            <LegalHighlight>CPF (quando coletado)</LegalHighlight> — cumprimento de obrigação legal
            (emissão fiscal).
          </li>
          <li>
            <LegalHighlight>Melhoria do serviço e estatísticas agregadas</LegalHighlight> — legítimo
            interesse, sempre em base anonimizada.
          </li>
          <li>
            <LegalHighlight>Retenção de logs de acesso</LegalHighlight> por 6 meses — cumprimento de
            obrigação legal (art. 15 do Marco Civil).
          </li>
          <li>
            <LegalHighlight>Atendimento a ordens judiciais e autoridades competentes</LegalHighlight>{' '}
            — cumprimento de obrigação legal.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Menores de idade">
        <p>
          A plataforma exige idade mínima de <LegalHighlight>14 anos</LegalHighlight>. Cadastros de
          menores de 14 são vedados; contas identificadas serão excluídas.
        </p>
        <p>
          Para usuários entre 14 e 17 anos, o tratamento de dados — incluindo dados sensíveis
          religiosos — exige <LegalHighlight>consentimento específico e destacado do responsável
          legal</LegalHighlight>, nos termos do art. 14, §1º, da LGPD. Coletamos esse consentimento
          por link assinado enviado ao e-mail do responsável. Enquanto o consentimento não é
          confirmado, a conta permanece restrita.
        </p>
        <p>
          O responsável pode revogar o consentimento, solicitar exclusão ou pedir acesso aos dados
          do menor pelo e-mail {LEGAL_OPERATOR.privacyEmail}.
        </p>
      </LegalSection>

      <LegalSection title="6. Com quem compartilhamos — subprocessadores">
        <p>
          <LegalHighlight>Não vendemos, alugamos ou cedemos</LegalHighlight> seus dados pessoais para
          fins comerciais ou de publicidade.
        </p>
        <p>
          Usamos os seguintes subprocessadores, necessários à operação do serviço. Cada um acessa
          apenas os dados indispensáveis à sua função:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <LegalHighlight>Supabase</LegalHighlight> (Estados Unidos) — banco de dados, autenticação
            e armazenamento de avatares legados.
          </li>
          <li>
            <LegalHighlight>Vercel</LegalHighlight> (Estados Unidos) — hospedagem, execução do
            aplicativo, CDN e execução de rotinas agendadas.
          </li>
          <li>
            <LegalHighlight>Cloudflare R2</LegalHighlight> (infraestrutura global) — armazenamento das
            mídias publicadas (fotos, capas, posts da comunidade) e entrega por CDN.
          </li>
          <li>
            <LegalHighlight>Cloudflare Turnstile</LegalHighlight> (infraestrutura global) — proteção
            contra bots em formulários sensíveis.
          </li>
          <li>
            <LegalHighlight>Cloudflare Workers AI</LegalHighlight> (infraestrutura global) —
            classificação automática de nudez/pornografia em imagens enviadas, para moderação.
          </li>
          <li>
            <LegalHighlight>Stripe</LegalHighlight> (Estados Unidos) — processamento de pagamentos de
            assinatura. Os dados de cartão de crédito são tratados pela Stripe, que atua como
            controladora autônoma para fins de PCI-DSS.
          </li>
          <li>
            <LegalHighlight>Provedores alternativos de pagamento</LegalHighlight> (Kirvano, Hotmart,
            Eduzz, quando ativos) — mesma finalidade de pagamento.
          </li>
          <li>
            <LegalHighlight>OpenAI</LegalHighlight> (Estados Unidos) — processamento de texto para
            explicações bíblicas e reflexões litúrgicas. Seu texto é enviado sob termos de retenção
            zero; não usamos seu conteúdo para treinar modelos próprios.
          </li>
          <li>
            <LegalHighlight>Google Maps Platform</LegalHighlight> (Estados Unidos) — autocomplete de
            endereços, detalhes e geocodificação reversa.
          </li>
          <li>
            <LegalHighlight>Upstash</LegalHighlight> (Estados Unidos) — rate-limit distribuído (armazena
            contadores efêmeros por curto período).
          </li>
          <li>
            <LegalHighlight>Servidor Web Push / VAPID</LegalHighlight> — envio de notificações push
            pelo navegador. Não há terceiro intermediário: o servidor do Veritas Dei fala diretamente
            com o navegador registrado.
          </li>
        </ul>
        <p>
          Também podemos compartilhar dados com autoridades, mediante obrigação legal, ordem judicial
          ou para a defesa de direitos do Veritas Dei ou de seus usuários, na estrita medida
          necessária.
        </p>
      </LegalSection>

      <LegalSection title="7. Transferência internacional de dados">
        <p>
          Parte dos nossos subprocessadores opera fora do Brasil (principalmente Estados Unidos). A
          transferência internacional observa os fundamentos do art. 33 da LGPD, em especial: (i)
          necessidade para execução do contrato (inciso V), (ii) cláusulas contratuais padrão ou
          termos equivalentes firmados com os subprocessadores (inciso II) e (iii) consentimento
          específico do titular (inciso VIII), quando aplicável.
        </p>
        <p>
          Aplicamos salvaguardas técnicas mínimas: criptografia em trânsito (TLS), criptografia em
          repouso oferecida pelos provedores, autenticação forte e registros de acesso.
        </p>
      </LegalSection>

      <LegalSection title="8. Retenção de dados">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <LegalHighlight>Dados de perfil e conteúdo do usuário</LegalHighlight>: enquanto a conta
            existir. Após exclusão, há período de graça de 30 dias para restauração; em seguida, os
            dados são removidos ou anonimizados.
          </li>
          <li>
            <LegalHighlight>Cartas privadas ao santo e intenções privadas</LegalHighlight>: removidas
            imediatamente na exclusão da conta.
          </li>
          <li>
            <LegalHighlight>Posts, comentários e interações públicas</LegalHighlight>: após exclusão
            da conta, podem ser preservados de forma anônima para integridade das conversas.
          </li>
          <li>
            <LegalHighlight>Logs de acesso</LegalHighlight>: 6 meses, em atendimento ao art. 15 do
            Marco Civil da Internet.
          </li>
          <li>
            <LegalHighlight>Logs de aplicação e moderação</LegalHighlight>: 12 meses.
          </li>
          <li>
            <LegalHighlight>Dados de pagamento e registros fiscais</LegalHighlight>: 5 anos, para
            cumprimento de obrigações tributárias e contábeis.
          </li>
          <li>
            <LegalHighlight>Documentos de verificação de paróquia</LegalHighlight>: mantidos durante a
            vigência do vínculo e removidos em até 2 anos após a revogação.
          </li>
          <li>
            <LegalHighlight>Conteúdo removido por moderação</LegalHighlight>: mantido em estado
            &quot;arquivado&quot; por 90 dias para preservação de provas em eventual litígio.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Seus direitos (LGPD, art. 18)">
        <p>Você pode, a qualquer tempo, exercer os seguintes direitos:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <LegalHighlight>Confirmação</LegalHighlight> da existência de tratamento.
          </li>
          <li>
            <LegalHighlight>Acesso</LegalHighlight> aos seus dados pessoais.
          </li>
          <li>
            <LegalHighlight>Correção</LegalHighlight> de dados incompletos, inexatos ou desatualizados.
          </li>
          <li>
            <LegalHighlight>Anonimização, bloqueio ou exclusão</LegalHighlight> de dados
            desnecessários, excessivos ou tratados em desconformidade com a LGPD.
          </li>
          <li>
            <LegalHighlight>Portabilidade</LegalHighlight> em formato estruturado (oferecemos
            exportação em JSON/ZIP por e-mail).
          </li>
          <li>
            <LegalHighlight>Eliminação</LegalHighlight> dos dados tratados com base em consentimento.
          </li>
          <li>
            <LegalHighlight>Informação sobre compartilhamento</LegalHighlight> com entidades públicas
            e privadas.
          </li>
          <li>
            <LegalHighlight>Revogação do consentimento</LegalHighlight>, a qualquer tempo, sem
            prejuízo das operações já realizadas em conformidade com a lei.
          </li>
          <li>
            <LegalHighlight>Oposição</LegalHighlight> ao tratamento em caso de descumprimento da LGPD.
          </li>
        </ul>
        <p>
          A maior parte desses direitos pode ser exercida diretamente em{' '}
          <LegalHighlight>Perfil › Privacidade</LegalHighlight>, que oferece os botões {'"'}Exportar
          meus dados{'"'} e {'"'}Excluir conta{'"'}. Alternativamente, envie um pedido a{' '}
          {LEGAL_OPERATOR.privacyEmail}. Responderemos em até 15 dias corridos, salvo hipóteses de
          prorrogação justificada.
        </p>
        <p>
          Você pode ainda apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="10. Segurança">
        <ul className="list-disc pl-6 space-y-1">
          <li>Conexões criptografadas com TLS 1.2+.</li>
          <li>Senhas armazenadas com hash bcrypt; nunca em texto puro.</li>
          <li>Banco de dados com Row Level Security (RLS) — cada registro acessível apenas a quem tem direito.</li>
          <li>Rate-limit distribuído e proteção anti-bot (Turnstile) em endpoints sensíveis.</li>
          <li>Headers de segurança (CSP, HSTS, X-Frame-Options).</li>
          <li>Classificação automática de imagens (Cloudflare Workers AI) e filtros de texto em conteúdo enviado.</li>
          <li>Histórico de login com detecção de acesso suspeito.</li>
          <li>Autenticação em dois fatores (2FA) opcional, recomendada para todos os usuários.</li>
        </ul>
        <p>
          Embora adotemos medidas proporcionais ao risco, nenhum sistema é 100% seguro. Em caso de
          incidente com risco relevante a titulares, comunicaremos a ANPD e você, conforme art. 48 da
          LGPD.
        </p>
      </LegalSection>

      <LegalSection title="11. Cookies">
        <p>
          Usamos apenas cookies essenciais para sessão autenticada, proteção anti-CSRF e preferências
          funcionais. Não usamos cookies publicitários, de rastreamento, remarketing ou analytics de
          terceiros. Detalhes em{' '}
          <Link href="/cookies" style={{ color: '#C9A84C' }}>
            /cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="12. Alterações desta política">
        <p>
          Podemos atualizar esta política. Mudanças materiais serão comunicadas pelo aplicativo ou por
          e-mail, com antecedência mínima de 15 dias, e exigirão novo aceite. A versão atual fica
          sempre visível no topo deste documento.
        </p>
      </LegalSection>

      <LegalSection title="13. Contato">
        <LegalCallout>
          <p>
            <LegalHighlight>Encarregado (DPO):</LegalHighlight> {LEGAL_OPERATOR.privacyEmail}
          </p>
          <p>Dúvidas gerais: {LEGAL_OPERATOR.contactEmail}</p>
          <p>Autoridade Nacional de Proteção de Dados: https://www.gov.br/anpd</p>
        </LegalCallout>
      </LegalSection>
    </LegalDocumentShell>
  )
}
