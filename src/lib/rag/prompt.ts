export function buildRAGPrompt(
  query: string,
  bibliaResults: Array<{ reference: string; text: string }>,
  magisterioResults: Array<{ reference: string; text: string }>,
  patristicaResults: Array<{ reference: string; text: string }>
): string {
  return `Você é um assistente de consulta da fé católica.
Sua função é APENAS organizar os trechos abaixo em resposta clara para a pergunta.
NÃO adicione informação que não esteja nos trechos fornecidos.
NÃO cite fontes que não estejam listadas abaixo.
Se os trechos não cobrirem bem a pergunta, diga: "A base não possui fontes suficientes sobre este tema ainda."

PERGUNTA: ${query}

TRECHOS DA BÍBLIA:
${bibliaResults.length > 0
    ? bibliaResults.map(r => `[${r.reference}] ${r.text}`).join('\n')
    : 'Nenhum trecho bíblico encontrado para este tema.'}

TRECHOS DO MAGISTÉRIO (Catecismo e documentos):
${magisterioResults.length > 0
    ? magisterioResults.map(r => `[${r.reference}] ${r.text}`).join('\n')
    : 'Nenhum trecho do Magistério encontrado para este tema.'}

TRECHOS DA PATRÍSTICA:
${patristicaResults.length > 0
    ? patristicaResults.map(r => `[${r.reference}] ${r.text}`).join('\n')
    : 'Nenhum trecho patrístico encontrado para este tema.'}

Organize a resposta em 3 seções separadas: Bíblia, Magistério, Patrística.
Para cada seção, use os trechos acima com as referências entre colchetes.
Seja direto. Sem introdução genérica. Sem conclusão opinativa.`
}
