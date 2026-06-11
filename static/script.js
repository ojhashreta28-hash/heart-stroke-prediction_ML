document.addEventListener('DOMContentLoaded', () => {
    // Range Slider Listeners
    setupSliderListener('age', 'age-val');
    setupSliderListener('max_hr', 'max_hr-val');
    setupSliderListener('oldpeak', 'oldpeak-val');

    // Form Submittal
    const form = document.getElementById('prediction-form');
    const submitBtn = document.getElementById('submit-prediction-btn');
    const loader = document.getElementById('btn-loader');
    const resultsPanel = document.getElementById('results-panel');
    const closeResultsBtn = document.getElementById('close-results-btn');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Collect inputs
        const formData = {
            age: parseInt(document.getElementById('age').value, 10),
            sex: document.querySelector('input[name="sex"]:checked').value,
            fasting_bs: parseInt(document.querySelector('input[name="fasting_bs"]:checked').value, 10),
            resting_bp: parseFloat(document.getElementById('resting_bp').value),
            cholestrol: parseFloat(document.getElementById('cholestrol').value),
            max_hr: parseInt(document.getElementById('max_hr').value, 10),
            pain: document.getElementById('pain').value,
            resting_ecg: document.getElementById('resting_ecg').value,
            exercise_angina: document.querySelector('input[name="exercise_angina"]:checked').value,
            oldpeak: parseFloat(document.getElementById('oldpeak').value),
            st_slope: document.getElementById('st_slope').value
        };

        // Basic Client Side Validation
        if (isNaN(formData.resting_bp) || formData.resting_bp < 80 || formData.resting_bp > 200) {
            alert('Please enter a valid resting blood pressure between 80 and 200 mmHg.');
            return;
        }
        if (isNaN(formData.cholestrol) || formData.cholestrol < 100 || formData.cholestrol > 600) {
            alert('Please enter a valid cholesterol level between 100 and 600 mg/dL.');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        loader.classList.remove('hidden');

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server prediction failed.');
            }

            const result = await response.json();
            
            // Present prediction results
            displayResults(result);

        } catch (error) {
            console.error('Prediction error:', error);
            alert(`Diagnostic Error: ${error.message}`);
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            loader.classList.add('hidden');
        }
    });

    closeResultsBtn.addEventListener('click', () => {
        resultsPanel.classList.add('hidden');
        // Scroll back to top of form smoothly
        form.scrollIntoView({ behavior: 'smooth' });
    });

    // Helper functions
    function setupSliderListener(sliderId, valSpanId) {
        const slider = document.getElementById(sliderId);
        const output = document.getElementById(valSpanId);
        if (slider && output) {
            slider.addEventListener('input', () => {
                output.textContent = slider.value;
            });
        }
    }

    function displayResults(data) {
        const { prediction, risk_probability, risk_factors } = data;
        
        const resultsCard = document.getElementById('results-card-element');
        const verdictBadge = document.getElementById('verdict-badge');
        const mainHeadline = document.getElementById('assessment-main-headline');
        const detailedDescription = document.getElementById('verdict-detailed-description');
        const riskFactorsContainer = document.getElementById('risk-factors-container');
        const riskFactorsList = document.getElementById('risk-factors-list');
        const suggestionsList = document.getElementById('suggestions-list');
        const riskPercentageText = document.getElementById('risk-percentage-val');
        const gaugeCircle = document.getElementById('gauge-fill-circle');

        // Clear previous entries
        riskFactorsList.innerHTML = '';
        suggestionsList.innerHTML = '';

        // Configure theme based on outcome
        if (prediction === 1) {
            resultsCard.className = 'results-card high-risk';
            verdictBadge.className = 'verdict-pill high';
            verdictBadge.textContent = 'High Risk';
            mainHeadline.textContent = 'High Stroke Risk Classification';
            detailedDescription.textContent = 'The classifier indicates a high risk profile. This suggests that the combined clinical parameters, particularly ECG abnormalities, stress indicators, and demographic features, are strongly correlated with historical heart stroke events.';
            
            // Populate Recommendations
            const highSuggestions = [
                'Schedule a diagnostic check-up with a cardiologist immediately.',
                'Request a professional 12-lead ECG, Echo, and myocardial perfusion scan.',
                'Initiate daily blood pressure monitoring and maintain logging.',
                'Adopt a clinical dietary plan targeted to cholesterol reduction.',
                'Restrict heavy physical exertion until cleared by an absolute cardiac assessment.'
            ];
            highSuggestions.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                suggestionsList.appendChild(li);
            });
            
        } else {
            resultsCard.className = 'results-card low-risk';
            verdictBadge.className = 'verdict-pill low';
            verdictBadge.textContent = 'Low Risk';
            mainHeadline.textContent = 'Low Stroke Risk Classification';
            detailedDescription.textContent = 'The classifier reports a low probability score. This means your current clinical readings do not align with patterns typically seen in acute heart stroke cases. Continued monitoring is still recommended.';
            
            // Populate Recommendations
            const lowSuggestions = [
                'Engage in 150 minutes of moderate aerobic exercises per week.',
                'Sustain a nutrient-dense diet rich in healthy fats, fiber, and whole foods.',
                'Track blood pressure and fasting blood sugar markers annually.',
                'Mitigate environmental stress levels through mindfulness practices.',
                'Ensure 7-9 hours of restful sleep daily to promote heart repair.'
            ];
            lowSuggestions.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                suggestionsList.appendChild(li);
            });
        }

        // Show risk factors if any
        if (risk_factors && risk_factors.length > 0) {
            riskFactorsContainer.classList.remove('hidden');
            risk_factors.forEach(factor => {
                const li = document.createElement('li');
                li.textContent = factor;
                riskFactorsList.appendChild(li);
            });
        } else {
            riskFactorsContainer.classList.add('hidden');
        }

        // Configure Gauge
        riskPercentageText.textContent = `${risk_probability}%`;
        const radius = 40;
        const circumference = 2 * Math.PI * radius; // 251.2
        const strokeOffset = circumference - (risk_probability / 100) * circumference;
        
        // Trigger stroke offset animation
        setTimeout(() => {
            gaugeCircle.style.strokeDashoffset = strokeOffset;
        }, 100);

        // Show panel
        resultsPanel.classList.remove('hidden');
        
        // Scroll to panel
        setTimeout(() => {
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
    }
});
