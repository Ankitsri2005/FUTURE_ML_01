from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load('sales_model.pkl')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    # Detect if data is JSON or Form-submitted
    if request.is_json:
        data = request.json
    else:
        data = request.form

    try:
        store       = int(data['store'])
        dept        = int(data['dept'])
        is_holiday  = int(data['is_holiday'])
        temperature = float(data['temperature'])
        fuel_price  = float(data['fuel_price'])
        markdown1   = float(data['markdown1'])
        markdown2   = float(data['markdown2'])
        markdown3   = float(data['markdown3'])
        markdown4   = float(data['markdown4'])
        markdown5   = float(data['markdown5'])
        cpi         = float(data['cpi'])
        unemployment= float(data['unemployment'])
        store_type  = int(data['store_type'])
        size        = int(data['size'])
        year        = int(data['year'])
        month       = int(data['month'])
        week        = int(data['week'])
    except (KeyError, ValueError) as e:
        if request.headers.get('Accept') == 'application/json' or request.is_json:
            return jsonify({'error': f'Invalid input: Missing or incorrect field: {str(e)}'}), 400
        raise

    features = np.array([[store, dept, is_holiday, temperature, fuel_price,
                          markdown1, markdown2, markdown3, markdown4, markdown5,
                          cpi, unemployment, store_type, size, year, month, week]])

    prediction = model.predict(features)[0]
    prediction = round(prediction, 2)

    # Return JSON for AJAX requests, standard HTML rendering otherwise
    if request.headers.get('Accept') == 'application/json' or request.is_json:
        return jsonify({'prediction': prediction})

    return render_template('result.html', prediction=prediction)

if __name__ == '__main__':
    app.run(debug=True)