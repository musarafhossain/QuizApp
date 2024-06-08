var quizQuestions = [];
// Get the button element
const startBtn = document.getElementById('start-quiz-button');

// Add event listener to the button
startBtn.addEventListener('click', async function () {
    // Get input values
    const numberOfQuestions = document.getElementById('no-of-question').value;
    const category = document.getElementById('category').value;
    const difficulty = document.getElementById('difficulty').value;

    // Check if inputs are not empty
    if (numberOfQuestions.trim() !== '' && category.trim() !== '' && difficulty.trim() !== '') {
        // Inputs are not empty, proceed with logic
        console.log('Number of Questions:', numberOfQuestions);
        console.log('Category:', category);
        console.log('Difficulty:', difficulty);
        
        // Disable the button after successful validation
        //this.disabled = true;
            // Construct the API URL with query parameters
        let apiUrl = `https://opentdb.com/api.php?amount=${numberOfQuestions}&category=${category}&difficulty=${difficulty}&type=multiple`

        console.log(apiUrl)

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
              throw new Error(`An error occurred: ${response.statusText}`);
            }
            const data = await response.json();
            const questionsData = data.results;
            
            // Translate and display the questions and choices
            for (const [index, questionData] of questionsData.entries()) {
              const question = questionData.question;
              const choices = [...questionData.incorrect_answers, questionData.correct_answer];
              choices.sort(() => Math.random() - 0.5);
              let data1 = {
                question: question,
                options: choices,
                correctAnswer: questionData.correct_answer,
              }
              quizQuestions.push(data1)
            }
          } catch (error) {
            console.error('Failed to fetch quiz questions:', error);
          }
          document.querySelector('.container').style.display = 'none';
          document.querySelector('.quiz-container').style.display = 'block';
    } else {
        // Inputs are empty, show error message or take appropriate action
        alert('Please fill in all fields.');
    }
});

  
  // Variables to track quiz state
  let currentQuestionIndex = 0;
  let score = 0;
  let timeLeft = 31;
  let timerInterval;
  
  // Function to start the quiz
  function startQuiz() {
    // Hide the start button and display the first question
    document.getElementById("start-button").style.display = "none";
    displayQuestion();
    startTimer();
  }
  
  // Function to display a question and its options
  function displayQuestion() {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const questionText = document.getElementById("question-text");
    const answerButtons = document.getElementById("answer-buttons");
  
    // Clear previous question and answer options
    questionText.innerHTML = "";
    answerButtons.innerHTML = "";
  
    // Display the current question
    questionText.innerHTML = currentQuestion.question;
  
    // Create answer buttons for each option
    currentQuestion.options.forEach(option => {
      const button = document.createElement("button");
      button.innerText = option;
      button.classList.add("answer-button");
      answerButtons.appendChild(button);
  
      // Add click event listener to check the answer
      button.addEventListener("click", function() {
        checkAnswer(option);
      });
    });
  }
  
  // Function to check the selected answer
  function checkAnswer(selectedOption) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
  
    // Check if the selected answer is correct
    if (selectedOption === currentQuestion.correctAnswer) {
      score++;
    }
  
    // Move to the next question or end the quiz if all questions are answered
    currentQuestionIndex++;
  
    if (currentQuestionIndex < quizQuestions.length) {
        timeLeft = 31;
      displayQuestion();
      
    } else {
      endQuiz();
    }
  }
  
  // Function to start the timer
  function startTimer() {
    timerInterval = setInterval(function() {
      timeLeft--;
  
      // Update the timer text
      document.getElementById("timer").textContent = timeLeft;
  
      // End the quiz if time runs out
      if (timeLeft <= 0) {
        //endQuiz();
        checkAnswer('');
      }
    }, 1000);
  }
  
  // Function to end the quiz
function endQuiz() {
    // Stop the timer
    clearInterval(timerInterval);
  
    // Calculate the score percentage
    const scorePercentage = ((score / quizQuestions.length) * 100).toFixed(2);
  
    // Display the final score
    const questionContainer = document.getElementById("question-container");
    questionContainer.innerHTML = `
      <h2 style="margin-top:30px; margin-bottom:20px;">Quiz Completed!</h2>
      <p>Your Score: ${score} out of ${quizQuestions.length}</p>
      <p>Score Percentage: ${scorePercentage}%</p>
      <div style="width:100%; display:flex; align-items:center; justify-content:center;">
        <a style="width: 120px;
                height: 40px;
                border-radius: 7px;
                display: block;
                color: white;
                text-align: center;
                padding: 14px 20px;
                text-decoration: none;
                font-family: sans-serif;
                background: -webkit-linear-gradient(right,#004489,#004f9e,#0059b3, #0073e6);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: 25px;" href="/">Go Home</a>
      </div>
    `;
  
    // Send quiz result to the backend
    fetch('/submit_result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        score: score,
        total_questions: quizQuestions.length,
        score_percentage: scorePercentage
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
  
  
  // Add event listener to start the quiz when the start button is clicked
  document.getElementById("start-button").addEventListener("click", startQuiz);