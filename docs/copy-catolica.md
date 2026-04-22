# Guia Editorial — Devoção Católica no Veritas Dei

Este guia rege toda copy **user-facing** do produto em contextos devocionais (santos, orações, sacramentais, liturgia, gamificação espiritual, testemunhos).

É uma ferramenta de proteção — do usuário (contra superstição/heterodoxia) e do produto (contra reputação de "app místico vulgar"). Toda mudança que toque estes contextos **deve** ser passada por ele antes do merge.

---

## 1. Fundamentos teológicos

Cinco princípios regem decisões de copy e UI:

### P1. O santo intercede, não age

> "Há um só Deus, e um só mediador entre Deus e os homens: Jesus Cristo, homem."  
> 1 Tm 2,5

Os santos **intercedem** por nós diante de Deus. Quem age é Deus. O santo é irmão mais velho em Cristo que leva nossa oração ao Pai. Nunca diga que o santo "resolve", "atende", "concede", "dá graças" — sempre peça a **intercessão** dele.

**Referências:** CIC §956 (comunhão dos santos), CIC §2683 (intercessão).

### P2. A oração é medida pelo amor, não pela quantidade

> "Quando rezardes, não sejais como os hipócritas, que gostam de orar em pé nas sinagogas e nas esquinas das ruas para serem vistos pelos homens."  
> Mt 6,5-8

Nada de ranking público de oração, streak competitivo, badge "devoto top 1%", pontos de piedade. Contadores privados (só o user vê) são aceitáveis como memória pessoal. Contadores públicos ou gamificação visível da oração são **proibidos**.

### P3. Intenção ≠ transação

> "Vós recebestes de graça, dai de graça."  
> Mt 10,8

Novena, oração, medalha, oferecimento — são atos de devoção, **não contratos com Deus**. Nunca "9 dias = pedido atendido"; nunca "acenda e receba graça"; nunca "pague o santo". A intenção é oferecimento livre ao amor de Deus.

### P4. Materialidade importa

Vela real é sacramental (CIC §1670) — tem matéria, luz, oração que continua quando o orante sai. "Vela virtual" não tem nada disso. Seja honesto: equivalente digital é **intenção registrada**, não ritual. Nomear com precisão: "oferecer intenção" > "acender vela virtual".

### P5. Graça recebida ≠ milagre

Milagre é categoria canônica com processo formal: comissão médica, tribunal eclesiástico, decreto papal. Usuários relatam **graças recebidas** — esse é o termo. "Milagre" sem reconhecimento oficial da Igreja é uso **indevido**, mesmo quando o relato é sincero.

**Referências:** Congregação das Causas dos Santos, processo de canonização.

---

## 2. Glossário — palavras proibidas e substitutas

### Em contexto devocional

| ❌ Evitar | ✅ Usar |
|---|---|
| "São X vai resolver sua causa" | "Peça a intercessão de São X junto ao Senhor" |
| "São X vai atender" | "Confie a sua intenção a Deus pela intercessão de São X" |
| "São X concede graças" | "São X intercede por você" |
| "Santo protetor de X" | "São X, padroeiro de X" (termo canônico correto) |
| "Milagre recebido" | "Graça recebida" (com disclaimer obrigatório — ver §3) |
| "Acenda uma vela" (em UI digital) | "Ofereça uma intenção" |
| "Novena cumprida / atendida" | "Novena rezada / oferecida" |
| "Receba graça" | "Peça a graça" |
| "Garantido", "poderoso", "infalível" | (remover — linguagem mágica) |
| "Promessa do santo" | "Tradição devocional" / "Palavra do santo" |
| "Poder do santo" | "Intercessão do santo" |
| "Canalizar" qualquer coisa | (proibido — ocultismo) |
| "Espírito de X" (referindo-se a um santo) | "Alma de X" / "São X" |
| "Energia sagrada" | "Graça divina" |
| "Vibração espiritual" | (proibido — New Age) |

### Em contexto de gamificação espiritual

| ❌ Evitar | ✅ Usar |
|---|---|
| "Relíquia" (como prêmio/badge) | "Selo de devoção" / "Medalha" |
| "Desbloqueie relíquias sagradas" | "Receba selos pela sua jornada" |
| "Colete relíquias" | "Registre sua jornada" |
| "Rank de oração" | (remover — viola P2) |
| "Streak de oração" em público | "Memória de perseverança" (só privada) |
| "Top devoto da semana" | (remover) |
| "Score espiritual" | (remover) |

