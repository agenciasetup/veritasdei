# Códex Veritas — Ideias de Cartas

> **Status:** rascunho de catálogo. Próximo passo (depois da revisão deste doc):
> gerar migrations de seed (`supabase/migrations/2026XXXX_cartas_seed_*.sql`) e
> evoluções de motor quando marcado como `[TODO motor]`.

## 1. Sumário

| Categoria | Raridade | Total proposto | Edição limitada? |
|---|---|---|---|
| A. Conteúdo / Módulo / Provas (regra geral) | Comum / Rara / Épica / Lendária / Suprema | ~96 + 12 + 12 + 1 + 1 | Apenas a Suprema (33 cópias) |
| B. Dogmas Marianos | Lendária / Suprema | 4 + 1 | Lendárias 144 / Suprema 33 |
| C. Cartas-segredo (frases em anotações) | Épica / Lendária / Suprema | 6 + 4 + 2 | Lendárias 144 / Supremas 33 |
| D. Debate | Épica / Lendária / Suprema | 3 + 2 + 1 | Lendárias 144 / Suprema 33 |
| E. Terço / Rosário | Comum / Rara / Épica / Lendária / Suprema | 1+1+3+2+1 | Lendárias 144 / Suprema 33 |
| F. Grupo de Estudo (Apóstolos) | Épica / Lendária / Suprema | 1 + 2 + 1 | Lendárias 144 / Suprema 33 |
| G. Constância (7 dias / streak) | Rara / Épica / Lendária | 1 + 2 + 2 | Lendárias 144 |
| H. Liturgia Dominical (ano litúrgico) | Comum / Rara | ~46 + ~6 | Não |
| I. Convite / Evangelização (Apóstolos) | Épica / Lendária / Suprema | 1 + 12 + 1 | Lendárias 144 cada / Suprema 33 |

**Convenção de raridade**
- **Comum (1–2 ★):** desbloqueio trivial e infinito.
- **Rara (3 ★):** uma vitória clara (uma prova 100%, um rosário completo, festa litúrgica…).
- **Épica (4 ★):** módulo inteiro, evento social, debate vencido.
- **Lendária (5 ★):** condição agregada e simbolicamente forte. **Limitada a 144 cópias no mundo** (referência a Ap 7,4 — 12×12). Quando esgotam, a carta sai do desbloqueio automático.
- **Suprema (5 ★ + selo dourado):** condição máxima de uma trilha temática. **Limitada a 33 cópias no mundo** (idade de Cristo na Páscoa). First-come; depois disso a carta vira pura lenda.

**Paleta de bordas (revisada — sai roxo/azul, entra âmbar/bordô):**

| Raridade | `cor_accent` | Símbolo |
|---|---|---|
| Comum | `#C2B7A6` (pedra/granito) | granito da Igreja |
| Rara | `#D4A574` (âmbar de vela) | cera de vela acesa |
| Épica | `#8B1E3F` (bordô) | sangue dos mártires |
| Lendária | `#E8C766` (ouro velho) | santidade |
| Suprema | `#F4DE96` (creme dourado) | transfiguração |

> **`[TODO motor]` para edição limitada:** a tabela `cartas` precisa ganhar
> `tiragem int` (NULL = ilimitada) e `tiragem_restante int` (NULL = ilimitada).
> A função `fn_avaliar_cartas` precisa decrementar `tiragem_restante` de forma
> atômica (`UPDATE … WHERE tiragem_restante > 0 RETURNING …`) antes de inserir
> em `user_cartas`. Sem isso, "limitada a N" é só decorativo.

---

## 2. Categoria A — Conteúdo, Módulo e Provas (regra geral)

> **Nota — slugs reais.** As 12 trilhas do front (`iniciante`, `sacramental`…)
> não existem como `content_groups` no banco — são apenas agrupamentos
> estáticos em TS. Os **7 pilares canônicos** no Supabase são: `dogmas`,
> `sacramentos`, `mandamentos`, `preceitos`, `oracoes`, `virtudes-pecados`,
> `obras-misericordia`. As cartas A.3/A.4/A.5 foram alinhadas a esses 7
> pilares (única forma de o `grupo_concluido` desbloquear na prática).

### A.1 — "Cada conteúdo terminado" → **Comum**
Uma carta **por subtópico** (~96 cartas comuns).

