# app.py
from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import openpyxl
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
        
        # Process the Excel file using openpyxl
        workbook = openpyxl.load_workbook(filepath)
        sheet = workbook.active
        
        # Convert to JSON format that matches your JavaScript processing
        data = []
        rows = list(sheet.iter_rows(values_only=True))
        
        # Skip header row (first row)
        for row in rows[1:]:
            if row[0]:  # Skip empty rows
                data.append({
                    'computerName': str(row[0]) if row[0] else 'Unknown',
                    'deviceModel': str(row[1]) if row[1] else 'Unknown',
                    'remoteOffice': str(row[2]) if row[2] else 'Unknown',
                    'warrantyExpiry': str(row[3]) if row[3] else None
                })
        
        # Clean up temporary file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'data': data,
            'message': f'Successfully processed {len(data)} records'
        })
        
    except Exception as e:
        # Clean up file if it exists
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint for Docker"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Use environment variables for production
    port = int(os.environ.get('PORT', 5003))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)