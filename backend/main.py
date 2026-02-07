from __future__ import annotations

import json
import os
import logging
from typing import Any, Dict, List, Literal, Optional, TypedDict

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