- **Nome:** `Marca de [Título do Subtópico]`
- **Personagem:** Personagem-mãe da trilha (ex.: `Cristo`, `Maria`, `Pedro`, `Tomás de Aquino`, `José`, `Santos Padres`).
- **Regra:** `{tipo: 'subtopico_concluido', ref: '<uuid>'}`.
- **Recompensa simbólica:** "+1 selo de leitura".
- **Como criar em lote:** script `scripts/cartas/seed-comuns-conteudo.ts` que itera `user_content_progress`-able subtopics e gera uma linha em `cartas` por subtópico.

### A.2 — "Cada prova completa 100%" → **Rara**
Uma por quiz (~12 cartas raras, uma por módulo).

- **Nome:** `Vitória sobre [Tópico da Prova]`
- **Regra:** `{tipo: 'quiz_gabaritado', ref: '<content_ref da study_quizzes>'}` (campo `content_ref` já existe).
- **Recompensa:** "Selo: Conhecedor de [tema]", +XP bônus (já existe via trigger).

### A.3 — "Cada módulo pronto 100%" → **Épica**
Uma por trilha (~12 cartas épicas).

- **Nome:** templates abaixo (cada um amarrado num personagem real do Codex).
- **Regra:** `{tipo: 'grupo_concluido', ref: '<slug da trilha>'}` (já suportado).
- Pode-se adicionar uma 2ª condição com operador `todas`: também ter o quiz gabaritado.

| Trilha | Nome da carta | Personagem | Frase central |
|---|---|---|---|
| `iniciante` | "O Catecúmeno" | Igreja | "Ide e fazei discípulos." (Mt 28,19) |
| `sacramental` | "O Selo dos Sete" | Igreja | "Os sete dons do Espírito" (Is 11,2) |
| `doutrina` | "Fides Quaerens Intellectum" | Tomás de Aquino | "A fé busca a inteligência." (Anselmo) |
| `caridade` | "Mãos de Cristo" | Cristo | "Tudo o que fizestes a um destes pequeninos…" (Mt 25,40) |
| `defesa` | "Apologista" | Justino Mártir | "Estai sempre prontos a dar resposta." (1Pd 3,15) |
| `oracao` | "Orai Sem Cessar" | Teresa d'Ávila | "Orai sem cessar." (1Ts 5,17) |
| `mariologia` | "Filho de Maria" | Maria | "Eis a tua Mãe." (Jo 19,27) |
| `josefologia` | "Ite ad Joseph" | José | "Ide a José." (Gn 41,55 / *Quemadmodum Deus*, Pio IX, 1870) |
| `escatologia` | "Os Novíssimos" | Cristo Rei | "Vinde, benditos de meu Pai." (Mt 25,34) |
| `missa` | "Servo do Altar" | Cristo Eucarístico | "Hoc est enim corpus meum." |
| `perscrutacao` | "Scrutamini Scripturas" | Jerônimo | "Examinai as Escrituras." (Jo 5,39) |
| `latim` | "Lingua Mater" | Igreja Romana | "Ut unum sint." |

### A.4 — "Todos os conteúdos finalizados" → **Lendária**
1 carta. Limitada a 144 cópias.

- **Nome:** `Lumen Doctrinae` ("Luz da Doutrina")
- **Personagem:** Doutores da Igreja (coleção, capitaneada por Tomás de Aquino)
- **Regra:** `operador: 'todas'`, condições = lista das 12 trilhas (`grupo_concluido` × 12).
- **Frase:** "A verdade não pode contradizer a verdade." (Leão XIII, *Aeterni Patris*, 1879)
- **Recompensa:** "Coroa Doutoral", moldura `vitral`.

### A.5 — "Todas as provas feitas 100%" → **Suprema**
1 carta. **Limitada a 33 cópias.**

- **Nome:** `Magister Sacrae Paginae` ("Mestre da Sagrada Página")
- **Personagem:** Cristo, Mestre Único
- **Regra:** `operador: 'todas'`, condições = `quiz_gabaritado` × N (todos os quizzes publicados).
- **Frase:** "Um só é o vosso Mestre, o Cristo." (Mt 23,10)
- **Recompensa:** acesso ao **Modo Debate Mestre** (3 cartas suprema-only).

