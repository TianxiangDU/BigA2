"""
风控引擎测试用例

测试内容：
1. L0 硬闸门测试
2. L1 风险预算测试
3. L2 市场状态识别测试
4. L3 二次闸门测试
5. 集成测试
"""
import pytest
from datetime import datetime

from services.risk_engine import (
    InputBundle, MarketContext, Portfolio, DataQuality,
    compute_hard_gate, compute_market_regime, compute_risk_budget,
    compute_exposure_adjustments, compute_anomaly_adjustments,
    compute_risk_context, apply_risk_to_aggregated,
    HardGateResult, RegimeResult, RiskBudgetResult
)


# ============ L0 硬闸门测试 ============

class TestHardGate:
    """L0 硬闸门测试"""
    
    def test_data_degraded_blocks(self):
        """数据降级应该禁止新增"""
        input_bundle = InputBundle(
            market=MarketContext(
                data_quality=DataQuality(is_degraded=True)
            )
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == False
        assert result.blocked_reason == "DATA_DEGRADED"
        assert any(r["rule"] == "data_degraded" for r in result.triggered_rules)
    
    def test_data_lag_blocks(self):
        """数据延迟超过阈值应该禁止新增"""
        input_bundle = InputBundle(
            market=MarketContext(
                data_quality=DataQuality(lag_sec=10)  # 超过默认阈值 5
            )
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == False
        assert result.blocked_reason == "DATA_LAG"
    
    def test_risk_light_red_blocks(self):
        """红灯应该禁止新增"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="RED")
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == False
        assert result.blocked_reason == "MARKET_RED"
    
    def test_high_bomb_rate_blocks(self):
        """高炸板率应该禁止新增"""
        input_bundle = InputBundle(
            market=MarketContext(bomb_rate=0.50)  # 超过默认阈值 0.45
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == False
        assert result.blocked_reason == "HIGH_BOMB_RATE"
    
    def test_high_down_limit_blocks(self):
        """高跌停数应该禁止新增"""
        input_bundle = InputBundle(
            market=MarketContext(limit_down_count=100)  # 超过默认阈值 80
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == False
        assert result.blocked_reason == "HIGH_DOWN_LIMIT"
    
    def test_account_drawdown_blocks(self):
        """账户回撤超过阈值应该禁止新增"""
        input_bundle = InputBundle(
            portfolio=Portfolio(drawdown=0.15)  # 超过默认阈值 0.10
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == False
        assert result.blocked_reason == "ACCOUNT_DRAWDOWN"
    
    def test_loss_streak_blocks(self):
        """连亏次数超过阈值应该禁止新增"""
        input_bundle = InputBundle(
            portfolio=Portfolio(loss_streak=3)  # 达到默认阈值 3
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == False
        assert result.blocked_reason == "ACCOUNT_LOSS_STREAK"
    
    def test_normal_allows(self):
        """正常情况应该允许新增"""
        input_bundle = InputBundle(
            market=MarketContext(
                risk_light="GREEN",
                limit_up_count=50,
                limit_down_count=5,
                bomb_rate=0.15,
                data_quality=DataQuality(is_degraded=False, lag_sec=1)
            ),
            portfolio=Portfolio(drawdown=0.02, loss_streak=0)
        )
        result = compute_hard_gate(input_bundle)
        
        assert result.allow_new_trades == True
        assert result.blocked_reason is None


# ============ L2 市场状态识别测试 ============

class TestMarketRegime:
    """L2 市场状态识别测试"""
    
    def test_strong_regime(self):
        """强势市场识别"""
        input_bundle = InputBundle(
            market=MarketContext(
                limit_up_count=100,
                limit_down_count=5,
                bomb_rate=0.15
            )
        )
        result = compute_market_regime(input_bundle)
        
        assert result.regime == "STRONG"
        assert result.suggested_topk == 30  # topk_strong
    
    def test_weak_regime(self):
        """弱势市场识别"""
        input_bundle = InputBundle(
            market=MarketContext(
                limit_up_count=20,
                limit_down_count=10,
                bomb_rate=0.25
            )
        )
        result = compute_market_regime(input_bundle)
        
        assert result.regime == "WEAK"
        assert result.suggested_topk == 10  # topk_weak
    
    def test_chaos_regime(self):
        """混乱市场识别"""
        input_bundle = InputBundle(
            market=MarketContext(
                limit_up_count=30,
                limit_down_count=60,  # 超过 chaos 阈值 50
                bomb_rate=0.35
            )
        )
        result = compute_market_regime(input_bundle)
        
        assert result.regime == "CHAOS"
        assert result.suggested_topk == 5  # topk_chaos
    
    def test_divergence_regime(self):
        """分化市场识别"""
        input_bundle = InputBundle(
            market=MarketContext(
                limit_up_count=50,
                limit_down_count=20,
                bomb_rate=0.25
            )
        )
        result = compute_market_regime(input_bundle)
        
        assert result.regime == "DIVERGENCE"
        assert result.suggested_topk == 20  # topk_divergence
    
    def test_risk_light_from_bomb_rate(self):
        """炸板率影响风控灯"""
        input_bundle = InputBundle(
            market=MarketContext(
                risk_light="GREEN",
                limit_up_count=50,
                bomb_rate=0.35  # 超过 0.30
            )
        )
        result = compute_market_regime(input_bundle)
        
        assert result.risk_light == "YELLOW"


# ============ L1 风险预算测试 ============

class TestRiskBudget:
    """L1 风险预算测试"""
    
    def test_normal_budget(self):
        """正常情况下的风险预算"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="GREEN", bomb_rate=0.15),
            portfolio=Portfolio(drawdown=0.02, loss_streak=0)
        )
        result = compute_risk_budget(input_bundle)
        
        assert result.max_total_position == 0.80
        assert result.max_single_position == 0.10
        assert result.max_new_trades == 5
        assert result.cooldown["enabled"] == False
    
    def test_yellow_light_reduces_budget(self):
        """黄灯降低风险预算"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="YELLOW"),
            portfolio=Portfolio()
        )
        result = compute_risk_budget(input_bundle)
        
        assert result.max_total_position < 0.80
        assert result.max_single_position < 0.10
        assert result.max_new_trades < 5
    
    def test_drawdown_reduces_budget(self):
        """回撤降低风险预算"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="GREEN"),
            portfolio=Portfolio(drawdown=0.08)  # 8% 回撤
        )
        result = compute_risk_budget(input_bundle)
        
        assert result.max_total_position < 0.80
        assert any("drawdown" in r["key"] for r in result.reasons)
    
    def test_loss_streak_reduces_budget(self):
        """连亏降低风险预算"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="GREEN"),
            portfolio=Portfolio(loss_streak=2)
        )
        result = compute_risk_budget(input_bundle)
        
        assert result.max_single_position < 0.10
        assert any("loss_streak" in r["key"] for r in result.reasons)
    
    def test_cooldown_enabled(self):
        """冷却期触发"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="GREEN"),
            portfolio=Portfolio(drawdown=0.12)  # 超过阈值
        )
        result = compute_risk_budget(input_bundle)
        
        assert result.cooldown["enabled"] == True
        assert result.cooldown["reason"] is not None


