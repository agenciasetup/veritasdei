import { NextResponse } from 'next/server'
import { z, type ZodSchema } from 'zod'

/**
 * Parse e valida JSON body contra um schema zod. Retorna o valor
 * parseado ou um NextResponse 400 pronto pra retornar.
 *
 * Uso:
 *   const body = await parseJson(req, Schema)
 *   if (body instanceof NextResponse) return body
 *   // body: z.infer<typeof Schema>
 */
export async function parseJson<T extends ZodSchema>(
  req: Request,
  schema: T,
): Promise<z.infer<T> | NextResponse> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    // Expor só o path dos erros — não vazar mensagens internas do zod
    // que podem conter contexto de schema privado.
    const paths = parsed.error.issues.map(i => i.path.join('.') || '(root)')
    return NextResponse.json(
      { error: 'invalid_fields', fields: paths },
      { status: 400 },
    )
  }
  return parsed.data
}

// ─── Schemas reutilizáveis ───────────────────────────────────────────────

/**
 * URL que representa um caminho interno do app. Usado em campos como
 * `target_url` de notificações — evita que um atacante cadastre
 * `javascript:alert(1)` ou `//evil.com`.
 */
export const internalPathSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(
    v => v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\'),
    { message: 'Deve ser um caminho interno começando com "/".' },
  )
  .refine(
    v => !/[\u0000-\u001F\u007F]/.test(v),
    { message: 'Caracteres de controle não permitidos.' },
  )

/** UUID v4/v5 padrão do Postgres. */
export const uuidSchema = z
  .string()
  .uuid()

/** Email básico — usado em shares e invites. */
export const emailSchema = z
  .string()
  .email()
  .max(320) // RFC 5321
  .transform(v => v.toLowerCase().trim())