---

## 3. Categoria B — Dogmas Marianos

Base: `src/features/dogmas/data/dogmas-maria-igreja.ts`. Cada um dos 4 dogmas
ganha uma **Lendária** (limite 144); concluir os 4 abre uma **Suprema** (33).

| Slug | Nome | Raridade | Tiragem | Regra | Frase central |
|---|---|---|---|---|---|
| `theotokos` | "Theotokos" (Mãe de Deus) | Lendária | 144 | `subtopico_concluido` no item do dogma Theotokos | "Bendito o fruto do teu ventre!" (Lc 1,42) |
| `virgindade-perpetua` | "Aeiparthenos" (Sempre Virgem) | Lendária | 144 | `subtopico_concluido` no dogma da Virgindade Perpétua | "Toda formosa és, ó amiga minha." (Ct 4,7) |
| `imaculada-conceicao` | "Tota Pulchra" (Imaculada Conceição) | Lendária | 144 | `subtopico_concluido` no dogma da Imaculada | "Cheia de graça." (Lc 1,28) |
| `assuncao` | "Assumpta Est" (Assunção) | Lendária | 144 | `subtopico_concluido` no dogma da Assunção | "Levantou-se Maria…" (Lc 1,39) |
| `regina-caeli` | **"Regina Caeli"** (Rainha do Céu) | **Suprema** | **33** | `operador: 'todas'` com os 4 acima | "Apareceu no céu um grande sinal: uma mulher vestida de sol." (Ap 12,1) |

- **Personagem:** todas atreladas ao personagem `Maria, Mãe de Deus`.
- **Concílio/autoridade:** Theotokos = Éfeso 431; Imaculada = Pio IX 1854 (*Ineffabilis Deus*); Assunção = Pio XII 1950 (*Munificentissimus Deus*); Virgindade Perpétua = Latrão 649.

---

## 4. Categoria C — Cartas-segredo (anotações)

Usa o tipo `nota_contem_frase` (já no motor — sprint 4). Ideia: certas frases,
quando o usuário **anota** num conteúdo específico, viram uma chave secreta. A
carta `dica_desbloqueio` fica **NULL** (surpresa total) ou um enigma.

> **`[TODO motor]` opcional:** hoje `nota_contem_frase` busca em qualquer nota
> do usuário. Se quisermos amarrar à **anotação no conteúdo específico**,
> adicionar campo `'ref_conteudo'` na condição e filtrar por
> `user_study_notes.content_ref`. Recomendo fazer — dá mais lore.

### C.1 — Épicas (6, sem limite de tiragem)
Frases curtas e marcantes, em conteúdos que naturalmente as sugerem.

| Carta | Conteúdo onde anotar | Frase-chave (lower-case) |
|---|---|---|
| "O Verbo se Fez Carne" | dogma da Encarnação | `verbum caro factum est` |
| "Lumen Gentium" | trilha `iniciante` — A Igreja | `luz das nações` |
| "Extra Ecclesiam" | trilha `defesa` — unicidade da Igreja | `fora da igreja não há salvação` |
| "Una Sancta" | trilha `defesa` — unidade da Igreja | `creio numa só igreja santa católica e apostólica` |
| "Cor ad Cor Loquitur" | trilha `oracao` — oração mental | `coração fala ao coração` |
| "Ad Maiorem Dei Gloriam" | trilha `josefologia` — silêncio de José | `para a maior glória de deus` |

### C.2 — Lendárias (4, 144 cópias cada)
Frases latinas longas — exigem que o usuário tenha estudado a fundo.

| Carta | Frase-chave |
|---|---|
| "Anima Christi" | `alma de cristo, santifica-me` |
| "Tantum Ergo" | `tantum ergo sacramentum veneremur cernui` |
| "Pange Lingua" | `pange lingua gloriosi corporis mysterium` |
| "Te Deum" | `te deum laudamus, te dominum confitemur` |

### C.3 — Supremas (2, 33 cópias cada)
Frases que exigem conhecimento profundo do *Catecismo*.

| Carta | Frase-chave |
|---|---|
| **"Sigillum Confessionis"** | `o sigilo sacramental é inviolável` |
| **"Lex Orandi, Lex Credendi"** | `a lei da oração é a lei da fé` |

