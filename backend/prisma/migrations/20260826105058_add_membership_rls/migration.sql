ALTER TABLE "Membership"
ENABLE ROW LEVEL SECURITY;

CREATE POLICY membership_tenant_isolation
ON "Membership"
USING (
  "organizationId" =
  current_setting('app.current_org_id', true)
)
WITH CHECK (
  "organizationId" =
  current_setting('app.current_org_id', true)
);