### Em contexto litúrgico

| ❌ Evitar | ✅ Usar |
|---|---|
| "Festa do santo" (informal) | "Memória litúrgica de São X" / "Festa de São X" (conforme calendário) |
| "Comemoração" (quando é memória obrigatória) | Usar o grau correto: **memória**, **memória obrigatória**, **festa**, **solenidade** |
| "Terço poderoso" | "Terço" (sem adjetivos mágicos) |
| "Oração milagrosa" | "Oração" (ou cite o nome tradicional sem o adjetivo) |

---

## 3. Disclaimers obrigatórios

Alguns contextos exigem disclaimer visível para blindar o produto e esclarecer o usuário:

### 3.1 Testemunhos de graças recebidas

Rodapé visível em **toda** página/feed de testemunho:

> _Testemunho pessoal do usuário. A Igreja Católica reconhece milagres apenas por processo canônico formal (exame médico independente, tribunal eclesiástico, decreto pontifício). Relatos publicados aqui não são pronunciamento da Igreja._

### 3.2 Orações geradas no app

Toda oração no banco deve ter campo `reference` preenchido com fonte canônica. Quando a oração for composição devocional (paráfrase de tradição), indicar: "Tradição devocional católica pt-BR" ou fonte específica.

### 3.3 Biografias de santos

Quando a biografia for resumo: "Síntese a partir do Martirológio Romano, Liturgia das Horas e Enciclopédia Católica."

### 3.4 Páginas devocionais em geral

Rodapé discreto nas páginas de santos, orações, sacramentais:

> _Conteúdo baseado no Catecismo da Igreja Católica e em devoções aprovadas pela Santa Sé._

### 3.5 Selos de devoção (ex-"relíquias")

Na primeira visita à página "Selos":

> _Selos devocionais são marcadores simbólicos da sua jornada de fé no app. Não se confundem com **relíquias** no sentido canônico — restos mortais ou objetos de santos, que são veneradas pela Igreja em seus locais próprios. Ver CIC §1674._

---

## 4. Processo de revisão

### 4.1 Quando um PR toca copy devocional

Qualquer mudança em um destes arquivos/pastas **exige** revisão doutrinária antes de merge:

- `src/app/santos/**`
- `src/app/oracoes/**`
- `src/components/devocao/**`
- `src/features/prayers/**`
- `src/components/gamification/**` (quando afeta copy)
- `supabase/migrations/*santos*.sql`
- `supabase/migrations/*prayer*.sql`
- `supabase/migrations/*oracoes*.sql`

### 4.2 Checklist de PR

Template em `.github/pull_request_template.md` com seção obrigatória para PRs doutrinários:

- [ ] Nenhum termo do glossário proibido (§2) foi introduzido
- [ ] Todo texto devocional novo tem fonte citada (§3.2)
- [ ] Nenhuma promessa transacional foi feita (P3)
- [ ] Nenhum ranking/streak público de oração foi introduzido (P2)
- [ ] Disclaimers obrigatórios presentes onde requeridos (§3)
- [ ] "Relíquia" não é usado como sinônimo de badge/prêmio (§2)
- [ ] "Milagre" só aparece em contexto canônico legítimo
- [ ] O santo é apresentado como **intercessor**, não agente (P1)

### 4.3 Revisor eclesiástico

O produto deve ter um **consultor teológico católico** (padre, diácono ou teólogo laico formado) como revisor de copy devocional. Responsabilidades:

- Revisar PRs com label `doutrinario:review-necessario`
- Endossar publicamente o conteúdo (página `/ortodoxia` no site)
- Revisar novas orações antes de publicação
- Consultar em casos de dúvida teológica

Badge público "Revisado por [Nome, credencial, data]" em conteúdo aprovado quando aplicável.

---

## 5. Fontes pré-aprovadas para conteúdo devocional

**Permitidas** (hierarquia de autoridade):

