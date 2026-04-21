"""
Agent Tool Registry
===================
Defines Anthropic-compatible tool schemas for all external service connectors.

Each connector operates in one of three modes:
  "mock"         → returns realistic demo data (no API keys required)
  "connected"    → calls the real external service
  "unconfigured" → required config keys are missing (falls back to mock)

Adding a new service connector
-------------------------------
1. Subclass ServiceConnector and implement execute() + anthropic_schema()
2. Add any required config key names to requires_config
3. Register at the bottom: tool_registry.register(MyConnector())

The tool_registry singleton is imported by ai_service.py and admin.py.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


# ── Base class ────────────────────────────────────────────────────────────────

class ServiceConnector(ABC):
    name: str
    label: str
    description: str
    requires_config: List[str] = []

    @property
    def status(self) -> str:
        from app.core.config import settings
        for key in self.requires_config:
            if not getattr(settings, key, None):
                return "unconfigured"
        return "connected"

    @abstractmethod
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]: ...

    @abstractmethod
    def anthropic_schema(self) -> Dict: ...

    def to_status_dict(self) -> Dict:
        return {
            "name": self.name,
            "label": self.label,
            "description": self.description,
            "status": self.status,
            "requires_config": self.requires_config,
        }


# ── Connectors ────────────────────────────────────────────────────────────────

class FlightStatusConnector(ServiceConnector):
    name = "get_flight_status"
    label = "Flight Status (FIDS)"
    description = "Real-time flight status, gate, delays, and check-in desk via FIDS"
    requires_config = ["FIDS_API_KEY"]

    async def execute(self, params: Dict) -> Dict:
        flight_number = params.get("flight_number", "").upper()
        try:
            from app.services.fids_service import FIDSService
            return await FIDSService().get_flight(flight_number)
        except Exception as e:
            return {"error": str(e), "flight_number": flight_number}

    def anthropic_schema(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "flight_number": {
                        "type": "string",
                        "description": "IATA flight number e.g. MK014",
                    }
                },
                "required": ["flight_number"],
            },
        }


class BookingLookupConnector(ServiceConnector):
    name = "get_booking_info"
    label = "Booking Lookup (PNR)"
    description = "Retrieve full passenger booking details by PNR reference"
    requires_config = ["BOOKING_SYSTEM_API_KEY"]

    async def execute(self, params: Dict) -> Dict:
        pnr = params.get("pnr", "").upper()
        try:
            from app.services.booking_service import BookingService
            return await BookingService().get_booking(pnr)
        except Exception as e:
            return {"error": str(e), "pnr": pnr}

    def anthropic_schema(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "pnr": {
                        "type": "string",
                        "description": "6-character booking reference e.g. ABC123",
                    }
                },
                "required": ["pnr"],
            },
        }


class SpecialServiceConnector(ServiceConnector):
    name = "request_special_service"
    label = "Special Service Request (SSR)"
    description = "Add a meal preference, wheelchair assistance, or other SSR code to a booking"
    requires_config = ["BOOKING_SYSTEM_API_KEY"]

    async def execute(self, params: Dict) -> Dict:
        pnr = params.get("pnr", "").upper()
        service_code = params.get("service_code", "")
        notes = params.get("notes", "")
        try:
            from app.services.booking_service import BookingService
            return await BookingService().request_service(
                pnr=pnr,
                service_type="special_request",
                service_code=service_code,
                notes=notes,
            )
        except Exception as e:
            return {"error": str(e)}

    def anthropic_schema(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "pnr": {"type": "string", "description": "Booking reference"},
                    "service_code": {
                        "type": "string",
                        "description": (
                            "SSR code: VGML Vegetarian, VLML Vegan, MOML Halal, "
                            "HNML Hindu, KSML Kosher, DBML Diabetic, GFML Gluten-free, "
                            "CHML Child, WCHR/WCHS/WCHC Wheelchair"
                        ),
                    },
                    "notes": {
                        "type": "string",
                        "description": "Additional notes for the service request",
                    },
                },
                "required": ["pnr", "service_code"],
            },
        }


class AirportInfoConnector(ServiceConnector):
    name = "get_airport_info"
    label = "Airport Information"
    description = "Current airport facilities, lounge access, wait times, and services"
    requires_config = []  # Built-in data, no external API needed

    async def execute(self, params: Dict) -> Dict:
        topic = params.get("topic", "general")
        _data = {
            "lounge": {
                "Amédée Maingard Lounge": "Business class (complimentary) — Level 2 Departures",
                "Premium Lounge": "Economy passengers ($35) — Level 2 Departures",
                "ATOL Lounge": "All passengers ($25) — Level 1 Departures",
                "facilities": "Wi-Fi, hot meals, showers, business center in all lounges",
            },
            "facilities": {
                "wifi": "Free throughout terminal — SSID: SSR_FREE_WIFI",
                "prayer_room": "Departures Level 2, near Gate A6",
                "nursing_room": "Arrivals Level 1 and Departures Level 2",
                "children_area": "Near Gate A3, Departures Level",
                "atm": "Arrivals hall and Departures Level 1 (MCB, SBM, Barclays)",
                "currency_exchange": "Arrivals hall — open 24/7",
                "pharmacy": "Departures Level 1, open 05:00–23:00",
                "smoking": "Designated outdoor area, Ground Level exit B",
            },
            "checkin": {
                "hall_a": "Air Mauritius flights (Desks 1–24)",
                "hall_b": "All other airlines (Desks 25–54)",
                "opens": "3 hours before departure",
                "closes": "60 minutes before departure",
                "online_checkin": "Opens 30 hours before departure on airmauritius.com",
            },
        }
        return _data.get(topic, _data)

    def anthropic_schema(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "enum": ["lounge", "facilities", "checkin", "general"],
                        "description": "Information category to retrieve",
                    }
                },
                "required": ["topic"],
            },
        }


class EscalationConnector(ServiceConnector):
    name = "escalate_to_human"
    label = "Human Escalation (IPCC)"
    description = "Transfer the conversation to a live human agent via Cisco IPCC queue"
    requires_config = ["CISCO_IPCC_WEBHOOK_URL"]

    async def execute(self, params: Dict) -> Dict:
        reason = params.get("reason", "Customer requested human agent")
        priority = params.get("priority", "normal")
        return {
            "escalated": True,
            "reason": reason,
            "priority": priority,
            "queue_message": "Transferring you to our customer service team. Please hold.",
            "estimated_wait_minutes": 3,
        }

    def anthropic_schema(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Clear reason for escalating to a human agent",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["urgent", "high", "normal"],
                        "description": "Ticket priority level",
                    },
                },
                "required": ["reason"],
            },
        }


# ── Registry ──────────────────────────────────────────────────────────────────

class ToolRegistry:
    def __init__(self):
        self._connectors: Dict[str, ServiceConnector] = {}

    def register(self, connector: ServiceConnector):
        self._connectors[connector.name] = connector

    def get_anthropic_tools(self) -> List[Dict]:
        """Return tool schemas in Anthropic API format."""
        return [c.anthropic_schema() for c in self._connectors.values()]

    async def execute(self, tool_name: str, params: Dict) -> Dict:
        connector = self._connectors.get(tool_name)
        if not connector:
            return {"error": f"Unknown tool: {tool_name}"}
        return await connector.execute(params)

    def get_statuses(self) -> List[Dict]:
        return [c.to_status_dict() for c in self._connectors.values()]

    def get_tool(self, name: str) -> Optional[ServiceConnector]:
        return self._connectors.get(name)


# Singleton imported everywhere
tool_registry = ToolRegistry()
tool_registry.register(FlightStatusConnector())
tool_registry.register(BookingLookupConnector())
tool_registry.register(SpecialServiceConnector())
tool_registry.register(AirportInfoConnector())
tool_registry.register(EscalationConnector())
