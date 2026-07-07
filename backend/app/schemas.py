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


class POItemIn(BaseModel):
    item_id: int
    item_qty: Decimal
    item_price: Decimal
    location_id: int
class PurchaseOrderIn(BaseModel):
    po_number: str
    supplier_id: int
    project_id: Optional[int]
    expected_delivery: date
    po_items: list[POItemIn]

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

class ItemIn(BaseModel):
    name: str
    code: Optional[str] = None
    category: str
    spec: Optional[str] = None
    unit: str
    is_active: bool

class LocationMember(BaseModel):
    role: str
    user_id: int

class StorageLocationIn(BaseModel):
    parent_storage: Optional[int]
    project_id: Optional[int]
    name: str
    type : str
    location_member: list[LocationMember]


class ReceiptLine(BaseModel):
    po_item_id: int
    received_qty: Decimal
    accepted_qty: Decimal
    rejected_qty: Decimal
    condition: str
    condition_note: Optional[str]
    return_to_supplier: bool


class ReceiptIn(BaseModel):
    po_id: int
    location_id: int
    po_lines: list[ReceiptLine]
    note: Optional[str]
    gps_lat: Optional[str] = None
    gps_lng: Optional[str] = None


class WithdrawalLineIn(BaseModel):
    item_id : int
    quantity : Decimal
class WithdrawalIn(BaseModel):
    project_id : int
    location_id : int
    withdrawalLines: list[WithdrawalLineIn]

    