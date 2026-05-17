# Plano de Melhoria — Ambiente de Estudo

> Branch: `claude/improve-study-layout-TeCY3`
> Escopo: rota `/estudo/[pilar]/[topico]/[subtopico]` e componentes auxiliares
> Premissas: respeitar os 3 modos — **PÚBLICO**, **PRIVADO**, **EM GRUPO** — que hoje compartilham o mesmo leitor e se diferenciam por contexto de autenticação + visibilidade dos dados (notas/progresso/marcadores).

---

## 1. Diagnóstico (problemas observados)

Referências por arquivo:

| # | Problema | Causa raiz | Onde |
|---|---|---|---|
| D1 | Botão "Editar lição" se sobrepõe ao breadcrumb | `InlineEditOverlay` com `position="top-right"` é renderizado dentro do mesmo container do header, sem reservar espaço quando não há vídeo | `StudyReader.tsx:100-138` |
| D2 | Sidebar de módulos sempre visível (320px), sem como recolher | Grid fixo de 2 colunas no `lg+`; aside é sticky mas não tem toggle | `StudyLayout.tsx:22-31` |
| D3 | Falta capa visual da lição | `ImmersiveReader` desenha só badge + título; `cover_url` existe no schema mas só é usado em listas/cards | `ImmersiveReader.tsx:115-152` |
| D4 | Texto sem ferramenta de marcação (marca-texto/highlight) | Tabela `user_study_notes` é por lição inteira, sem `item_id`/offset | `useStudyNotes.ts`, migrations `20260421200000`, `20260422200000` |
| D5 | Toolbar sticky só tem progresso + fonte | `ReaderToolbar` é minimalista; sem ações de estudo | `ReaderToolbar.tsx:14-56` |
| D6 | Anotações só acessíveis via botão no rodapé do conteúdo | `ActionBar` só aparece após `afterItems` | `StudyReader.tsx:209-228` |
| D7 | Sidebar mostra títulos truncados ("Cada Natureza em Cristo Possui Vo...") | Largura fixa 320px, sem expansão por hover/tooltip | `StudyLessonsTree.tsx` |

---

## 2. Princípios

1. **Leitura primeiro** — qualquer ferramenta nova é opcional, recolhida por padrão, não compete com o texto.
2. **Modos espelhados** — toda ferramenta de marcação/anotação respeita os 3 escopos (privado/grupo/público), reaproveitando o modelo RLS já validado em `user_study_notes`.
3. **Persistência local + remota** — preferências de UI (sidebar colapsada, cores de marcador) vão em `localStorage`; dados em Supabase.
4. **Sem fork de conteúdo** — grupo não duplica lição; só adiciona camada de marcadores/notas visíveis ao grupo. Mantém o que já existe.
5. **Mobile-respeitoso** — qualquer adição precisa ter equivalente em drawer/sheet, ou estar oculta `<lg`.

---

## 3. Fases

### Fase 1 — Limpeza visual (P0, sem migrations)

**Objetivo:** resolver D1, D2, D3 sem mudar banco. Entrega imediata, baixo risco.

1. **Header reorganizado** (`StudyReader.tsx`)
   - Mover breadcrumb para fora do `headerSlot` para uma faixa própria entre toolbar e capa.
   - Botão "Editar lição" sai do canto sobreposto: vira chip discreto à direita do breadcrumb, alinhado ao final, só admin.
   - Ajustar `mb`/`mt` para eliminar a colisão atual.

2. **Sidebar colapsável** (`StudyLayout.tsx` + `StudyLessonsSidebar.tsx`)
   - Adicionar estado `sidebarCollapsed` persistido em `localStorage` (`veritasdei:study:sidebar:collapsed`).
   - Estado expandido: 320px (atual). Estado colapsado: rail de 56px com:
     - Barra vertical de progresso do pilar
     - Ícone do módulo atual
     - Botão "expandir" (ChevronLeft)
   - Toggle posicionado na borda interna do aside (botão circular meio-fora, padrão de IDEs).
   - Em `<lg` continua usando drawer (sem mudança).
   - Atalho de teclado: `[` para colapsar/expandir.

