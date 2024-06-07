import os
import random
import smtplib
from email.message import EmailMessage
from flask import Flask, jsonify, render_template, request, redirect, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydb.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.urandom(24)  # Set a random secret key

db = SQLAlchemy(app)

# Define the User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

    def __repr__(self):
        return f'<User {self.email}>'

class QuizResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    score_percentage = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@app.route("/otp-verification", methods=['GET', 'POST'])
def otp_verification():
    if 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        one = request.form.get('one')
        two = request.form.get('two')
        three = request.form.get('three')
        four = request.form.get('four')
        five = request.form.get('five')
        six = request.form.get('six')
        entered_otp = one + two + three + four + five + six
        if entered_otp == session.get('otp'):
            email = session.get('email')
            password = session.get('password')
            user = User(email=email, password=password)
            db.session.add(user)
            db.session.commit()
            flash('User signed up successfully!')
            session['user_id'] = user.id
            return redirect('/')
        else:
            flash('Invalid OTP, please try again.')
    return render_template('otp.html')

@app.route("/")
def dashboard():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('dashboard.html')

@app.route("/quiz")
def quiz():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('quiz.html')

@app.route('/submit_result', methods=['POST'])
def submit_result():
    if 'user_id' not in session:
        return redirect('/login')
    data = request.json
    new_result = QuizResult(
        user_id=session['user_id'],
        score=data['score'],
        total_questions=data['total_questions'],
        score_percentage=data['score_percentage'],
        timestamp=datetime.utcnow()
    )
    db.session.add(new_result)
    db.session.commit()
    return jsonify({'message': 'Result saved successfully!'})

@app.route('/quiz-results')
def quiz_results():
    results = QuizResult.query.filter_by(user_id=session['user_id']).all()
    data = {
        'scores': [result.score_percentage for result in results]
    }
    return jsonify(data)

@app.route("/signup", methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Generate OTP
        otp = ''.join(str(random.randint(0, 9)) for _ in range(6))
        session['otp'] = otp
        session['email'] = email
        session['password'] = password

        # Send OTP via email
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        from_mail = 'musarafhossainofficial33@gmail.com'
        server.login(from_mail, 'pzzf dobv etuu fcun')
        to_mail = email
        msg = EmailMessage()
        msg['Subject'] = 'OTP Verification'
        msg['From'] = from_mail
        msg['To'] = to_mail
        msg.set_content("Your OTP is: " + otp)
        server.send_message(msg)
        server.quit()

        flash('OTP sent to your email address.')
        return redirect('/otp-verification')
    return render_template('login.html')

@app.route("/login", methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and user.password==password:
            session['user_id'] = user.id
            flash('Login successful!')
            return redirect('/')
        else:
            flash('Invalid email or password, please try again.')
    return render_template('login.html')

@app.route("/logout")
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.')
    return redirect('/login')

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
