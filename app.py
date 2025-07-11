# app.py
from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import pandas as pd
from datetime import datetime

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB limit

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.xlsx'):
            return jsonify({'error': 'Please upload a valid .xlsx file'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the Excel file
        df = pd.read_excel(filepath)
        
        # Convert to JSON format that matches your JavaScript processing
        data = []
        for _, row in df.iterrows():
            data.append({
                'computerName': str(row.iloc[0]) if pd.notna(row.iloc[0]) else 'Unknown',
                'deviceModel': str(row.iloc[1]) if pd.notna(row.iloc[1]) else 'Unknown',
                'remoteOffice': str(row.iloc[2]) if pd.notna(row.iloc[2]) else 'Unknown',
                'warrantyExpiry': str(row.iloc[3]) if pd.notna(row.iloc[3]) else None
            })
        
        # Clean up temporary file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'data': data,
            'message': f'Successfully processed {len(data)} records'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)