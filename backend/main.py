from __future__ import annotations

import json
import os
import logging
from typing import Any, Dict, List, Literal, Optional, TypedDict
from math import asin, cos, radians, sin, sqrt

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

logger = logging.getLogger("fitzone.ai_coach")

SYSTEM_PROMPT = (
    "You are FitZone Coach, an energetic and motivating fitness coach in a gamified territory-capture fitness app.\n\n"
    "Your personality:\n"
    "- Enthusiastic and supportive, like a personal trainer\n"
    "- Uses gaming terminology (XP, levels, conquering zones)\n"
    "- Gives practical, actionable fitness advice\n"
    "- Considers user's fitness level and goals\n"
    "- Recommends nearby places for workouts when relevant\n\n"
    "When responding:\n"
    "- Keep responses concise (2-3 sentences max)\n"
    "- Include emojis sparingly for energy\n"
    "- Reference their stats and progress\n"
    "- Suggest specific activities based on time of day\n"
    "- If they mention a location, recommend nearby gyms or parks\n\n"
    "Never:\n"
    "- Give medical advice\n"
    "- Recommend extreme diets or dangerous exercises\n"
    "- Be discouraging about their progress"
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class UserContext(BaseModel):
    name: str
    fitnessLevel: str
    fitnessGoals: List[str]
    totalDistance: float
    totalActivities: int
    xp: int
    level: int
    streak: int
    zonesOwned: int
    currentLocation: Optional[Dict[str, float]] = None
    timeOfDay: Literal["morning", "afternoon", "evening", "night"]
    nearbyPlaces: Optional[List[Dict[str, str]]] = None


class CoachRequest(BaseModel):
    messages: List[ChatMessage]
    context: UserContext


class CoachResponse(BaseModel):
    message: str
    suggestions: Optional[List[str]] = None
    recommendedPlace: Optional[Dict[str, Any]] = None


class MapZone(BaseModel):
    id: str
    center: Dict[str, float]
    isOwned: bool = False
    level: int = 1
    name: Optional[str] = None
    type: Optional[str] = None


class ZoneDecisionContext(BaseModel):
    currentLocation: Dict[str, float]
    streak: int = 0
    level: int = 1
    timeOfDay: Literal["morning", "afternoon", "evening", "night"] = "afternoon"


class ZoneDecisionRequest(BaseModel):
    zones: List[MapZone] = Field(default_factory=list)
    context: ZoneDecisionContext


class ZoneDecisionResponse(BaseModel):
    zoneId: str
    score: float
    reason: str
    model: str
    distanceKm: float
    estimatedRouteKm: float
    estimatedTravelMinutes: int
    idealPath: str


class GraphState(TypedDict):
    messages: List[ChatMessage]
    context: UserContext
    result: Optional[Dict[str, Any]]


def _build_llm() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.6"))

    return ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        google_api_key=api_key,
    )


def _to_lc_messages(messages: List[ChatMessage], context: UserContext) -> List[Any]:
    lc_messages: List[Any] = [SystemMessage(content=SYSTEM_PROMPT)]
    context_hint = (
        "User context (JSON): "
        + json.dumps(context.model_dump(), ensure_ascii=True)
    )
    # Gemini models often expect a single system message; include context as user content.
    lc_messages.append(HumanMessage(content=context_hint))

    for msg in messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
        else:
            # Convert extra system messages into user content to avoid Gemini errors.
            lc_messages.append(HumanMessage(content=msg.content))

    return lc_messages


def _coach_node(state: GraphState) -> Dict[str, Any]:
    llm = _build_llm()
    lc_messages = _to_lc_messages(state["messages"], state["context"])
    response = llm.invoke(lc_messages)
    content = response.content if hasattr(response, "content") else str(response)

    parsed: Dict[str, Any] = {}
    if isinstance(content, str):
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            parsed = {"message": content}

    if "message" not in parsed:
        parsed["message"] = content if isinstance(content, str) else str(content)

    return {"result": parsed}


def _build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("coach", _coach_node)
    graph.set_entry_point("coach")
    graph.add_edge("coach", END)
    return graph.compile()


def _zone_distance_km(a: Dict[str, float], b: Dict[str, float]) -> float:
    # Haversine distance gives robust results across city-scale points.
    lat1, lon1, lat2, lon2 = map(radians, [a["lat"], a["lng"], b["lat"], b["lng"]])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371.0 * (2 * asin(sqrt(h)))


def _normalize_zone_type(zone: MapZone) -> str:
    raw = (zone.type or "").strip().lower()
    if raw in {"park", "trail", "runway", "greenway", "waterfront", "gym"}:
        return raw

    name = (zone.name or "").lower()
    if "park" in name:
        return "park"
    if "trail" in name or "track" in name:
        return "trail"
    if "greenway" in name:
        return "greenway"
    if "waterfront" in name or "riverwalk" in name:
        return "waterfront"
    if "gym" in name or "fitness" in name:
        return "gym"
    return "park"


