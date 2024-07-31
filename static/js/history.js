window.onload = async function() {
    const data_response = await fetch('/get-data');
    data = await data_response.json();
    // Add data to the table
    addDataToTable(data);
};

// Function to add rows to the table
function addDataToTable(data) {
    const tableBody = document.querySelector("#statementTable tbody");
    for (let i = 0; i < data.topic.length; i++) {
        const row = document.createElement("tr");

        const topicCell = document.createElement("td");
        //console.log(data.topic[0])
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
        dateTimeCell.textContent = formatDateForOutput(data.date_time[i]);
        dateTimeCell.setAttribute("data-label", "Date and Time");
        row.appendChild(dateTimeCell);

        tableBody.appendChild(row);
    }
}

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

function formatDateForOutput(dt) {
    let period = "AM";
    let hour = dt.hour;

    if (hour >= 12) {
        period = "PM";
        if (hour > 12) {
            hour -= 12;
        }
    } else if (hour === 0) {
        hour = 12;
    }
    const paddedHour = hour.toString().padStart(2, '0');
    const paddedMonth = dt.month.toString().padStart(2, '0');
    const paddedDay = dt.day.toString().padStart(2, '0');
    const paddedMinute = dt.minute.toString().padStart(2, '0');
    return `${dt.year}/${paddedMonth}/${paddedDay} ${paddedHour}:${paddedMinute} ${period}`;
}