/**
 * Constantes compartilhadas entre a rota POST /api/admin/seed e as
 * páginas admin que disparam seeds. Importadas dos dois lados para não
 * drift o header.
 *
 * O valor é um magic string em vez de true/1 para deixar acidentes
 * (copiar cURL, usar Postman com defaults) mais difíceis: você precisa
 * saber o valor exato. Não é segredo criptográfico — a defesa de fato é
 * role admin + auth, este header é o "are you sure?" final.
 */
export const WIPE_CONFIRM_HEADER = 'x-confirm-wipe'
export const WIPE_CONFIRM_VALUE = 'destructive-wipe-yes-i-know'
