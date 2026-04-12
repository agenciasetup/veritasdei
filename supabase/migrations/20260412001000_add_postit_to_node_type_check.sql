-- Add 'postit' to the allowed node_type values
-- Applied via Supabase MCP. This stub records the migration.
ALTER TABLE verbum_nodes DROP CONSTRAINT IF EXISTS verbum_nodes_node_type_check;
ALTER TABLE verbum_nodes ADD CONSTRAINT verbum_nodes_node_type_check
  CHECK (node_type = ANY(ARRAY['canonical','figura','versiculo','dogma','conceito','encarnado','postit']));
