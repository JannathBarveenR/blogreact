# backend/app/timeline/services/export_service.py
import io, csv
from app.supabase_client import supabase

def _flatten_event(ev):
    flat = []
    base = [ev["event_date"], ev.get("clinic_name",""), ev.get("vet_name","")]
    for en in ev.get("category_entries", []):
        flat.append(base + [en.get("category"), en.get("item_name"),
                            en.get("status",""), en.get("next_due_date","")])
    return flat

class ExportService:
    @staticmethod
    def _fetch_timeline(pet_id: str):
        return (supabase.table("medical_events").select("*")
                .eq("pet_id", pet_id).eq("is_deleted", False)
                .order("event_date", desc=True).execute().data) or []

    @staticmethod
    def generate_csv(pet_id: str) -> bytes:
        events = ExportService._fetch_timeline(pet_id)
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(["Date", "Clinic", "Vet", "Category", "Item", "Status", "Next Due"])
        for ev in events:
            for row in _flatten_event(ev):
                writer.writerow(row)
        return out.getvalue().encode("utf-8")

    @staticmethod
    def generate_pdf(pet_id: str) -> bytes:
        try:
            from reportlab.pdfgen import canvas
        except ImportError:
            # Fallback if reportlab isn't installed
            return b"PDF export requires reportlab. Run pip install reportlab."
        
        events = ExportService._fetch_timeline(pet_id)
        buf = io.BytesIO()
        c = canvas.Canvas(buf)
        c.drawString(100, 800, f"Medical History for Pet: {pet_id}")
        y = 770
        for ev in events:
            if y < 100: c.showPage(); y = 800
            c.drawString(100, y, f"Date: {ev['event_date']} | Clinic: {ev.get('clinic_name','')}")
            y -= 20
            for en in ev.get("category_entries", []):
                if y < 100: c.showPage(); y = 800
                c.drawString(120, y, f"- {en.get('category')}: {en.get('item_name')}")
                y -= 20
            y -= 10
        c.save()
        return buf.getvalue()
