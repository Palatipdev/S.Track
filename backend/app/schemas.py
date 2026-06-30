from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import date

class RequestItemIn(BaseModel):
    item_name: str
    quantity: Decimal
    unit: str

class MaterialRequest(BaseModel):
    project_id: int
    urgency: Optional[str] = "medium"
    reason: Optional[str] = None
    items: list[RequestItemIn]

class ApproveRequest(BaseModel):
    status: str
    
class OrderItemIn(BaseModel):
    item_name: str
    quantity: Decimal
    unit: str 
    unit_cost: Decimal

class PurchaseOrderIn(BaseModel):
    material_request_id: int
    supplier_id: int
    expected_delivery: date
    items: list[OrderItemIn]