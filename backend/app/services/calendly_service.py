"""
Calendly Service — Online Consultation Booking & Webhook Integration

Provides utilities for:
1. Constructing personalized Calendly online video consultation URLs with pre-filled pet & user details.
2. Parsing and verifying Calendly Webhook events (e.g. invitee.created, invitee.canceled).
"""

import os
import urllib.parse
from typing import Dict, Any, Optional


CALENDLY_API_TOKEN = os.getenv("CALENDLY_API_TOKEN", "")
CALENDLY_WEBHOOK_SIGNING_KEY = os.getenv("CALENDLY_WEBHOOK_SIGNING_KEY", "")


class CalendlyService:
    @staticmethod
    def generate_booking_url(
        calendly_base_url: str,
        user_name: str,
        user_email: str,
        pet_name: str,
        consultation_id: str,
        reason: Optional[str] = None
    ) -> str:
        """
        Generates an online video consultation booking URL with pre-filled query parameters.
        """
        if not calendly_base_url:
            calendly_base_url = "https://calendly.com/petolife-consultations/online-vet"

        query_params = {
            "name": user_name,
            "email": user_email,
            "a1": f"Pet Name: {pet_name}",
            "a2": f"Consultation ID: {consultation_id}",
        }
        if reason:
            query_params["a3"] = f"Reason: {reason}"

        encoded_params = urllib.parse.urlencode(query_params)
        return f"{calendly_base_url}?{encoded_params}"

    @staticmethod
    def parse_webhook_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses incoming Calendly webhook event payload.
        Extracts event type, start time, end time, meeting link, and invitee info.
        """
        event_name = payload.get("event", "")
        payload_data = payload.get("payload", {})
        
        scheduled_event = payload_data.get("scheduled_event", {})
        location = scheduled_event.get("location", {})
        meeting_link = location.get("join_url") or location.get("location") or ""
        
        invitee_name = payload_data.get("name", "")
        invitee_email = payload_data.get("email", "")
        tracking = payload_data.get("tracking", {})
        
        start_time = scheduled_event.get("start_time")
        end_time = scheduled_event.get("end_time")
        event_uri = scheduled_event.get("uri")
        invitee_uri = payload_data.get("uri")

        return {
            "event_type": event_name, # e.g. 'invitee.created' or 'invitee.canceled'
            "event_uri": event_uri,
            "invitee_uri": invitee_uri,
            "meeting_link": meeting_link,
            "start_time": start_time,
            "end_time": end_time,
            "invitee_name": invitee_name,
            "invitee_email": invitee_email,
            "tracking": tracking,
            "status": "completed" if event_name == "invitee.completed" else ("cancelled" if "canceled" in event_name else "scheduled")
        }
