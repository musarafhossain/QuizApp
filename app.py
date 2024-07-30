from flask import Flask, render_template, request, session, redirect, jsonify, url_for
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
    if 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        if not 'user_id' in session:
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            if check_email_exists(email):
                return render_template('signup.html', message = 'User already exists. You can login or reset your password.')
            otp = send_otp(email)
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
    if 'user_id' in session:
        return redirect('/')
    if request.method == 'POST':
        if not 'user_id' in session:
            email = request.form.get('email')
            password = request.form.get('password')
            if not check_email_exists(email):
                return render_template('forgot-password.html', message = 'User not exist. Sign up first.')
            otp = send_otp(email)
            session['email'], session['password'], session['otp'] = email, password, otp
            return redirect('/otp-verification')
        else:
            return redirect('/')
    return render_template('forgot-password.html')

@app.route("/quiz")
def quiz():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('quiz.html')

@app.route("/history")
def history():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('history.html')

#------------------ API's ---------------------------#
@app.route('/submit_result', methods=['POST'])
def submit_result():
    if 'user_id' not in session:
        return redirect('/login')
    data = request.json
    result = {
        'user_id': session['user_id'],
        'topic': data['topic'],
        'score': data['score'],
        'total_questions': data['total_questions'],
        'score_percentage': data['score_percentage'],
        'timestamp': datetime.utcnow()
    }
    add_result(result)
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

@app.route('/get-all-scores')
def get_all_scores():
    results = QuizResult.query.filter_by().all()
    data = {
        'scores': [result.score_percentage for result in results]
    }
    return jsonify(data)

@app.route('/get-all-users')
def get_all_users():
    users = User.query.all()
    data = {
            'users': [
                {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'password': user.password
                }
                for user in users
            ]
        }
    return jsonify(data)

@app.route('/update-user/<int:user_id>', methods=['PUT'])
def update_user_api(user_id):
    user = User.query.get(user_id)
    data = request.get_json()
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.password = data.get('password', user.password)
    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200

@app.route('/add-user', methods=['POST'])
def add_user_api():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    try:
        add_user(name, email, password)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': True, 'message': str(e)}), 500
    return jsonify({'success': True, 'message': 'User added successfully'}), 201

@app.route('/delete-user/<int:user_id>', methods=['DELETE'])
def delete_user_api(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': True, 'message': 'User not found'}), 404
        results = QuizResult.query.filter_by(user_id=user_id).all()
        for result in results:
            db.session.delete(result)
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True, 'message': f'User with ID {user_id} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({'error': True, 'message': str(e)}), 500

@app.route('/get-all-results')
def get_all_results():
    results = QuizResult.query.all()
    data = {
            'results': [
                {
                    'id': result.id,
                    'user_id': result.user_id,
                    'score': result.score,
                    'total_questions': result.total_questions,
                    'score_percentage': result.score_percentage,
                    'topic': result.topic,
                    'timestamp': result.timestamp,
                }
                for result in results
            ]
        }
    return jsonify(data)

@app.route('/add-result', methods=['POST'])
def add_result_api():
    data = request.json
    user_id = data.get('user_id')
    score = data.get('score')
    total_questions = data.get('total_questions')
    score_percentage = data.get('score_percentage')
    topic = data.get('topic')
    timestamp_str = data.get('timestamp')
    try:
        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M')
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid timestamp format'})
    result = {
        'user_id': user_id,
        'topic': topic,
        'score': score,
        'total_questions': total_questions,
        'score_percentage': score_percentage,
        'timestamp': timestamp
    }
    try:
        add_result(result)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': True, 'message': str(e)}), 500
    return jsonify({'success': True, 'message': 'User added successfully'}), 201

@app.route('/delete-result/<int:result_id>', methods=['DELETE'])
def delete_result_api(result_id):
    try:
        result = QuizResult.query.get(result_id)
        if not result:
            return jsonify({'error': True, 'message': 'result not found'}), 404
        db.session.delete(result)
        db.session.commit()
        return jsonify({'success': True, 'message': f'Result with ID {result_id} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({'error': True, 'message': str(e)}), 500
    
@app.route('/update-result/<int:id>', methods=['PUT'])
def update_result_api(id):
    result = QuizResult.query.get(id)
    data = request.get_json()
    user_id = data.get('user_id')
    score = data.get('score')
    total_questions = data.get('total_questions')
    score_percentage = data.get('score_percentage')
    topic = data.get('topic')
    timestamp_str = data.get('timestamp')
    try:
        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M')
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid timestamp format'})
    result.user_id = user_id
    result.score = score
    result.topic = topic
    result.total_questions = total_questions
    result.score_percentage = score_percentage
    result.timestamp = timestamp
    db.session.commit()
    return jsonify({'message': 'Result updated successfully'}), 200
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
        user_id=data['user_id'],
        topic=data['topic'],
        score=data['score'],
        total_questions=data['total_questions'],
        score_percentage=data['score_percentage'],
        timestamp=data['timestamp'],
    )
    db.session.add(new_result)
    db.session.commit()
#------------------ End  Helping Functions ---------------------------#

#------------------ Admin Routes ---------------------------#
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        if email == 'admin@example.com' and password == '12345678':
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            message = 'Email ID or password not matched.'
            return render_template('admin/login.html', message=message)
    return render_template('admin/login.html')

@app.route('/admin/logout', methods=['GET'])
def admin_logout():
    session['admin_logged_in'] = False
    return redirect(url_for('admin_login'))

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    users = User.query.all()
    quizes = QuizResult.query.all()
    data = {
        'total_users': len(users),
        'total_quizes': len(quizes),
    }
    return render_template('admin/dashboard.html', data=data)

@app.route('/admin/current-users')
def current_users():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    return render_template('admin/current-users.html')

@app.route('/admin/user-results')
def user_results():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    return render_template('admin/user-results.html')
#------------------ End Admin Routes ---------------------------#

if __name__=="__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)