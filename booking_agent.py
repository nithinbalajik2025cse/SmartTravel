from phi.agent import Agent
from phi.model.openai import OpenAIChat

def get_booking_agent() -> Agent:
    return Agent(
        name="Booking Coordinator",
        role="Finalize flight and hotel options and calculate the budget breakdown.",
        model=OpenAIChat(id="gpt-4o"),
        instructions=[
            "You receive raw research and an itinerary.",
            "Select the best flight options and hotel options that fit within the given budget.",
            "Calculate a detailed budget breakdown (flights, accommodation, activities, food_and_misc) and total cost.",
            "Output must be structured clearly."
        ],
        show_tool_calls=False,
    )
