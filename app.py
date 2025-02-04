from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_socketio import SocketIO, send, emit


app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")


app.config['SECRET_KEY'] = 'mysecret'


world = {
    'figures': []
}



@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('add_figure')
def add_figure(data):
    figure_name = data['name']
    figure_size = data['size']
    figure_color = data['color']
    figure_x = 0
    figure_y = 0

    figure = {

        'name': figure_name,
        'size': figure_size,
        'color': figure_color,
        'x': figure_x,
        'y': figure_y
    }

    print(
        f"{figure_name} added to x: {figure_x}, y: {figure_y}"
    )
    socketio.emit('update_player', figure)

    return redirect(url_for('index'))


@socketio.on('move_figure')
def move_figure(data):
    figure_name = data['name']
    figure_x = data['x']
    figure_y = data['y']

    for figure in world['figures']:
        if figure['name'] == figure_name:
            figure['x'] = figure_x
            figure['y'] = figure_y

    print(
        f"{figure_name} moved to x: {figure_x}, y: {figure_y}"
    )

    socketio.emit('update_player', data)



@socketio.on('message')
def handleMessage(msg):
    print('Message: ' + msg)
    send(msg, broadcast=True)


@socketio.on('connect')
def send_figures():
    for figure in world['figures']:
        emit('update_player', figure)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
