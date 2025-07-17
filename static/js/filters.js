// filters.js - Filter Management
window.InventoryFilters = {
    currentFilter: { type: null, value: null },

    initFilters: function() {
        this.currentFilter = { type: null, value: null };
    },

    applyFilter: function(filterType, filterValue) {
        // Check if the same filter is being applied again - if so, clear the filter
        if (this.currentFilter.type === filterType && this.currentFilter.value === filterValue) {
            this.clearFilter();
            return;
        }
        
        // Update filter state
        this.currentFilter = { type: filterType, value: filterValue };
        
        // Get current data
        const currentData = window.InventoryFileUpload.getCurrentData();
        
        // Filter the data
        let filteredData = this.filterData(currentData, filterType, filterValue);
        
        // Update the page to show filter
        this.updateFilterDisplay(filterType, filterValue, filteredData.length);
        
        // Regenerate all charts with filtered data
        window.InventoryAnalytics.generateAnalytics(filteredData);
        
        // Show the filtered devices list at the bottom
        this.showFilteredDevicesList(filteredData, filterType, filterValue);
        
        // Show clear filter button
        this.showClearFilterButton();
    },

    filterData: function(data, filterType, filterValue) {
        const config = window.InventoryConfig.FILTER_TYPES;
        
        switch (filterType) {
            case config.DEVICE_MODEL:
                return data.filter(d => d.deviceModel === filterValue);
            case config.REMOTE_OFFICE:
                return data.filter(d => d.remoteOffice === filterValue);
            case config.WARRANTY_STATUS:
                return this.filterByWarrantyStatus(data, filterValue);
            case config.TECH_ASSIGNED:
                return data.filter(d => d.techAssigned === filterValue);
            default:
                return data;
        }
    },

    filterByWarrantyStatus: function(data, status) {
        const now = new Date();
        switch (status) {
            case 'Active':
                return data.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now);
            case 'Expired':
                return data.filter(d => d.warrantyExpiry && d.warrantyExpiry < now);
            case 'Unknown':
                return data.filter(d => !d.warrantyExpiry);
            default:
                return data;
        }
    },

    clearFilter: function() {
        this.currentFilter = { type: null, value: null };
        const currentData = window.InventoryFileUpload.getCurrentData();
        this.updateFilterDisplay(null, null, currentData.length);
        window.InventoryAnalytics.generateAnalytics(currentData);
        this.hideFilteredDevicesList();
        this.hideClearFilterButton();
    },

    updateFilterDisplay: function(filterType, filterValue, count) {
        let filterText = '';
        if (filterType && filterValue) {
            const displayType = window.InventoryConfig.DISPLAY_NAMES[filterType] || filterType;
            filterText = `Filtered by ${displayType}: "${filterValue}" (${count} devices)`;
        } else {
            filterText = `All Devices (${count} total)`;
        }
        
        // Update or create filter display
        let filterDisplay = document.getElementById('filterDisplay');
        if (!filterDisplay) {
            filterDisplay = this.createFilterDisplay();
        }
        
        filterDisplay.innerHTML = `<i class="fas fa-filter"></i> ${filterText}`;
    },

    createFilterDisplay: function() {
        const filterDisplay = document.createElement('div');
        filterDisplay.id = 'filterDisplay';
        filterDisplay.style.cssText = `
            background: #e1effe;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            font-weight: 500;
            color: #1e40af;
        `;
        
        const mainContent = document.getElementById('mainContent');
        const aiInsights = document.getElementById('aiInsights');
        mainContent.insertBefore(filterDisplay, aiInsights);
        
        return filterDisplay;
    },

    showClearFilterButton: function() {
        let clearBtn = document.getElementById('clearFilterBtn');
        if (!clearBtn) {
            clearBtn = document.createElement('button');
            clearBtn.id = 'clearFilterBtn';
            clearBtn.innerHTML = '<i class="fas fa-times"></i> Clear Filter';
            clearBtn.style.cssText = `
                background: #dc2626;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                margin-left: 15px;
                font-size: 0.9em;
            `;
            clearBtn.onclick = () => this.clearFilter();
            
            const filterDisplay = document.getElementById('filterDisplay');
            filterDisplay.appendChild(clearBtn);
        }
        clearBtn.style.display = 'inline-block';
    },

    hideClearFilterButton: function() {
        const clearBtn = document.getElementById('clearFilterBtn');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    },

    showFilteredDevicesList: function(filteredData, filterType, filterValue) {
        const now = new Date();
        
        // Create or get the filtered devices section
        let filteredSection = document.getElementById('filteredDevicesSection');
        if (!filteredSection) {
            filteredSection = this.createFilteredDevicesSection();
        }
        
        const displayType = window.InventoryConfig.DISPLAY_NAMES[filterType] || filterType;
        
        let html = `
            <h3 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-list"></i>
                Filtered Devices: ${displayType} = "${filterValue}" (${filteredData.length} devices)
            </h3>
            
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid var(--border-color);">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: var(--secondary-bg);">
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color); color: var(--text-primary);">Computer Name</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color); color: var(--text-primary);">Device Model</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color); color: var(--text-primary);">Office</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color); color: var(--text-primary);">Tech Assigned</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color); color: var(--text-primary);">Warranty Status</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color); color: var(--text-primary);">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        filteredData.forEach((device, index) => {
            let warrantyStatus = 'Unknown';
            let statusClass = 'unknown';
            let expiryDate = 'N/A';
            
            if (device.warrantyExpiry) {
                expiryDate = device.warrantyExpiry.toLocaleDateString();
                if (device.warrantyExpiry < now) {
                    warrantyStatus = 'Expired';
                    statusClass = 'expired';
                } else {
                    warrantyStatus = 'Active';
                    statusClass = 'active';
                }
            }
            
            const rowStyle = index % 2 === 0 ? 'background: var(--primary-bg);' : 'background: var(--secondary-bg);';
            
            html += `
                <tr style="${rowStyle}">
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">${device.computerName}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">${device.deviceModel}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">${device.remoteOffice}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">${device.techAssigned}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border-color);">
                        <span class="status-badge status-${statusClass}" style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 500;">${warrantyStatus}</span>
                    </td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">${expiryDate}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px; font-size: 0.9em; color: var(--text-secondary); font-style: italic;">
                Showing ${filteredData.length} devices matching the selected filter criteria.
            </div>
        `;
        
        filteredSection.innerHTML = html;
        filteredSection.style.display = 'block';
        
        // Scroll to the filtered devices list
        setTimeout(() => {
            window.InventoryUtils.scrollToElement('filteredDevicesSection');
        }, 100);
    },

    createFilteredDevicesSection: function() {
        const filteredSection = document.createElement('div');
        filteredSection.id = 'filteredDevicesSection';
        filteredSection.style.cssText = `
            background: var(--primary-bg);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid var(--border-color);
            box-shadow: var(--card-shadow);
        `;
        
        const mainContent = document.getElementById('mainContent');
        mainContent.appendChild(filteredSection);
        
        return filteredSection;
    },

    hideFilteredDevicesList: function() {
        const filteredSection = document.getElementById('filteredDevicesSection');
        if (filteredSection) {
            filteredSection.style.display = 'none';
        }
    },

    getCurrentFilter: function() {
        return this.currentFilter;
    }
};