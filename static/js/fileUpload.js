// fileUpload.js - File Upload and Processing
window.InventoryFileUpload = {
    currentData: [],

    initFileUpload: function() {
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('fileInput');

        if (dropArea && fileInput) {
            dropArea.addEventListener('dragover', this.handleDragOver);
            dropArea.addEventListener('dragleave', this.handleDragLeave);
            dropArea.addEventListener('drop', this.handleDrop.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    },

    handleDragOver: function(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    },

    handleDragLeave: function(e) {
        e.currentTarget.classList.remove('dragover');
    },

    handleDrop: function(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        
        if (file && file.name.endsWith('.xlsx')) {
            this.processFile(file);
        } else {
            window.InventoryUtils.showStatus('Please upload a valid .xlsx file', 'error');
        }
    },

    handleFileSelect: function(e) {
        const file = e.target.files[0];
        
        if (file && file.name.endsWith('.xlsx')) {
            this.processFile(file);
        } else {
            window.InventoryUtils.showStatus('Please upload a valid .xlsx file', 'error');
        }
    },

    processFile: async function(file) {
        window.InventoryUtils.showStatus('Processing file...', 'info');
        window.InventoryUtils.showLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(window.InventoryConfig.FILE_CONFIG.UPLOAD_ENDPOINT, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                const processedData = result.data.map(item => ({
                    computerName: item.computerName || 'Unknown',
                    deviceModel: item.deviceModel || 'Unknown',
                    remoteOffice: item.remoteOffice || 'Unknown',
                    warrantyExpiry: window.InventoryUtils.parseDate(item.warrantyExpiry),
                    techAssigned: item.techAssigned || 'Unassigned'
                })).filter(item => item.computerName && item.computerName !== 'Unknown');

                this.currentData = processedData;
                window.InventoryAnalytics.generateAnalytics(processedData);
                window.InventoryUtils.showStatus(result.message, 'success');
                window.InventoryUtils.showLoading(false);
                
                // Show main content and export section
                document.getElementById('mainContent').style.display = 'block';
                document.getElementById('exportSection').style.display = 'block';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            window.InventoryUtils.showStatus('Error processing file: ' + error.message, 'error');
            window.InventoryUtils.showLoading(false);
        }
    },

    getCurrentData: function() {
        return this.currentData;
    },

    setCurrentData: function(data) {
        this.currentData = data;
    }
};