-- Fase 5 / Item 2: índice único parcial em banned_identifiers.
-- Permite que a trigger use ON CONFLICT DO NOTHING ao reinserir o mesmo
-- email/IP banido perpetuamente, sem afetar bans com TTL (que podem
-- coexistir caso operador queira escalonar).

begin;

create unique index if not exists banned_identifiers_kind_hash_perp_uniq
  on public.banned_identifiers (kind, value_hash)
  where expires_at is null;

commit;
