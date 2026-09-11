-- This is an empty migration.ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "CostRecord" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ResourceUtilization" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_tenant_isolation"
ON "Integration"
USING (
  "organizationId" = current_setting('app.current_org_id', true)
)
WITH CHECK (
  "organizationId" = current_setting('app.current_org_id', true)
);


CREATE POLICY "cost_record_tenant_isolation"
ON "CostRecord"
USING (
  "organizationId" = current_setting('app.current_org_id', true)
)
WITH CHECK (
  "organizationId" = current_setting('app.current_org_id', true)
);


CREATE POLICY "resource_utilization_tenant_isolation"
ON "ResourceUtilization"
USING (
  "organizationId" = current_setting('app.current_org_id', true)
)
WITH CHECK (
  "organizationId" = current_setting('app.current_org_id', true)
);