---

## 5. Categoria D — Cartas de Debate

> **`[TODO motor]`:** debates hoje rodam em `localStorage` (cf. `src/app/educa/debate/DebateRoom.tsx`).
> Pra ativar essas cartas precisamos:
> 1. Tabela `debate_sessions` (user_id, tema, score_biblico, score_magisterio, score_caridade, vencido_em).
> 2. Endpoint server-to-server `/api/codex/eventos/debate` que valida a IA-juíza e chama `fn_registrar_evento_carta(user, 'debate_vencido', 1)` ou `'debate_perfeito'` quando os 3 scores = 100%.

### D.1 — Épicas (3)
| Carta | Regra | Frase |
|---|---|---|
| "Mestre da Apologia" | `contador 'debates_vencidos' >= 1` | "Estai prontos a dar resposta." (1Pd 3,15) |
| "Espada do Espírito" | `contador 'debates_perfeitos' >= 1` (vencer com 100% em bíblia+magistério+caridade) | "A palavra de Deus é viva e eficaz." (Hb 4,12) |
| "Sal da Terra" | `contador 'debates_vencidos' >= 7` | "Sois o sal da terra." (Mt 5,13) |

### D.2 — Lendárias (2, 144 cada)
| Carta | Regra | Personagem |
|---|---|---|
| "Doctor Angelicus" | `contador 'debates_vencidos' >= 33` **e** ter a carta `Fides Quaerens Intellectum` | Tomás de Aquino |
| "Doctor Gratiae" | `contador 'debates_perfeitos' >= 10` | Agostinho de Hipona |

### D.3 — Suprema (1, 33 cópias)
- **"Athanasius contra Mundum"** — `contador 'debates_perfeitos' >= 33`.
  Frase: "Se o mundo está contra Atanásio, Atanásio está contra o mundo."
  Personagem: Atanásio de Alexandria. Concílio: Niceia 325.

---

## 6. Categoria E — Terço, Rosário e Quantidades

Base: `rosary_sessions.mystery_set` e `completed_at`. **Distinção crítica:**
- **Terço** = 1 conjunto de mistérios (5 mistérios) → 1 linha em `rosary_sessions` com `completed_at not null`.
- **Rosário completo** = 4 conjuntos rezados no mesmo dia (gozosos + luminosos + dolorosos + gloriosos).

> **`[TODO motor]`:** adicionar 2 contadores via trigger em `rosary_sessions`:
> - `tercos_rezados` → +1 por `completed_at` preenchido.
> - `rosarios_completos` → +1 quando, no mesmo `date_trunc('day', completed_at)`, o usuário fechou os 4 `mystery_set` distintos.

### E.1 — Comum: "Um Terço" — `contador 'tercos_rezados' >= 1`
- Personagem: Maria do Rosário. Frase: "Rezai o terço todos os dias." (Fátima)

### E.2 — Rara: "Rosário Completo" — `contador 'rosarios_completos' >= 1`
- Frase: "O Rosário é a minha oração predileta." (São João Paulo II)

### E.3 — Cartas por quantidade de terços
| Nº terços | Nome | Raridade | Tiragem |
|---|---|---|---|
| 3 | "Triduum Mariale" | Rara | — |
| 5 | "Os Cinco Mistérios" | Rara | — |
| 7 | "As Sete Dores de Maria" | Épica | — |
| 10 | "Década Selada" | Épica | — |
| 20 | "Rosário do Vigésimo" | Épica | — |
| 50 | "Cinquenta Aves" | Lendária | 144 |
| 100 | "Centena Coroada" | Lendária | 144 |
| 1000 | **"Mil Aves"** | **Suprema** | **33** |

Regra: `contador 'tercos_rezados' >= N`.

### E.4 — Salas compartilhadas (`rosary_rooms`)
Bônus simbólico — não estava no pedido, mas combina com "Estudo em Grupo":
- "Onde Dois ou Três" — Épica — `contador 'tercos_em_sala' >= 1` (rezou um terço inteiro junto com >= 2 outras pessoas em `rosary_rooms`).

---

## 7. Categoria F — Estudo em Grupo (Apóstolos)

Base: `study_groups`, `study_group_members.joined_at`, `member_count`.

