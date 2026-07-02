from fastapi import FastAPI, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.schemas import MaterialRequest
from app.database import get_db
from app.models import MaterialRequest as MaterialRequestModel
from app.models import RequestItem as RequestItemModel
from app.models import User
from app.schemas import ApproveRequest
from app.auth import get_current_user
from app.schemas import PurchaseOrderIn
from app.models import PurchaseOrder as PurchaseOrderModel
from app.models import OrderItem as OrderItemModel
from app.models import Delivery as DeliveryModel
from app.models import DeliveryItem as DeliveryItemModel
from app.schemas import DeliveryItemIn, DeliveryIn, ProjectIn, SupplierIn
from app.models import Project as ProjectModel, Supplier as SupplierModel
from app.models import DeliveryPhoto as DeliveryPhotoModel

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
    checkStatus = db.query(MaterialRequestModel).filter(MaterialRequestModel.id == body.material_request_id).first()
    if not checkStatus:
        raise HTTPException(status_code=404, detail="Request not found")
    if checkStatus.status.value != "approved":
        raise HTTPException(status_code=403, detail="Request not approved")
    newPurchase =  PurchaseOrderModel(company_id=current_user.company_id, material_request_id= body.material_request_id, supplier_id= body.supplier_id, expected_delivery= body.expected_delivery, total_cost = sum(item.quantity * item.unit_cost  for item in body.items))

    db.add(newPurchase)
    db.commit()
    db.refresh(newPurchase)

    for item in body.items:
        newItemOrder =  OrderItemModel(purchase_order_id= newPurchase.id, item_name= item.item_name, quantity= item.quantity, unit= item.unit, unit_cost= item.unit_cost, request_item_id = item.request_item_id )
        db.add(newItemOrder)

    db.commit()
    return newPurchase

@app.get("/purchase-orders")
def get_purchase_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(PurchaseOrderModel).filter(PurchaseOrderModel.company_id == current_user.company_id).all()
    result = []
    for order in orders:
        request_items = db.query(RequestItemModel).filter(RequestItemModel.material_request_id == order.material_request_id).all()
        order_items = db.query(OrderItemModel).filter(OrderItemModel.purchase_order_id == order.id).all()

        requested_by_id = {ri.id: ri.quantity for ri in request_items}
        item_variances = []
        for item in order_items:
            if item.request_item_id not in requested_by_id:
                item_variances.append({"request_item_id": None, "variance_pct": None, "unrequested": True , "item_name": item.item_name, "quantity": item.quantity})
                continue
            var = (( item.quantity- requested_by_id[item.request_item_id] ) / requested_by_id[item.request_item_id]) * 100
            item_variances.append({"request_item_id": item.request_item_id, "variance_pct": var, "item_name": item.item_name, "quantity": item.quantity})

        flagged = any(abs(v["variance_pct"]) > 10 for v in item_variances if v["variance_pct"] is not None)

        result.append({
            "order": order,
            "flagged": flagged,
            "item_variances": item_variances
        })
    return result

@app.get("/purchase-orders/{order_id}/items")
def get_order_items(order_id: int ,db:Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if (db.query(PurchaseOrderModel).filter(PurchaseOrderModel.id == order_id ,PurchaseOrderModel.company_id == current_user.company_id).first() == None):
        raise HTTPException(status_code = 403 , detail="Not found")
    order_request = db.query(OrderItemModel).filter(OrderItemModel.purchase_order_id == order_id).all()
    return order_request


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
    supabase.storage.from_("delivery-photos").upload(f"{delivery_id}/{myString}" , file_byte)

    request = DeliveryPhotoModel(delivery_id = delivery_id, file_key = f"{delivery_id}/{myString}", sha256_hash = myString)
    db.add(request)
    db.commit()
    return request
