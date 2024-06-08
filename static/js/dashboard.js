var score_data;
window.onload = async function() {
    const response = await fetch(`/quiz-results`);
    score_data = await response.json();
    console.log(score_data)

    // JavaScript to create the chart
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array.from({ length: score_data.scores.length }, (_, i) => i + 1),
        datasets: [{
            label: 'Your Progress',
            data: score_data.scores,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
        }]
    },
    options: {
        responsive: true, // Make the chart responsive
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Attempts'
                },
                ticks: {
                    autoSkipPadding: 10 // Set the interval between the ticks
                }
            },
            y: {
                beginAtZero: true,
                min: 0,      // Set the minimum value for the y-axis
                max: 100,    // Set the maximum value for the y-axis
                title: {
                    display: true,
                    text: 'Percentage'
                },
                ticks: {
                    stepSize: 10 // Show y-axis ticks at intervals of 5
                }
            }
        }
    }
});

};

