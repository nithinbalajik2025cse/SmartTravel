from phi.agent import Agent
from phi.model.openai import OpenAIChat
from services.serp_service import search_flights, search_hotels, search_activities

def get_research_agent() -> Agent:
    return Agent(
        name="Research Expert",
        role="Search for latest flights, hotels, and tourist attractions.",
        model=OpenAIChat(id="gpt-4o"),
        tools=[search_flights, search_hotels, search_activities],
        instructions=[
            "Given a destination, origin, duration, and budget, research real-time data.",
            "Use search_flights to find flight options.",
            "Use search_hotels to find accommodation.",
            "Use search_activities to find things to do.",
            "Provide a raw summary of findings."
        ],
        show_tool_calls=True,
    )
