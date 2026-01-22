"""
内容资产路由 - CRUD
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db, ContentAsset

router = APIRouter()


# ============ Pydantic Models ============

class ContentAssetCreate(BaseModel):
    """创建内容资产"""
    type: str  # TEXT, IMAGE, VIDEO_LINK, PDF
    title: str
    raw_text: Optional[str] = None
    source_url: Optional[str] = None
    attachments: Optional[List[dict]] = None
    notes: Optional[str] = None


class ContentAssetUpdate(BaseModel):
    """更新内容资产"""
    title: Optional[str] = None
    raw_text: Optional[str] = None
    source_url: Optional[str] = None
    attachments: Optional[List[dict]] = None
    notes: Optional[str] = None


class ContentAssetResponse(BaseModel):
    """内容资产响应"""
    id: int
    type: str
    title: str
    raw_text: Optional[str] = None
    source_url: Optional[str] = None
    attachments: Optional[List[dict]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentAssetListResponse(BaseModel):
    """内容资产列表响应"""
    items: List[ContentAssetResponse]
    total: int
    page: int
    page_size: int


# ============ API Routes ============

@router.get("", response_model=ContentAssetListResponse)
async def list_content_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None, description="按类型筛选: TEXT, IMAGE, VIDEO_LINK, PDF"),
    search: Optional[str] = Query(None, description="搜索标题或内容"),
    db: AsyncSession = Depends(get_db),
):
    """获取内容资产列表"""
    query = select(ContentAsset).where(ContentAsset.is_deleted == False)
    count_query = select(func.count(ContentAsset.id)).where(ContentAsset.is_deleted == False)
    
    if type:
        query = query.where(ContentAsset.type == type)
        count_query = count_query.where(ContentAsset.type == type)
    
    if search:
        search_filter = ContentAsset.title.ilike(f"%{search}%") | ContentAsset.raw_text.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # 分页
    query = query.order_by(ContentAsset.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    return ContentAssetListResponse(
        items=[ContentAssetResponse(
            id=item.id,
            type=item.type,
            title=item.title,
            raw_text=item.raw_text,
            source_url=item.source_url,
            attachments=item.attachments_json,
            notes=item.notes,
            created_at=item.created_at,
            updated_at=item.updated_at,
        ) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ContentAssetResponse)
async def create_content_asset(
    data: ContentAssetCreate,
    db: AsyncSession = Depends(get_db),
):
    """创建内容资产"""
    asset = ContentAsset(
        type=data.type,
        title=data.title,
        raw_text=data.raw_text,
        source_url=data.source_url,
        attachments_json=data.attachments,
        notes=data.notes,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    
    return ContentAssetResponse(
        id=asset.id,
        type=asset.type,
        title=asset.title,
        raw_text=asset.raw_text,
        source_url=asset.source_url,
        attachments=asset.attachments_json,
        notes=asset.notes,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


@router.get("/{asset_id}", response_model=ContentAssetResponse)
async def get_content_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取单个内容资产"""
    result = await db.execute(
        select(ContentAsset).where(
            ContentAsset.id == asset_id,
            ContentAsset.is_deleted == False
        )
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="内容资产不存在")
    
    return ContentAssetResponse(
        id=asset.id,
        type=asset.type,
        title=asset.title,
        raw_text=asset.raw_text,
        source_url=asset.source_url,
        attachments=asset.attachments_json,
        notes=asset.notes,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


@router.put("/{asset_id}", response_model=ContentAssetResponse)
async def update_content_asset(
    asset_id: int,
    data: ContentAssetUpdate,
    db: AsyncSession = Depends(get_db),
):
    """更新内容资产"""
    result = await db.execute(
        select(ContentAsset).where(
            ContentAsset.id == asset_id,
            ContentAsset.is_deleted == False
        )
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="内容资产不存在")
    
    # 更新字段
    update_data = data.model_dump(exclude_unset=True)
    if "attachments" in update_data:
        update_data["attachments_json"] = update_data.pop("attachments")
    
    for key, value in update_data.items():
        setattr(asset, key, value)
    
    await db.commit()
    await db.refresh(asset)
    
    return ContentAssetResponse(
        id=asset.id,
        type=asset.type,
        title=asset.title,
        raw_text=asset.raw_text,
        source_url=asset.source_url,
        attachments=asset.attachments_json,
        notes=asset.notes,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


@router.delete("/{asset_id}")
async def delete_content_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
):
    """删除内容资产（软删除）"""
    result = await db.execute(
        select(ContentAsset).where(
            ContentAsset.id == asset_id,
            ContentAsset.is_deleted == False
        )
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="内容资产不存在")
    
    asset.is_deleted = True
    await db.commit()
    
    return {"status": "ok", "message": "删除成功"}
