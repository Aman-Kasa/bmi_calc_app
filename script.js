// Your Gemini API key
const API_KEY = 'AIzaSyCyvl-ozvVI0Hlr9gzB7rvKBbecYMyXuEg';


document.getElementById('calculateBtn').addEventListener('click', calculateBMI);


function calculateBMI() {
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    const resultDiv = document.getElementById('result');
    const aiResponseDiv = document.getElementById('aiResponse');


    if (!height || !weight) {
        alert('Please enter both height and weight');
        return;
    }


    // Convert height to meters
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const roundedBMI = bmi.toFixed(1);


    let classification = getClassification(bmi);


    // Display BMI result
    resultDiv.innerHTML = `
        <div class="result-box">
            <h2>BMI Results</h2>
            <p><strong>BMI:</strong> ${roundedBMI}</p>
            <p><strong>Classification:</strong> ${classification}</p>
        </div>
    `;


    // Show loading state
    aiResponseDiv.innerHTML = '<div class="loading"></div>';


    // Call Gemini API for personalized advice
    fetchGeminiAdvice(roundedBMI, classification);
}


function getClassification(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi >= 18.5 && bmi < 24.9) return 'Normal Weight';
    if (bmi >= 25 && bmi < 29.9) return 'Overweight';
    return 'Obese';
}


function parseAdvice(advice) {
    // Remove markdown-like asterisks and extra whitespace
    const cleanText = advice.replace(/\*+/g, '').trim();
   
    // Split into sections
    const sections = cleanText.split(/\n\n/).filter(section => section.trim() !== '');
   
    // Create a more structured result
    const parsedAdvice = sections.map(section => {
        // Try to extract section title
        const titleMatch = section.match(/^([^:]+):/);
        if (titleMatch) {
            const title = titleMatch[1].trim();
            const content = section.replace(titleMatch[0], '').trim();
            return { title, content };
        }
        return { title: '', content: section };
    });


    return parsedAdvice;
}


function renderAdvice(parsedAdvice) {
    return parsedAdvice.map(section => {
        if (section.title) {
            return `
                <div class="advice-section">
                    <h3>${section.title}</h3>
                    <p>${section.content}</p>
                </div>
            `;
        }
        return `<p>${section.content}</p>`;
    }).join('');
}


async function fetchGeminiAdvice(bmi, classification) {
    const aiResponseDiv = document.getElementById('aiResponse');
   
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Provide personalized health advice for someone with a BMI of ${bmi}, classified as ${classification}.
                        Format the response with clear sections:
                        1. Health Overview
                        2. Nutrition Recommendations
                        3. Exercise Plan
                        4. Lifestyle Tips
                       
                        Be specific, actionable, and encouraging. Use a professional yet supportive tone.`
                    }]
                }]
            })
        });


        if (!response.ok) {
            throw new Error('Gemini API request failed');
        }


        const data = await response.json();
        const advice = data.candidates[0].content.parts[0].text;


        // Parse and clean the advice
        const parsedAdvice = parseAdvice(advice);


        aiResponseDiv.innerHTML = `
            <div class="result-box">
                <h2>Personalized Health Insights</h2>
                ${renderAdvice(parsedAdvice)}
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        aiResponseDiv.innerHTML = `
            <div class="result-box">
                <h2>Error</h2>
                <p>Unable to fetch personalized advice. Please try again later.</p>
            </div>
        `;
    }
}
