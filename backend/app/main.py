from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import hashlib
from app.schemas import MaterialRequest
from app.database import get_db
from app.models import MaterialRequest as MaterialRequestModel
from app.models import RequestItem as RequestItemModel
from app.auth import supabase, supabase_admin
from app.models import User
from app.schemas import ApproveRequest
from app.auth import get_current_user
from app.schemas import PurchaseOrderIn
from app.models import PurchaseOrder as PurchaseOrderModel
from app.models import OrderItem as OrderItemModel
from app.models import POItem as POItemModel
from app.models import Delivery as DeliveryModel
from app.models import DeliveryItem as DeliveryItemModel
from app.schemas import DeliveryItemIn, DeliveryIn, ProjectIn, SupplierIn
from app.models import Project as ProjectModel, Supplier as SupplierModel
from app.models import DeliveryPhoto as DeliveryPhotoModel

# Storage location
from app.models import StorageLocation as StorageLocationModel
from app.schemas import StorageLocationIn
from app.models import LocationMembers as LocationMemberIn
from app.schemas import LocationMember

# Items
from app.models import Items as ItemModel
from app.schemas import ItemIn

# Receipts
from app.models import Receipt as ReceiptModel
from app.schemas import ReceiptIn
from app.schemas import ReceiptLine
from app.models import ReceiptLine as ReceiptLineModel
from app.models import ReceiptPhoto as ReceiptPhotoModel

# Stocks
from app.models import StockLevel as StockLevelModel
from app.models import StockMovement as StockMovementModel

