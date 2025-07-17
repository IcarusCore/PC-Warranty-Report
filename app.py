# app.py
from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB limit

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def generate_demo_data():
    """Generate curated demo computer inventory data showcasing specific scenarios"""
    # 5 Dell models only
    dell_models = [
        'Dell OptiPlex 7090',
        'Dell OptiPlex 5090', 
        'Dell OptiPlex 3090',
        'Dell OptiPlex 7080',
        'Dell OptiPlex 5080'
    ]

    # 10 office locations with specific counts and assigned technicians
    offices = [
        {'name': 'New York HQ', 'count': 25, 'technician': 'Mike Johnson'},
        {'name': 'Chicago Office', 'count': 20, 'technician': 'David Rodriguez'},
        {'name': 'Los Angeles Branch', 'count': 18, 'technician': 'Sarah Chen'},
        {'name': 'Houston Center', 'count': 15, 'technician': 'Lisa Thompson'},
        {'name': 'Boston Office', 'count': 12, 'technician': 'Mike Johnson'},
        {'name': 'Phoenix Branch', 'count': 12, 'technician': 'Sarah Chen'},
        {'name': 'Atlanta Office', 'count': 12, 'technician': 'Lisa Thompson'},
        {'name': 'Seattle Branch', 'count': 12, 'technician': 'Sarah Chen'},
        {'name': 'Denver Office', 'count': 12, 'technician': 'David Rodriguez'},
        {'name': 'Miami Branch', 'count': 12, 'technician': 'Lisa Thompson'}
    ]

    data = []
    now = datetime.now()
    pc_counter = 1

    # Define warranty scenarios for demonstration
    warranty_scenarios = [
        {'type': 'expired', 'count': 20, 'days_range': (-365, -1)},      # 20 expired
        {'type': 'expiring_soon', 'count': 25, 'days_range': (1, 30)},   # 25 expiring within 30 days
        {'type': 'expiring_medium', 'count': 30, 'days_range': (90, 180)}, # 30 expiring in 3-6 months
        {'type': 'long_term', 'count': 75, 'days_range': (365, 730)}     # 75 expiring 12+ months
    ]

    # Distribute computers across offices
    for office in offices:
        for i in range(office['count']):
            computer_name = f"PC-{pc_counter:04d}"
            device_model = dell_models[(pc_counter - 1) % len(dell_models)]  # Rotate through models
            
            # Determine warranty scenario based on position for predictable demo
            if pc_counter <= 20:
                scenario = warranty_scenarios[0]  # expired
            elif pc_counter <= 45:
                scenario = warranty_scenarios[1]  # expiring soon
            elif pc_counter <= 75:
                scenario = warranty_scenarios[2]  # expiring medium
            else:
                scenario = warranty_scenarios[3]  # long term

            # Generate warranty date within scenario range
            min_days, max_days = scenario['days_range']
            # Use pc_counter for consistent but varied distribution
            days_offset = min_days + ((pc_counter * 7) % (max_days - min_days + 1))
            warranty_expiry = now + timedelta(days=days_offset)

            data.append({
                'computerName': computer_name,
                'deviceModel': device_model,
                'remoteOffice': office['name'],
                'warrantyExpiry': warranty_expiry.strftime('%Y-%m-%d'),
                'techAssigned': office['technician']
            })

            pc_counter += 1

    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    """Health check endpoint for Docker"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/demo-data', methods=['GET'])
def get_demo_data():
    """Generate and return curated demo data"""
    try:
        demo_data = generate_demo_data()
        
        return jsonify({
            'success': True,
            'data': demo_data,
            'message': f'Curated demo loaded: {len(demo_data)} computers (5 Dell models, 10 locations, 4 technicians, strategic warranty scenarios)'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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