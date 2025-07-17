# Enhanced Computer Inventory Analytics

A Flask web application for visualizing computer inventory data with warranty tracking and technician accountability features. Built for personal/workplace use.

## 🎯 Features

- **Interactive Charts** - Device models, offices, warranty status, and technician assignments
- **AI Like* Insights** - Automated warranty expiration analysis and recommendations  
- **Click-to-Filter** - Toggle filters by clicking chart elements
- **Export Options** - PDF reports, CSV data, and individual chart images
- **Technician Tracking** - Performance metrics and accountability reporting
- **Dark/Light Theme** - Automatic theme switching and persistence
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Backend**: Python Flask, Pandas
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Modular)
- **Charts**: Chart.js
- **Export**: jsPDF

## 📋 Requirements

- Python 3.7+
- Modern web browser
- Excel files (.xlsx format)

## 🚀 Installation

```bash
# Clone and setup
git clone [your-repo-url]
cd computer-inventory-analytics
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux  
source venv/bin/activate

# Install and run
pip install -r requirements.txt
python app.py
```

Access at: `http://localhost:5003`

## 📊 Data Format

Required Excel columns:
- **Computer Name** - Device identifier
- **Device Model** - Computer model/brand  
- **Remote Office** - Office location
- **Warranty Expiry Date** - Warranty end date
- **Tech Assigned** - Responsible technician

Excel file can have columns in any order with headers like:
✅ "Computer Name" or "Computer" or "Name" or "Hostname"
✅ "Device Model" or "Model" or "Device" or "Make"
✅ "Remote Office" or "Office" or "Location" or "Site"
✅ "Warranty Expiry Date" or "Warranty" or "Expiry"

## 📁 Project Structure

```
├── app.py                    # Flask application
├── templates/index.html      # Main template
├── static/
│   ├── css/styles.css       # Styling
│   └── js/                  # Modular JavaScript
│       ├── config.js        # Configuration
│       ├── utils.js         # Utilities
│       ├── theme.js         # Theme management
│       ├── fileUpload.js    # File handling
│       ├── analytics.js     # AI insights
│       ├── charts.js        # Chart generation
│       ├── filters.js       # Filter system
│       ├── modals.js        # Modal dialogs
│       ├── export.js        # Export functions
│       └── main.js          # App coordination
└── uploads/                 # Temp file storage
```

## 🎮 Usage

1. **Upload Excel File** - Drag & drop or click to select
2. **Explore Data** - Click charts to filter, click again to clear
3. **Switch Chart Types** - Use controls to change visualization
4. **Export Results** - Generate PDF reports or CSV data
5. **Track Performance** - Monitor technician accountability

## 🔧 Configuration

Edit `static/js/config.js` for colors and settings:

```javascript
CHART_COLORS: {
    primary: ['#1e3a8a', '#3b82f6', ...],
    warranty: {
        active: '#16a34a',
        expired: '#dc2626',
        unknown: '#6b7280'
    }
}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| File upload fails | Use .xlsx format, max 25MB |
| Charts not showing | Check browser console (F12) |
| JavaScript errors | Clear cache, refresh page |

## 🚀 Production Deployment

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5003 app:app
```

## 🔒 Security Notes

- Files are processed locally and auto-deleted
- No permanent data storage
- Input validation prevents malicious uploads
- Use HTTPS in production

## 📄 License

MIT License - Use however you want, no support provided.

## 📝 Notes

This was built for personal workplace use. Take it, modify it, break it - it's yours now. No support, warranties, or guarantees provided. 😄