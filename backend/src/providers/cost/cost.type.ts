export interface CostLineItem {
  externalId: string;

  service: string;

  team?: string;
  project?: string;
  environment?: string;

  amount: number;
  currency: string;

  date: Date;
  region?: string;
}

export interface CostDateRange {
  startDate: Date;
  endDate: Date;
}