"""
策略相关路由
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid

from database import get_db, StrategyCard, StrategyCardVersion, ContentAsset


router = APIRouter()


# ============ 内容资产 ============
class ContentAssetCreate(BaseModel):
    type: str  # TEXT, IMAGE, VIDEO_LINK
    title: str
    raw_text: Optional[str] = None
    source_url: Optional[str] = None
    attachments: Optional[list[str]] = None
    notes: Optional[str] = None


class ContentAssetResponse(BaseModel):
    id: int
    type: str
    title: str
    raw_text: Optional[str] = None
    source_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


@router.get("/assets", response_model=list[ContentAssetResponse])
async def list_assets(db: AsyncSession = Depends(get_db)):
    """获取内容资产列表"""
    result = await db.execute(
        select(ContentAsset).where(ContentAsset.is_deleted == False)
    )
    return result.scalars().all()


@router.post("/assets", response_model=ContentAssetResponse)
async def create_asset(asset: ContentAssetCreate, db: AsyncSession = Depends(get_db)):
    """创建内容资产"""
    db_asset = ContentAsset(
        type=asset.type,
        title=asset.title,
        raw_text=asset.raw_text,
        source_url=asset.source_url,
        attachments_json=asset.attachments,
        notes=asset.notes,
    )
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    return db_asset


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


@router.post("/cards/{strategy_id}/publish")
async def publish_strategy(strategy_id: str, db: AsyncSession = Depends(get_db)):
    """发布策略"""
    result = await db.execute(
        select(StrategyCard).where(StrategyCard.strategy_id == strategy_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="策略卡不存在")
    
    card.status = "PUBLISHED"
    await db.commit()
    return {"status": "ok", "message": "策略已发布"}


# ============ DSL 校验 ============
class DSLValidationResult(BaseModel):
    valid: bool
    errors: list[str] = []
    warnings: list[str] = []


@router.post("/validate-dsl", response_model=DSLValidationResult)
async def validate_dsl(dsl: StrategyDSL):
    """校验策略 DSL"""
    errors = []
    warnings = []
    
    # 基本字段校验
    if not dsl.id:
        errors.append("缺少策略 ID")
    if not dsl.name:
        errors.append("缺少策略名称")
    if not dsl.version:
        errors.append("缺少版本号")
    
    # 条件校验
    if not dsl.entry_conditions:
        warnings.append("未定义入场条件")
    if not dsl.exit_conditions:
        warnings.append("未定义出场条件")
    
    # 参数校验
    for cond in dsl.entry_conditions:
        if "indicator" not in cond:
            errors.append(f"入场条件缺少 indicator 字段")
        if "threshold" not in cond and "value" not in cond:
            warnings.append(f"入场条件缺少阈值配置")
    
    # 风控规则校验
    if not dsl.risk_rules:
        warnings.append("未定义风控规则")
    
    return DSLValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
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
