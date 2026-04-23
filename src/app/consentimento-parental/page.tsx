import { ParentalConsentForm } from '@/components/legal/ParentalConsentForm'
import {
  LegalDocumentShell,
  LegalSection,
  LegalHighlight,
} from '@/components/legal/LegalDocumentShell'

export const metadata = {
  title: 'Consentimento parental | Veritas Dei',
  description: 'Confirmação de consentimento do responsável legal (LGPD art. 14).',
}

export default async function ConsentimentoParentalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <LegalDocumentShell documentKey="privacy" title="Consentimento Parental">
      <LegalSection title="Confirmação do responsável">
        <p>
          O Veritas Dei exige consentimento expresso do responsável legal para que adolescentes entre
          14 e 17 anos utilizem a plataforma, nos termos do{' '}
          <LegalHighlight>art. 14, §1º, da Lei Geral de Proteção de Dados</LegalHighlight>{' '}
          (Lei nº 13.709/2018).
        </p>
        <p>
          Ao preencher e enviar o formulário abaixo, você declara ser o pai, a mãe ou o tutor legal do
          adolescente e consente com o tratamento dos dados pessoais dele conforme nossa{' '}
          <a href="/privacidade" style={{ color: '#C9A84C' }}>
            Política de Privacidade
          </a>{' '}
          e nossos{' '}
          <a href="/termos" style={{ color: '#C9A84C' }}>
            Termos de Uso
          </a>
          .
        </p>
        <ParentalConsentForm token={token ?? ''} />
      </LegalSection>
    </LegalDocumentShell>
  )
}
