from pydantic import BaseModel
from decimal import Decimal
from typing import Optional

class RequestItemIn(BaseModel):
    item_name: str
    quantity: Decimal
    unit: str

class MaterialRequest(BaseModel):
    project_id: int
    urgency: Optional[str] = "medium"
    reason: Optional[str] = None
    items: list[RequestItemIn]
    