### F.1 — "Os Doze Apóstolos" — **Épica** (já existe, carta-mestra)
- Regra: `grupo_estudo_tamanho >= 12` (já em `cartas_seed_especiais`).
- Concedida aos **12 primeiros membros** quando o 12º entra (trigger já existe).

### F.2 — "Iscariotes" — **Lendária** (144)
- Tema: o **primeiro** que **sai** de um grupo depois dele ter atingido 12.
- Frase central: "Era melhor a esse homem não ter nascido." (Mt 26,24)
- Frase de redenção (`autoridade_doutrinaria`): "Senhor, tu sabes que te amo." (Jo 21,17 — Pedro restaurado)
- Categoria: Sombra.
- **Nota pastoral (lore):** *A Igreja nunca declarou ninguém condenado — o destino final de qualquer alma é mistério reservado a Deus. Esta carta é símbolo catequético do peso de abandonar a comunhão; quem saiu sempre pode voltar — e voltar é "Pedro Restaurado". A carta da volta apaga a sombra desta.*
- **Carta paralena de redenção:** **"Pedro Restaurado"** (Épica, sem limite) — entregue quando o usuário **volta** ao mesmo grupo dentro de 30 dias após sair. Frase: "Apascenta as minhas ovelhas." (Jo 21,17). Quando ganha "Pedro Restaurado", a Igreja confessa: o discípulo voltou.

> **`[TODO motor]`:**
> 1. Adicionar `study_group_members.left_at timestamptz null`.
> 2. Trigger `AFTER UPDATE of left_at` em `study_group_members`: quando passar de NULL → not NULL, se o grupo já teve `member_count >= 12` (campo derivado: `peak_member_count`), e este é o **primeiro** evento `left_at` desse grupo, registrar contador `'foi_o_judas'` ao saidor e chamar `fn_avaliar_cartas`.

### F.3 — "Matias, o Eleito" — **Lendária** (144)
- Tema: o **13º** a entrar num grupo que já passou pelo evento "Judas".
- Frase: "E lançaram a sorte… e a sorte caiu sobre Matias." (At 1,26)
- Regra: `contador 'foi_o_matias' >= 1` registrado pelo mesmo trigger acima quando entra o 13º membro pós-saída do "Judas".

### F.4 — "Pentecostes" — **Suprema** (33)
- Tema: pertencer a um grupo que **atingiu 120 membros** e completou uma trilha juntos (referência aos 120 do cenáculo, At 1,15).
- Regra: `operador: 'todas'` — `grupo_estudo_tamanho >= 120` **e** `grupo_concluido` em qualquer trilha **e** o grupo é o que aparece em `study_group_picks_and_pacts` (cf. migration `20260514300000_study_group_picks_and_pacts.sql`).
- Frase: "Encheram-se todos do Espírito Santo." (At 2,4)

---

## 8. Categoria G — Constância (streak / 7 dias seguidos)

Base: `user_gamification.current_streak`, `longest_streak`.

| Streak | Carta | Raridade | Tiragem |
|---|---|---|---|
| 3 dias | "Tríduo Pascal" | Rara | — |
| 7 dias | **"Os Sete Dias do Verbo"** | Épica | — |
| 14 dias | "Quaresma Curta" | Épica | — |
| 40 dias | "Quaresma do Senhor" | Lendária | 144 |
| 50 dias | "Pentecostes em Mim" | Lendária | 144 |

Regra: `{tipo: 'streak', valor: N}` (já existe).

- "Os Sete Dias do Verbo" — Frase: "Sete vezes ao dia te louvo." (Sl 119,164). Personagem: Bento de Núrsia (regra das horas).

---

## 9. Categoria H — Liturgia Dominical (ano litúrgico)

Base: `liturgia_reflexao_dia`. Hoje não há registro de "abertura" pelo usuário.

> **`[TODO motor]`:**
> 1. Criar `user_liturgia_aberturas (user_id, data date, aberta_em timestamptz, primary key (user_id, data))`.
> 2. Rota client → `INSERT` ao abrir `/educa/liturgia/hoje` (UPSERT idempotente por dia).
> 3. Trigger `AFTER INSERT` chama `fn_registrar_evento_carta(user, 'liturgia_<slug-do-domingo>', 1, 'definir')`.
> 4. O slug do domingo vem de uma tabela `liturgia_calendario (data, slug_domingo, tempo_liturgico, festa)` semeada por ano (script `scripts/liturgia/seed-ano-2027.ts`, etc.).

