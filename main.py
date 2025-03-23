
from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    return render_template('index.html')

# Ensure static directories exist
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
