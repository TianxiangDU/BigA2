import { z } from "zod";

// MCP Tool Call
export interface MCPToolCall {
  server: string;
  tool: string;
  args: Record<string, unknown>;
  timeoutMs?: number;
}

// MCP Tool Result
export interface MCPToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  runtimeMs: number;
}

// Strategy Registry Configuration
export interface StrategyConfig {
  strategyId: string;
  name: string;
  version: string;
  server: string;
  tool: string;
  enabled: boolean;
  weight: number;
  timeoutMs: number;
  params: Record<string, unknown>;
}

// Strategy Group Configuration
export interface StrategyGroupConfig {
  groupId: string;
  name: string;
  strategies: StrategyConfig[];
  aggregationMethod: "weighted" | "voting" | "filter";
  conflictRule: "block_wins" | "allow_wins";
}

// Agent Configuration
export interface AgentConfig {
  agentId: string;
  server: string;
  tool: string;
  enabled: boolean;
  timeoutMs: number;
}
