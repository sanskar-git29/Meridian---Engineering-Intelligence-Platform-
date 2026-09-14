export interface Organization {
  name: string;
  slug: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export interface CostSummary {
  totalCost: number;
  currency: string;
  averageDailyCost: number;
  previousPeriodCost: number;
  costChangePercent: number;
  highestDailyCost: number;
  highestCostDate: string;
  activeServices: number;
  activeIntegrations: number;
}

export interface CostTrendItem {
  date: string;
  cost: number;
  anomaly?: boolean;
  severity?: "HIGH" | "MEDIUM" | "LOW";
  label?: string;
}

export interface CloudService {
  name: string;
  cost: number;
  percentage: number;
  trend: number;
  status: "ACTIVE" | "INACTIVE" | "WARNING";
}

export interface TeamCost {
  name: string;
  cost: number;
  percentage: number;
  trend: number;
}

export interface ProjectCost {
  name: string;
  cost: number;
  percentage: number;
  trend: number;
}

export interface CostAnomaly {
  date: string;
  title: string;
  actualCost: number;
  expectedCost: number;
  increasePercent: number;
  additionalCost: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

export interface AttributionItem {
  name: string;
  actualCost?: number;
  expectedCost?: number;
  additionalCost: number;
  increasePercent: number;
}

export interface AttributionDetail {
  selectedDate: string;
  actualCost: number;
  expectedCost: number;
  additionalCost: number;
  currency: string;
  services: AttributionItem[];
  teams: AttributionItem[];
  projects: AttributionItem[];
  environments: AttributionItem[];
  regions: AttributionItem[];
}

export interface PullRequestsSummary {
  total: number;
  open: number;
  merged: number;
  closed: number;
}

export interface CiCdSummary {
  totalRuns: number;
  successful: number;
  failed: number;
  successRate: number;
}

export interface CiCdFailure {
  status: "FAILED" | "SUCCESS";
  workflow: string;
  repository: string;
  branch: string;
  actor: {
    name: string;
    role: string;
  };
  failedAt: string;
  duration: string;
  reason: string;
}

export interface RecentActivityItem {
  actor: string;
  action: string;
  type: "CI_FAILURE" | "MERGED_PR" | "OPENED_PR" | "COMMIT";
  time: string;
}

export interface GitHubData {
  repository: string;
  branch: string;
  pullRequests: PullRequestsSummary;
  ciCd: CiCdSummary;
  latestFailure: CiCdFailure;
  recentActivity: RecentActivityItem[];
}

export interface IntegrationItem {
  name: string;
  provider: string;
  status: "ACTIVE" | "INACTIVE";
  lastSynced: string;
}

export interface FilterOptions {
  services: string[];
  teams: string[];
  projects: string[];
  environments: string[];
  regions: string[];
}

export interface DashboardData {
  organization: Organization;
  user: UserProfile;
  summary: CostSummary;
  costTrend: CostTrendItem[];
  services: CloudService[];
  teams: TeamCost[];
  projects: ProjectCost[];
  anomalies: CostAnomaly[];
  attribution: AttributionDetail;
  github: GitHubData;
  integrations: IntegrationItem[];
  filters: FilterOptions;
}