3. **Capa da lição (hero opcional)** (`ImmersiveReader.tsx`)
   - Novo prop `coverUrl?: string | null`.
   - Quando presente, renderiza hero acima do `headerSlot`:
     - Imagem `aspect-[21/9]` com gradiente bottom→top para o fundo da página
     - Título e badge "DOGMA N" sobrepostos no canto inferior (estilo já usado nos cards de módulo)
   - Quando ausente, usa o header centralizado atual (sem regressão).
   - `StudyReader` passa `coverUrl` que já recebe e hoje só usa pro overlay de edição.

4. **Truncamento da sidebar** (`StudyLessonsTree.tsx`)
   - Trocar `truncate` por `line-clamp-2` na lista de subtópicos, com `min-h` fixo para alinhar.
   - Tooltip nativo (`title`) com o nome completo.

**Critério de aceite:** screenshot atual deixa de ter sobreposição "Editar lição" × breadcrumb; usuário consegue colapsar a sidebar e voltar ao estado anterior na próxima visita; lições com `cover_url` mostram hero.

---

### Fase 2 — Floating Reader Toolbar (P1, sem migrations)

**Objetivo:** atacar D5, D6 — toolbar de estudo que acompanha rolagem.

1. **Novo componente** `StudyFloatingToolbar.tsx` (irmão de `ReaderToolbar`)
   - Posição: `fixed`, lado esquerdo do conteúdo, vertical, `top: 40vh`.
   - Em telas `<lg`: vira sheet no rodapé (bottom action bar acima do `StudyNavBar`).
   - Ações sempre visíveis:
     - **Anotações** (abre painel; substitui o `ActionBar` do rodapé que vai sair)
     - **Marcador** (Fase 3)
     - **Indicador** (bookmark — leva ao próximo retorno)
     - **Compartilhar trecho** (Fase 3)
     - **Tamanho de fonte** (move-se do `ReaderToolbar` para cá; libera o topo)
2. **Toolbar contextual de seleção** (selection popover)
   - Aparece ao selecionar texto (`window.getSelection`), próximo ao final da seleção.
   - Ações: marcar (cores), comentar, copiar, ir para a referência bíblica (se o item for `verse`).
   - Esconde ao deselecionar / scroll.
3. **`ReaderToolbar` enxuta** (`ReaderToolbar.tsx`)
   - Mantém só progresso de leitura no topo (faz sentido sticky).
   - Remove botão de fonte (vai pra toolbar lateral).
   - Reduz `py-2 mb-2` para `py-1.5 mb-0` para não competir com o breadcrumb.

**Critério de aceite:** toolbar lateral visível em `lg+`, sheet em mobile; seleção de texto abre popover; nenhuma ação nova grava em banco ainda (Fase 3 conecta).

---

### Fase 3 — Sistema de marca-texto (highlights) (P1, com migration)

**Objetivo:** D4. Adicionar a ferramenta principal pedida.

1. **Nova migration** `supabase/migrations/AAAAMMDDHHMMSS_study_highlights.sql`
   ```sql
   create table user_lesson_highlights (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     content_type text not null,         -- 'dogmas', 'sacramentos', etc.
     content_ref text not null,          -- subtopic_id (UUID em texto, padrão atual)
     item_id uuid not null references content_items(id) on delete cascade,
     char_start integer not null check (char_start >= 0),
     char_end   integer not null check (char_end > char_start),
     color text not null default 'gold' check (color in ('gold','wine','sage','sky','plain')),
     visibility text not null default 'private' check (visibility in ('private','group','public')),
     group_id uuid references study_groups(id) on delete cascade,
     note_id  uuid references user_study_notes(id) on delete set null,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now(),
     constraint highlight_group_required check (visibility <> 'group' or group_id is not null)
   );

   create index on user_lesson_highlights (content_type, content_ref, item_id);
   create index on user_lesson_highlights (user_id);
   create index on user_lesson_highlights (group_id) where group_id is not null;
   ```
   - **RLS espelhando `user_study_notes`** — visibilidade `private` (só dono), `group` (membros do `group_id`), `public` (qualquer leitor da lição).
   - **`item_id` âncora** evita o problema de offsets em HTML cru: cada `content_item` tem `body: text` em coluna; o offset é dentro desse texto.
   - **`note_id` opcional** permite associar um marcador a uma anotação (Fase 4).

