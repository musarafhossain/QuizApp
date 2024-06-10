var score_data;
let data;
window.onload = async function() {
    const response = await fetch(`/quiz-results`);
    score_data = await response.json();
    console.log(score_data)
    let width = `${51+(score_data.scores.length*30)}px`;
    document.querySelector(".container").style.width = width;

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
    const data_response = await fetch('/get-data');
    data = await data_response.json();
    console.log(data)
    // Add data to the table
    addDataToTable(data);
};

// Object mapping values to category strings
const categoryMapping = {
    "9": "General Knowledge",
    "10": "Entertainment: Books",
    "11": "Entertainment: Film",
    "12": "Entertainment: Music",
    "13": "Entertainment: Musicals & Theatres",
    "14": "Entertainment: Television",
    "15": "Entertainment: Video Games",
    "16": "Entertainment: Board Games",
    "17": "Science & Nature",
    "18": "Science: Computers",
    "19": "Science: Mathematics",
    "20": "Mythology",
    "21": "Sports",
    "22": "Geography",
    "23": "History",
    "24": "Politics",
    "25": "Art",
    "26": "Celebrities",
    "27": "Animals"
};

function getCategoryString(value) {
    return categoryMapping[value] || "Unknown Category";
}

// Function to add rows to the table
function addDataToTable(data) {
    const tableBody = document.querySelector("#statementTable tbody");
    for (let i = 0; i < data.topic.length; i++) {
        const row = document.createElement("tr");

        const topicCell = document.createElement("td");
        console.log(data.topic[0])
        topicCell.textContent = getCategoryString(parseInt(data.topic[i]));
        topicCell.setAttribute("data-label", "Topic");
        row.appendChild(topicCell);

        const scoreCell = document.createElement("td");
        scoreCell.textContent = data.scores[i];
        scoreCell.setAttribute("data-label", "Your Score");
        row.appendChild(scoreCell);

        if(data.scores[i] >= 60){
            row.style.backgroundColor = '#C3FF93';
        }else if(data.scores[i] >= 30){
            row.style.backgroundColor = '#FFDB5C';
        }else{
            row.style.backgroundColor = '#FA7070';
        }

        const totalMarksCell = document.createElement("td");
        totalMarksCell.textContent = 100;
        totalMarksCell.setAttribute("data-label", "Total Marks");
        row.appendChild(totalMarksCell);

        const totalQuestionsCell = document.createElement("td");
        totalQuestionsCell.textContent = data.total_qus[i];
        totalQuestionsCell.setAttribute("data-label", "Total Questions");
        row.appendChild(totalQuestionsCell);

        const dateTimeCell = document.createElement("td");
        dateTimeCell.textContent = new Date(data.date_time[i]).toLocaleString();
        dateTimeCell.setAttribute("data-label", "Date and Time");
        row.appendChild(dateTimeCell);

        tableBody.appendChild(row);
    }
}