### Modelo proposto

**1 personagem:** `Calendário Litúrgico`.
**~52 cartas comuns**, uma por domingo do ano litúrgico, mais **~6 raras** pras solenidades de preceito que caem fora de domingo (ou que coincidem — viram festa "dupla").

- **Comum (ano litúrgico):** desbloqueada quando o usuário abre a liturgia **naquele domingo específico**. Regra: `contador 'liturgia_<slug>' >= 1`. Slugs estáveis:
  - **Advento (4):** `advento-1`, `advento-2`, `advento-3` (Gaudete), `advento-4`.
  - **Natal (3):** `natal`, `sagrada-familia`, `maria-mae-de-deus`.
  - **Epifania (1):** `epifania`.
  - **Tempo Comum I (3–8):** `tc-1`, `tc-2`, …, `tc-9`.
  - **Quaresma (5):** `quaresma-1`, `quaresma-2`, `quaresma-3`, `quaresma-4` (Laetare), `quaresma-5`.
  - **Semana Santa (2):** `ramos`, `pascoa`.
  - **Tempo Pascal (6):** `pascoa-2` (Misericórdia), `pascoa-3`, …, `pascoa-7`.
  - **Pentecostes (1):** `pentecostes`.
  - **Tempo Comum II (até Cristo Rei):** `tc-10` … `tc-34` (Cristo Rei).
- **Rara (festas solenes):** `imaculada-conceicao` (8/12), `corpo-de-cristo`, `sagrado-coracao`, `assuncao-de-maria` (15/8), `todos-os-santos` (1/11), `cristo-rei`.

**Anti-bug do ano novo litúrgico:** o motor usa `contador` que só conta `>= 1`,
então quando o ano vira, basta o seed registrar a próxima ocorrência com o
**mesmo slug** (`advento-1`) — quem já tem a carta não ganha de novo (já está em
`user_cartas`); quem não tem, agora pode ganhar. Sem duplicação, sem bug.

Total: ~46 comuns + ~6 raras = ~52 cartas.

---

## 10. Categoria I — Convite / Evangelização (Apóstolos)

> **`[TODO motor]`:** o sistema **não tem** referrals hoje. Proposta:
> 1. Tabela `user_referrals (referrer_id, invitee_id unique, criado_em, ativou_em)`. `ativou_em` = quando o convidado fez login pela 1ª vez.
> 2. Coluna `profiles.codigo_convite text unique` (8 chars).
> 3. Rota de signup que aceita `?ref=<codigo>` e popula `user_referrals`.
> 4. Trigger `AFTER UPDATE of ativou_em` chama
>    `fn_registrar_evento_carta(referrer, 'convites_ativos', 1)`.

### I.1 — Épica: "O Primeiro Convite" — `contador 'convites_ativos' >= 1`
- Frase: "Ide e fazei discípulos de todas as nações." (Mt 28,19)
- Personagem: Cristo, Verbo Encarnado.

### I.2 — 12 Lendárias dos Apóstolos (144 cada)

Uma carta por apóstolo desbloqueada por **N convites ativos** (escala simbólica
crescente). Cada carta retrata o **martírio/missão** do apóstolo.

