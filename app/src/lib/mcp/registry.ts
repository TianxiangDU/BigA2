import { StrategyConfig, StrategyGroupConfig, AgentConfig } from "./types";

// 默认策略配置
const defaultStrategies: StrategyConfig[] = [
  {
    strategyId: "reseal_v1",
    name: "回封策略",
    version: "0.1.0",
    server: "daban-strategy-mcp",
    tool: "run_strategy",
    enabled: true,
    weight: 0.6,
    timeoutMs: 5000,
    params: {
      max_bomb_rate: 0.3,
      reseal_speed_sec: 60,
      min_volume: 300000000,
      min_score: 60,
    },
  },
  {
    strategyId: "firstseal_guard_v1",
    name: "首封保守策略",
    version: "0.1.0",
    server: "daban-strategy-mcp",
    tool: "run_strategy",
    enabled: true,
    weight: 0.4,
    timeoutMs: 5000,
    params: {
      max_bomb_rate: 0.25,
      max_open_count: 2,
      min_volume: 200000000,
      min_score: 65,
    },
  },
];

// 默认策略组
const defaultStrategyGroups: StrategyGroupConfig[] = [
  {
    groupId: "default",
    name: "默认策略组",
    strategies: defaultStrategies,
    aggregationMethod: "weighted",
    conflictRule: "block_wins",
  },
];

// 默认智能体配置
const defaultAgents: AgentConfig[] = [
  {
    agentId: "market_state",
    server: "daban-agents-mcp",
    tool: "market_state",
    enabled: true,
    timeoutMs: 2500,
  },
  {
    agentId: "theme_heat",
    server: "daban-agents-mcp",
    tool: "theme_heat",
    enabled: true,
    timeoutMs: 2500,
  },
  {
    agentId: "signal_explain",
    server: "daban-agents-mcp",
    tool: "signal_explain",
    enabled: true,
    timeoutMs: 4000,
  },
  {
    agentId: "risk_coach",
    server: "daban-agents-mcp",
    tool: "risk_coach",
    enabled: true,
    timeoutMs: 2500,
  },
  {
    agentId: "review_analyze",
    server: "daban-agents-mcp",
    tool: "review_analyze",
    enabled: true,
    timeoutMs: 4000,
  },
];

// Strategy Registry
class StrategyRegistry {
  private strategies: Map<string, StrategyConfig> = new Map();
  private groups: Map<string, StrategyGroupConfig> = new Map();
  private agents: Map<string, AgentConfig> = new Map();

  constructor() {
    // 初始化默认配置
    defaultStrategies.forEach((s) => this.strategies.set(s.strategyId, s));
    defaultStrategyGroups.forEach((g) => this.groups.set(g.groupId, g));
    defaultAgents.forEach((a) => this.agents.set(a.agentId, a));
  }

  // Strategy methods
  getStrategy(strategyId: string): StrategyConfig | undefined {
    return this.strategies.get(strategyId);
  }

  getAllStrategies(): StrategyConfig[] {
    return Array.from(this.strategies.values());
  }

  getEnabledStrategies(): StrategyConfig[] {
    return this.getAllStrategies().filter((s) => s.enabled);
  }

  updateStrategy(strategyId: string, updates: Partial<StrategyConfig>): void {
    const existing = this.strategies.get(strategyId);
    if (existing) {
      this.strategies.set(strategyId, { ...existing, ...updates });
    }
  }

  // Group methods
  getGroup(groupId: string): StrategyGroupConfig | undefined {
    return this.groups.get(groupId);
  }

  getAllGroups(): StrategyGroupConfig[] {
    return Array.from(this.groups.values());
  }

  // Agent methods
  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  getEnabledAgents(): AgentConfig[] {
    return this.getAllAgents().filter((a) => a.enabled);
  }
}

// Singleton instance
export const strategyRegistry = new StrategyRegistry();
