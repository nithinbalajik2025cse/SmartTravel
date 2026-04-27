document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("trip-form");
    const loading = document.getElementById("loading");
    const results = document.getElementById("results");
    const loadingText = document.getElementById("loading-text");
    const resDestination = document.getElementById("res-destination");
    let budgetChartInstance = null;

    const loadingStates = [
        "Consulting Research Expert...",
        "Scanning for optimal flights...",
        "Checking hotel availability...",
        "Itinerary Planner crafting the perfect schedule...",
        "Booking Coordinator crunching the budget...",
        "Finalizing your trip details..."
    ];

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const origin = document.getElementById("origin").value;
        const destination = document.getElementById("destination").value;
        const duration = parseInt(document.getElementById("duration").value);
        const budget = parseFloat(document.getElementById("budget").value);

        // UI Reset
        results.classList.add("hidden");
        loading.classList.remove("hidden");
        
        let stateIndex = 0;
        const stateInterval = setInterval(() => {
            stateIndex = (stateIndex + 1) % loadingStates.length;
            loadingText.textContent = loadingStates[stateIndex];
        }, 3000);

        try {
            const response = await fetch("/api/plan-trip", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    origin: origin,
                    destination: destination,
                    duration_days: duration,
                    budget: budget
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Server error");
            }

            const data = await response.json();
            clearInterval(stateInterval);
            renderResults(data);
        } catch (error) {
            clearInterval(stateInterval);
            alert("Error planning trip: " + error.message);
            loading.classList.add("hidden");
        }
    });

    function renderResults(data) {
        loading.classList.add("hidden");
        results.classList.remove("hidden");
        
        resDestination.textContent = data.destination || document.getElementById("destination").value;

        // Render Flights
        const flightsContainer = document.getElementById("flights-container");
        flightsContainer.innerHTML = "";
        if (data.flights && data.flights.length > 0) {
            data.flights.forEach(flight => {
                const el = document.createElement("div");
                el.className = "info-item";
                el.innerHTML = `
                    <strong>${flight.airline} (${flight.flight_number})</strong>
                    <p>${flight.departure_time} - ${flight.arrival_time} (${flight.duration})</p>
                    <p style="color:var(--primary); font-weight:600; margin-top:5px;">Cost: ₹${flight.price}</p>
                `;
                flightsContainer.appendChild(el);
            });
        } else {
            flightsContainer.innerHTML = "<p>No flight details returned.</p>";
        }

        // Render Hotels
        const hotelsContainer = document.getElementById("hotels-container");
        hotelsContainer.innerHTML = "";
        if (data.hotels && data.hotels.length > 0) {
            data.hotels.forEach(hotel => {
                const el = document.createElement("div");
                el.className = "info-item";
                el.innerHTML = `
                    <strong>${hotel.name} (⭐ ${hotel.rating})</strong>
                    <p>Amenities: ${hotel.amenities ? hotel.amenities.join(", ") : 'N/A'}</p>
                    <p style="color:var(--primary); font-weight:600; margin-top:5px;">Price per night: ₹${hotel.price_per_night}</p>
                `;
                hotelsContainer.appendChild(el);
            });
        } else {
            hotelsContainer.innerHTML = "<p>No hotel details returned.</p>";
        }

        // Render Itinerary Accordion
        const itineraryContainer = document.getElementById("itinerary-accordion");
        itineraryContainer.innerHTML = "";
        if (data.itinerary && data.itinerary.length > 0) {
            data.itinerary.forEach((day, index) => {
                const item = document.createElement("div");
                item.className = "accordion-item";

                let activitiesHtml = "";
                if (day.activities) {
                    day.activities.forEach(act => {
                        activitiesHtml += `
                            <div class="activity">
                                <div class="activity-time">${act.time}</div>
                                <div class="activity-desc">${act.description}</div>
                                ${act.cost ? `<div style="font-size:0.85rem; color:#aaa; margin-top:4px;">Est. Cost: ₹${act.cost}</div>` : ''}
                            </div>
                        `;
                    });
                }

                item.innerHTML = `
                    <button class="accordion-header" onclick="toggleAccordion(this)">
                        Day ${day.day}: ${day.date}
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <div class="accordion-inner">
                            ${activitiesHtml}
                        </div>
                    </div>
                `;
                itineraryContainer.appendChild(item);
            });
            // Open first panel by default
            if(itineraryContainer.firstChild) {
                itineraryContainer.firstChild.classList.add("active");
            }
        }

        // Render Budget Breakdown (Chart.js)
        renderChart(data.budget_breakdown);
        
        // Summary Text
        if (data.budget_breakdown) {
            const b = data.budget_breakdown;
            document.getElementById("budget-summary").innerHTML = `
                <p><strong>Total Flight Cost:</strong> ₹${b.flights}</p>
                <p><strong>Total Accommodation:</strong> ₹${b.accommodation}</p>
                <p><strong>Estimated Activities:</strong> ₹${b.activities}</p>
                <p><strong>Food & Misc:</strong> ₹${b.food_and_misc}</p>
                <hr style="border-color:var(--glass-border); margin:10px 0;">
                <p style="font-size:1.2rem; color:var(--primary);"><strong>Estimated Total:</strong> ₹${b.total}</p>
            `;
        }
    }

    function renderChart(budget) {
        const ctx = document.getElementById("budgetChart").getContext("2d");
        
        if (budgetChartInstance) {
            budgetChartInstance.destroy();
        }
        
        if (!budget) return;

        const dataVals = [
            budget.flights || 0,
            budget.accommodation || 0,
            budget.activities || 0,
            budget.food_and_misc || 0
        ];

        budgetChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Flights', 'Accommodation', 'Activities', 'Food/Misc'],
                datasets: [{
                    data: dataVals,
                    backgroundColor: [
                        '#00B4D8', // primary
                        '#90E0EF', // secondary
                        '#0077b6', // darker teal/navy
                        '#caf0f8'  // light accent
                    ],
                    borderColor: 'transparent',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#E0E1DD',
                            font: {
                                family: "'Outfit', sans-serif"
                            }
                        }
                    }
                }
            }
        });
    }

    // Global toggle function
    window.toggleAccordion = function(element) {
        const item = element.parentElement;
        item.classList.toggle("active");
    };
});