# ============ L3 二次闸门测试 ============

class TestAdjustments:
    """L3 二次闸门测试"""
    
    def test_exposure_downgrade(self):
        """暴露超限降级"""
        portfolio = Portfolio(
            theme_exposure={"AI": 0.40}  # 已经很高
        )
        candidates = [
            {"symbol": "300xxx", "action": "ALLOW", "theme": "AI"}
        ]
        risk_budget = RiskBudgetResult(
            theme_exposure_caps={"AI": 0.35}  # 上限
        )
        
        adjustments = compute_exposure_adjustments(portfolio, candidates, risk_budget)
        
        assert len(adjustments) == 1
        assert adjustments[0].symbol == "300xxx"
        assert adjustments[0].to_action == "WATCH"
        assert "暴露" in adjustments[0].reason
    
    def test_anomaly_open_count(self):
        """开板次数过多降级"""
        candidates = [
            {"symbol": "300xxx", "action": "ALLOW", "open_count": 5}
        ]
        input_bundle = InputBundle()
        
        adjustments = compute_anomaly_adjustments(candidates, input_bundle)
        
        assert len(adjustments) == 1
        assert adjustments[0].symbol == "300xxx"
        assert "开板" in adjustments[0].reason
    
    def test_anomaly_turnover_rate(self):
        """换手率异常降级"""
        candidates = [
            {"symbol": "300xxx", "action": "ALLOW", "turnover_rate": 35}
        ]
        input_bundle = InputBundle()
        
        adjustments = compute_anomaly_adjustments(candidates, input_bundle)
        
        assert len(adjustments) == 1
        assert "换手率" in adjustments[0].reason
    
    def test_anomaly_volume_ratio(self):
        """量能萎缩降级"""
        candidates = [
            {"symbol": "300xxx", "action": "ALLOW", "volume_ratio": 0.3}
        ]
        input_bundle = InputBundle()
        
        adjustments = compute_anomaly_adjustments(candidates, input_bundle)
        
        assert len(adjustments) == 1
        assert "量能" in adjustments[0].reason


