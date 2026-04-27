from phi.agent import Agent
from phi.model.openai import OpenAIChat

def get_planner_agent() -> Agent:
    return Agent(
        name="Itinerary Planner",
        role="Design a detailed day-by-day travel itinerary.",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You receive raw research data about a destination, including activities.",
            "Create a logical day-by-day itinerary.",
            "Each day should include a morning, afternoon, and evening activity.",
            "Format the output clearly."
        ],
        show_tool_calls=False,
    )
