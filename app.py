import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, render_template, send_from_directory

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load the trained model and preprocessing steps
try:
    model = joblib.load('KNN_heart.pkl')
    scaler = joblib.load('scaler.pkl')
    expected_columns = joblib.load('columns.pkl')
except Exception as e:
    print(f"Error loading models or scaler files: {e}")
    model, scaler, expected_columns = None, None, None

def transform_input(data):
    """
    Maps front-end JSON inputs into the exact column format and order expected by the scaler.
    """
    mapped = {}
    
    # 1. Numeric Fields
    mapped['Age'] = float(data.get('age', 40))
    mapped['RestingBP'] = float(data.get('resting_bp', 120))
    mapped['Cholesterol'] = float(data.get('cholestrol', 200))
    mapped['FastingBS'] = int(data.get('fasting_bs', 0))
    mapped['MaxHR'] = float(data.get('max_hr', 150))
    mapped['Oldpeak'] = float(data.get('oldpeak', 1.0))
    
    # 2. Sex (Male / Female)
    sex = data.get('sex', 'Male')
    mapped['Sex_M'] = 1 if sex in ['Male', 'M'] else 0
    
    # 3. Chest Pain Type (ATA, NAP, TA, ASY)
    pain = data.get('pain', 'ASY')
    mapped['ChestPainType_ATA'] = 1 if pain == 'ATA' else 0
    mapped['ChestPainType_NAP'] = 1 if pain == 'NAP' else 0
    mapped['ChestPainType_TA'] = 1 if pain == 'TA' else 0
    
    # 4. Resting ECG (Normal, ST, LVH)
    ecg = data.get('resting_ecg', 'Normal')
    mapped['RestingECG_Normal'] = 1 if ecg == 'Normal' else 0
    mapped['RestingECG_ST'] = 1 if ecg == 'ST' else 0
    
    # 5. Exercise Induced Angina (Yes / No)
    angina = data.get('exercise_angina', 'No')
    mapped['ExerciseAngina_Y'] = 1 if angina in ['Yes', 'Y'] else 0
    
    # 6. ST Slope (Up, Flat, Down)
    slope = data.get('st_slope', 'Flat')
    mapped['ST_Slope_Flat'] = 1 if slope == 'Flat' else 0
    mapped['ST_Slope_Up'] = 1 if slope == 'Up' else 0
    
    # Convert to DataFrame
    df = pd.DataFrame([mapped])
    
    # Ensure all expected columns are present in the exact order
    df = df[expected_columns]
    
    return df

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler or not expected_columns:
        return jsonify({'error': 'Prediction models are not loaded on server.'}), 500
        
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
            
        # Map frontend inputs to expected model features
        input_df = transform_input(data)
        
        # Scale inputs
        scaled_data = scaler.transform(input_df)
        
        # Predict using model
        prediction = int(model.predict(scaled_data)[0])
        probabilities = model.predict_proba(scaled_data)[0]
        
        # Risk probability percentage (probability of category 1)
        risk_probability = float(probabilities[1]) * 100 if len(probabilities) > 1 else (100.0 if prediction == 1 else 0.0)
        
        # Extract features contributing to risk to give feedback
        risk_factors = []
        if input_df['RestingBP'].iloc[0] > 130:
            risk_factors.append("Elevated Blood Pressure (>130 mmHg)")
        if input_df['Cholesterol'].iloc[0] > 200:
            risk_factors.append("High Cholesterol (>200 mg/dL)")
        if input_df['FastingBS'].iloc[0] == 1:
            risk_factors.append("High Fasting Blood Sugar (>120 mg/dL)")
        if input_df['Oldpeak'].iloc[0] > 1.5:
            risk_factors.append("Abnormal ST Depression (Oldpeak > 1.5)")
        if input_df['ST_Slope_Flat'].iloc[0] == 1:
            risk_factors.append("Flat ST Slope during exercise")
        if input_df['ExerciseAngina_Y'].iloc[0] == 1:
            risk_factors.append("Exercise Induced Angina")
            
        return jsonify({
            'prediction': prediction,
            'risk_probability': round(risk_probability, 1),
            'risk_factors': risk_factors
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)