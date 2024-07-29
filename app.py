from flask import Flask, render_template, request, session, redirect, jsonify
from flask_sqlalchemy import SQLAlchemy
import random
import smtplib
from email.message import EmailMessage
from datetime import datetime

app = Flask(__name__)
app.config ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydb.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['SECRET_KEY'] = "@Musaraf$786"
db = SQLAlchemy(app)

# Define the User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<User {self.name, self.email, self.password}>'

class QuizResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    score_percentage = db.Column(db.Float, nullable=False)
    topic = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/')
def dashboard():
    if 'user_id' not in session:
        return redirect('/login')
    results = QuizResult.query.filter_by(user_id=session['user_id']).all()
    data = {
        'scores': [result.score_percentage for result in results],
        'total_qus': [result.total_questions for result in results],
        'date_time': [result.timestamp for result in results],
        'topic': [result.topic for result in results],
    }
    total_pass, total_mod, total_fail = 0, 0, 0
    for score in data['scores']:
        if score<=100 and score>=60:
            total_pass+=1
        elif score<60 and score>=30:
            total_mod+=1
        elif score<30 and score>=0:
            total_fail+=1
    score = {
        'overall_score' : int(sum(data['scores'])),
        'total_score' : int(len(results)*100),
        'total_quizes' : int(len(results)),
        'total_passed' : int(total_pass),
        'total_moderate' : int(total_mod),
        'total_failed' : int(total_fail),
    }
    user = User.query.filter_by(id=session['user_id']).first()
    return render_template('dashboard.html', name = user.name, score = score)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        print(email, password)
        user = User.query.filter_by(email=email).first()
        if user:
            if password==user.password:
                session['user_id'] = user.id
                return redirect('/')
            else:
                return render_template('login.html', message = 'Password not matched. Please try again.')
        else:
            return render_template('login.html', message = 'User not exist. Sign up first.')
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        if not 'user_id' in session:
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            if check_email_exists(email):
                return render_template('signup.html', message = 'User already exists. You can login or reset your password.')
            otp = send_otp(otp, email)
            session['name'], session['email'], session['password'], session['otp'] = name, email, password, otp
            return redirect('/otp-verification')
        else:
            return redirect('/')
    return render_template('signup.html')

@app.route("/logout")
def logout():
    session.pop('user_id', None)
    return redirect('/login')

@app.route("/otp-verification", methods=['GET', 'POST'])
def otp_verification():
    if 'user_id' in session:
        return redirect('/')

    if request.method == 'POST':
        if not 'user_id' in session:
            one = request.form.get('one')
            two = request.form.get('two')
            three = request.form.get('three')
            four = request.form.get('four')
            five = request.form.get('five')
            six = request.form.get('six')
            entered_otp = one + two + three + four + five + six
            if entered_otp == session.get('otp'):
                name = session.get('name')
                email = session.get('email')
                password = session.get('password')
                existing_user = User.query.filter_by(email=email).first()
                if existing_user:
                    update_password(existing_user, password)
                    session['user_id'] = existing_user.id
                else:
                    user_id = add_user(name, email, password)
                    session['user_id'] = user_id
                session.pop('otp', None)
                return redirect('/')
            else:
                return render_template('otp.html', message='Incorrect OTP. Please try again.')
        else:
            return redirect('/')
    if session.get('otp'):
        return render_template('otp.html')
    else:
        return redirect('/login')

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        if not 'user_id' in session:
            email = request.form.get('email')
            password = request.form.get('password')
            if not check_email_exists(email):
                return render_template('forgot-password.html', message = 'User not exist. Sign up first.')
            otp = send_otp(email)
            print(otp)
            session['email'], session['password'], session['otp'] = email, password, otp
            return redirect('/otp-verification')
        else:
            return redirect('/')
    return render_template('forgot-password.html')

@app.route("/quiz")
def quiz():
    return render_template('quiz.html')

@app.route("/history")
def history():
    return render_template('history.html')

#------------------ API's ---------------------------#
@app.route('/submit_result', methods=['POST'])
def submit_result():
    if 'user_id' not in session:
        return redirect('/login')
    data = request.json
    add_result(data)
    return jsonify({'message': 'Result saved successfully!'})

@app.route('/get-data')
def get_data():
    results = QuizResult.query.filter_by(user_id=session['user_id']).all()
    data = {
        'scores': [result.score_percentage for result in results],
        'total_qus': [result.total_questions for result in results],
        'date_time': [result.timestamp for result in results],
        'topic': [result.topic for result in results],
    }
    return jsonify(data)

@app.route('/get-scores')
def get_scores():
    results = QuizResult.query.filter_by(user_id=session['user_id']).all()
    data = {
        'scores': [result.score_percentage for result in results]
    }
    return jsonify(data)
#----------------- End API's -----------------------#

#------------------ Helping Functions ---------------------------#
def check_email_exists(email):
    return User.query.filter_by(email=email).first()

def send_otp(email):
    try:
        otp = ''.join(str(random.randint(0, 9)) for _ in range(6))
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
        return otp
    except Exception as e:
        print(f"Error sending OTP: {e}")
        return None

def add_user(name, email, password):
    new_user = User(name=name, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    return new_user.id

def update_password(existing_user, password):
    existing_user.password =  password
    db.session.commit()

def add_result(data):
    new_result = QuizResult(
        user_id=session['user_id'],
        topic=data['topic'],
        score=data['score'],
        total_questions=data['total_questions'],
        score_percentage=data['score_percentage'],
        timestamp=datetime.utcnow(),
    )
    db.session.add(new_result)
    db.session.commit()
#------------------ End  Helping Functions ---------------------------#

if __name__=="__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)