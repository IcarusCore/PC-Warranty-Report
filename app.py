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

@app.route('/health')
def health():
    """Health check endpoint for Docker"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

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
        
        # Print column info for debugging
        print(f"Excel file has {len(df.columns)} columns")
        print(f"Column names: {list(df.columns)}")
        
        # Convert to JSON format - Updated to handle 5 columns including Tech Assigned
        data = []
        for _, row in df.iterrows():
            # Handle the case where there might be more or fewer columns
            computer_name = str(row.iloc[0]) if pd.notna(row.iloc[0]) else 'Unknown'
            device_model = str(row.iloc[1]) if len(row) > 1 and pd.notna(row.iloc[1]) else 'Unknown'
            remote_office = str(row.iloc[2]) if len(row) > 2 and pd.notna(row.iloc[2]) else 'Unknown'
            warranty_expiry = str(row.iloc[3]) if len(row) > 3 and pd.notna(row.iloc[3]) else None
            tech_assigned = str(row.iloc[4]) if len(row) > 4 and pd.notna(row.iloc[4]) else 'Unassigned'
            
            # Only add valid entries
            if computer_name != 'Unknown':
                data.append({
                    'computerName': computer_name,
                    'deviceModel': device_model,
                    'remoteOffice': remote_office,
                    'warrantyExpiry': warranty_expiry,
                    'techAssigned': tech_assigned
                })
        
        # Clean up temporary file
        os.remove(filepath)
        
        print(f"Processed {len(data)} valid records")
        
        return jsonify({
            'success': True,
            'data': data,
            'message': f'Successfully processed {len(data)} records with technician assignments'
        })
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        # Clean up file if it exists
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)