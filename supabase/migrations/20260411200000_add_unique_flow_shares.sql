-- Add UNIQUE constraint to prevent duplicate flow shares (TOCTOU race condition fix)
ALTER TABLE verbum_flow_shares
  ADD CONSTRAINT uq_flow_shares_flow_email UNIQUE (flow_id, shared_with_email);
