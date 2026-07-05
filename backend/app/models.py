import enum
from sqlalchemy import (
    BigInteger, Text, DateTime, Date, Numeric, String,
    func, ForeignKey, Enum, UniqueConstraint, PrimaryKeyConstraint, Boolean
)
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(enum.Enum):
    owner    = "owner"
    buyer    = "buyer"
    onsite   = "onsite"
    factory  = "factory"
    engineer = "engineer"

class LocationRole(enum.Enum):
    leader = "leader"
    employee = "employee"

class ProjectStatus(enum.Enum):
    active    = "active"
    completed = "completed"
    on_hold   = "on_hold"


class RequestStatus(enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"


class UrgencyLevel(enum.Enum):
    low    = "low"
    medium = "medium"
    high   = "high"


class OrderStatus(enum.Enum):
    open               = "open"
    partially_received = "partially_received"
    received           = "received"
    closed             = "closed"
    cancelled          = "cancelled"
class StorageStatus(enum.Enum):
    central = "central"
    unit = "unit"
    project_site = "project_site"

class MovementType(enum.Enum):
    receive           = "receive"
    withdraw          = "withdraw"
    transfer_in       = "transfer_in"
    transfer_out      = "transfer_out"
    return_to_supplier = "return_to_supplier"
    dispose           = "dispose"
    adjust            = "adjust"

class ReceiptCondition(enum.Enum):
    good                     = "good"
    damaged_package_unopened = "damaged_package_unopened"
    damaged                  = "damaged"
    wrong_item               = "wrong_item"


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------

class Company(Base):
    __tablename__ = "companies"

    id         = mapped_column(BigInteger, primary_key=True)
    name       = mapped_column(Text, nullable=False)
    created_at = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("company_id", "email"),)

    id         = mapped_column(BigInteger, primary_key=True)
    company_id = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    email      = mapped_column(Text, nullable=False)
    role       = mapped_column(Enum(UserRole), nullable=False)
    deleted_at = mapped_column(DateTime(timezone=True))
    created_at = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Project(Base):
    __tablename__ = "projects"

    id         = mapped_column(BigInteger, primary_key=True)
    company_id = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    name       = mapped_column(Text, nullable=False)
    budget     = mapped_column(Numeric(14, 2), nullable=False)
    status     = mapped_column(Enum(ProjectStatus), nullable=False, server_default="active")
    start_date = mapped_column(Date, nullable=False)
    end_date   = mapped_column(Date)
    deleted_at = mapped_column(DateTime(timezone=True))
    created_at = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (PrimaryKeyConstraint("project_id", "user_id"),)

    project_id = mapped_column(BigInteger, ForeignKey("projects.id"), nullable=False)
    user_id    = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)


class Supplier(Base):
    __tablename__ = "suppliers"

    id         = mapped_column(BigInteger, primary_key=True)
    company_id = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    name       = mapped_column(Text, nullable=False)
    deleted_at = mapped_column(DateTime(timezone=True))
    created_at = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MaterialRequest(Base):
    __tablename__ = "material_requests"

    id           = mapped_column(BigInteger, primary_key=True)
    company_id   = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    project_id   = mapped_column(BigInteger, ForeignKey("projects.id"), nullable=False)
    requested_by = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    status       = mapped_column(Enum(RequestStatus), nullable=False, server_default="pending")
    urgency      = mapped_column(Enum(UrgencyLevel), nullable=False, server_default="medium")
    reason       = mapped_column(Text)
    approved_by  = mapped_column(BigInteger, ForeignKey("users.id"))
    approved_at  = mapped_column(DateTime(timezone=True))
    deleted_at   = mapped_column(DateTime(timezone=True))
    created_at   = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RequestItem(Base):
    __tablename__ = "request_items"

    id                  = mapped_column(BigInteger, primary_key=True)
    material_request_id = mapped_column(BigInteger, ForeignKey("material_requests.id"), nullable=False)
    item_name           = mapped_column(Text, nullable=False)
    quantity            = mapped_column(Numeric(14, 2), nullable=False)
    unit                = mapped_column(Text, nullable=False)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id                  = mapped_column(BigInteger, primary_key=True)
    company_id          = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    supplier_id         = mapped_column(BigInteger, ForeignKey("suppliers.id"), nullable=False)
    total_cost          = mapped_column(Numeric(14, 2), nullable=False)
    expected_delivery   = mapped_column(Date, nullable=False)
    status              = mapped_column(Enum(OrderStatus), nullable=False, server_default="pending")
    deleted_at          = mapped_column(DateTime(timezone=True))
    created_at          = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    project_id = mapped_column(BigInteger, ForeignKey("projects.id"), nullable = True)


