import fs from 'fs'
import pdfParse from 'pdf-parse'

export interface PdfChunk {
  text: string
  pageNumber: number
}

export async function extractTextFromPdf(filePath: string): Promise<string[]> {
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse(buffer)

  // pdf-parse retorna texto completo; dividimos por form feed ou estimativa de página
  // Como pdf-parse não dá páginas individuais diretamente, usamos o texto completo
  const pages = data.text.split(/\f/)
  return pages.filter(p => p.trim().length > 0)
}

export function chunkText(
  text: string,
  pageNumber: number,
  maxTokens: number = 400,
  overlapTokens: number = 50
): PdfChunk[] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const chunks: PdfChunk[] = []

  if (words.length === 0) return chunks

  let start = 0
  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length)
    const chunkWords = words.slice(start, end)
    chunks.push({
      text: chunkWords.join(' '),
      pageNumber,
    })

    if (end >= words.length) break
    start = end - overlapTokens
  }

  return chunks
}

export async function chunkPdf(filePath: string): Promise<PdfChunk[]> {
  const pages = await extractTextFromPdf(filePath)
  const allChunks: PdfChunk[] = []

  for (let i = 0; i < pages.length; i++) {
    const pageChunks = chunkText(pages[i], i + 1)
    allChunks.push(...pageChunks)
  }

  return allChunks
}
