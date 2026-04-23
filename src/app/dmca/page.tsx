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
  title: 'Política de Direitos Autorais | Veritas Dei',
  description:
    'Procedimento de notificação e contranotificação de direitos autorais (Lei 9.610/98 e DMCA).',
}

export default function DmcaPage() {
  return (
    <LegalDocumentShell documentKey="dmca" title="Política de Direitos Autorais">
      <LegalSection title="1. Respeito aos direitos do autor">
        <p>
          O Veritas Dei respeita os direitos autorais de terceiros e espera o mesmo de seus usuários.
          Esta política descreve como você pode notificar violações de direitos autorais em conteúdo
          publicado na plataforma, conforme a Lei 9.610/1998 e o procedimento estilo{' '}
          <em>notice-and-takedown</em> inspirado no DMCA norte-americano.
        </p>
      </LegalSection>

      <LegalSection title="2. Como enviar uma notificação">
        <p>
          Envie um e-mail para{' '}
          <LegalHighlight>{LEGAL_OPERATOR.dmcaEmail}</LegalHighlight> com os seguintes dados:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Identificação do titular do direito (nome completo, documento, contato).</li>
          <li>Descrição da obra protegida (título, autor, data de registro se houver).</li>
          <li>Localização exata do conteúdo infrator (URLs do Veritas Dei).</li>
          <li>
            Declaração de <LegalHighlight>boa-fé</LegalHighlight> de que o uso não é autorizado.
          </li>
          <li>
            Declaração, sob as penas da lei, de que as informações são verdadeiras e de que você é o
            titular do direito ou representante autorizado.
          </li>
          <li>Assinatura (eletrônica ou manuscrita digitalizada).</li>
        </ul>
        <p>
          Notificações falsas ou de má-fé podem sujeitar o remetente a responsabilização civil e
          criminal.
        </p>
      </LegalSection>

      <LegalSection title="3. Remoção cautelar">
        <p>
          Ao receber uma notificação formalmente válida, removemos o conteúdo cautelarmente em até{' '}
          <LegalHighlight>48 horas</LegalHighlight> e notificamos o usuário que publicou.
        </p>
      </LegalSection>

      <LegalSection title="4. Contranotificação">
        <p>
          O usuário cujo conteúdo foi removido pode apresentar contranotificação em até{' '}
          <LegalHighlight>10 dias corridos</LegalHighlight>, para o mesmo e-mail, contendo:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Identificação e contato.</li>
          <li>URL e descrição do conteúdo removido.</li>
          <li>
            Declaração, sob as penas da lei, de boa-fé de que a remoção foi equivocada e de que o
            conteúdo é de sua autoria ou uso autorizado.
          </li>
          <li>
            Aceite expresso de receber comunicações do suposto titular e, se for o caso, de submeter
            eventual disputa ao juízo competente.
          </li>
        </ul>
        <p>
          Avaliaremos a contranotificação e podemos restabelecer o conteúdo se entendermos cabível,
          ou mantê-lo removido.
        </p>
      </LegalSection>

      <LegalSection title="5. Reincidência">
        <p>
          Usuários que <LegalHighlight>acumulem três notificações válidas</LegalHighlight> sofrem
          banimento permanente.
        </p>
      </LegalSection>

      <LegalSection title="6. Conteúdo doutrinal e obras consagradas">
        <LegalCallout>
          <p>
            O patrimônio doutrinal da Igreja (catecismos, orações tradicionais, textos bíblicos no
            original) costuma estar em domínio público. Traduções modernas, contudo, podem estar sob
            direitos de editoras (CNBB, Paulinas, Loyola, etc.). Usamos preferencialmente traduções
            em domínio público ou com autorização.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection title="7. Direito de imagem e dados de terceiros">
        <p>
          Reivindicações sobre direito de imagem, voz e dados pessoais seguem fluxo semelhante. Para
          pedidos em que o fundamento principal é LGPD, encaminhe a solicitação para{' '}
          <Link href="/privacidade" style={{ color: '#C9A84C' }}>
            a Política de Privacidade
          </Link>{' '}
          ({LEGAL_OPERATOR.privacyEmail}).
        </p>
      </LegalSection>

      <LegalSection title="8. Contato">
        <LegalCallout>
          <p>Notificações de direitos autorais: {LEGAL_OPERATOR.dmcaEmail}</p>
          <p>Privacidade / LGPD: {LEGAL_OPERATOR.privacyEmail}</p>
          <p>Suporte geral: {LEGAL_OPERATOR.contactEmail}</p>
        </LegalCallout>
      </LegalSection>
    </LegalDocumentShell>
  )
}
