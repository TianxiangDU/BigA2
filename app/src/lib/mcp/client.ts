import { MCPToolCall, MCPToolResult } from "./types";

/**
 * MCP Client - 与 MCP Server 通信的客户端
 * 
 * MVP 版本使用 Mock Transport，后续可替换为真实的 MCP Transport
 */
class MCPClient {
  private mockMode = true;

  /**
   * 调用 MCP Tool
   */
  async callTool<T = unknown>(
    call: MCPToolCall
  ): Promise<MCPToolResult<T>> {
    const startTime = Date.now();

    try {
      if (this.mockMode) {
        return await this.mockToolCall<T>(call);
      }

      // TODO: 实现真实的 MCP Transport
      throw new Error("Real MCP transport not implemented");
    } catch (error) {
      return {
        success: false,
        error: {
          code: "INTERNAL",
          message: error instanceof Error ? error.message : "Unknown error",
          retryable: true,
        },
        runtimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * 批量调用多个 Tool（并行）
   */
  async callToolsParallel<T = unknown>(
    calls: MCPToolCall[]
  ): Promise<MCPToolResult<T>[]> {
    return Promise.all(calls.map((call) => this.callTool<T>(call)));
  }

  /**
   * Mock Tool 调用（开发/测试用）
   */
  private async mockToolCall<T>(
    call: MCPToolCall
  ): Promise<MCPToolResult<T>> {
    const startTime = Date.now();

    // 模拟网络延迟
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );

    // 根据 tool 返回 mock 数据
    const mockData = this.getMockData(call.server, call.tool, call.args);

    return {
      success: true,
      data: mockData as T,
      runtimeMs: Date.now() - startTime,
    };
  }

  /**
   * 获取 Mock 数据
   */
  private getMockData(
    server: string,
    tool: string,
    args: Record<string, unknown>
  ): unknown {
    // 策略 MCP Mock
    if (server === "daban-strategy-mcp") {
      if (tool === "run_strategy") {
        return this.getMockStrategyResult(args);
      }
      if (tool === "describe_strategy") {
        return this.getMockStrategyDescription(args);
      }
    }

    // 智能体 MCP Mock
    if (server === "daban-agents-mcp") {
      if (tool === "market_state") {
        return this.getMockMarketState();
      }
      if (tool === "theme_heat") {
        return this.getMockThemeHeat();
      }
      if (tool === "signal_explain") {
        return this.getMockSignalExplain(args);
      }
      if (tool === "risk_coach") {
        return this.getMockRiskCoach();
      }
      if (tool === "review_analyze") {
        return this.getMockReviewAnalyze(args);
      }
    }

    return null;
  }

  private getMockStrategyResult(args: Record<string, unknown>): unknown {
    const strategyId = args.strategy_id as string || "reseal_v1";
    return {
      strategy_id: strategyId,
      version: "0.1.0",
      ts: new Date().toISOString(),
      recommendations: [
        {
          symbol: "300xxx",
          name: "示例股A",
          action: "ALLOW",
          score: 82.4,
          confidence: 0.78,
          tags: ["回封", "主线题材"],
          position_hint: { max_single_position: 0.1 },
          triggers: [
            { name: "回封速度", status: "PASS", detail: "45s<=60s" },
            { name: "炸板率", status: "PASS", detail: "18%<=30%" },
          ],
          plan: {
            entry_note: "回封确认后入场",
            exit_rules: [
              "开板30s不回封=>减仓",
              "回撤>18%=>止损",
              "红灯=>停止新增",
            ],
          },
          risks: ["题材分歧可能扩大"],
        },
      ],
      warnings: [],
      meta: { params_used: args.params || {}, runtime_ms: 150 },
    };
  }

  private getMockStrategyDescription(args: Record<string, unknown>): unknown {
    return {
      strategy_id: args.strategy_id,
      name: "回封策略",
      version: "0.1.0",
      description: "基于回封速度和稳定性的打板策略",
      params_schema: {
        max_bomb_rate: { type: "number", default: 0.3 },
        reseal_speed_sec: { type: "number", default: 60 },
        min_volume: { type: "number", default: 300000000 },
      },
    };
  }

  private getMockMarketState(): unknown {
    return {
      type: "MarketState",
      payload: {
        mode: "DIVERGENCE",
        risk_light: "YELLOW",
        reasons: [
          { key: "bomb_rate", value: 0.18, rule: "<=0.30 => ok" },
          { key: "limit_up_count", value: 68, rule: ">50 => 活跃" },
        ],
        suggested_risk: {
          allow_new_trades: true,
          max_total_position: 0.6,
          max_single_position: 0.1,
        },
      },
      meta: {
        agent: "market_state",
        version: "0.2.0",
        ts: new Date().toISOString(),
        confidence: 0.85,
        warnings: [],
      },
    };
  }

  private getMockThemeHeat(): unknown {
    return {
      type: "ThemeHeat",
      payload: {
        top_themes: [
          {
            name: "AI应用",
            tier: "MAIN",
            strength: 0.85,
            leaders: ["300xxx"],
            notes: "主线强势",
          },
          {
            name: "机器人",
            tier: "MAIN",
            strength: 0.78,
            leaders: ["300yyy"],
          },
        ],
        avoid_themes: [
          { name: "地产", reason: "退潮/炸板率高" },
        ],
      },
      meta: {
        agent: "theme_heat",
        version: "0.2.0",
        ts: new Date().toISOString(),
      },
    };
  }

  private getMockSignalExplain(args: Record<string, unknown>): unknown {
    return {
      type: "SignalExplain",
      payload: {
        symbol: args.symbol,
        strategy_group_id: "default",
        action: "ALLOW",
        one_liner: "黄灯分歧，满足回封速度与稳定性，小仓试错",
        triggers: [
          { name: "回封速度", status: "PASS", detail: "45s<=60s" },
          { name: "风险灯", status: "PASS", detail: "YELLOW => 限仓" },
        ],
        plan: {
          max_single_position: 0.1,
          entry_note: "回封确认后小仓入场",
          exit_rules: [
            "开板30s不回封=>减仓",
            "回撤>18%=>止损",
            "红灯=>停止新增",
          ],
        },
        risks: ["题材分歧可能扩大"],
        snapshot_hint: {
          should_create_snapshot: true,
          snapshot_tags: ["signal_card", args.symbol as string],
        },
      },
      meta: {
        agent: "signal_explain",
        version: "0.2.0",
        ts: new Date().toISOString(),
        confidence: 0.78,
      },
    };
  }

  private getMockRiskCoach(): unknown {
    return {
      type: "RiskCoach",
      payload: {
        allow_new_trades: true,
        max_total_position: 0.5,
        max_single_position: 0.08,
        notes: ["YELLOW灯，折减仓位", "无连亏，仓控正常"],
      },
      meta: {
        agent: "risk_coach",
        version: "0.2.0",
        ts: new Date().toISOString(),
      },
    };
  }

  private getMockReviewAnalyze(args: Record<string, unknown>): unknown {
    return {
      type: "ReviewAnalyst",
      payload: {
        alert_id: args.alert_id,
        label: "FAIL",
        root_causes: [
          { factor: "市场退潮", detail: "炸板率从0.18升至0.35" },
        ],
        suggestions: [
          "YELLOW灯且bomb_rate>0.30时下调仓位到0.06",
          "回封速度阈值收紧到45s",
        ],
        summary: "环境恶化导致失败，可收紧阈值",
      },
      meta: {
        agent: "review_analyze",
        version: "0.2.0",
        ts: new Date().toISOString(),
      },
    };
  }
}

// Singleton instance
export const mcpClient = new MCPClient();