class OrderItem(Base):
    __tablename__ = "order_items"

    id                = mapped_column(BigInteger, primary_key=True)
    purchase_order_id = mapped_column(BigInteger, ForeignKey("purchase_orders.id"), nullable=False)
    request_item_id   = mapped_column(BigInteger, ForeignKey("request_items.id"))
    item_name         = mapped_column(Text, nullable=False)
    quantity          = mapped_column(Numeric(14, 2), nullable=False)
    unit              = mapped_column(Text, nullable=False)
    unit_cost         = mapped_column(Numeric(14, 2), nullable=False)


class Delivery(Base):
    __tablename__ = "deliveries"

    id                = mapped_column(BigInteger, primary_key=True)
    company_id        = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    purchase_order_id = mapped_column(BigInteger, ForeignKey("purchase_orders.id"), nullable=False)
    confirmed_by      = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    gps_lat           = mapped_column(Numeric(9, 6))
    gps_lng           = mapped_column(Numeric(9, 6))
    created_at        = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class DeliveryItem(Base):
    __tablename__ = "delivery_items"

    id            = mapped_column(BigInteger, primary_key=True)
    delivery_id   = mapped_column(BigInteger, ForeignKey("deliveries.id"), nullable=False)
    order_item_id = mapped_column(BigInteger, ForeignKey("order_items.id"), nullable=False)
    received_qty  = mapped_column(Numeric(14, 2), nullable=False)


class DeliveryPhoto(Base):
    __tablename__ = "delivery_photos"
    __table_args__ = (UniqueConstraint("delivery_id", "sha256_hash"),)

    id                 = mapped_column(BigInteger, primary_key=True)
    delivery_id        = mapped_column(BigInteger, ForeignKey("deliveries.id"), nullable=False)
    file_key           = mapped_column(Text, nullable=False)
    sha256_hash        = mapped_column(String(64), nullable=False)
    server_uploaded_at = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RequestEvent(Base):
    __tablename__ = "request_events"

    id                  = mapped_column(BigInteger, primary_key=True)
    material_request_id = mapped_column(BigInteger, ForeignKey("material_requests.id"), nullable=False)
    actor_id            = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    event_type          = mapped_column(Text, nullable=False)
    payload             = mapped_column(JSONB)
    created_at          = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class OrderEvent(Base):
    __tablename__ = "order_events"

    id                = mapped_column(BigInteger, primary_key=True)
    purchase_order_id = mapped_column(BigInteger, ForeignKey("purchase_orders.id"), nullable=False)
    actor_id          = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    event_type        = mapped_column(Text, nullable=False)
    payload           = mapped_column(JSONB)
    created_at        = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class DeliveryEvent(Base):
    __tablename__ = "delivery_events"

    id          = mapped_column(BigInteger, primary_key=True)
    delivery_id = mapped_column(BigInteger, ForeignKey("deliveries.id"), nullable=False)
    actor_id    = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    event_type  = mapped_column(Text, nullable=False)
    payload     = mapped_column(JSONB)
    created_at  = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

class StorageLocation(Base):
    __tablename__ = "storage_locations"

    id = mapped_column(BigInteger, primary_key=True)
    parent_storage_id = mapped_column(BigInteger, ForeignKey("storage_locations.id"), nullable = True)
    company_id = mapped_column(BigInteger, ForeignKey("companies.id"), nullable = False)
    project_id = mapped_column(BigInteger, ForeignKey("projects.id"), nullable = True)
    name = mapped_column(Text, nullable = False)
    type = mapped_column(Enum(StorageStatus), nullable = False)
    created_at = mapped_column(DateTime(timezone=True), nullable = False, server_default=func.now())
    deleted_at = mapped_column(DateTime(timezone=True))

class LocationMembers(Base):
    __tablename__ = "location_members"
    __table_args__ = (PrimaryKeyConstraint("storage_id", "user_id"),)

    user_id = mapped_column(BigInteger, ForeignKey("users.id") , nullable = False)
    storage_id = mapped_column(BigInteger, ForeignKey("storage_locations.id"),nullable =False)
    role = mapped_column(Enum(LocationRole), nullable = False)

class Items(Base):
    __tablename__ = "items"

    id = mapped_column(BigInteger, primary_key = True)
    item_name = mapped_column(Text, nullable = False)
    company_id = mapped_column (BigInteger, ForeignKey("companies.id"), nullable = False)
    code = mapped_column(Text, nullable = True)
    category = mapped_column(Text, nullable = False)
    spec = mapped_column(Text, nullable = False)
    base_unit = mapped_column(Text, nullable = False)
    is_active = mapped_column(Boolean, nullable = False)
    deleted_at = mapped_column(DateTime(timezone= True), nullable = True)
    created_at = mapped_column(DateTime(timezone = True), nullable = False, server_default=func.now())


