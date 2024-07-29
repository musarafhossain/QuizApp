let quizQuestions = [];
const startQuizBtn = document.getElementById('start-quiz-button');
const startBtn = document.getElementById('start-button');
let currentQuestionIndex = 0;
let score = 0;
let totalTime = 30; 
let timeLeft = totalTime;
let timerInterval;
let currentOpt=[];
let topic;

startQuizBtn.addEventListener('click', async function () {
    const numberOfQuestions = document.getElementById('no-of-question').value;
    const category = document.getElementById('category').value;
    topic = category;
    const difficulty = document.getElementById('difficulty').value;

    if (numberOfQuestions.trim() !== '' && category.trim() !== '' && difficulty.trim() !== '') {
        openModal();
        let apiUrl = `https://opentdb.com/api.php?amount=${numberOfQuestions}&category=${category}&difficulty=${difficulty}&type=multiple`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
              throw new Error(`An error occurred: ${response.statusText}`);
            }
            const data = await response.json();
            const questionsData = data.results;
            quizQuestions = [];
            questionsData.forEach(question => {
                const ques = question.question;
                const options = question.incorrect_answers;
                options.push(question.correct_answer);
                shuffleArray(options); // Shuffle the options array
                const qus = {
                    question: ques,
                    options: options,
                    correctAnswer: question.correct_answer,
                }
                quizQuestions.push(qus)
            })
            document.getElementById('input-container').style.display = 'none';
            document.getElementById('start-container').style.display = 'block';
            document.getElementById('topic-name').innerText = getCategoryString(category);
            document.getElementById('qus-no').innerText = numberOfQuestions;
        }catch (error) {
            console.error('Failed to fetch quiz questions:', error);
        }
        closeModal()
    } else {
        alert('Please fill in all fields.');
    }
});

startBtn.addEventListener('click', async function () {
    document.getElementById('start-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'flex';
    displayQuestion();
    startTimer();
});

function displayQuestion() {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const qusContainer = document.getElementById('qus-container')
    const optContainer = document.getElementById("option-container");
  
    qusContainer.innerHTML = "";
    optContainer.innerHTML = "";
  
    qusContainer.innerHTML = currentQuestion.question;
    currentOpt = [];
    currentQuestion.options.forEach(option => {
      const button = document.createElement("button");
      button.innerText = option;
      button.classList.add("option-button");
      optContainer.appendChild(button);
      currentOpt.push(button);
      button.addEventListener("click", function() {
        checkAnswer(option, button);
      });
    });
}

function checkAnswer(selectedOption, opt_btn) {
    const currentQuestion = quizQuestions[currentQuestionIndex];

    if (selectedOption === currentQuestion.correctAnswer) {
        score++;
        opt_btn.style.backgroundColor = '#399918'; 
    } else {
        if(opt_btn)
            opt_btn.style.backgroundColor = '#FF0000';
    }
    currentOpt.forEach(opt => {
        if(opt.innerText===currentQuestion.correctAnswer){
            opt.style.backgroundColor = '#399918';
        }
    });
    if(opt_btn===0){
        currentOpt.forEach(opt => {
            if(opt.innerText===currentQuestion.correctAnswer){
                opt.style.backgroundColor = '#399918'; 
            }else{
                opt.style.backgroundColor = '#FF0000';
            }
        })
    }
    setTimeout(() => {
        currentQuestionIndex+=1;
        if (currentQuestionIndex < quizQuestions.length) {
            timeLeft = totalTime;
            displayQuestion();
            startTimer();
        } else {
            endQuiz();
        }
    }, 1000); 
}

function endQuiz() {
    let message;
    clearInterval(timerInterval);
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'flex';
    const scorePercentage = ((score / quizQuestions.length) * 100).toFixed(2);
    if(scorePercentage>=60&&scorePercentage<=100){
        message = 'Congratulation! 🤩 You have passed';
    }else if(scorePercentage>=30&&scorePercentage<60){
        message = 'Good! 👏';
    }else if(scorePercentage>=0&&scorePercentage<30){
        message = 'Keep learning! 😑';
    }else{
        message = 'Invalid Result! ❎';
    }
    document.getElementById('result-score').innerHTML = score;
    document.getElementById('total-qus').innerHTML = quizQuestions.length;
    document.getElementById('result-percentage').innerHTML = scorePercentage;
    document.getElementById('result-msg').innerHTML = message;

    // Send quiz result to the backend
    fetch('/submit_result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: score,
          total_questions: quizQuestions.length,
          score_percentage: scorePercentage,
          topic: topic,
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log(data.message);
      })
      .catch(error => {
        console.error('Error:', error);
      });
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    document.getElementById('progress-container').innerHTML = ``;
    document.getElementById('progress-container').innerHTML = `
        <svg class="progress-circle" viewBox="0 0 100 100">
            <circle class="progress-circle-bg" cx="50" cy="50" r="45"></circle>
            <circle class="progress-circle-bar" cx="50" cy="50" r="45"></circle>
            <text id="timer-text" x="50%" y="50%" text-anchor="middle" alignment-baseline="middle" transform="rotate(90, 50, 50)">${totalTime}</text>
        </svg>
    `;
    const timerText = document.getElementById('timer-text');
    const progressCircleBar = document.querySelector('.progress-circle-bar');
    timerInterval = setInterval(function() {
        timeLeft--;
        timerText.textContent = timeLeft;
        const radius = parseFloat(progressCircleBar.getAttribute('r'));
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - (timeLeft / totalTime));
        progressCircleBar.style.strokeDasharray = `${circumference}px ${circumference}px`;
        progressCircleBar.style.strokeDashoffset = offset;

        // Change color based on time left
        if (timeLeft <= totalTime / 3) {
            progressCircleBar.style.stroke = 'red'; 
        } else if (timeLeft <= (2 * totalTime) / 3) {
            progressCircleBar.style.stroke = 'orange'; 
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkAnswer('', 0);
        }
    }, 1000);
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

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}