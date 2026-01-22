import { config } from "dotenv";
import { marketState } from "./tools/market-state.js";
import { themeHeat } from "./tools/theme-heat.js";
import { signalExplain } from "./tools/signal-explain.js";
import { riskCoach } from "./tools/risk-coach.js";
import { reviewAnalyze } from "./tools/review-analyze.js";
import { strategyCritic } from "./tools/strategy-critic.js";
import { ensembleJudge } from "./tools/ensemble-judge.js";

config();

/**
 * 智能体 MCP Server
 * 提供 7 个核心工具：
 * - market_state: 市场状态解释
 * - theme_heat: 题材热度分析
 * - signal_explain: 信号卡生成
 * - risk_coach: 风控建议
 * - review_analyze: 复盘归因
 * - strategy_critic: 策略评估
 * - ensemble_judge: 并行策略仲裁
 */

export {
  marketState,
  themeHeat,
  signalExplain,
  riskCoach,
  reviewAnalyze,
  strategyCritic,
  ensembleJudge,
};

// CLI for testing
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "market_state": {
      const inputBundle = {
        market: {
          riskLight: "YELLOW",
          bombRate: 0.18,
          limitUpCount: 68,
          limitDownCount: 12,
          maxStreak: 5,
        },
        strategyContext: {
          dataQuality: { isDegraded: false },
          timestamp: new Date().toISOString(),
        },
      };
      const result = await marketState(inputBundle);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "theme_heat": {
      const inputBundle = {
        market: { riskLight: "YELLOW", bombRate: 0.18, limitUpCount: 68, limitDownCount: 12, maxStreak: 5 },
        themes: [
          { name: "AI应用", tier: "MAIN", strength: 0.85, leaders: ["300xxx"] },
          { name: "机器人", tier: "MAIN", strength: 0.78, leaders: ["300yyy"] },
          { name: "地产", tier: "FADING", strength: 0.28, leaders: [] },
        ],
        strategyContext: {
          dataQuality: { isDegraded: false },
          timestamp: new Date().toISOString(),
        },
      };
      const result = await themeHeat(inputBundle);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "signal_explain": {
      const input = {
        symbol: "300xxx",
        inputBundle: {
          market: { riskLight: "YELLOW", bombRate: 0.18, limitUpCount: 68, limitDownCount: 12, maxStreak: 5 },
          strategyContext: {
            dataQuality: { isDegraded: false },
            timestamp: new Date().toISOString(),
          },
        },
        aggregatedItem: {
          score: 82.4,
          action: "ALLOW",
          confidence: 0.78,
          tags: ["回封", "AI应用"],
          triggers: [
            { name: "回封速度", status: "PASS", detail: "45s<=60s" },
          ],
          planHint: { maxSinglePosition: 0.1 },
        },
        policyDecision: {
          allowNewTrades: true,
          maxTotalPosition: 0.6,
          maxSinglePosition: 0.1,
          reason: "YELLOW灯折减仓位",
        },
      };
      const result = await signalExplain(input);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "risk_coach": {
      const inputBundle = {
        market: { riskLight: "YELLOW", bombRate: 0.18, limitUpCount: 68, limitDownCount: 12, maxStreak: 5 },
        portfolio: {
          totalValue: 1000000,
          cash: 400000,
          consecutiveLosses: 1,
        },
        strategyContext: {
          dataQuality: { isDegraded: false },
          timestamp: new Date().toISOString(),
        },
      };
      const result = await riskCoach(inputBundle);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "review_analyze": {
      const input = {
        alertId: "a_20260122_001",
        snapshot: {},
        signalCard: {},
        outcome: {
          label: "FAIL",
          pnl: -0.021,
          notes: "炸板后未及时止损",
        },
      };
      const result = await reviewAnalyze(input);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    default:
      console.log("daban-agents-mcp Server ready");
      console.log("Available tools: market_state, theme_heat, signal_explain, risk_coach, review_analyze");
  }
}

main().catch(console.error);
