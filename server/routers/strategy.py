"""
策略相关路由 - 策略卡版本化管理
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import uuid
import re

from database import get_db, StrategyCard, StrategyCardVersion, ContentAsset, StrategyGroup, StrategyRun


router = APIRouter()


# ============ 策略卡 DSL ============
class StrategyDSL(BaseModel):
    """策略 DSL 结构"""
    id: str
    version: str
    name: str
    description: str = ""
    params: dict = {}
    entry_conditions: list[dict] = []
    exit_conditions: list[dict] = []
    risk_rules: list[dict] = []
    tags: list[str] = []


class StrategyCardCreate(BaseModel):
    name: str
    dsl: StrategyDSL
    source_asset_ids: list[int] = []


class StrategyCardResponse(BaseModel):
    id: int
    strategy_id: str
    name: str
    status: str
    current_version: str
    created_at: datetime


@router.get("/cards", response_model=list[StrategyCardResponse])
async def list_strategy_cards(db: AsyncSession = Depends(get_db)):
    """获取策略卡列表"""
    result = await db.execute(select(StrategyCard))
    return result.scalars().all()


@router.post("/cards", response_model=StrategyCardResponse)
async def create_strategy_card(
    data: StrategyCardCreate, 
    db: AsyncSession = Depends(get_db)
):
    """创建策略卡"""
    strategy_id = data.dsl.id or f"strategy_{uuid.uuid4().hex[:8]}"
    
    # 创建策略卡
    card = StrategyCard(
        strategy_id=strategy_id,
        name=data.name,
        current_version=data.dsl.version,
    )
    db.add(card)
    
    # 创建版本
    version = StrategyCardVersion(
        strategy_id=strategy_id,
        version=data.dsl.version,
        dsl_json=data.dsl.model_dump(),
        source_asset_ids=data.source_asset_ids,
    )
    db.add(version)
    
    await db.commit()
    await db.refresh(card)
    return card


@router.get("/cards/{strategy_id}")
async def get_strategy_card(strategy_id: str, db: AsyncSession = Depends(get_db)):
    """获取策略卡详情"""
    result = await db.execute(
        select(StrategyCard).where(StrategyCard.strategy_id == strategy_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="策略卡不存在")
    
    # 获取版本
    versions = await db.execute(
        select(StrategyCardVersion).where(
            StrategyCardVersion.strategy_id == strategy_id
        )
    )
    
    return {
        "card": card,
        "versions": versions.scalars().all()
    }


@router.get("/cards/{strategy_id}/versions")
async def list_strategy_versions(
    strategy_id: str, 
    db: AsyncSession = Depends(get_db)
):
    """获取策略卡版本列表"""
    result = await db.execute(
        select(StrategyCard).where(StrategyCard.strategy_id == strategy_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="策略卡不存在")
    
    versions = await db.execute(
        select(StrategyCardVersion)
        .where(StrategyCardVersion.strategy_id == strategy_id)
        .order_by(StrategyCardVersion.created_at.desc())
    )
    
    return {
        "strategy_id": strategy_id,
        "current_version": card.current_version,
        "versions": [
            {
                "id": v.id,
                "version": v.version,
                "dsl": v.dsl_json,
                "source_asset_ids": v.source_asset_ids,
                "published_at": v.published_at,
                "created_at": v.created_at,
            }
            for v in versions.scalars().all()
        ]
    }


class NewVersionCreate(BaseModel):
    """创建新版本"""
    version: str
    dsl: dict
    source_asset_ids: List[int] = []


@router.post("/cards/{strategy_id}/versions")
async def create_new_version(
    strategy_id: str,
    data: NewVersionCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建策略卡新版本"""
    result = await db.execute(
        select(StrategyCard).where(StrategyCard.strategy_id == strategy_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="策略卡不存在")
    
    # 检查版本号是否已存在
    existing = await db.execute(
        select(StrategyCardVersion).where(
            StrategyCardVersion.strategy_id == strategy_id,
            StrategyCardVersion.version == data.version
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"版本 {data.version} 已存在")
    
    # 创建新版本
    version = StrategyCardVersion(
        strategy_id=strategy_id,
        version=data.version,
        dsl_json=data.dsl,
        source_asset_ids=data.source_asset_ids,
    )
    db.add(version)
    
    # 更新当前版本
    card.current_version = data.version
    card.status = "DRAFT"  # 新版本默认为草稿
    
    await db.commit()
    
    return {
        "status": "ok",
        "message": f"版本 {data.version} 创建成功",
        "version": data.version
    }


@router.post("/cards/{strategy_id}/publish")
async def publish_strategy(
    strategy_id: str, 
    version: Optional[str] = Query(None, description="要发布的版本，默认当前版本"),
    db: AsyncSession = Depends(get_db)
):
    """发布策略"""
    result = await db.execute(
        select(StrategyCard).where(StrategyCard.strategy_id == strategy_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="策略卡不存在")
    
    publish_version = version or card.current_version
    
    # 查找版本
    ver_result = await db.execute(
        select(StrategyCardVersion).where(
            StrategyCardVersion.strategy_id == strategy_id,
            StrategyCardVersion.version == publish_version
        )
    )
    ver = ver_result.scalar_one_or_none()
    if not ver:
        raise HTTPException(status_code=404, detail=f"版本 {publish_version} 不存在")
    
    # 更新发布时间和状态
    ver.published_at = datetime.utcnow()
    card.status = "PUBLISHED"
    card.current_version = publish_version
    
    await db.commit()
    return {"status": "ok", "message": f"策略 {strategy_id} v{publish_version} 已发布"}


@router.post("/cards/{strategy_id}/deprecate")
async def deprecate_strategy(strategy_id: str, db: AsyncSession = Depends(get_db)):
    """废弃策略"""
    result = await db.execute(
        select(StrategyCard).where(StrategyCard.strategy_id == strategy_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="策略卡不存在")
    
    card.status = "DEPRECATED"
    await db.commit()
    return {"status": "ok", "message": "策略已废弃"}


# ============ DSL 校验 ============

# 允许的指标白名单
ALLOWED_INDICATORS = {
    # 价格相关
    "price", "open", "high", "low", "close", "change_pct", "amplitude",
    # 涨停相关
    "is_limit_up", "limit_up_days", "limit_up_time", "reseal_count", "first_seal_time",
    "open_count", "bomb_rate", "is_first_seal", "is_reseal",
    # 量能相关
    "volume", "turnover", "turnover_rate", "volume_ratio",
    # 技术指标
    "ma5", "ma10", "ma20", "ma60", "macd", "kdj_k", "kdj_d", "kdj_j", "rsi",
    # 板块相关
    "sector", "concept", "industry", "theme_heat",
    # 市场相关
    "market_sentiment", "market_limit_up_count", "market_bomb_rate",
    # 持仓相关
    "holding_days", "holding_pnl", "cost_price", "position_ratio",
}

# 允许的操作符
ALLOWED_OPERATORS = {"==", "!=", ">", ">=", "<", "<=", "in", "not_in", "contains", "between"}

# 风控规则类型
ALLOWED_RISK_TYPES = {"stop_loss", "take_profit", "max_holding_days", "max_position", "sector_limit"}


class DSLValidationResult(BaseModel):
    valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []


def validate_condition(cond: dict, cond_type: str, errors: list, warnings: list):
    """校验单个条件"""
    # 检查 indicator
    indicator = cond.get("indicator")
    if not indicator:
        errors.append(f"{cond_type}条件缺少 indicator 字段")
    elif indicator not in ALLOWED_INDICATORS:
        warnings.append(f"{cond_type}条件使用了未知指标 '{indicator}'，请确认是否正确")
    
    # 检查 operator
    operator = cond.get("operator")
    if operator and operator not in ALLOWED_OPERATORS:
        errors.append(f"{cond_type}条件使用了无效操作符 '{operator}'")
    
    # 检查阈值
    if "threshold" not in cond and "value" not in cond:
        warnings.append(f"{cond_type}条件 '{indicator}' 缺少阈值配置")
    
    # 类型检查
    threshold = cond.get("threshold") or cond.get("value")
    if threshold is not None:
        if operator in {"in", "not_in"} and not isinstance(threshold, list):
            errors.append(f"{cond_type}条件 '{indicator}' 的 in/not_in 操作符需要数组值")
        if operator == "between" and (not isinstance(threshold, list) or len(threshold) != 2):
            errors.append(f"{cond_type}条件 '{indicator}' 的 between 操作符需要两个值的数组")


@router.post("/validate-dsl", response_model=DSLValidationResult)
async def validate_dsl(dsl: StrategyDSL):
    """
    校验策略 DSL
    
    校验内容：
    1. 基本字段完整性
    2. 版本号格式 (semver)
    3. 指标白名单检查
    4. 操作符有效性
    5. 阈值类型匹配
    6. 风控规则完整性
    """
    errors = []
    warnings = []
    suggestions = []
    
    # 基本字段校验
    if not dsl.id:
        errors.append("缺少策略 ID")
    elif not re.match(r'^[a-z][a-z0-9_]*$', dsl.id):
        warnings.append("策略 ID 建议使用小写字母、数字和下划线，以字母开头")
    
    if not dsl.name:
        errors.append("缺少策略名称")
    
    if not dsl.version:
        errors.append("缺少版本号")
    elif not re.match(r'^\d+\.\d+\.\d+$', dsl.version):
        warnings.append("版本号建议使用语义化版本 (如 1.0.0)")
    
    # 条件校验
    if not dsl.entry_conditions:
        warnings.append("未定义入场条件")
    else:
        for i, cond in enumerate(dsl.entry_conditions):
            validate_condition(cond, f"入场[{i}]", errors, warnings)
    
    if not dsl.exit_conditions:
        warnings.append("未定义出场条件")
    else:
        for i, cond in enumerate(dsl.exit_conditions):
            validate_condition(cond, f"出场[{i}]", errors, warnings)
    
    # 风控规则校验
    if not dsl.risk_rules:
        warnings.append("未定义风控规则，建议至少设置止损规则")
        suggestions.append("添加风控规则: {'type': 'stop_loss', 'threshold': -0.05}")
    else:
        has_stop_loss = False
        for i, rule in enumerate(dsl.risk_rules):
            rule_type = rule.get("type")
            if not rule_type:
                errors.append(f"风控规则[{i}]缺少 type 字段")
            elif rule_type not in ALLOWED_RISK_TYPES:
                warnings.append(f"风控规则[{i}]使用了未知类型 '{rule_type}'")
            
            if rule_type == "stop_loss":
                has_stop_loss = True
                threshold = rule.get("threshold")
                if threshold is None:
                    errors.append("止损规则缺少 threshold")
                elif threshold > 0:
                    warnings.append("止损阈值应为负数")
        
        if not has_stop_loss:
            suggestions.append("建议添加止损规则以控制风险")
    
    # 标签检查
    if not dsl.tags:
        suggestions.append("建议添加标签以便分类管理")
    
    return DSLValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        suggestions=suggestions,
    )


# ============ 策略草案生成 ============
class DraftGenerationRequest(BaseModel):
    asset_ids: list[int]
    strategy_type: str = "momentum"  # momentum, mean_reversion, breakout


@router.post("/generate-draft")
async def generate_strategy_draft(
    req: DraftGenerationRequest,
    db: AsyncSession = Depends(get_db)
):
    """从内容资产生成策略草案"""
    # 获取资产内容
    result = await db.execute(
        select(ContentAsset).where(ContentAsset.id.in_(req.asset_ids))
    )
    assets = result.scalars().all()
    
    if not assets:
        raise HTTPException(status_code=404, detail="未找到内容资产")
    
    # 基于资产类型和内容生成草案
    # 这里是简化版本，实际应该调用 LLM
    strategy_id = f"{req.strategy_type}_{uuid.uuid4().hex[:6]}"
    
    draft = StrategyDSL(
        id=strategy_id,
        version="0.1.0",
        name=f"基于 {len(assets)} 个资产的{req.strategy_type}策略",
        description="自动生成的策略草案",
        params={
            "lookback_period": 20,
            "threshold": 0.05,
        },
        entry_conditions=[
            {
                "indicator": "change_pct",
                "operator": ">=",
                "threshold": 9.9,
                "description": "涨停买入"
            }
        ],
        exit_conditions=[
            {
                "indicator": "holding_days",
                "operator": ">=",
                "threshold": 3,
                "description": "持有3天后卖出"
            }
        ],
        risk_rules=[
            {
                "type": "stop_loss",
                "threshold": -0.05,
                "description": "止损5%"
            }
        ],
        tags=[req.strategy_type, "auto_generated"],
    )
    
    return {
        "draft": draft,
        "source_assets": [{"id": a.id, "title": a.title} for a in assets],
    }


# ============ 策略组 ============

class StrategyGroupConfig(BaseModel):
    """策略组配置"""
    strategies: List[dict]  # [{strategy_id, version, weight}]
    aggregation: str = "vote"  # vote, weighted, unanimous
    conflict_policy: str = "conservative"  # conservative, aggressive
    market_routing: Optional[dict] = None  # 按市场状态路由


class StrategyGroupCreate(BaseModel):
    """创建策略组"""
    name: str
    config: StrategyGroupConfig


class StrategyGroupResponse(BaseModel):
    """策略组响应"""
    id: int
    group_id: str
    name: str
    config: dict
    enabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/groups", response_model=List[StrategyGroupResponse])
async def list_strategy_groups(db: AsyncSession = Depends(get_db)):
    """获取策略组列表"""
    result = await db.execute(
        select(StrategyGroup).order_by(StrategyGroup.created_at.desc())
    )
    groups = result.scalars().all()
    return [
        StrategyGroupResponse(
            id=g.id,
            group_id=g.group_id,
            name=g.name,
            config=g.config_json,
            enabled=g.enabled,
            created_at=g.created_at,
        )
        for g in groups
    ]


@router.post("/groups", response_model=StrategyGroupResponse)
async def create_strategy_group(
    data: StrategyGroupCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建策略组"""
    group_id = f"group_{uuid.uuid4().hex[:8]}"
    
    group = StrategyGroup(
        group_id=group_id,
        name=data.name,
        config_json=data.config.model_dump(),
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    
    return StrategyGroupResponse(
        id=group.id,
        group_id=group.group_id,
        name=group.name,
        config=group.config_json,
        enabled=group.enabled,
        created_at=group.created_at,
    )


@router.get("/groups/{group_id}")
async def get_strategy_group(group_id: str, db: AsyncSession = Depends(get_db)):
    """获取策略组详情"""
    result = await db.execute(
        select(StrategyGroup).where(StrategyGroup.group_id == group_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="策略组不存在")
    
    # 获取运行记录
    runs = await db.execute(
        select(StrategyRun)
        .where(StrategyRun.group_id == group_id)
        .order_by(StrategyRun.ts.desc())
        .limit(10)
    )
    
    return {
        "group": {
            "id": group.id,
            "group_id": group.group_id,
            "name": group.name,
            "config": group.config_json,
            "enabled": group.enabled,
            "created_at": group.created_at,
        },
        "recent_runs": [
            {
                "run_id": r.run_id,
                "ts": r.ts,
                "input_hash": r.input_hash,
                "runtime_ms": r.runtime_ms,
                "aggregated_result": r.aggregated_result_json,
                "warnings": r.warnings_json,
            }
            for r in runs.scalars().all()
        ]
    }


@router.put("/groups/{group_id}")
async def update_strategy_group(
    group_id: str,
    data: StrategyGroupCreate,
    db: AsyncSession = Depends(get_db)
):
    """更新策略组"""
    result = await db.execute(
        select(StrategyGroup).where(StrategyGroup.group_id == group_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="策略组不存在")
    
    group.name = data.name
    group.config_json = data.config.model_dump()
    
    await db.commit()
    return {"status": "ok", "message": "策略组已更新"}


@router.post("/groups/{group_id}/toggle")
async def toggle_strategy_group(group_id: str, db: AsyncSession = Depends(get_db)):
    """启用/禁用策略组"""
    result = await db.execute(
        select(StrategyGroup).where(StrategyGroup.group_id == group_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="策略组不存在")
    
    group.enabled = not group.enabled
    await db.commit()
    
    status = "已启用" if group.enabled else "已禁用"
    return {"status": "ok", "message": f"策略组{status}", "enabled": group.enabled}


# ============ 策略运行 ============

class RunStrategyRequest(BaseModel):
    """运行策略请求"""
    symbol: str
    snapshot: Optional[dict] = None  # 行情快照，为空则实时获取


@router.post("/groups/{group_id}/run")
async def run_strategy_group(
    group_id: str,
    req: RunStrategyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    运行策略组
    
    1. 并行运行组内所有策略
    2. 聚合结果
    3. 通过 Policy Gate
    4. 返回最终信号
    """
    import hashlib
    import time
    
    start_time = time.time()
    
    # 获取策略组
    result = await db.execute(
        select(StrategyGroup).where(StrategyGroup.group_id == group_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="策略组不存在")
    
    if not group.enabled:
        return {"status": "error", "message": "策略组已禁用"}
    
    config = group.config_json
    
    # 模拟获取行情快照
    snapshot = req.snapshot or {
        "symbol": req.symbol,
        "price": 10.0,
        "change_pct": 9.98,
        "volume": 1000000,
        "turnover_rate": 5.5,
        "limit_up_days": 1,
        "ts": datetime.utcnow().isoformat(),
    }
    
    # 生成输入哈希
    input_hash = hashlib.md5(str(snapshot).encode()).hexdigest()[:16]
    
    # 模拟并行运行各策略
    per_strategy_results = []
    for strat in config.get("strategies", []):
        # 实际应该调用 MCP 或本地策略引擎
        result = {
            "strategy_id": strat.get("strategy_id"),
            "version": strat.get("version"),
            "weight": strat.get("weight", 1.0),
            "signal": "BUY",  # BUY, SELL, HOLD
            "confidence": 0.75,
            "reasons": ["涨停板", "量能充足"],
        }
        per_strategy_results.append(result)
    
    # 聚合结果
    aggregation = config.get("aggregation", "vote")
    if aggregation == "vote":
        # 投票法：多数决定
        buy_votes = sum(1 for r in per_strategy_results if r["signal"] == "BUY")
        sell_votes = sum(1 for r in per_strategy_results if r["signal"] == "SELL")
        total = len(per_strategy_results)
        
        if buy_votes > total / 2:
            final_signal = "BUY"
        elif sell_votes > total / 2:
            final_signal = "SELL"
        else:
            final_signal = "HOLD"
        
        final_confidence = max(r["confidence"] for r in per_strategy_results) if per_strategy_results else 0
    else:
        # 加权法
        weighted_sum = sum(
            r["weight"] * (1 if r["signal"] == "BUY" else -1 if r["signal"] == "SELL" else 0)
            for r in per_strategy_results
        )
        total_weight = sum(r["weight"] for r in per_strategy_results)
        
        if total_weight > 0:
            score = weighted_sum / total_weight
            if score > 0.3:
                final_signal = "BUY"
            elif score < -0.3:
                final_signal = "SELL"
            else:
                final_signal = "HOLD"
            final_confidence = abs(score)
        else:
            final_signal = "HOLD"
            final_confidence = 0
    
    aggregated_result = {
        "signal": final_signal,
        "confidence": final_confidence,
        "action": "ALLOW" if final_signal == "BUY" and final_confidence > 0.5 else "WATCH",
    }
    
    runtime_ms = int((time.time() - start_time) * 1000)
    
    # 记录运行结果
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    run = StrategyRun(
        run_id=run_id,
        group_id=group_id,
        input_hash=input_hash,
        input_snapshot_json=snapshot,
        per_strategy_results_json=per_strategy_results,
        aggregated_result_json=aggregated_result,
        runtime_ms=runtime_ms,
    )
    db.add(run)
    await db.commit()
    
    return {
        "run_id": run_id,
        "group_id": group_id,
        "symbol": req.symbol,
        "snapshot": snapshot,
        "per_strategy_results": per_strategy_results,
        "aggregated_result": aggregated_result,
        "runtime_ms": runtime_ms,
    }


# ============ 策略列表（兼容旧接口）============

@router.get("/list")
async def list_strategies(db: AsyncSession = Depends(get_db)):
    """获取所有策略列表（包括策略卡和策略组）"""
    # 获取策略卡
    cards = await db.execute(
        select(StrategyCard).where(StrategyCard.status != "DEPRECATED")
    )
    
    # 获取策略组
    groups = await db.execute(
        select(StrategyGroup).where(StrategyGroup.enabled == True)
    )
    
    return {
        "cards": [
            {
                "id": c.strategy_id,
                "name": c.name,
                "version": c.current_version,
                "status": c.status,
                "type": "card",
            }
            for c in cards.scalars().all()
        ],
        "groups": [
            {
                "id": g.group_id,
                "name": g.name,
                "enabled": g.enabled,
                "type": "group",
            }
            for g in groups.scalars().all()
        ]
    }