1. **Sagrada Escritura** (Bíblia canônica)
2. **Catecismo da Igreja Católica** (CIC)
3. **Compêndio do CIC**
4. **Documentos do Magistério** — encíclicas, cartas apostólicas, exortações
5. **Vatican.va** (textos pontifícios oficiais)
6. **Liturgia das Horas** (edição CNBB, aprovada pela CELAM)
7. **Missal Romano** (3ª edição típica)
8. **Martirológio Romano**
9. **Acta Apostolicae Sedis (AAS)**
10. **Enciclopédia Católica** (Catholic Encyclopedia, 1913, domínio público — exceto onde superada por Magistério posterior)
11. **Textos dos Doutores da Igreja** (leitura cuidadosa — contexto histórico)
12. **Hagiografias aprovadas** — Bollandistas, Butler's Lives, etc.

**Não permitidas:**

- Wikipédia (sem verificação cruzada com fonte canônica)
- Blogs pessoais, mesmo de padres/teólogos individuais
- Vidências privadas **não reconhecidas oficialmente** pela Igreja
- Devoções que foram **condenadas, suspensas ou reprovadas** pelo Magistério
- Apócrifos de qualquer natureza
- Livros de espiritualidade New Age, esotérica ou sincretista
- "Tradição oral" popular sem atestação canônica

**Em caso de dúvida:** consultar revisor eclesiástico.

---

## 6. Casos de uso (exemplos reais)

### 6.1 Página de detalhe de um santo

**✅ Correto:**
> São Francisco de Assis, rogai por nós.
>
> Padroeiro dos animais, da ecologia e da Itália. Festa litúrgica em 4 de outubro.
>
> Tradição devocional: "Senhor, fazei de mim instrumento de vossa paz..."
>
> _Oração atribuída a São Francisco. Tradição devocional católica, séculos XIX–XX. Texto em uso nos missais e liturgias do Papa Francisco._

**❌ Incorreto:**
> São Francisco é o protetor dos animais e vai resolver seus problemas com bichinhos de estimação. Reze essa oração milagrosa e receba graças!

### 6.2 Call-to-action em novena

**✅ Correto:**
> Reze a novena a Santa Teresinha: 9 dias de oração em companhia da Santa, unindo sua intenção à dela diante de Deus.

**❌ Incorreto:**
> Complete a novena em 9 dias e Santa Teresinha atenderá seu pedido! Não pule nenhum dia ou perde a graça.

### 6.3 Testemunho de graça recebida

**✅ Correto:**
> Após semanas de oração pela intercessão de São Judas Tadeu, recebi a graça que havia pedido. Agradeço a Deus e a São Judas por esse sinal.
>
> _Testemunho pessoal do usuário. A Igreja Católica reconhece milagres apenas por processo canônico formal._

**❌ Incorreto:**
> São Judas fez o milagre que eu pedi! Ele é o santo das causas impossíveis, rezem que ele atende!

### 6.4 Selo de devoção (gamificação)

**✅ Correto:**
> Selo de Perseverança — registrado por 30 dias consecutivos de estudo.

**❌ Incorreto:**
> Relíquia Lendária Desbloqueada! +500 pontos de Fé!

### 6.5 Oferecer intenção

**✅ Correto:**
> Oferecer uma intenção ao Senhor, pedindo a intercessão de São José.

**❌ Incorreto:**
> Acenda uma vela virtual para São José e ele vai cuidar do seu pedido.

---

## 7. Manutenção deste guia

- **Versionamento:** atualizações exigem PR com label `doutrinario:review-necessario`
- **Histórico:** git log é o histórico autoritativo de mudanças
- **Idioma:** este guia cobre português pt-BR. Adaptações para outros idiomas exigem revisão litúrgica/teológica local (CELAM, conferências episcopais)
- **Revisão periódica:** sugerida anualmente, ou sempre que houver documento magisterial novo relevante

---

## 8. Dúvidas e decisões pendentes

Caso você esteja em dúvida sobre uma construção de copy, antes de fazer qualquer aposta:

1. Consulte os 5 princípios (§1) — há violação?
2. Consulte o glossário (§2) — há termo proibido?
3. Se ainda em dúvida, prefira a construção **mais sóbria**. A Igreja é mãe: fala com ternura, mas sem promessas exageradas
4. Em última instância, escale para revisor eclesiástico

**Regra de ouro:** _quando em dúvida, soe como um livro de espiritualidade sério, não como um panfleto de rua._
