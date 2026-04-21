'use client'

/**
 * Container de 3 colunas para o modo leitor de estudos.
 *
 * Desktop (lg+): `main` flui até max-w-[1400px] com aside sticky de 320px
 * à direita (TOC de lições). Em md e abaixo a aside é omitida — quem
 * consome fornece um drawer separado.
 *
 * Não altera o AppShell. O `main#main-content` global continua com
 * `md:ml-16`; este layout vive dentro dele.
 */
interface Props {
  /** Coluna lateral direita (desktop lg+). Oculta em < lg. */
  sidebar?: React.ReactNode
  children: React.ReactNode
}

export default function StudyLayout({ sidebar, children }: Props) {
  return (
    <div className="max-w-[1400px] mx-auto w-full px-0 lg:px-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="min-w-0">{children}</div>
        {sidebar ? (
          <aside
            aria-label="Índice de lições"
            className="hidden lg:block sticky top-0 h-screen overflow-y-auto py-6"
          >
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
