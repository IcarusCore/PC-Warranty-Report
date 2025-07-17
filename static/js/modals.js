// modals.js - Modal Functions
window.InventoryModals = {
    showModal: function(title, content) {
        let modal = document.getElementById('detailModal');
        if (!modal) {
            modal = this.createModal();
        }

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modalOverlay').style.display = 'block';
    },

    closeModal: function() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.style.display = 'none';
        }
    },

createModal: function() {
    const modal = document.createElement('div');
    modal.id = 'detailModal';
    modal.innerHTML = `
        <div style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);" id="modalOverlay">
            <div style="background-color: white; margin: 1.5% auto; padding: 0; border-radius: 8px; width: 80%; max-width: 800px; max-height: 96vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0;" id="modalTitle"></h2>
                    <span style="font-size: 28px; font-weight: bold; cursor: pointer;" onclick="window.InventoryModals.closeModal()">&times;</span>
                </div>
                <div style="padding: 20px;" id="modalBody"></div>
            </div>
        </div>
    `;
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        document.getElementById('modalOverlay').addEventListener('click', function(e) {
            if (e.target === this) {
                window.InventoryModals.closeModal();
            }
        });
        
        return modal;
    },

    showTechDetails: function(tech, data) {
        const now = new Date();
        const sixMonthsFromNow = new Date(now.getTime() + window.InventoryConfig.DATE_RANGES.SIX_MONTHS);
        const techDevices = data.filter(d => d.techAssigned === tech);
        
        const expiredDevices = techDevices.filter(d => d.warrantyExpiry && d.warrantyExpiry < now);
        const expiringSoonDevices = techDevices.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now && d.warrantyExpiry <= sixMonthsFromNow);
        const activeDevices = techDevices.filter(d => d.warrantyExpiry && d.warrantyExpiry > sixMonthsFromNow);
        const unknownDevices = techDevices.filter(d => !d.warrantyExpiry);

        // Group by office with 4 categories
        const officeBreakdown = {};
        techDevices.forEach(device => {
            const office = device.remoteOffice;
            if (!officeBreakdown[office]) {
                officeBreakdown[office] = { total: 0, expired: 0, expiringSoon: 0, active: 0, unknown: 0 };
            }
            officeBreakdown[office].total++;
            
            if (!device.warrantyExpiry) {
                officeBreakdown[office].unknown++;
            } else if (device.warrantyExpiry < now) {
                officeBreakdown[office].expired++;
            } else if (device.warrantyExpiry <= sixMonthsFromNow) {
                officeBreakdown[office].expiringSoon++;
            } else {
                officeBreakdown[office].active++;
            }
        });

        const expiredRate = ((expiredDevices.length / techDevices.length) * 100).toFixed(1);
        const performanceScore = (((activeDevices.length + expiringSoonDevices.length) / techDevices.length) * 100).toFixed(1);

        let content = `
            <h3>${tech} Performance Report</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-bottom: 10px; color: #374151;">Performance Summary</h4>
                <p><strong>Total Devices Assigned:</strong> ${techDevices.length}</p>
                <p><strong>Performance Score:</strong> ${performanceScore}% (valid warranties)</p>
                <p><strong>Active (>6 months):</strong> ${activeDevices.length}</p>
                <p><strong>Expiring Soon (≤6 months):</strong> ${expiringSoonDevices.length}</p>
                <p><strong>Expired:</strong> ${expiredDevices.length} (${expiredRate}%)</p>
                <p><strong>Unknown Status:</strong> ${unknownDevices.length}</p>
            </div>
            
            <h4>Performance by Office:</h4>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <tr style="background: #f3f4f6;">
                    <th style="padding: 8px; border: 1px solid #ddd;">Office</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Total</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Active</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Expiring</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Expired</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Score</th>
                </tr>
        `;

        Object.entries(officeBreakdown).forEach(([office, stats]) => {
            const officeScore = (((stats.active + stats.expiringSoon) / stats.total) * 100).toFixed(1);
            content += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${office}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${stats.total}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #16a34a;">${stats.active}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #f59e0b;">${stats.expiringSoon}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #dc2626;">${stats.expired}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>${officeScore}%</strong></td>
                </tr>
            `;
        });

        content += `</table>`;

        if (expiredDevices.length > 0) {
            content += `
                <h4 style="color: #dc2626;">🚨 Expired Warranties (${expiredDevices.length} devices)</h4>
                <ul style="max-height: 150px; overflow-y: auto; background: #fef2f2; padding: 10px; border-radius: 6px;">
            `;
            
            expiredDevices.forEach(device => {
                const expiredDays = Math.floor((now - device.warrantyExpiry) / (1000 * 60 * 60 * 24));
                content += `
                    <li style="margin-bottom: 5px; font-size: 0.9em;">
                        <strong>${device.computerName}</strong> (${device.deviceModel})<br>
                        <small>Office: ${device.remoteOffice} | Expired: ${device.warrantyExpiry.toLocaleDateString()} (${expiredDays} days ago)</small>
                    </li>
                `;
            });
            
            content += `</ul>`;
        }

        if (expiringSoonDevices.length > 0) {
            content += `
                <h4 style="color: #f59e0b;">⚠️ Expiring Within 6 Months (${expiringSoonDevices.length} devices)</h4>
                <ul style="max-height: 150px; overflow-y: auto; background: #fefbf0; padding: 10px; border-radius: 6px;">
            `;
            
            expiringSoonDevices.forEach(device => {
                const daysUntilExpiry = Math.floor((device.warrantyExpiry - now) / (1000 * 60 * 60 * 24));
                content += `
                    <li style="margin-bottom: 5px; font-size: 0.9em;">
                        <strong>${device.computerName}</strong> (${device.deviceModel})<br>
                        <small>Office: ${device.remoteOffice} | Expires: ${device.warrantyExpiry.toLocaleDateString()} (${daysUntilExpiry} days remaining)</small>
                    </li>
                `;
            });
            
            content += `</ul>`;
        }

        this.showModal(`${tech} - Performance Report`, content);
    },

    showTechPerformanceDetails: function(tech, stats, data) {
        const now = new Date();
        const sixMonthsFromNow = new Date(now.getTime() + window.InventoryConfig.DATE_RANGES.SIX_MONTHS);
        
        // Recalculate stats with 4 categories for detailed view
        const techDevices = data.filter(d => d.techAssigned === tech);
        const detailedStats = {
            total: techDevices.length,
            expired: 0,
            expiringSoon: 0,
            active: 0,
            unknown: 0
        };
        
        const expiredDevices = [];
        const expiringSoonDevices = [];
        
        techDevices.forEach(device => {
            if (!device.warrantyExpiry) {
                detailedStats.unknown++;
            } else if (device.warrantyExpiry < now) {
                detailedStats.expired++;
                expiredDevices.push(device);
            } else if (device.warrantyExpiry <= sixMonthsFromNow) {
                detailedStats.expiringSoon++;
                expiringSoonDevices.push(device);
            } else {
                detailedStats.active++;
            }
        });
        
        const performanceScore = ((detailedStats.active + detailedStats.expiringSoon) / detailedStats.total * 100).toFixed(1);
        const urgentScore = (detailedStats.active / detailedStats.total * 100).toFixed(1);
        
        let content = `
            <h3>${tech} - Detailed Performance Report</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
                <div style="background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #166534;">${detailedStats.active}</div>
                    <div style="color: #166534; font-size: 0.9em;">Active (>6mo)</div>
                </div>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #92400e;">${detailedStats.expiringSoon}</div>
                    <div style="color: #92400e; font-size: 0.9em;">Expiring Soon</div>
                </div>
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #991b1b;">${detailedStats.expired}</div>
                    <div style="color: #991b1b; font-size: 0.9em;">Expired</div>
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #374151;">${detailedStats.unknown}</div>
                    <div style="color: #374151; font-size: 0.9em;">Unknown</div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-bottom: 15px; color: #374151;">Performance Metrics</h4>
                <p><strong>Overall Performance Score:</strong> ${performanceScore}% (includes warranties expiring within 6 months)</p>
                <p><strong>Critical Performance Score:</strong> ${urgentScore}% (only warranties with >6 months remaining)</p>
                <p><strong>Action Required:</strong> ${detailedStats.expired} expired + ${detailedStats.expiringSoon} expiring soon = ${detailedStats.expired + detailedStats.expiringSoon} devices</p>
            </div>
        `;

        if (expiredDevices.length > 0) {
            content += `
                <h4 style="color: #dc2626;">🚨 Expired Warranties (Immediate Action Required)</h4>
                <ul style="max-height: 200px; overflow-y: auto; background: #fef2f2; padding: 20px; border-radius: 6px;">
            `;
            
            expiredDevices.forEach(device => {
                const expiredDays = Math.floor((now - device.warrantyExpiry) / (1000 * 60 * 60 * 24));
                content += `
                    <li style="margin-bottom: 8px;">
                        <strong>${device.computerName}</strong> (${device.deviceModel})<br>
                        <small>Office: ${device.remoteOffice} | Expired: ${device.warrantyExpiry.toLocaleDateString()} (${expiredDays} days ago)</small>
                    </li>
                `;
            });
            
            content += `</ul>`;
        }

        if (expiringSoonDevices.length > 0) {
            content += `
                <h4 style="color: #f59e0b;">⚠️ Expiring Within 6 Months (Plan Renewals)</h4>
                <ul style="max-height: 200px; overflow-y: auto; background: #fefbf0; padding: 20px; border-radius: 6px;">
            `;
            
            expiringSoonDevices.forEach(device => {
                const daysUntilExpiry = Math.floor((device.warrantyExpiry - now) / (1000 * 60 * 60 * 24));
                content += `
                    <li style="margin-bottom: 8px;">
                        <strong>${device.computerName}</strong> (${device.deviceModel})<br>
                        <small>Office: ${device.remoteOffice} | Expires: ${device.warrantyExpiry.toLocaleDateString()} (${daysUntilExpiry} days remaining)</small>
                    </li>
                `;
            });
            
            content += `</ul>`;
        }

        this.showModal(`${tech} Performance Report`, content);
    },

    showOfficeDetails: function(office, data) {
        const now = new Date();
        const sixMonthsFromNow = new Date(now.getTime() + window.InventoryConfig.DATE_RANGES.SIX_MONTHS);
        const officeDevices = data.filter(d => d.remoteOffice === office);
        
        const expiredDevices = officeDevices.filter(d => d.warrantyExpiry && d.warrantyExpiry < now);
        const expiringSoonDevices = officeDevices.filter(d => d.warrantyExpiry && d.warrantyExpiry >= now && d.warrantyExpiry <= sixMonthsFromNow);
        
        let content = `
            <h3>${office} Office Details</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Total Devices:</strong> ${officeDevices.length}</p>
                <p><strong>Expired Warranties:</strong> ${expiredDevices.length}</p>
                <p><strong>Expiring Soon (≤6 months):</strong> ${expiringSoonDevices.length}</p>
                <p><strong>Devices Needing Attention:</strong> ${expiredDevices.length + expiringSoonDevices.length}</p>
            </div>
        `;

        if (expiredDevices.length > 0) {
            content += `
                <h4 style="color: #dc2626;">🚨 Devices Out of Warranty:</h4>
                <ul style="max-height: 200px; overflow-y: auto; background: #fef2f2; padding: 10px; border-radius: 6px;">
            `;
            
            expiredDevices.forEach(device => {
                const expiredDays = Math.floor((now - device.warrantyExpiry) / (1000 * 60 * 60 * 24));
                content += `
                    <li style="margin-bottom: 8px;">
                        <strong>${device.computerName}</strong> (${device.deviceModel})<br>
                        <small>Tech: ${device.techAssigned} | Expired: ${device.warrantyExpiry.toLocaleDateString()} (${expiredDays} days ago)</small>
                    </li>
                `;
            });
            
            content += `</ul>`;
        }

        if (expiringSoonDevices.length > 0) {
            content += `
                <h4 style="color: #f59e0b;">⚠️ Warranties Expiring Soon:</h4>
                <ul style="max-height: 200px; overflow-y: auto; background: #fefbf0; padding: 10px; border-radius: 6px;">
            `;
            
            expiringSoonDevices.forEach(device => {
                const daysUntilExpiry = Math.floor((device.warrantyExpiry - now) / (1000 * 60 * 60 * 24));
                content += `
                    <li style="margin-bottom: 8px;">
                        <strong>${device.computerName}</strong> (${device.deviceModel})<br>
                        <small>Tech: ${device.techAssigned} | Expires: ${device.warrantyExpiry.toLocaleDateString()} (${daysUntilExpiry} days remaining)</small>
                    </li>
                `;
            });
            
            content += `</ul>`;
        }

        // Show technicians responsible for this office with 4-category breakdown
        const officeTechs = {};
        officeDevices.forEach(device => {
            const tech = device.techAssigned || 'Unassigned';
            if (!officeTechs[tech]) {
                officeTechs[tech] = { total: 0, expired: 0, expiringSoon: 0, active: 0, unknown: 0 };
            }
            officeTechs[tech].total++;
            
            if (!device.warrantyExpiry) {
                officeTechs[tech].unknown++;
            } else if (device.warrantyExpiry < now) {
                officeTechs[tech].expired++;
            } else if (device.warrantyExpiry <= sixMonthsFromNow) {
                officeTechs[tech].expiringSoon++;
            } else {
                officeTechs[tech].active++;
            }
        });

        content += `
            <h4>Technicians Responsible:</h4>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <tr style="background: #f3f4f6;">
                    <th style="padding: 8px; border: 1px solid #ddd;">Technician</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Total</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Active</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Expiring</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Expired</th>
                </tr>
        `;
        
        Object.entries(officeTechs).forEach(([tech, stats]) => {
            content += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>${tech}</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${stats.total}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #16a34a;">${stats.active}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #f59e0b;">${stats.expiringSoon}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #dc2626;">${stats.expired}</td>
                </tr>
            `;
        });
        
        content += `</table>`;

        this.showModal(`${office} Office Details`, content);
    }
};