# ============ 集成测试 ============

class TestIntegration:
    """集成测试"""
    
    def test_full_risk_context(self):
        """完整风控上下文计算"""
        input_bundle = InputBundle(
            market=MarketContext(
                risk_light="GREEN",
                limit_up_count=60,
                limit_down_count=10,
                bomb_rate=0.20,
                data_quality=DataQuality(is_degraded=False, lag_sec=1)
            ),
            portfolio=Portfolio(
                total_position=0.30,
                drawdown=0.03,
                loss_streak=0
            )
        )
        
        context = compute_risk_context(input_bundle)
        
        assert context.hard_gate.allow_new_trades == True
        assert context.regime.regime in ["STRONG", "DIVERGENCE", "WEAK", "CHAOS"]
        assert context.risk_budget.max_total_position > 0
        assert "input_hash" in context.meta
    
    def test_apply_risk_to_aggregated(self):
        """应用风控到聚合结果"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="GREEN"),
            portfolio=Portfolio(theme_exposure={"AI": 0.40})
        )
        context = compute_risk_context(input_bundle)
        
        # 模拟聚合结果
        aggregated = [
            {
                "symbol": "300xxx",
                "action": "ALLOW",
                "confidence": 0.75,
                "theme": "AI",
                "open_count": 0,
                "turnover_rate": 10,
                "volume_ratio": 1.2,
            }
        ]
        
        result = apply_risk_to_aggregated(aggregated, context, input_bundle)
        
        # AI 主题已经暴露 40%，超过默认上限 35%，应该降级
        assert result[0]["action"] == "WATCH"
        assert "downgrade_reason" in result[0]
    
    def test_hard_gate_blocks_all(self):
        """硬闸门禁止时全部拦截"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="RED")
        )
        context = compute_risk_context(input_bundle)
        
        aggregated = [
            {"symbol": "300xxx", "action": "ALLOW", "confidence": 0.9}
        ]
        
        result = apply_risk_to_aggregated(aggregated, context, input_bundle)
        
        assert result[0]["action"] == "BLOCK"
        assert "blocked_reason" in result[0]
    
    def test_confidence_threshold(self):
        """置信度阈值检查"""
        input_bundle = InputBundle(
            market=MarketContext(risk_light="GREEN")
        )
        context = compute_risk_context(input_bundle)
        
        aggregated = [
            {
                "symbol": "300xxx",
                "action": "ALLOW",
                "confidence": 0.50,  # 低于阈值 0.60
                "theme": "其他",
                "open_count": 0,
                "turnover_rate": 5,
                "volume_ratio": 1.5,
            }
        ]
        
        result = apply_risk_to_aggregated(aggregated, context, input_bundle)
        
        assert result[0]["action"] == "WATCH"
        assert "置信度" in result[0].get("downgrade_reason", "")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