| # | Carta | Apóstolo | Convites | Missão / Frase |
|---|---|---|---|---|
| 1 | "Pedro, a Pedra" | Pedro | 3 | Roma, crucificado de cabeça pra baixo. *"Tu és Pedro."* (Mt 16,18) |
| 2 | "André, a Cruz em X" | André | 5 | Patras, Grécia. *"Vinde após mim."* |
| 3 | "Tiago Maior, Compostela" | Tiago Maior | 7 | Decapitado em Jerusalém por Herodes Agripa (At 12,2); sepultado em Compostela, segundo a tradição. *"Filho do Trovão."* |
| 4 | "João, o Discípulo Amado" | João | 9 | Éfeso. *"Eis aí teu filho."* (Jo 19,26) |
| 5 | "Filipe, Frígia" | Filipe | 11 | Hierápolis. *"Senhor, mostra-nos o Pai."* (Jo 14,8) |
| 6 | "Bartolomeu, o Esfolado" | Bartolomeu | 13 | Armênia. *"Eis um verdadeiro israelita."* (Jo 1,47) |
| 7 | "Mateus, Etiópia" | Mateus | 15 | Etiópia. *"Segue-me."* (Mt 9,9) |
| 8 | "Tomé, Apóstolo das Índias" | Tomé | 17 | Mylapore, Índia. *"Meu Senhor e meu Deus!"* (Jo 20,28) |
| 9 | "Tiago Menor, Justo" | Tiago Menor | 19 | Jerusalém, atirado do templo. *"A fé sem obras é morta."* (Tg 2,17) |
| 10 | "Judas Tadeu, Esperança" | Judas Tadeu | 21 | Pérsia. *"Tem piedade de nós."* |
| 11 | "Simão, o Zelote" | Simão Zelote | 23 | Pérsia, serrado ao meio. *"Zelo pela tua casa me devora."* (Sl 69,9) |
| 12 | "Matias, o Eleito" | Matias | 25 | Etiópia/Cólquida. *"E a sorte caiu sobre Matias."* (At 1,26) |

Regra: `{tipo: 'contador', ref: 'convites_ativos', valor: N}`. A escala é
**cumulativa** — quem chega a 25 ganha todas as 12 (efeito catequético: você
convidou tanto que se tornou os Doze).

### I.3 — Suprema: "Paulo, o Apóstolo das Gentes" (33)
- **Convites ativos >= 50** **e** ter completado a trilha `perscrutacao`.
- Frase: "Vaso de eleição." (At 9,15)
- Concílio: Jerusalém (At 15) — primeiro concílio.
- Recompensa: badge `Apostolus Gentium` no perfil.

---

## 11. Resumo numérico

| Bloco | Cartas |
|---|---|
| A. Conteúdo / Módulo / Provas | ~96 comuns + 12 raras + 12 épicas + 1 lendária + 1 suprema = **~122** |
| B. Dogmas Marianos | 4 lendárias + 1 suprema = **5** |
| C. Cartas-segredo | 6 + 4 + 2 = **12** |
| D. Debate | 3 + 2 + 1 = **6** |
| E. Terço / Rosário | 1 + 1 + 3 + 3 + 2 + 1 = **11** |
| F. Grupo (Apóstolos) | 1 + 2 + 1 = **4** |
| G. Constância | 1 + 2 + 2 = **5** |
| H. Liturgia | ~46 + 6 = **~52** |
| I. Convite | 1 + 12 + 1 = **14** |
| **Total** | **~231 cartas** |

---

## 12. Próximos passos sugeridos

1. **Revisar este doc** (você): cortar, renomear, ajustar frases e tiragens.
2. **Aprovar evoluções de motor** marcadas `[TODO motor]`:
   - `cartas.tiragem` + `cartas.tiragem_restante` (essencial — sem isso "limitada" é fake).
   - `study_group_members.left_at` + `peak_member_count` (pro "Judas/Matias").
   - `user_liturgia_aberturas` + `liturgia_calendario` (pra liturgia dominical).
   - `user_referrals` + `profiles.codigo_convite` (pros apóstolos).
   - `debate_sessions` + rota `/api/codex/eventos/debate` (pras cartas de debate).
3. **Seeds em ordem:**
   - `2026XXXX_cartas_personagens.sql` — todos os personagens (Cristo, Maria, José, Apóstolos, Padres da Igreja, Doutores, Calendário Litúrgico).
   - `2026XXXX_cartas_seed_a_conteudo.sql` — A.1 a A.5 (geradas em script, não à mão).
   - `2026XXXX_cartas_seed_b_marianos.sql` — B.
   - `2026XXXX_cartas_seed_c_segredos.sql` — C.
   - `2026XXXX_cartas_seed_d_debate.sql` — D (depende do motor).
   - `2026XXXX_cartas_seed_e_rosario.sql` — E (depende do motor de contadores).
   - `2026XXXX_cartas_seed_f_grupo.sql` — F.
   - `2026XXXX_cartas_seed_g_streak.sql` — G.
   - `2026XXXX_cartas_seed_h_liturgia_2027.sql` — H (um por ano litúrgico).
   - `2026XXXX_cartas_seed_i_convite.sql` — I.
