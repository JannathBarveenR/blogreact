from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter()

class PincodeRequest(BaseModel):
    pincode: str

COMMON_PINCODES = {
    "641001": {"city": "Coimbatore", "state": "Tamil Nadu", "district": "Coimbatore"},
    "641002": {"city": "Coimbatore", "state": "Tamil Nadu", "district": "Coimbatore"},
    "641003": {"city": "Coimbatore", "state": "Tamil Nadu", "district": "Coimbatore"},
    "560001": {"city": "Bangalore", "state": "Karnataka", "district": "Bangalore Urban"},
    "560002": {"city": "Bangalore", "state": "Karnataka", "district": "Bangalore Urban"},
    "600001": {"city": "Chennai", "state": "Tamil Nadu", "district": "Chennai"},
    "600002": {"city": "Chennai", "state": "Tamil Nadu", "district": "Chennai"},
    "500001": {"city": "Hyderabad", "state": "Telangana", "district": "Hyderabad"},
    "500002": {"city": "Hyderabad", "state": "Telangana", "district": "Hyderabad"},
}

async def fetch_pincode_data(pincode: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"https://api.postalpincode.in/pincode/{pincode}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0]
            return None
    except Exception:
        return None

@router.get("/pincode/{pincode}")
async def get_location(pincode: str):
    """Lookup city/state/district from 6-digit Indian pincode."""
    pincode_clean = pincode.strip()
    if len(pincode_clean) != 6 or not pincode_clean.isdigit():
        raise HTTPException(status_code=400, detail="Invalid pincode. Must be 6 digits.")
    
    if pincode_clean in COMMON_PINCODES:
        data = COMMON_PINCODES[pincode_clean]
        return {"pincode": pincode_clean, **data, "is_valid": True}
    
    raw_data = await fetch_pincode_data(pincode_clean)
    if raw_data and raw_data.get("Status") == "Success" and raw_data.get("PostOffice"):
        po = raw_data["PostOffice"][0]
        return {
            "pincode": pincode_clean,
            "city": po.get("District") or po.get("Region", ""),
            "state": po.get("State", ""),
            "district": po.get("District", ""),
            "is_valid": True
        }
    
    raise HTTPException(status_code=404, detail=f"Pincode {pincode_clean} not found")

@router.post("/lookup")
async def lookup_pincode(body: PincodeRequest):
    """POST wrapper for pincode lookup (delegates to GET implementation)."""
    return await get_location(body.pincode)