class POItem(Base):
    __tablename__ = "po_items"

    id = mapped_column(BigInteger, primary_key = True)
    po_id = mapped_column(BigInteger, ForeignKey("purchase_orders.id"))
    item_id = mapped_column(BigInteger, ForeignKey("items.id"))
    item_qty = mapped_column(Numeric(14,2), nullable = False)
    price = mapped_column(Numeric(14,2), nullable = False)
    location = mapped_column(BigInteger, ForeignKey("storage_locations.id"))


class Receipt(Base):
    # physical arrival of an PO (partially or fully)
    __tablename__ = "receipts"

    id                = mapped_column(BigInteger, primary_key=True)
    company_id        = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    purchase_order_id = mapped_column(BigInteger, ForeignKey("purchase_orders.id"), nullable=False)
    location_id       = mapped_column(BigInteger, ForeignKey("storage_locations.id"), nullable=False)
    received_by       = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    gps_lat           = mapped_column(Numeric(9, 6))
    gps_lng           = mapped_column(Numeric(9, 6))
    note              = mapped_column(Text)
    created_at        = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ReceiptLine(Base):
    __tablename__ = "receipt_lines"

    id                 = mapped_column(BigInteger, primary_key=True)
    receipt_id         = mapped_column(BigInteger, ForeignKey("receipts.id"), nullable=False)
    po_item_id         = mapped_column(BigInteger, ForeignKey("po_items.id"), nullable=False)
    received_qty       = mapped_column(Numeric(14, 2), nullable=False)
    accepted_qty       = mapped_column(Numeric(14, 2), nullable=False)
    rejected_qty       = mapped_column(Numeric(14, 2), nullable=False)
    condition          = mapped_column(Enum(ReceiptCondition), nullable=False, server_default="good")
    condition_note     = mapped_column(Text)
    return_to_supplier = mapped_column(Boolean, nullable=False, server_default="false")


class ReceiptPhoto(Base):
    __tablename__ = "receipt_photos"
    __table_args__ = (UniqueConstraint("receipt_id", "sha256_hash"),)

    id                 = mapped_column(BigInteger, primary_key=True)
    receipt_id         = mapped_column(BigInteger, ForeignKey("receipts.id"), nullable=False)
    file_key           = mapped_column(Text, nullable=False)
    sha256_hash        = mapped_column(String(64), nullable=False)
    server_uploaded_at = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id            = mapped_column(BigInteger, primary_key=True)
    company_id    = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    item_id       = mapped_column(BigInteger, ForeignKey("items.id"), nullable=False)
    location_id   = mapped_column(BigInteger, ForeignKey("storage_locations.id"), nullable=False)
    movement_type = mapped_column(Enum(MovementType), nullable=False)
    qty           = mapped_column(Numeric(14, 2), nullable=False)
    project_id    = mapped_column(BigInteger, ForeignKey("projects.id"))
    actor_id      = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    ref_type      = mapped_column(Text)
    ref_id        = mapped_column(BigInteger)
    created_at    = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class StockLevel(Base):
    __tablename__ = "stock_levels"
    __table_args__ = (PrimaryKeyConstraint("item_id", "location_id"),)

    item_id     = mapped_column(BigInteger, ForeignKey("items.id"), nullable=False)
    location_id = mapped_column(BigInteger, ForeignKey("storage_locations.id"), nullable=False)
    qty         = mapped_column(Numeric(14, 2), nullable=False, server_default="0")


class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id           = mapped_column(BigInteger, primary_key=True)
    company_id   = mapped_column(BigInteger, ForeignKey("companies.id"), nullable=False)
    project_id   = mapped_column(BigInteger, ForeignKey("projects.id"), nullable=False)
    location_id  = mapped_column(BigInteger, ForeignKey("storage_locations.id"), nullable=False)
    requested_by = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    verified_by  = mapped_column(BigInteger, ForeignKey("users.id"))
    created_at   = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class WithdrawalLine(Base):
    __tablename__ = "withdrawal_lines"

    id            = mapped_column(BigInteger, primary_key=True)
    withdrawal_id = mapped_column(BigInteger, ForeignKey("withdrawals.id"), nullable=False)
    item_id       = mapped_column(BigInteger, ForeignKey("items.id"), nullable=False)
    qty           = mapped_column(Numeric(14, 2), nullable=False)

 
