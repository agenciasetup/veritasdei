-- Adiciona `telefone` em profiles.
--
-- Coletado no cadastro da página de venda do Veritas Educa (junto com o
-- CPF, que já existe). Serve pra pré-preencher o checkout Asaas — assim o
-- comprador não redigita nome/CPF/telefone na etapa de pagamento.
--
-- `whatsapp` já existe em profiles, mas é um campo público da comunidade;
-- telefone de cobrança é outra coisa e fica separado.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
