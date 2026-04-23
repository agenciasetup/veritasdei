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
  title: 'Diretrizes da Comunidade | Veritas Dei',
  description: 'Regras de convivência, conduta e moderação da Comunidade Veritas Dei.',
}

export default function DiretrizesPage() {
  return (
    <LegalDocumentShell documentKey="guidelines" title="Diretrizes da Comunidade">
      <LegalSection title="1. O que esperamos de você">
        <p>
          A Comunidade Veritas Dei é um espaço católico. O tom de toda a plataforma é guiado pelos
          valores da <LegalHighlight>caridade cristã, verdade e respeito à dignidade de cada
          pessoa</LegalHighlight>.
        </p>
        <p>
          Estas Diretrizes explicam o que é permitido, o que é desencorajado e o que é estritamente
          proibido. Elas complementam os{' '}
          <Link href="/termos" style={{ color: '#C9A84C' }}>
            Termos de Uso
          </Link>{' '}
          e são parte integrante do contrato. O descumprimento pode levar desde advertência até
          banimento permanente.
        </p>
        <LegalCallout>
          <p>
            <LegalHighlight>Princípio da moderação:</LegalHighlight> preferimos educar a excluir.
            Exceto nos casos de tolerância zero, aplicamos sanções graduais e você tem direito a
            apelar.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection title="2. Tolerância zero — ban imediato">
        <p>
          O conteúdo abaixo é <LegalHighlight>proibido em qualquer forma</LegalHighlight> (texto,
          imagem, GIF, link ou menção). Detecção automática ou denúncia leva a:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Remoção imediata do conteúdo.</li>
          <li>Banimento permanente da conta.</li>
          <li>Bloqueio de novo cadastro com o mesmo e-mail ou assinatura técnica.</li>
          <li>Quando cabível, comunicação às autoridades (SaferNet, Polícia Federal, Ministério Público).</li>
        </ul>

        <LegalSubheading>2.1 Pornografia, nudez e teor sexual</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Pornografia em qualquer formato.</li>
          <li>
            Nudez, total ou parcial: fotos sem camiseta em contexto sensual, bikini, lingerie,
            sungas/calções em pose sexualizada, bico do peito marcado ou enfatizado, roupas
            transparentes/íntimas.
          </li>
          <li>Poses sexualizadas, insinuações eróticas, {'"'}fitness sensualizado{'"'}, conteúdo sugestivo.</li>
          <li>Texto com descrição de atos sexuais, fetiche, solicitação sexual ou flerte explícito.</li>
          <li>Links a sites pornográficos (PornHub, Xvideos, Xhamster, OnlyFans, Fansly, Privacy, camsoda, chaturbate e equivalentes).</li>
          <li>Emojis ou códigos usados como substitutos de linguagem sexual explícita.</li>
        </ul>
        <LegalCallout>
          <p>
            <LegalHighlight>Exceção única:</LegalHighlight> arte sacra histórica em contexto
            educacional (Capela Sistina, iconografia tradicional, obras de arte consagradas) é
            permitida desde que contextualizada e não utilizada com finalidade lasciva.
          </p>
        </LegalCallout>

        <LegalSubheading>2.2 Conteúdo envolvendo menores</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Qualquer conteúdo sexual envolvendo menor de 18 anos (CP arts. 217-A, 218-A, 218-B,
            218-C, 241-A a 241-E).
          </li>
          <li>Aliciamento, contato privado com menor para fim sexual, pedir foto íntima de menor.</li>
          <li>Imagem de menor identificável sem consentimento documentado de responsável legal.</li>
        </ul>
        <p>
          Casos desse grupo são <LegalHighlight>comunicados imediatamente</LegalHighlight> à SaferNet
          e, quando aplicável, à Polícia Federal, com preservação de provas.
        </p>

        <LegalSubheading>2.3 Violência, ódio e ameaças</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Incitação à violência, apologia de crime, apologia a grupos terroristas ou milícias.</li>
          <li>Discurso de ódio por raça, etnia, nacionalidade, deficiência, orientação sexual ou condição social. (O ensino moral do Magistério é diferente de xingamento dirigido à pessoa.)</li>
          <li>Ameaças diretas ou veladas, doxxing (divulgação de endereço, CPF, telefone ou fotos de terceiros sem consentimento).</li>
          <li>Stalking ou perseguição (Lei 14.132/2021), inclusive por contas duplicadas após bloqueio.</li>
          <li>Apologia ao suicídio, automutilação ou transtorno alimentar (conteúdo de conscientização é permitido com tom adequado).</li>
        </ul>

        <LegalSubheading>2.4 Crimes, fraudes e simonia</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Anúncio ou venda de drogas ilícitas, armas, documentos falsos.</li>
          <li>Esquemas em pirâmide, golpes financeiros, estelionato digital.</li>
          <li>Vaquinha em nome de paróquia sem autorização verificável.</li>
          <li>
            <LegalHighlight>Simonia:</LegalHighlight> venda de sacramentos, de objetos ditos
            milagrosos ou de &quot;graças garantidas&quot; em troca de dinheiro.
          </li>
          <li>Phishing, distribuição de malware, links encurtados maliciosos.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Proibido — sanção gradual">
        <p>
          As condutas abaixo são proibidas, mas admitem sanção gradual (advertência → silenciamento
          temporário → suspensão → banimento).
        </p>

        <LegalSubheading>3.1 Spam e engajamento desonesto</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Publicação repetitiva, flood de posts, uso abusivo de hashtags.</li>
          <li>Compra de seguidores, engajamento artificial, bots, automação.</li>
          <li>Autopromoção excessiva fora de espaços próprios.</li>
        </ul>

        <LegalSubheading>3.2 Impersonação e falsidade</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Fingir-se clérigo, paróquia, santo ou figura pública católica sem verificação.</li>
          <li>Criar perfil com nome de pessoa real para induzir a erro.</li>
          <li>Contestar a verdade verificada de outros perfis com o intuito de prejudicar.</li>
        </ul>

        <LegalSubheading>3.3 Conteúdo religioso abusivo</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Proselitismo ativo de outras religiões (o diálogo respeitoso é permitido).</li>
          <li>Heterodoxia deliberada contra o Magistério católico definido.</li>
          <li>Superstição, sensacionalismo devocional, &quot;garantias de milagre&quot; vendidas ou sugeridas.</li>
          <li>Uso da plataforma para dividir a Igreja, atacar o Papa, bispos ou clérigos com intenção difamatória.</li>
        </ul>
        <p>
          Essas situações exigem <LegalHighlight>revisão humana</LegalHighlight>. Não aplicamos
          moderação automática definitiva em matéria doutrinal.
        </p>

        <LegalSubheading>3.4 Assédio e conduta hostil</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Ataques pessoais, xingamentos, escárnio, &quot;cancelamento&quot; coordenado.</li>
          <li>Insistência em contato após bloqueio (crime de perseguição).</li>
          <li>Comentários sistemáticos em tom agressivo em posts alheios.</li>
        </ul>

        <LegalSubheading>3.5 Propriedade intelectual e comercial</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Compartilhar cópias ilegais de livros, cursos, filmes ou áudios.</li>
          <li>Reproduzir traduções protegidas (CNBB, Paulinas, Loyola) em larga escala.</li>
          <li>Usar a plataforma para atividade comercial sem plano adequado.</li>
          <li>Divulgar a própria marca ou loja usando o feed da Comunidade como vitrine.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Regras específicas para imagens">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Fotos com crianças identificáveis só são permitidas quando o responsável legal consentiu.
            Em caso de dúvida, a foto é removida — a proteção do menor prevalece.
          </li>
          <li>
            Fotos em celebrações litúrgicas são bem-vindas quando respeitosas (sem escárnio, sem foco
            em corpos, sem captar terceiros em exposição indevida).
          </li>
          <li>
            Fotos de obras de arte, vitrais, imagens e paisagens eclesiais são sempre bem-vindas.
          </li>
          <li>
            Imagens submetidas passam por classificador automático. Se sinalizadas, seguem para
            revisão humana ou são removidas.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Intenções, cartas, pedidos de oração e graças">
        <LegalSubheading>5.1 Cartas privadas ao santo</LegalSubheading>
        <p>
          São privadas por definição. Não são lidas por ninguém além de você. Só passam por moderação
          se houver denúncia formal (por exemplo, se a conta foi invadida e conteúdo foi inserido).
        </p>

        <LegalSubheading>5.2 Intenções pessoais</LegalSubheading>
        <p>
          Privadas por padrão. Se você optar por compartilhar uma graça publicamente, o texto passa
          por aprovação prévia — especialmente para evitar linguagem que prometa resultados de
          &quot;milagre garantido&quot;, contrariando o{' '}
          <LegalHighlight>discernimento da Igreja sobre reconhecimento formal de milagres</LegalHighlight>.
        </p>

        <LegalSubheading>5.3 Pedidos de oração públicos</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>Evite expor nome completo, diagnóstico médico ou dados sensíveis de terceiros sem consentimento deles.</li>
          <li>Peça por pessoas e situações, não por resultados específicos em processos judiciais, concursos, disputas amorosas, vinganças.</li>
          <li>Não use como vitrine de drama pessoal reiterado.</li>
          <li>Moderação automática retira do público; revisão humana confirma ou devolve.</li>
        </ul>

        <LegalSubheading>5.4 Testemunhos de graças</LegalSubheading>
        <p>
          Publicados com o disclaimer obrigatório:{' '}
          <em>
            &quot;Testemunho pessoal. A Igreja reconhece milagres por processo canônico formal.&quot;
          </em>{' '}
          Rejeitamos textos que prometam resultados, que banalizem o sagrado ou que caricaturem a fé.
        </p>
      </LegalSection>

      <LegalSection title="6. Moderação — como funciona">
        <LegalSubheading>6.1 Denúncia</LegalSubheading>
        <p>
          Todo post tem botão de denúncia. Categorias: heterodoxo, superstição, sensacionalista,
          ofensivo, spam, outro. Denúncias de má-fé repetidas são punidas.
        </p>

        <LegalSubheading>6.2 Decisão</LegalSubheading>
        <ul className="list-disc pl-6 space-y-1">
          <li>5 denúncias legítimas em 24 horas geram <LegalHighlight>ocultação automática</LegalHighlight> do post até revisão humana.</li>
          <li>Revisão humana ocorre em até <LegalHighlight>72 horas úteis</LegalHighlight>.</li>
          <li>
            Denúncias marcadas como {'"'}envolve menor{'"'} ou {'"'}nudez não consensual{'"'} têm SLA
            de <LegalHighlight>24 horas</LegalHighlight> (arts. 19 e 21 do Marco Civil).
          </li>
          <li>A reincidência acelera a escala de sanções.</li>
        </ul>

        <LegalSubheading>6.3 Sanções</LegalSubheading>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Advertência com remoção do conteúdo.</li>
          <li>Silenciamento por 24 horas — leitura permitida, publicação não.</li>
          <li>Suspensão por 7 dias (para reincidência ou violação média).</li>
          <li>Banimento permanente, com bloqueio de novo cadastro.</li>
        </ol>
        <p>Violações de tolerância zero (§2) saltam direto para banimento.</p>

        <LegalSubheading>6.4 Apelação</LegalSubheading>
        <p>
          Você pode contestar uma sanção em até <LegalHighlight>7 dias</LegalHighlight>, pelo e-mail
          {' '}{LEGAL_OPERATOR.contactEmail}. A revisão é feita por membro da equipe diferente do que
          aplicou a decisão. Decisão final é comunicada em até 72 horas.
        </p>

        <LegalSubheading>6.5 Preservação de provas</LegalSubheading>
        <p>
          Conteúdo removido é mantido em estado arquivado por 90 dias para eventual atendimento de
          ordem judicial ou pedido fundamentado, conforme art. 15 do Marco Civil da Internet.
        </p>

        <LegalSubheading>6.6 Transparência</LegalSubheading>
        <p>
          Publicaremos anualmente um relatório agregado (volume de remoções por categoria, número de
          contas suspensas e banidas, tempo médio de resposta). Os dados não identificam usuários.
        </p>
      </LegalSection>

      <LegalSection title="7. Botão de socorro (SOS)">
        <p>
          Em casos graves — suspeita de exploração de menor, ameaça concreta, risco de vida — use o
          botão SOS do perfil ou do post. A denúncia entra na fila prioritária com SLA de 24 horas e,
          se apropriado, acionamos SaferNet ou Polícia Federal.
        </p>
      </LegalSection>

      <LegalSection title="8. Uso responsável e saúde digital">
        <p>
          O Veritas Dei é uma ferramenta devocional e comunitária — não um substituto para a vida
          sacramental presencial, aconselhamento psicológico, terapia ou acompanhamento médico. Busque
          orientação pastoral real; cultive o silêncio e o recolhimento fora da tela.
        </p>
      </LegalSection>

      <LegalSection title="9. Contato">
        <LegalCallout>
          <p>Denúncias urgentes: botão SOS do app e {LEGAL_OPERATOR.contactEmail}</p>
          <p>Apelações: {LEGAL_OPERATOR.contactEmail}</p>
          <p>Privacidade: {LEGAL_OPERATOR.privacyEmail}</p>
        </LegalCallout>
      </LegalSection>
    </LegalDocumentShell>
  )
}
