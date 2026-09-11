export interface MockCostScenario {
  spikeMultiplier?: number;
  spikeServices?: string[];
}

export const defaultMockScenario: MockCostScenario = {
  spikeMultiplier: 1,
  spikeServices: [],
};