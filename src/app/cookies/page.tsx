import Link from 'next/link'
import {
  LegalDocumentShell,
  LegalSection,
  LegalHighlight,
  LegalCallout,
} from '@/components/legal/LegalDocumentShell'
import { LEGAL_OPERATOR } from '@/lib/legal/versions'

export const metadata = {
  title: 'Política de Cookies | Veritas Dei',
  description: 'Política de Cookies do aplicativo Veritas Dei.',
}

export default function CookiesPage() {
  return (
    <LegalDocumentShell documentKey="cookies" title="Política de Cookies">
      <LegalSection title="1. O que são cookies">
        <p>
          Cookies são pequenos arquivos de texto que um site armazena no seu navegador. Eles podem ter
          finalidades diferentes — desde manter você logado até rastrear sua navegação entre sites.
        </p>
      </LegalSection>

      <LegalSection title="2. Quais cookies o Veritas Dei utiliza">
        <p>
          Usamos <LegalHighlight>apenas cookies essenciais</LegalHighlight>, indispensáveis para
          operar o serviço. Eles dispensam consentimento específico, conforme entendimento da ANPD.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <LegalHighlight>Cookies de sessão do Supabase Auth</LegalHighlight>: mantêm você
            autenticado e permitem navegar entre páginas sem precisar relogar. Sem eles, o app não
            funciona.
          </li>
          <li>
            <LegalHighlight>Cookies de segurança (CSRF)</LegalHighlight>: protegem formulários e APIs
            contra ataques de cross-site.
          </li>
          <li>
            <LegalHighlight>Preferência funcional</LegalHighlight> (quando aplicável): armazenam
            escolhas como tema, idioma e estado de avisos já lidos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. O que não usamos">
        <ul className="list-disc pl-6 space-y-1">
          <li>Cookies publicitários, de remarketing ou de personalização de anúncios.</li>
          <li>Cookies de redes sociais para rastrear comportamento fora da plataforma.</li>
          <li>Google Analytics, Meta Pixel, TikTok Pixel ou equivalentes.</li>
          <li>Ferramentas de fingerprinting ou rastreamento invisível.</li>
        </ul>
        <LegalCallout>
          <p>
            Se um dia adotarmos analytics ou qualquer tecnologia não-essencial, esta política será
            atualizada com antecedência e apresentaremos um banner de consentimento com opção de
            recusar.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection title="4. Outras tecnologias equivalentes">
        <p>
          Também podemos usar <LegalHighlight>localStorage</LegalHighlight> e{' '}
          <LegalHighlight>IndexedDB</LegalHighlight> do navegador para fins estritamente
          funcionais (cache de páginas lidas, preferências offline do PWA, estado de formulário).
          Nenhum desses armazenamentos envia dados a terceiros.
        </p>
      </LegalSection>

      <LegalSection title="5. Como gerenciar">
        <p>
          Você pode bloquear ou apagar cookies diretamente nas configurações do seu navegador. Note
          que, sem os cookies de sessão, não será possível permanecer logado — recursos autenticados
          ficam indisponíveis.
        </p>
      </LegalSection>

      <LegalSection title="6. Saiba mais">
        <p>
          Para informações completas sobre como tratamos seus dados, consulte nossa{' '}
          <Link href="/privacidade" style={{ color: '#C9A84C' }}>
            Política de Privacidade
          </Link>
          .
        </p>
        <p>Contato: {LEGAL_OPERATOR.privacyEmail}</p>
      </LegalSection>
    </LegalDocumentShell>
  )
}