2. **Hook** `src/lib/study/useLessonHighlights.ts`
   - `useLessonHighlights(contentType, contentRef)` → `{ highlights, addHighlight, removeHighlight, setVisibility }`.
   - Filtragem por modo: hoje no `useStudyNotes` o RLS já faz o trabalho — repetir o padrão.
   - Cache otimista; refetch em foco da janela.

3. **Render** (`ImmersiveReader.tsx`)
   - Novo wrapper `HighlightableText` envolvendo o `<p>` dos `TextSection`, `VerseSection`, `ListSection`, `PrayerSection`.
   - Recebe `itemId` + lista de highlights desse item; serializa o texto em fragmentos `[normal | highlight]` para envolver com `<mark>` colorido.
   - Eventos de seleção captam `getSelection()` → calcula offsets dentro do `data-item-id` mais próximo via `Range.getBoundingClientRect()` + `node.textContent` walking.
   - Importante: **não renderizar HTML cru** vindo do banco; já é texto puro hoje.

4. **Selection popover** (do Fase 2) conecta:
   - Click em cor → `addHighlight({ itemId, char_start, char_end, color, visibility: defaultVisibility })`.
   - "Anotar" cria highlight + abre prompt rápido → vira nota com `note_id` apontando para o highlight (Fase 4 amarra isso completo).

5. **Toggle de modo da marcação** (no `StudyFloatingToolbar`)
   - Seletor pequeno: 🔒 Privado · 👥 Grupo · 🌐 Público
   - Default: privado para usuário logado fora de grupo; grupo quando entra via `/estudo/grupos/[id]/...`.
   - Mode "público" só liberado quando admin (`role_capabilities` já existe).

**Critério de aceite:** usuário privado consegue marcar trechos, ver na próxima visita, mudar cor/visibilidade; em grupo, marcadores `visibility='group'` aparecem para outros membros com badge do autor; nenhum highlight vaza entre grupos (RLS testado).

---

### Fase 4 — Anotações ancoradas + painel lateral (P2)

**Objetivo:** transformar anotação em algo que faz parte do texto, não um modal isolado.

1. **Anotação rápida na margem**
   - Quando um highlight tem `note_id`, ícone discreto (NotebookPen) aparece na **margem direita** do parágrafo (col absoluta dentro da coluna de leitura).
   - Click expande tooltip com a nota inline; click longo abre o painel completo no contexto.

2. **Painel lateral de anotações** (versão expandida do `StudyNotesPanel`)
   - Abre como drawer lateral esquerdo (não modal central) → permite ler e anotar lado a lado.
   - Aba "Minhas anotações" / "Do grupo" / "Públicas" — filtros por `visibility` já no client.
   - Lista ordenada pela ordem do texto (`item.sort_order` + `char_start`).

3. **Migration leve** — adicionar `highlight_id uuid references user_lesson_highlights(id) on delete set null` em `user_study_notes` (relação inversa do `note_id`, para query rápida).

4. **Notas sem highlight continuam funcionando** (compatibilidade). São renderizadas no topo do painel como "Notas da lição".

**Critério de aceite:** anotar um trecho mostra ícone na margem; painel mostra notas na ordem do texto; click em uma nota faz scroll até o trecho.

---

### Fase 5 — Sidebar TOC: rail com afford do hover (P2)

**Objetivo:** evoluir a Fase 1 — sidebar inteligente.

1. **Rail colapsado** (56px) mostra:
   - Ponto por módulo (acende = atual, contorno = estudado)
   - Hover sobre um ponto: expande painel flutuante daquele módulo (sem mudar o estado global)
2. **Drag handle** entre conteúdo e sidebar para o usuário escolher largura (160–420px), persistido.
3. **Toggle no header global** (`AppShell`) — atalho rápido `[` continua, mas agora também tem botão no canto.

---

### Fase 6 — Polimento dos modos (P2)

