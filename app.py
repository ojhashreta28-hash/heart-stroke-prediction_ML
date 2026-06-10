import streamlit as st
import pandas as pd
import numpy as np
import joblib

model=joblib.load('KNN_heart.pkl')
scaler=joblib.load('scaler.pkl')
expected_columns=joblib.load('columns.pkl')

st.title("Heart stroke prediction by Shratss❤️")

st.markdown("### Enter the following values:")
age=st.slider("Enter your age",18,100,40)
sex=st.selectbox("Enter your gender",["Male","Female"])
pain=st.selectbox("Chest Pain Type",["ATA","TA","NAP","ASY"])
resting_bp=st.number_input("Enter your resting blood pressure",80,200,120)
cholestrol=st.number_input("Enter your cholesterol",100,600,200)
fasting_bs=st.selectbox("Fasting Blood Sugar",[0,1])
resting_ecg=st.selectbox("Resting ECG",['Normal','ST','LVH'])

max_hr=st.slider("Max Heart Rate",60,220,150)

exercise_angina=st.selectbox("Exercise Induced Angina",["Yes","No"])
oldpeak=st.slider("Old Peak",0.0,6.0,1.0)
st_slope=st.selectbox("ST Slope",["Up","Down","Flat"])

if st.button ("Predict"):
    raw_input={
        "age":  age,
        "sex": sex,
        "chest pain type": pain,
        "resting blood pressure": resting_bp,
        "cholesterol": cholestrol,
        "fasting blood sugar": fasting_bs,
        "resting ecg": resting_ecg,
        "max heart rate": max_hr,
        "exercise induced angina": exercise_angina,
        "oldpeak": oldpeak,
        "st slope": st_slope
    }

    input_df=pd.DataFrame([raw_input])
    
    for col in expected_columns:
        if col not in input_df.columns:
            input_df[col]=0

    

    input_df=input_df[expected_columns]
    scaled_data=scaler.transform(input_df)

    prediction=model.predict(scaled_data)[0]

    if prediction == 1:
        st.error("Heart stroke detected")
    else:
        st.success("Heart stroke not detected")

        
    