# Withdrawals
from app.models import Withdrawal as WithdrawalModel
from app.models import WithdrawalLine as WithdrawalLineModel
from app.schemas import WithdrawalIn

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/material-requests")
def create_material_request(body: MaterialRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # TODO(user): insert a new MaterialRequest row into the DB and return it
    new_request = MaterialRequestModel(project_id=body.project_id , urgency=body.urgency, reason=body.reason, company_id = current_user.company_id , requested_by = current_user.id)
    db.add(new_request)

    db.commit()
    db.refresh(new_request)
    for item in body.items:
        # TODO(user): create a RequestItem row linked to new_request.id
        new_item = RequestItemModel(material_request_id=new_request.id , item_name=item.item_name, quantity = item.quantity, unit = item.unit)
        db.add(new_item)

    db.commit()
    db.refresh(new_request)
    return new_request

@app.get("/material-requests")
def get_all_material_request(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allRequest = db.query(MaterialRequestModel).filter(MaterialRequestModel.company_id == current_user.company_id).all()
    return allRequest

@app.patch("/material-requests/{request_id}")
def approveOrReject(request_id: int , body: ApproveRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.value != "owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    request = db.query(MaterialRequestModel).filter(MaterialRequestModel.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Requeest not found")
    if request.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    request.status = body.status
    db.commit()
    return request

@app.get("/material-requests/{request_id}/items")
def show_request_items(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    request = db.query(MaterialRequestModel).filter(MaterialRequestModel.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    items = db.query(RequestItemModel).filter(RequestItemModel.material_request_id == request_id).all()
    return items


@app.post("/purchase-orders")
def purchase_order(body: PurchaseOrderIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    newPurchase = PurchaseOrderModel(
        company_id=current_user.company_id,
        supplier_id=body.supplier_id,
        project_id=body.project_id,
        expected_delivery=body.expected_delivery,
        total_cost=sum(item.item_qty * item.item_price for item in body.po_items),
    )
    db.add(newPurchase)
    db.commit()
    db.refresh(newPurchase)

    for item in body.po_items:
        newPOItem = POItemModel(po_id=newPurchase.id, item_id=item.item_id, item_qty=item.item_qty, price=item.item_price, location=item.location_id)
        db.add(newPOItem)

    db.commit()
    return newPurchase

@app.get("/purchase-orders")
def get_purchase_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PurchaseOrderModel).filter(PurchaseOrderModel.company_id == current_user.company_id).all()
    

@app.get("/purchase-orders/{order_id}/items")
def get_order_items(order_id: int ,db:Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if (db.query(PurchaseOrderModel).filter(PurchaseOrderModel.id == order_id ,PurchaseOrderModel.company_id == current_user.company_id).first() == None):
        raise HTTPException(status_code = 403 , detail="Not found")
    order_request = db.query(OrderItemModel).filter(OrderItemModel.purchase_order_id == order_id).all()
    return order_request

@app.get("/purchase-orders/{order_id}/po-items")
def get_po_items(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if (db.query(PurchaseOrderModel).filter(PurchaseOrderModel.id == order_id, PurchaseOrderModel.company_id == current_user.company_id).first() == None):
        raise HTTPException(status_code = 403, detail="Not found")
    return db.query(POItemModel).filter(POItemModel.po_id == order_id).all()


@app.post("/deliveries")
def delivered(body: DeliveryIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    purchase_order = db.query(PurchaseOrderModel).filter(PurchaseOrderModel.id == body.purchase_order_id).first()
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if purchase_order.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    new_delivery = DeliveryModel(company_id = current_user.company_id, purchase_order_id = body.purchase_order_id, gps_lat = body.gps_lat, gps_lng = body.gps_lng, confirmed_by = current_user.id  )
    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)

    for item in body.items:
        new_item = DeliveryItemModel(order_item_id = item.order_item_id, received_qty = item.received_qty, delivery_id = new_delivery.id)
        db.add(new_item)
    db.commit()
    db.refresh(new_delivery)
    return new_delivery

@app.post("/projects")
def create_project(body: ProjectIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = ProjectModel(
        company_id=current_user.company_id,
        name=body.name,
        budget=body.budget,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@app.get("/projects")
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ProjectModel).filter(ProjectModel.company_id == current_user.company_id).all()

@app.post("/suppliers")
def create_supplier(body: SupplierIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    supplier = SupplierModel(company_id=current_user.company_id, name=body.name)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@app.get("/suppliers")
def get_suppliers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SupplierModel).filter(SupplierModel.company_id == current_user.company_id).all()


@app.post("/deliveries/{delivery_id}/photos")
async def upload_delivery_photo(delivery_id: int , file: UploadFile = File(), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check = db.query(DeliveryModel).filter(DeliveryModel.id == delivery_id).first()
    if not check:
        raise HTTPException(status_code = 404, detail="Delivery not found")
    if check.company_id != current_user.company_id:
        raise HTTPException(status_code = 403, detail="Invalid User")
    file_byte = await file.read()
    myString = hashlib.sha256(file_byte).hexdigest()
    supabase_admin.storage.from_("delivery-photos").upload(f"{delivery_id}/{myString}" , file_byte)

    request = DeliveryPhotoModel(delivery_id = delivery_id, file_key = f"{delivery_id}/{myString}", sha256_hash = myString)
    db.add(request)
    db.commit()
    return request

@app.post("/storage_location")
def storage_location(body: StorageLocationIn, db: Session = Depends(get_db), current_user:User = Depends(get_current_user)):
    request = StorageLocationModel(parent_storage_id = body.parent_storage, company_id = current_user.company_id, project_id = body.project_id, name = body.name , type = body.type)
    db.add(request)
    db.commit()
    db.refresh(request)

    for item in body.location_member:
        new_item = LocationMember(role= item.role, user_id = item.user_id, storage_id = request.id)
        db.add(new_item)
    db.commit()
    db.refresh(request)

    return request
    
@app.get("/storage_location")
def get_storage_locations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(StorageLocationModel).filter(StorageLocationModel.company_id == current_user.company_id).all()

@app.post("/items")
def enter_item(body: ItemIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    request = ItemModel(item_name = body.name, company_id = current_user.company_id, code = body.code, category = body.category, spec = body.spec, unit = body.unit, is_active = body.is_active , )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request
@app.get("/items")
def get_item(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ItemModel).filter(ItemModel.company_id == current_user.company_id).all()


@app.post("/receipt/{receipt_id}/photos")
async def upload_receipt_photo(receipt_id: int, file: UploadFile = File(), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check = db.query(ReceiptModel).filter(ReceiptModel.id == receipt_id).first()
    if not check:
        raise HTTPException(status_code = 404, detail = "receipt not found")
    if check.company_id != current_user.company_id:
        raise HTTPException(status_code = 403, detail  = "invalid request")   
    file_byte = await file.read()
    myString = hashlib.sha256(file_byte).hexdigest()
    supabase_admin.storage.from_("receipt-photos").upload(f"{receipt_id}/{myString}", file_byte)
    
    request = ReceiptPhotoModel(receipt_id = receipt_id, file_key = f"{receipt_id}/{myString}" , sha256_hash = myString)
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

@app.post("/receipt")
def add_receipt(body: ReceiptIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    request = ReceiptModel(company_id = current_user.company_id, purchase_order_id = body.po_id, location_id = body.location_id, received_by = current_user.id, note = body.note, gps_lat = body.gps_lat, gps_lng = body.gps_lng)
    db.add(request)
    db.commit()
    db.refresh(request)
    fulfilled_flags = []

    for line in body.po_lines:
        new_line = ReceiptLineModel(
    receipt_id=request.id,
    po_item_id=line.po_item_id,
    received_qty=line.received_qty,
    accepted_qty=line.accepted_qty,
    rejected_qty=line.rejected_qty,
    condition=line.condition,
    condition_note=line.condition_note,
    return_to_supplier=line.return_to_supplier,
)
        db.add(new_line)
        po_item = db.query(POItemModel).filter(POItemModel.id == line.po_item_id).first()
        received_location = db.query(StorageLocationModel).filter(StorageLocationModel.id == po_item.location).first()
        # need to use in stock movement and stock level
        stockMovement = StockMovementModel(company_id = current_user.company_id,item_id = po_item.item_id , location_id = received_location.id, movement_type = "receive" , qty = line.accepted_qty , project_id = received_location.project_id , actor_id = current_user.id, ref_type = "receipt", ref_id = request.id)
        db.add(stockMovement)
        stockLevel = db.query(StockLevelModel).filter(StockLevelModel.item_id == po_item.item_id , StockLevelModel.location_id == received_location.id).first()
        if stockLevel:
            stockLevel.qty += line.accepted_qty
            db.add(stockLevel)
        else:
            new_stock = StockLevelModel(item_id = po_item.item_id, location_id = po_item.location, qty = line.accepted_qty)
            db.add(new_stock)


    po = db.query(PurchaseOrderModel).filter(PurchaseOrderModel.id == body.po_id).first()
    all_po_item = db.query(POItemModel).filter(POItemModel.po_id == po.id).all()
    for po_item in all_po_item:
        # gives us all the receipt lines of the po_item
        receiptLines = db.query(ReceiptLineModel).filter(ReceiptLineModel.po_item_id == po_item.id)
        total_qty = 0
        for receipt_line in receiptLines:
            total_qty += receipt_line.accepted_qty
        fulfilled_flags.append(total_qty >= po_item.item_qty)
    if not any(fulfilled_flags):
        po.status = "open"
    elif False in fulfilled_flags:
        po.status = "partially_received"
    else:
        po.status = "received"
    db.add(po)



    db.commit()
    db.refresh(request)
    return request


@app.post("/withdrawal")
def add_withdrawal(body: WithdrawalIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    withdrawal = WithdrawalModel(company_id=current_user.company_id, project_id=body.project_id, location_id=body.location_id, requested_by=current_user.id)
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)

    for line in body.withdrawalLines:
        new_line = WithdrawalLineModel(withdrawal_id=withdrawal.id, item_id=line.item_id, qty=line.quantity)
        db.add(new_line)
        # TODO(user): insert a StockMovement (movement_type="withdraw") and decrement StockLevel for this item/location
        stockMovement = StockMovementModel(company_id = current_user.company_id, item_id = line.item_id , location_id = body.location_id, movement_type = "withdraw", qty = line.quantity, project_id = body.project_id, actor_id = current_user.id, ref_type = "withdraw", ref_id = withdrawal.id)
        db.add(stockMovement)
        stockLevel = db.query(StockLevelModel).filter(StockLevelModel.item_id == line.item_id, StockLevelModel.location_id == withdrawal.location_id).first()
        # a stock must exist otherwise we wound't have withdrawal to loop over, but what about we withdraw more than what we have
        # this should still be seen by the manager if its negative
        stockLevel.qty -= line.quantity 
        db.add(stockLevel)

    db.commit()
    db.refresh(withdrawal)
    return withdrawal

@app.get("/withdrawal")
def get_withdrawals(db: Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    return db.query(WithdrawalModel).filter(WithdrawalModel.company_id == current_user.company_id).all()

@app.get("/stock_level/{location_id}")
def get_stock_level(location_id: int, db: Session = Depends(get_db), current_user : User = Depends(get_current_user)):
    location = db.query(StockLevelModel).filter(StockLevelModel.location_id == location_id).all()
    storage = db.query(StorageLocationModel).filter(StorageLocationModel.id == location_id).first()
    if not storage:
        raise HTTPException(status_code = 404, detail = "stock doesnt exist")
    if storage.company_id != current_user.company_id:
        raise HTTPException(status_code = 403 , detail = "Unauthorised Access")
    return location