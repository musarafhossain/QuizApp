window.onload = async function () {
    const data_response = await fetch('/get-all-results');
    data = await data_response.json();
    // Add data to the table
    addDataToTable(data.results);
};

// Function to add rows to the table
function addDataToTable(data) {
    const tableBody = document.querySelector("#statementTable tbody");
    const userIDSelect = document.getElementById('userID');

    function userIdExists(userId) {
        for (const option of userIDSelect.options) {
            if (parseInt(option.value) === userId) {
                return true;
            }
        }
        return false;
    }

    for (let i = 0; i < data.length; i++) {
        if (!userIdExists(data[i].user_id)) {
            const option = document.createElement('option');
            option.text = data[i].user_id;
            option.value = data[i].user_id;
            userIDSelect.appendChild(option);
        }
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = data[i].id;
        idCell.setAttribute("data-label", "ID");
        row.appendChild(idCell);

        const userIdCell = document.createElement("td");
        userIdCell.textContent = data[i].user_id;
        userIdCell.setAttribute("data-label", "User ID");
        row.appendChild(userIdCell);

        const scoreCell = document.createElement("td");
        scoreCell.textContent = data[i].score;
        scoreCell.setAttribute("data-label", "Score");
        row.appendChild(scoreCell);

        const totalQuestionCell = document.createElement("td");
        totalQuestionCell.textContent = data[i].total_questions;
        totalQuestionCell.setAttribute("data-label", "Total Questions");
        row.appendChild(totalQuestionCell);

        const scorePercentageCell = document.createElement("td");
        scorePercentageCell.textContent = data[i].score_percentage;
        scorePercentageCell.setAttribute("data-label", "Score Percentage");
        row.appendChild(scorePercentageCell);

        const topicCell = document.createElement("td");
        topicCell.textContent = data[i].topic;
        topicCell.setAttribute("data-label", "Topic");
        row.appendChild(topicCell);

        const dt = data[i].timestamp;
        const timeCell = document.createElement("td");
        timeCell.textContent = formatDateForOutput(dt)
        timeCell.setAttribute("data-label", "Date Time");
        row.appendChild(timeCell);

        const actionCell = document.createElement("td");
        actionCell.setAttribute("data-label", "Action");
        actionCell.className = "actionCell";

        const editButton = document.createElement("button");
        editButton.className = "btn btn-yes";
        editButton.innerHTML = '<i class="fas fa-edit"></i> Edit Result';
        editButton.addEventListener("click", () => {
            openModal(document.getElementById('editModal'));
            setEditModalData(data[i]);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-no";
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Result';
        deleteButton.addEventListener("click", () => {
            document.getElementById("resultId").value = data[i].id;
            openModal(document.getElementById('confirmModal'));
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);

        tableBody.appendChild(row);
    }
}

/*================ Edit Modal Code ================*/
function setEditModalData(result) {
    document.getElementById("editId").value = result.id;
    document.getElementById("userEditID").value = result.user_id;
    document.getElementById("editScore").value = result.score;
    document.getElementById("editTotalQuestions").value = result.total_questions;
    document.getElementById("editScorePercentage").value = result.score_percentage;
    document.getElementById("editTopic").value = result.topic;
    document.getElementById("editDateTime").value = formatDateForInput(result.timestamp);
}

function editResult(event) {
    event.preventDefault();
    const id = document.getElementById("editId").value;
    const user_id = document.getElementById("userEditID").value;
    const score = document.getElementById("editScore").value;
    const total_questions = document.getElementById("editTotalQuestions").value;
    const score_percentage = document.getElementById("editScorePercentage").value;
    const topic = document.getElementById("editTopic").value;
    const timestamp = document.getElementById("editDateTime").value;

    fetch(`/update-result/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, user_id, score, total_questions, score_percentage, topic, timestamp })
    })
        .then(response => {
            if (response.ok) {
                alert(`Result with ID ${id} updated successfully.`);
                location.reload();
            } else {
                alert(`Failed to update result with ID ${id}.`);
            }
        })
        .catch(error => console.error('Error:', error));
}
/*============== End Edit Modal Code ================*/

/*================ Confirm Modal Code ================*/
function deleteReselt(event) {
    event.preventDefault();
    const form = event.target;
    const resultId = form.querySelector('input[name="resultId"]').value;
    fetch(`/delete-result/${resultId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                alert(`Result with ID ${resultId} deleted successfully.`);
                location.reload();
            } else {
                alert(`Failed to delete Result with ID ${resultId}.`);
            }
        })
        .catch(error => console.error('Error:', error));
}
/*============== End Delete Modal Code ================*/

/*================ Add User Code ================*/
function addResult(event) {
    event.preventDefault();

    const user_id = document.getElementById('userID').value;
    const score = parseFloat(document.getElementById('score').value);
    const total_questions = parseFloat(document.getElementById('totalQuestions').value);
    const score_percentage = document.getElementById('scorePercentage').value;
    const topic = document.getElementById('topic').value;
    const timestamp = document.getElementById('dateTime').value;
    fetch('/add-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id, score, total_questions, score_percentage, topic, timestamp })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Result added successfully');
                location.reload();
            } else {
                alert('Failed to add result', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
}

function updatePercentage(inputElement) {
    let score, totalQuestions;
    if (inputElement.id === 'score' || inputElement.id === 'totalQuestions') {
        score = parseFloat(document.getElementById('score').value);
        totalQuestions = parseFloat(document.getElementById('totalQuestions').value);
    } else if (inputElement.id === 'editScore' || inputElement.id === 'editTotalQuestions') {
        score = parseFloat(document.getElementById('editScore').value);
        totalQuestions = parseFloat(document.getElementById('editTotalQuestions').value);
    }

    if (!isNaN(score) && !isNaN(totalQuestions) && totalQuestions > 0) {
        const percentage = (score / totalQuestions) * 100;
        if (inputElement.id === 'score' || inputElement.id === 'totalQuestions') {
            document.getElementById('scorePercentage').value = percentage.toFixed(2);
        } else if (inputElement.id === 'editScore' || inputElement.id === 'editTotalQuestions') {
            document.getElementById('editScorePercentage').value = percentage.toFixed(2);
        }
    } else {
        if (inputElement.id === 'score' || inputElement.id === 'totalQuestions') {
            document.getElementById('scorePercentage').value = '';
        } else if (inputElement.id === 'editScore' || inputElement.id === 'editTotalQuestions') {
            document.getElementById('editScorePercentage').value = '';
        }
    }
}

function setDefaultDateTime() {
    const datetimeLocalValue = formatCurrentDateForInput(new Date());
    const dateTimeInput = document.querySelector('#addResultModal #dateTime');
    if (dateTimeInput) {
        dateTimeInput.value = datetimeLocalValue;
    }
}

function formatCurrentDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateForInput(dt) {
    const year = dt.year;
    const month = dt.month.toString().padStart(2, '0');
    const day = dt.day.toString().padStart(2, '0');
    const hours = dt.hour.toString().padStart(2, '0');
    const minutes = dt.minute.toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
/*============== End Modal Code ================*/

/*================ Modal Code ================*/
function openModal(modal) {
    setDefaultDateTime()
    modal.style.display = 'block'
}

function closeModal(modal) {
    modal.style.display = "none";
}
/*================ End Modal Code ================*/
