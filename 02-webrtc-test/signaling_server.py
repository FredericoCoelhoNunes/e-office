from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import logging

logging.getLogger('socketio').setLevel(logging.ERROR)
logging.getLogger('engineio').setLevel(logging.ERROR)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", logger=False, engineio_logger=False)

@socketio.on('connect')
def connect():
    print('User connected')

@socketio.on('new_ice_candidate')
def new_ice_candidate(msg):
    print('Received a new ICE candidate')
    print(msg)
    emit('received_ice_candidate', msg, include_self=False, broadcast=True)

@socketio.on('answer')
def new_ice_candidate(msg):
    print('Received a new answer')
    emit('answer', msg, include_self=False, broadcast=True)

@socketio.on('offer')
def new_ice_candidate(msg):
    print('Received a new offer')
    emit('offer', msg, include_self=False, broadcast=True)


if __name__ == '__main__':
    socketio.run(app)

