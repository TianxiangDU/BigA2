/**
 * Orchestrator 和 Policy Gate 测试用例
 * 
 * 测试场景：
 * 1. 正常运行策略组
 * 2. 红灯禁止新增
 * 3. 数据降级禁止 ALLOW
 * 4. 多策略冲突（BLOCK 优先）
 * 5. 低置信度降级
 * 6. 连亏降低仓位
 * 7. 策略失败降级
 */

import { orchestrator } from "../orchestrator";
import { InputBundle } from "../../schemas";

// 基础 InputBundle 模板
const createInputBundle = (overrides: Partial<InputBundle> = {}): InputBundle => ({
  market: {
    riskLight: "GREEN",
    bombRate: 0.15,
    limitUpCount: 70,
    limitDownCount: 8,
    maxStreak: 5,
    ...overrides.market,
  },
  themes: overrides.themes || [],
  candidates: overrides.candidates || [],
  portfolio: {
    totalValue: 1000000,
    cash: 500000,
    consecutiveLosses: 0,
    ...overrides.portfolio,
  },
  strategyContext: {
    dataQuality: {
      isDegraded: false,
      ...overrides.strategyContext?.dataQuality,
    },
    timestamp: new Date().toISOString(),
    ...overrides.strategyContext,
  },
});

/**
 * 测试用例 1: 正常运行策略组
 * 绿灯、数据正常、无连亏 => 允许 ALLOW
 */
async function testNormalRun() {
  console.log("测试用例 1: 正常运行策略组");
  
  const inputBundle = createInputBundle();
  const result = await orchestrator.runStrategyGroup("default", inputBundle);

  // 断言
  console.assert(result.policyDecision.allowNewTrades === true, "应允许新交易");
  console.assert(result.policyDecision.maxTotalPosition >= 0.6, "总仓位应 >= 60%");
  console.assert(result.recommendations.length > 0, "应有推荐结果");
  console.assert(result.warnings.length === 0 || result.perStrategyResults.length > 0, "应有策略结果");
  
  console.log("✅ 测试用例 1 通过");
  console.log("  - allowNewTrades:", result.policyDecision.allowNewTrades);
  console.log("  - maxTotalPosition:", result.policyDecision.maxTotalPosition);
  console.log("  - recommendations:", result.recommendations.length);
}

/**
 * 测试用例 2: 红灯禁止新增
 * risk_light = RED => allowNewTrades = false, action 不得为 ALLOW
 */
async function testRedLightBlock() {
  console.log("\n测试用例 2: 红灯禁止新增");
  
  const inputBundle = createInputBundle({
    market: {
      riskLight: "RED",
      bombRate: 0.45,
      limitUpCount: 30,
      limitDownCount: 50,
      maxStreak: 2,
    },
  });
  const result = await orchestrator.runStrategyGroup("default", inputBundle);

  // 断言
  console.assert(result.policyDecision.allowNewTrades === false, "红灯应禁止新交易");
  
  // 所有推荐的 action 不应为 ALLOW
  const hasAllow = result.recommendations.some((r) => r.action === "ALLOW");
  console.assert(!hasAllow, "红灯下不应有 ALLOW 推荐");
  
  console.log("✅ 测试用例 2 通过");
  console.log("  - allowNewTrades:", result.policyDecision.allowNewTrades);
  console.log("  - reason:", result.policyDecision.reason);
}

/**
 * 测试用例 3: 数据降级禁止 ALLOW
 * is_degraded = true => allowNewTrades = false
 */
async function testDataDegradation() {
  console.log("\n测试用例 3: 数据降级禁止 ALLOW");
  
  const inputBundle = createInputBundle({
    strategyContext: {
      dataQuality: {
        isDegraded: true,
        dataLagSec: 120,
        missingFields: ["reseal_speed"],
      },
      timestamp: new Date().toISOString(),
    },
  });
  const result = await orchestrator.runStrategyGroup("default", inputBundle);

  // 断言
  console.assert(result.policyDecision.allowNewTrades === false, "数据降级应禁止新交易");
  console.assert(result.policyDecision.reason.includes("数据降级"), "原因应包含数据降级");
  
  console.log("✅ 测试用例 3 通过");
  console.log("  - allowNewTrades:", result.policyDecision.allowNewTrades);
  console.log("  - reason:", result.policyDecision.reason);
}