1. **Indicador visual de modo**
   - Pequena tag no canto da toolbar lateral: "Privado" / "Grupo: X" / "Público".
   - Em grupo: avatares miniatura dos membros que marcaram naquele item.
2. **URL preserva o grupo**
   - Quando navegando a partir de `/estudo/grupos/[id]`, manter query `?grupo={id}` nas rotas de lição para que marcadores/notas default para `visibility='group'`.
3. **Compartilhar trecho** (do Fase 2)
   - Gera link `/estudo/.../[subtopico]?h=<highlight_id>` que ao abrir faz scroll + flash do trecho.
   - Se highlight for `private`, fallback: cria highlight `public` temporário (TTL 7d) só para o link.

---

## 4. Mudanças no schema (consolidado)

| Migration | Tabela/Coluna | Fase |
|---|---|---|
| `study_highlights` | `user_lesson_highlights` (nova) | 3 |
| `study_highlights_notes` | `user_study_notes.highlight_id` | 4 |

Nenhuma alteração destrutiva. Tudo aditivo.

---

## 5. Componentes a criar/alterar

**Criar:**
- `src/components/study/StudyFloatingToolbar.tsx`
- `src/components/study/SelectionPopover.tsx`
- `src/components/study/HighlightableText.tsx`
- `src/components/study/LessonHero.tsx`
- `src/components/study/SidebarToggle.tsx`
- `src/lib/study/useLessonHighlights.ts`
- `src/lib/study/useTextSelection.ts`

**Alterar:**
- `src/components/study/StudyLayout.tsx` — suporte a colapso
- `src/components/study/StudyReader.tsx` — reorganizar header, passar `coverUrl` para hero, conectar floating toolbar
- `src/components/content/ImmersiveReader.tsx` — receber `cover`, usar `HighlightableText`
- `src/components/content/ReaderToolbar.tsx` — só progresso
- `src/components/study/StudyLessonsTree.tsx` — line-clamp + tooltips, modo rail
- `src/components/study/StudyLessonsSidebar.tsx` — variantes "rail" e "expanded"
- `src/components/study/StudyNotesPanel.tsx` — drawer lateral + aba por visibilidade + scroll-to-anchor

---

## 6. Ordem de entrega sugerida

1. **PR 1 — Fase 1** (limpeza visual): só CSS/JSX, sem migration, alto impacto percebido. Mergeable em 1 dia.
2. **PR 2 — Fase 2** (toolbar flutuante, sem persistência): prepara superfície para Fase 3.
3. **PR 3 — Fase 3** (highlights): migration + hook + render + popover funcional para os 3 modos.
4. **PR 4 — Fase 4** (anotações ancoradas + painel lateral).
5. **PR 5 — Fases 5+6** (polimento da sidebar e dos modos).

Cada PR é independente: Fase 2 funciona sem 3 (botões viram no-ops com tooltip "em breve"), Fase 3 funciona sem 4 (highlight sem nota), etc. Permite ship gradual.

---

## 7. Riscos & mitigações

| Risco | Mitigação |
|---|---|
| Offsets de highlight quebram se admin editar o `body` de um `content_item` | `updated_at` no item; ao carregar, se `highlight.created_at < item.updated_at`, marcar como "órfão" (mostra ícone na margem, não destaca o texto). Tela do admin avisa. |
| Performance de render com muitos highlights públicos | Limitar `public` a max N=50 por item no client; paginar resto via "ver mais marcadores da comunidade". |
| Selection em mobile (toque longo) conflitando com scroll | Usar `selectionchange` com debounce; popover só aparece quando seleção fica estável >300ms. |
| Sobrecarga visual em "público" com muitos marcadores | Modo de exibição na toolbar: "Só meus" / "Meu grupo" / "Comunidade" — default "Só meus + meu grupo". |
| RLS quebrada para grupos | Reaproveitar as policies de `user_study_notes` (mesma forma) e adicionar teste SQL em `supabase/tests/`. |

---

## 8. Fora de escopo (registrado para depois)

- Exportar marcadores/notas como PDF de estudo
- Sincronização offline (PWA) dos highlights
- Compartilhar trecho com imagem gerada (estilo Readwise)
- Histórico de revisão (spaced repetition) a partir dos marcadores
