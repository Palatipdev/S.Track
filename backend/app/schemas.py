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
    request_item_id: int
    item_name: str
    quantity: Decimal
    unit: str
    unit_cost: Decimal

class PurchaseOrderIn(BaseModel):
    material_request_id: int
    supplier_id: int
    expected_delivery: date
    items: list[OrderItemIn]

class ProjectIn(BaseModel):
    name: str
    budget: Decimal
    start_date: date
    end_date: Optional[date] = None

class SupplierIn(BaseModel):
    name: str

class DeliveryItemIn(BaseModel):
    order_item_id: int
    received_qty: Decimal

class DeliveryIn(BaseModel):
    purchase_order_id: int
    gps_lat: Optional[Decimal] = None
    gps_lng: Optional[Decimal] = None
    items: list[DeliveryItemIn]

    