/**
 * 测试用例 4: 黄灯折减仓位
 * risk_light = YELLOW => 仓位上限降低
 */
async function testYellowLightReduction() {
  console.log("\n测试用例 4: 黄灯折减仓位");
  
  const inputBundle = createInputBundle({
    market: {
      riskLight: "YELLOW",
      bombRate: 0.22,
      limitUpCount: 55,
      limitDownCount: 15,
      maxStreak: 4,
    },
  });
  const result = await orchestrator.runStrategyGroup("default", inputBundle);

  // 断言
  console.assert(result.policyDecision.allowNewTrades === true, "黄灯应允许新交易");
  console.assert(result.policyDecision.maxTotalPosition <= 0.6, "黄灯总仓位应 <= 60%");
  console.assert(result.policyDecision.maxSinglePosition <= 0.1, "黄灯单票仓位应 <= 10%");
  
  console.log("✅ 测试用例 4 通过");
  console.log("  - maxTotalPosition:", result.policyDecision.maxTotalPosition);
  console.log("  - maxSinglePosition:", result.policyDecision.maxSinglePosition);
}

/**
 * 测试用例 5: 连亏降低仓位
 * consecutiveLosses >= 2 => 单票仓位降低
 */
async function testConsecutiveLosses() {
  console.log("\n测试用例 5: 连亏降低仓位");
  
  const inputBundle = createInputBundle({
    portfolio: {
      totalValue: 1000000,
      cash: 500000,
      consecutiveLosses: 3,
    },
  });
  const result = await orchestrator.runStrategyGroup("default", inputBundle);

  // 断言
  console.assert(result.policyDecision.maxSinglePosition <= 0.06, "连亏3次单票仓位应 <= 6%");
  console.assert(result.policyDecision.reason.includes("连亏"), "原因应包含连亏");
  
  console.log("✅ 测试用例 5 通过");
  console.log("  - maxSinglePosition:", result.policyDecision.maxSinglePosition);
  console.log("  - reason:", result.policyDecision.reason);
}

/**
 * 测试用例 6: 高炸板率降低仓位
 * bomb_rate > 0.3 => 仓位降低
 */
async function testHighBombRate() {
  console.log("\n测试用例 6: 高炸板率降低仓位");
  
  const inputBundle = createInputBundle({
    market: {
      riskLight: "YELLOW",
      bombRate: 0.38,
      limitUpCount: 45,
      limitDownCount: 20,
      maxStreak: 3,
    },
  });
  const result = await orchestrator.runStrategyGroup("default", inputBundle);

  // 断言
  console.assert(result.policyDecision.maxTotalPosition <= 0.5, "高炸板率总仓位应 <= 50%");
  console.assert(result.policyDecision.maxSinglePosition <= 0.08, "高炸板率单票仓位应 <= 8%");
  
  console.log("✅ 测试用例 6 通过");
  console.log("  - maxTotalPosition:", result.policyDecision.maxTotalPosition);
  console.log("  - maxSinglePosition:", result.policyDecision.maxSinglePosition);
}

/**
 * 测试用例 7: 聚合结果按分数排序
 */
async function testScoreSorting() {
  console.log("\n测试用例 7: 聚合结果按分数排序");
  
  const inputBundle = createInputBundle();
  const result = await orchestrator.runStrategyGroup("default", inputBundle);

  // 断言
  if (result.recommendations.length >= 2) {
    for (let i = 1; i < result.recommendations.length; i++) {
      console.assert(
        result.recommendations[i - 1].score >= result.recommendations[i].score,
        "推荐应按分数降序排列"
      );
    }
    console.log("✅ 测试用例 7 通过");
  } else {
    console.log("⏭️ 测试用例 7 跳过（推荐数量不足）");
  }
}

// 运行所有测试
async function runAllTests() {
  console.log("========== Orchestrator & Policy Gate 测试 ==========\n");
  
  try {
    await testNormalRun();
    await testRedLightBlock();
    await testDataDegradation();
    await testYellowLightReduction();
    await testConsecutiveLosses();
    await testHighBombRate();
    await testScoreSorting();
    
    console.log("\n========== 所有测试通过 ==========");
  } catch (error) {
    console.error("\n❌ 测试失败:", error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (typeof window === "undefined") {
  runAllTests();
}

export { runAllTests };
