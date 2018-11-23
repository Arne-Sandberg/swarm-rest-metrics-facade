from flask import Flask, jsonify
app = Flask(__name__)

@app.route("/text")
def text():
    return "certainly not JSON"


@app.route("/json-not-array")
def json_not_array():
    return jsonify({'foo': 'bar'})


@app.route("/json-no-id")
def json_no_site_location_name():
    return jsonify([
        {'foo': 'bar'},
        {'foo': 'bar'},
        {'foo': 'bar'},
        {'foo': 'bar'}
    ])


@app.route("/json")
def json():
    return jsonify([
        {'site_location_name': 'site01'},
        {'site_location_name': 'site02'},
        {'site_location_name': 'site02'},
        {'site_location_name': 'site03'}
    ])
