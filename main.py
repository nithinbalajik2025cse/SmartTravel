import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
from datetime import datetime

from models.trip_request import TripRequest, TripPlanResponse
from services.openai_service import init_openai
from agents.research_agent import get_research_agent
from agents.planner_agent import get_planner_agent
from agents.booking_agent import get_booking_agent
from phi.agent import Agent

app = FastAPI(title="Smart Travel Advisor API")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

init_openai()

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/plan-trip", response_model=TripPlanResponse)
async def plan_trip(request: TripRequest):
    try:
        # Create an orchestrator team using Phidata
        research_agent = get_research_agent()
        planner_agent = get_planner_agent()
        booking_agent = get_booking_agent()
        
        team = Agent(
            name="Travel Agency Team",
            team=[research_agent, planner_agent, booking_agent],
            instructions=[
                "1. Ask the Research Expert to gather data about flights, hotels, and activities based on the criteria.",
                "2. Ask the Itinerary Planner to construct a day-by-day itinerary with the findings.",
                "3. Ask the Booking Coordinator to select the best flights and hotels within budget and calculate the budget breakdown.",
                "4. Compile all information and return the exact JSON structure mapped to TripPlanResponse model.",
            ],
            response_model=TripPlanResponse,
            show_tool_calls=True,
        )
        
        # We need the trip start date
        date_str = datetime.now().strftime("%Y-%m-%d") # Use today roughly or fake future
        
        prompt = (
            f"Please plan a {request.duration_days}-day trip to {request.destination} "
            f"from {request.origin} starting soon (e.g. {date_str}). "
            f"The total budget is {request.budget} INR. "
        )
        
        # Run team
        run_response = team.run(prompt)
        
        # run_response.content contains the Pydantic model if response_model is defined
        return run_response.content
        
    except Exception as e:
        print("Error during trip planning:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
