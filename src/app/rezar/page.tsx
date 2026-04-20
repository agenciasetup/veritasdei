/**
 * `/rezar` é a rota canônica do hub de oração.
 * `/orar` permanece como redirect 301 (ver next.config.ts) durante a
 * transição; ao estabilizar, `/orar` pode ser removido.
 */
import OrarPage from "../orar/page"

export default OrarPage