def _athlete_zone_quality(zone: MapZone) -> float:
    zone_type = _normalize_zone_type(zone)
    type_weights = {
        "park": 1.0,
        "trail": 0.97,
        "greenway": 0.95,
        "runway": 0.92,
        "waterfront": 0.89,
        "gym": 0.84,
    }
    weight = type_weights.get(zone_type, 0.8)

    name = (zone.name or "").lower()
    bad_landmarks = {
        "bridge",
        "terminal",
        "museum",
        "courthouse",
        "station",
        "tunnel",
        "airport",
        "pier",
    }
    fitness_markers = {"park", "trail", "track", "greenway", "run", "fitness", "gym"}
    if any(word in name for word in bad_landmarks) and not any(word in name for word in fitness_markers):
        return 0.15

    return weight


def _target_distance_km(context: ZoneDecisionContext) -> float:
    base = {
        "morning": 1.8,
        "afternoon": 2.4,
        "evening": 2.2,
        "night": 1.4,
    }[context.timeOfDay]
    level_adjust = min(1.8, max(0.0, (context.level - 1) * 0.15))
    return base + level_adjust


def _estimate_route_km(crow_km: float, zone: MapZone) -> float:
    zone_type = _normalize_zone_type(zone)
    route_factor = {
        "park": 1.28,
        "trail": 1.18,
        "greenway": 1.2,
        "runway": 1.12,
        "waterfront": 1.25,
        "gym": 1.15,
    }.get(zone_type, 1.22)
    return crow_km * route_factor


def _estimate_travel_minutes(route_km: float, context: ZoneDecisionContext) -> int:
    # Blend walk/jog speed by level to keep ETAs realistic.
    pace_kmh = min(7.5, 4.8 + (context.level * 0.28))
    return max(4, int(round((route_km / max(pace_kmh, 0.1)) * 60)))


def _ideal_path_label(route_km: float, context: ZoneDecisionContext) -> str:
    if route_km <= 1.4:
        return "Direct out-and-back warmup route"
    if route_km <= 3.5:
        return "Single-loop steady pace route"
    if context.level >= 5:
        return "Progressive loop with final tempo push"
    return "Controlled out-and-back with even splits"


def _zone_metrics(zone: MapZone, context: ZoneDecisionContext) -> Dict[str, Any]:
    crow_distance = _zone_distance_km(zone.center, context.currentLocation)
    route_km = _estimate_route_km(crow_distance, zone)
    travel_minutes = _estimate_travel_minutes(route_km, context)

    target_distance = _target_distance_km(context)
    distance_fit = 1.0 / (1.0 + abs(route_km - target_distance))
    proximity_score = 1.0 / (1.0 + crow_distance)
    athlete_quality = _athlete_zone_quality(zone)
    ownership_score = 1.0 if not zone.isOwned else 0.35
    level_gap = abs(zone.level - context.level)
    level_score = max(0.25, 1.0 - (level_gap / 6.0))
    streak_bonus = min(0.2, context.streak / 50.0)

    score = (
        proximity_score * 0.34
        + distance_fit * 0.24
        + athlete_quality * 0.2
        + ownership_score * 0.14
        + level_score * 0.08
        + streak_bonus
    )

    return {
        "score": round(score, 4),
        "distanceKm": round(crow_distance, 3),
        "estimatedRouteKm": round(route_km, 3),
        "estimatedTravelMinutes": travel_minutes,
        "idealPath": _ideal_path_label(route_km, context),
    }


def _python_reason_for_zone(zone: MapZone, metrics: Dict[str, Any]) -> str:
    zone_name = zone.name or f"Zone {zone.id}"
    return (
        f"{zone_name} is closest with an estimated {metrics['estimatedRouteKm']} km route "
        f"({metrics['estimatedTravelMinutes']} min), ideal for a {metrics['idealPath'].lower()}."
    )


app = FastAPI(title="FitZone AI Coach")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ai-coach", response_model=CoachResponse)
def ai_coach(payload: CoachRequest):
    try:
        app_graph = _build_graph()
        result = app_graph.invoke(
            {"messages": payload.messages, "context": payload.context, "result": None}
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("AI coach failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not isinstance(result, dict) or "result" not in result:
        raise HTTPException(status_code=500, detail="AI coach returned invalid state")

    return CoachResponse(**result["result"])


@app.post("/zone-decision", response_model=ZoneDecisionResponse)
def zone_decision(payload: ZoneDecisionRequest):
    if not payload.zones:
        raise HTTPException(status_code=400, detail="No zones provided")

    scored = [
        (zone, _zone_metrics(zone, payload.context))
        for zone in payload.zones
    ]
    best_zone, best_metrics = max(scored, key=lambda item: item[1]["score"])
    reason = _python_reason_for_zone(best_zone, best_metrics)

    return ZoneDecisionResponse(
        zoneId=best_zone.id,
        score=best_metrics["score"],
        reason=reason,
        model="python-geospatial-v2",
        distanceKm=best_metrics["distanceKm"],
        estimatedRouteKm=best_metrics["estimatedRouteKm"],
        estimatedTravelMinutes=best_metrics["estimatedTravelMinutes"],
        idealPath=best_metrics["idealPath"],
    )
