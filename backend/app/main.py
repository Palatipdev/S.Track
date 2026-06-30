from fastapi import FastAPI, Depends, HTTPException
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

        newItemOrder =  OrderItemModel(purchase_order_id= newPurchase.id, item_name= item.item_name, quantity= item.quantity, unit= item.unit, unit_cost= item.unit_cost )
        db.add(newItemOrder)

    db.commit()
    return newPurchase



