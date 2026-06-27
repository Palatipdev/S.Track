from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.schemas import MaterialRequest
from app.database import get_db
from app.models import MaterialRequest as MaterialRequestModel
from app.models import RequestItem as RequestItemModel
from app.models import User
from app.auth import get_current_user

app = FastAPI()


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




