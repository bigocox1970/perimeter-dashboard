         let customers = [];
         let editingCustomerId = null;
         let completingInspection = null;
         let currentSort = { field: null, direction: 'asc' };

        // Scaffold system variables
        let scaffSystems = [];
        let editingScaffId = null;
        let currentScaffSort = { field: null, direction: 'asc' };
        
        // Scaffold constants
        const VAT_RATE = 0.2;
        const STANDARD_WEEKLY_COST = 100;
        const EXTRA_SENSOR_WEEKLY_COST = 15;

        // Password protection
        const CORRECT_PASSWORD = 'Perimeter2999';
        
        // Check if user is already logged in
        function checkLoginStatus() {
            const isLoggedIn = sessionStorage.getItem('perimLoggedIn');
            if (isLoggedIn === 'true') {
                showDashboard();
            } else {
                showLoginScreen();
            }
        }

        // Initialize mobile-specific features
        function initializeMobileFeatures() {
            if (isMobileDevice()) {
                console.log('Mobile device detected, applying mobile optimizations');
                
                // Force mobile layout
                document.body.classList.add('force-mobile');
                document.documentElement.classList.add('force-mobile');
                
                // Add mobile-specific event listeners
                document.addEventListener('touchstart', function() {}, { passive: true });
                
                // Handle orientation changes
                window.addEventListener('orientationchange', function() {
                    console.log('Orientation changed, reloading data...');
                    setTimeout(function() {
                        // Force reload of current NSI data
                        const activeSubPage = document.querySelector('.nsi-sub-button.active');
                        if (activeSubPage) {
                            const subPageName = activeSubPage.textContent.toLowerCase().replace(' ', '-');
                            console.log('Reloading sub-page:', subPageName);
                            showNsiSubPage(subPageName);
                        }
                        
                        // Trigger window resize event to fix any layout issues
                        window.dispatchEvent(new Event('resize'));
                    }, 300);
                });
                
                // Handle resize events
                let resizeTimeout;
                window.addEventListener('resize', function() {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(function() {
                        // Only reload data on significant size changes, not on scroll
                        const currentWidth = window.innerWidth;
                        const currentHeight = window.innerHeight;
                        
                        // Skip reload if this is likely a scroll event (small dimension changes)
                        if (Math.abs(currentWidth - (window.lastResizeWidth || currentWidth)) < 50 && 
                            Math.abs(currentHeight - (window.lastResizeHeight || currentHeight)) < 50) {
                            return;
                        }
                        
                        window.lastResizeWidth = currentWidth;
                        window.lastResizeHeight = currentHeight;
                        
                        // Force table re-render on actual resize
                        const activeNsiTab = document.querySelector('.tab-button.active');
                        if (activeNsiTab && activeNsiTab.textContent === 'NSI') {
                            const activeSubPage = document.querySelector('.nsi-sub-button.active');
                            if (activeSubPage) {
                                const subPageName = activeSubPage.textContent.toLowerCase().replace(' ', '-');
                                console.log('Actual resize detected, refreshing:', subPageName);
                                showNsiSubPage(subPageName);
                            }
                        }
                    }, 300);
                });
                
                // Ensure viewport is properly set
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
                }
            }
        }

        // Show login screen
        function showLoginScreen() {
            document.getElementById('splashScreen').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('mainDashboard').style.display = 'none';
            setTimeout(() => {
                document.getElementById('passwordInput').focus();
            }, 100);
        }

        // Show dashboard
        function showDashboard() {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainDashboard').style.display = 'block';
            loadCustomerData();
            // Initialize statistics visibility based on screen size
            initializeStatsVisibility();
        }

        // Check password
        function checkPassword() {
            const password = document.getElementById('passwordInput').value;
            const errorElement = document.getElementById('loginError');
            
            if (password === CORRECT_PASSWORD) {
                sessionStorage.setItem('perimLoggedIn', 'true');
                showDashboard();
                errorElement.style.display = 'none';
            } else {
                errorElement.style.display = 'block';
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordInput').focus();
            }
        }

        // Logout function
        function logout() {
            sessionStorage.removeItem('perimLoggedIn');
            showLoginScreen();
        }

        // Tab switching functionality
        function showTab(tabName) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tab buttons (both top and mobile footer)
            const tabButtons = document.querySelectorAll('.tab-button, .mobile-tab-button');
            tabButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // Show selected tab content
            const selectedContent = document.getElementById(tabName + 'Tab');
            if (selectedContent) {
                selectedContent.classList.add('active');
            }
            
            // Add active class to clicked button (both top and mobile footer)
            const selectedButtons = document.querySelectorAll(`[onclick="showTab('${tabName}')"], [data-tab="${tabName}"]`);
            selectedButtons.forEach(button => {
                button.classList.add('active');
            });

            // Load scaffold data when scaff tab is selected
            if (tabName === 'scaff') {
                loadScaffoldData();
            }
            
                // Load NSI data when nsi tab is selected (complaints by default)
            if (tabName === 'nsi') {
                // Add delay for mobile devices to ensure DOM is ready
                setTimeout(function() {
                    console.log('Loading NSI tab data...');
                    loadComplaintData();
                }, isMobileDevice() ? 300 : 0);
            }
        }

        // Handle Enter key in password field
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && document.getElementById('loginScreen').style.display === 'flex') {
                checkPassword();
            }
        });

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            // Register Service Worker for PWA
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered successfully:', registration);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            }

            // PWA install prompt disabled - users can install via browser menu

                    // Handle splash screen timing
        setTimeout(() => {
            document.getElementById('splashScreen').style.display = 'none';
            checkLoginStatus();
        }, 2500); // Show splash for 2.5 seconds
            
            // Set default completion date to today
            if (document.getElementById('completionDate')) {
                document.getElementById('completionDate').value = new Date().toISOString().split('T')[0];
            }

            // Add scaffold form event listeners
            const scaffArcCheckbox = document.getElementById('scaffArcEnabled');
            if (scaffArcCheckbox) {
                scaffArcCheckbox.addEventListener('change', function() {
                    document.getElementById('scaffArcFields').style.display = this.checked ? 'block' : 'none';
                });
            }

            const scaffExtraSensors = document.getElementById('scaffExtraSensors');
            if (scaffExtraSensors) {
                scaffExtraSensors.addEventListener('input', updateScaffoldCostPreview);
            }

            // Add scaffold form submission handler
            const scaffForm = document.getElementById('scaffForm');
            if (scaffForm) {
                scaffForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const formData = {
                        p_number: document.getElementById('scaffPNumber').value,
                        extra_sensors: parseInt(document.getElementById('scaffExtraSensors').value) || 0,
                        site_contact: document.getElementById('scaffSiteContact').value,
                        address1: document.getElementById('scaffAddress1').value || '',
                        address2: document.getElementById('scaffAddress2').value || '',
                        postcode: document.getElementById('scaffPostcode').value || '',
                        site_phone: document.getElementById('scaffSitePhone').value,
                        app_contact: document.getElementById('scaffAppContact').value,
                        app_phone: document.getElementById('scaffAppPhone').value,
                        arc_enabled: document.getElementById('scaffArcEnabled').checked,
                        arc_contact: document.getElementById('scaffArcContact').value,
                        arc_phone: document.getElementById('scaffArcPhone').value,
                        start_date: document.getElementById('scaffStartDate').value,
                        last_invoice_date: document.getElementById('scaffLastInvoiceDate').value,
                        hire_status: document.getElementById('scaffHireStatus').value
                    };

                    try {
                        if (editingScaffId) {
                            // Update existing system
                            const { error } = await supabase
                                .from(SCAFF_TABLE_NAME)
                                .update(formData)
                                .eq('id', editingScaffId);

                            if (error) throw error;
                            showScaffoldMessage('Scaffold system updated successfully!', 'success');
                        } else {
                            // Add new system
                            const newSystemData = {
                                id: Date.now(),
                                ...formData
                            };

                            const { error } = await supabase
                                .from(SCAFF_TABLE_NAME)
                                .insert([newSystemData]);

                            if (error) throw error;
                            showScaffoldMessage('Scaffold system added successfully!', 'success');
                        }

                        await loadScaffoldData(); // Reload data from Supabase
                        closeScaffModal();
                    } catch (error) {
                        console.error('Error saving scaffold system:', error);
                        showScaffoldMessage('Error saving scaffold system: ' + error.message, 'error');
                    }
                });
            }

            // Initialize first tab as active
            showTab('maint');
        });

        // Handle window resize to adjust statistics visibility (but respect user's manual toggle)
        let userToggledStats = false;
        window.addEventListener('resize', function() {
            if (document.getElementById('mainDashboard').style.display !== 'none' && !userToggledStats) {
                initializeStatsVisibility();
            }
        });



        // Show/hide loading
        function showLoading(show = true) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        // Show messages
        function showMessage(message, type = 'success') {
            const successEl = document.getElementById('successMessage');
            const errorEl = document.getElementById('errorMessage');
            
            successEl.style.display = 'none';
            errorEl.style.display = 'none';
            
            if (type === 'success') {
                successEl.textContent = message;
                successEl.style.display = 'block';
                setTimeout(() => successEl.style.display = 'none', 3000);
            } else {
                errorEl.textContent = message;
                errorEl.style.display = 'block';
                setTimeout(() => errorEl.style.display = 'none', 5000);
            }
        }

        // Load customer data from Supabase
        async function loadCustomerData() {
            showLoading(true);
            try {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw error;
                }

                customers = data || [];
                showMessage('Data loaded successfully from Supabase!', 'success');
                
                // Store data in localStorage for offline access
                localStorage.setItem('perimCustomers', JSON.stringify(customers));
            } catch (error) {
                console.error('Error loading customer data:', error);
                
                // Try to load from localStorage if online loading fails
                const cachedData = localStorage.getItem('perimCustomers');
                if (cachedData) {
                    customers = JSON.parse(cachedData);
                    showMessage('Loaded cached data (offline mode)', 'warning');
                } else {
                    customers = [];
                    showMessage('Error loading data from Supabase: ' + error.message, 'error');
                }
            }
            
            showLoading(false);
            renderCustomers();
            updateStats();
        }

        // Save customer data to Supabase
        async function saveCustomerData() {
            try {
                showMessage('Saving customer data to Supabase...', 'success');
                
                // For now, we'll save individual records as they're modified
                // This function is called after each add/edit/delete operation
                showMessage('Data saved to Supabase successfully!', 'success');
                
            } catch (error) {
                console.error('Error saving data:', error);
                showMessage('Error saving data to Supabase: ' + error.message, 'error');
            }
        }

        // Update inspection fields based on inspections per year
        function updateInspectionFields() {
            const inspectionsPerYear = document.getElementById('inspectionsPerYear').value;
            const secondInspectionGroup = document.getElementById('secondInspectionGroup');
            
            if (inspectionsPerYear === '2') {
                secondInspectionGroup.style.display = 'block';
                document.getElementById('secondInspectionMonth').required = true;
            } else {
                secondInspectionGroup.style.display = 'none';
                document.getElementById('secondInspectionMonth').required = false;
            }
        }

        // Open add customer modal
        function openAddModal() {
            editingCustomerId = null;
            document.getElementById('modalTitle').textContent = 'Add Customer';
            document.getElementById('customerForm').reset();
            updateInspectionFields();
            document.getElementById('customerModal').style.display = 'block';
        }

        // Open edit customer modal
        function editCustomer(id) {
            editingCustomerId = id;
            const customer = customers.find(c => String(c.id) === String(id));
            if (!customer) {
                console.error('Customer not found with ID:', id);
                return;
            }

            document.getElementById('modalTitle').textContent = 'Edit Customer';
            document.getElementById('customerName').value = customer.name;
            document.getElementById('customerAddress').value = customer.address;
            document.getElementById('customerPostcode').value = customer.postcode;
                         document.getElementById('systemType').value = customer.system_type;
             document.getElementById('nsiStatus').value = customer.nsi_status || 'NSI';
             document.getElementById('cloudId').value = customer.cloud_id || '';
             document.getElementById('cloudRenewalDate').value = customer.cloud_renewal_date || '';
             document.getElementById('arcNo').value = customer.arc_no || '';
             document.getElementById('arcRenewalDate').value = customer.arc_renewal_date || '';
             document.getElementById('dateInstalled').value = customer.date_installed;
            document.getElementById('inspectionsPerYear').value = customer.inspections_per_year || 1;
            document.getElementById('firstInspectionMonth').value = customer.first_inspection_month || 1;
                         document.getElementById('secondInspectionMonth').value = customer.second_inspection_month || 6;
             document.getElementById('customerNotes').value = customer.notes || '';
             
             // Populate battery replacement dates
             const batteryData = customer.battery_replacement || {};
             document.getElementById('controlPanelBattery').value = batteryData.control_panel || '';
             document.getElementById('sirenBattery').value = batteryData.siren || '';
             document.getElementById('detectorBatteries').value = batteryData.detectors || '';
            
            updateInspectionFields();
            document.getElementById('customerModal').style.display = 'block';
        }

        // Close modal
        function closeModal() {
            document.getElementById('customerModal').style.display = 'none';
            editingCustomerId = null;
        }

        // View customer maintenance list
        function viewCustomerMaintenanceList(customerId) {
            const customer = customers.find(c => String(c.id) === String(customerId));
            if (!customer) return;

            const inspection1History = customer.inspection_history?.inspection1 || [];
            const inspection2History = customer.inspection_history?.inspection2 || [];
            
            // Combine all maintenance records with inspection type
            const allMaintenance = [];
            
            inspection1History.forEach(record => {
                allMaintenance.push({
                    ...record,
                    inspectionType: 'Inspection 1',
                    month: getMonthName(customer.first_inspection_month)
                });
            });
            
            if (customer.inspections_per_year === 2) {
                inspection2History.forEach(record => {
                    allMaintenance.push({
                        ...record,
                        inspectionType: 'Inspection 2',
                        month: getMonthName(customer.second_inspection_month)
                    });
                });
            }
            
            // Sort by date (newest first)
            allMaintenance.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Show in modal
            const modal = document.getElementById('monthlyCompletionsModal');
            const tbody = document.getElementById('monthlyCompletionsBody');
            const title = document.getElementById('monthlyCompletionsTitle');
            
            title.textContent = `Maintenance History - ${customer.name} (${allMaintenance.length} records)`;
            
            // Update table headers
            const table = document.querySelector('#monthlyCompletionsModal table');
            table.querySelector('thead tr').innerHTML = `
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Date</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Inspection Type</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Schedule</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Job Number</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Notes</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Action</th>
            `;
            
            tbody.innerHTML = allMaintenance.map(record => `
                <tr>
                    <td><strong>${new Date(record.date).toLocaleDateString()}</strong></td>
                    <td>${record.inspectionType}</td>
                    <td>${record.month}</td>
                    <td>${record.jobNumber || '<span style="color: #999;">Not recorded</span>'}</td>
                    <td>${record.notes || '<span style="color: #999;">No notes</span>'}</td>
                    <td>
                        <button class="btn" onclick="openEditInspectionDateModal(${customerId}, '${record.inspectionType.toLowerCase().replace(' ', '')}', '${record.date}', '${(record.notes || '').replace(/'/g, '&#39;')}')" style="background: #f39c12; color: white; padding: 6px; width: 28px; margin-right: 5px;" title="Edit this inspection">✏️</button>
                        <button class="btn" onclick="deleteInspection(${customerId}, '${record.inspectionType.toLowerCase().replace(' ', '')}', '${record.date}')" style="background: #e74c3c; color: white; padding: 6px; width: 28px;" title="Delete this inspection">🗑️</button>
                    </td>
                </tr>
            `).join('');
            
            if (allMaintenance.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No maintenance records found</td></tr>';
            }
            
            modal.style.display = 'block';
        }

        // Handle form submission
        document.getElementById('customerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const inspectionsPerYear = parseInt(document.getElementById('inspectionsPerYear').value);
                         const formData = {
                 name: document.getElementById('customerName').value,
                 address: document.getElementById('customerAddress').value,
                 postcode: document.getElementById('customerPostcode').value,
                 system_type: document.getElementById('systemType').value,
                 nsi_status: document.getElementById('nsiStatus').value,
                 cloud_id: document.getElementById('cloudId').value || null,
                 cloud_renewal_date: document.getElementById('cloudRenewalDate').value || null,
                 arc_no: document.getElementById('arcNo').value || null,
                 arc_renewal_date: document.getElementById('arcRenewalDate').value || null,
                 date_installed: document.getElementById('dateInstalled').value,
                 inspections_per_year: inspectionsPerYear,
                 first_inspection_month: parseInt(document.getElementById('firstInspectionMonth').value),
                 second_inspection_month: inspectionsPerYear === 2 ? parseInt(document.getElementById('secondInspectionMonth').value) : null,
                 notes: document.getElementById('customerNotes').value,
                 battery_replacement: {
                     control_panel: document.getElementById('controlPanelBattery').value || null,
                     siren: document.getElementById('sirenBattery').value || null,
                     detectors: document.getElementById('detectorBatteries').value || null
                 }
             };

            try {
                if (editingCustomerId) {
                    // Update existing customer
                    const { error } = await supabase
                        .from(TABLE_NAME)
                        .update(formData)
                        .eq('id', editingCustomerId);

                    if (error) throw error;
                    showMessage('Customer updated successfully!', 'success');
                } else {
                    // Add new customer
                    const newCustomer = {
                        id: Date.now(),
                        ...formData,
                        inspection_history: {
                            inspection1: [],
                            inspection2: []
                        }
                    };

                    const { error } = await supabase
                        .from(TABLE_NAME)
                        .insert([newCustomer]);

                    if (error) throw error;
                    showMessage('Customer added successfully!', 'success');
                }

                await loadCustomerData(); // Reload data from Supabase
                closeModal();
            } catch (error) {
                console.error('Error saving customer:', error);
                showMessage('Error saving customer: ' + error.message, 'error');
            }
        });

        // Delete customer
        async function deleteCustomer(id) {
            if (confirm('Are you sure you want to delete this customer?')) {
                try {
                    const { error } = await supabase
                        .from(TABLE_NAME)
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    
                    showMessage('Customer deleted successfully!', 'success');
                    await loadCustomerData(); // Reload data from Supabase
                } catch (error) {
                    console.error('Error deleting customer:', error);
                    showMessage('Error deleting customer: ' + error.message, 'error');
                }
            }
        }

        // Get inspection status using NSI 3-month window rule
        function getInspectionStatus(customer, inspectionType) {
            const today = new Date();
            const currentYear = today.getFullYear();
            
            let dueMonth = customer.first_inspection_month;
            if (inspectionType === 'inspection2' && customer.inspections_per_year === 2) {
                dueMonth = customer.second_inspection_month;
            }
            
            // NSI 3-month window: month before due, due month, month after
            const monthBeforeDue = dueMonth - 1 <= 0 ? 12 + (dueMonth - 1) : dueMonth - 1;
            const monthAfterDue = dueMonth + 1 > 12 ? (dueMonth + 1) - 12 : dueMonth + 1;
            
            // Calculate year adjustments for cross-year windows
            let yearBeforeDue = currentYear;
            let yearAfterDue = currentYear;
            
            if (dueMonth === 1 && monthBeforeDue === 12) yearBeforeDue = currentYear - 1;
            if (dueMonth === 12 && monthAfterDue === 1) yearAfterDue = currentYear + 1;
            
            // Define the acceptable window dates
            const windowStart = new Date(yearBeforeDue, monthBeforeDue - 1, 1);
            const windowEnd = new Date(yearAfterDue, monthAfterDue, 0); // Last day of month after due
            const dueMonthStart = new Date(currentYear, dueMonth - 1, 1);
            const dueMonthEnd = new Date(currentYear, dueMonth, 0); // Last day of due month
            
            // Get the most recent completion in this inspection cycle (within last 12 months)
            const history = customer.inspection_history?.[inspectionType] || [];
            const oneYearAgo = new Date(currentYear - 1, today.getMonth(), today.getDate());
            const recentCompletions = history
                .filter(h => new Date(h.date) >= oneYearAgo)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const lastCompletion = recentCompletions.length > 0 ? new Date(recentCompletions[0].date) : null;
            
            // If completed within the last 12 months AND within acceptable window, it's up to date
            if (lastCompletion && lastCompletion >= windowStart && lastCompletion <= windowEnd) {
                return 'up-to-date';
            }
            
            // If completed recently but outside window, determine current status
            if (lastCompletion && lastCompletion > windowEnd) {
                // Completed late but recently - still considered current for this cycle
                return 'up-to-date';
            }
            
            // No recent acceptable completion - check current date against due dates
            const currentMonth = today.getMonth() + 1;
            
            // If we're currently in the acceptable window
            if (today >= windowStart && today <= windowEnd) {
                if (currentMonth === monthBeforeDue) return 'due-soon';
                if (currentMonth === dueMonth) return 'due-this-month';
                if (currentMonth === monthAfterDue) return 'due-soon';
            }
            
            // If we're past the acceptable window, it's overdue
            if (today > windowEnd) {
                return 'overdue';
            }
            
            // If we're before the acceptable window, it's up to date for now
            return 'up-to-date';
        }

        // Get status badge HTML
        function getStatusBadge(status) {
            const statusMap = {
                'up-to-date': { class: 'status-current', text: 'Up to Date' },
                'can-be-done': { class: 'status-can-be-done', text: 'Can be done' },
                'due-this-month': { class: 'status-due-soon', text: 'Due this month' },
                'due-last-month': { class: 'status-due-last-month', text: 'Due last month' },
                'overdue': { class: 'status-overdue', text: 'Overdue' },
                // Legacy status mappings for backwards compatibility
                'current': { class: 'status-current', text: 'Up to Date' },
                'due-soon': { class: 'status-due-soon', text: 'Due This Month' },
                'completed': { class: 'status-completed', text: 'Completed' }
            };
            
            const statusInfo = statusMap[status];
            return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
        }

        // Open completion modal
        function recordCompletion(customerId, inspectionType) {
            completingInspection = { customerId, inspectionType };
            const customer = customers.find(c => String(c.id) === String(customerId));
            const inspectionName = inspectionType === 'inspection1' ? 'Inspection 1' : 'Inspection 2';
            
            document.getElementById('completionModalTitle').textContent = `Record ${inspectionName} Completion - ${customer.name}`;
            document.getElementById('completionDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('jobNumber').value = '';
            document.getElementById('completionNotes').value = '';
            document.getElementById('completionModal').style.display = 'block';
        }

        // Close completion modal
        function closeCompletionModal() {
            document.getElementById('completionModal').style.display = 'none';
            completingInspection = null;
        }

        // Edit inspection date
        let editingInspection = null;
        
        function openEditInspectionDateModal(customerId, inspectionType, currentDate, currentNotes) {
            editingInspection = { customerId, inspectionType, originalDate: currentDate };
            const customer = customers.find(c => String(c.id) === String(customerId));
            const inspectionName = inspectionType === 'inspection1' ? 'Inspection 1' : 'Inspection 2';
            
            document.getElementById('editInspectionDateTitle').textContent = `Edit ${inspectionName} Date - ${customer.name}`;
            document.getElementById('editCompletionDate').value = currentDate ? new Date(currentDate).toISOString().split('T')[0] : '';
            document.getElementById('editCompletionNotes').value = currentNotes || '';
            document.getElementById('editInspectionDateModal').style.display = 'block';
        }
        
        function closeEditInspectionDateModal() {
            document.getElementById('editInspectionDateModal').style.display = 'none';
            editingInspection = null;
        }

        // Delete inspection - simple as fuck!
        async function deleteInspection(customerId, inspectionType, inspectionDate) {
            if (!confirm('Delete this inspection?')) return;
            
            console.log('DELETING:', customerId, inspectionType, inspectionDate);
            
            try {
                // Get the current customer from database
                const { data: customer, error: fetchError } = await supabase
                    .from(TABLE_NAME)
                    .select('*')
                    .eq('id', customerId)
                    .single();

                if (fetchError) throw fetchError;
                
                // Get inspection history
                let inspectionHistory = customer.inspection_history || { inspection1: [], inspection2: [] };
                
                // Filter out the inspection with matching date
                if (inspectionHistory[inspectionType]) {
                    inspectionHistory[inspectionType] = inspectionHistory[inspectionType].filter(
                        inspection => inspection.date !== inspectionDate
                    );
                }
                
                // Update database
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .update({ inspection_history: inspectionHistory })
                    .eq('id', customerId);

                if (error) throw error;
                
                showMessage('Inspection deleted!', 'success');
                await loadCustomerData();
                closeMonthlyCompletionsModal();
                
            } catch (error) {
                console.error('Delete error:', error);
                showMessage('ERROR deleting: ' + error.message, 'error');
            }
        }

        // Close monthly completions modal
        function closeMonthlyCompletionsModal() {
            document.getElementById('monthlyCompletionsModal').style.display = 'none';
        }

        // Handle completion form submission
        document.getElementById('completionForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!completingInspection) return;
            
            const { customerId, inspectionType } = completingInspection;
            const customer = customers.find(c => String(c.id) === String(customerId));
            
            if (!customer) return;
            
            const completion = {
                date: document.getElementById('completionDate').value,
                jobNumber: document.getElementById('jobNumber').value,
                notes: document.getElementById('completionNotes').value,
                recordedAt: new Date().toISOString()
            };
            
            try {
                // Get current inspection history
                let inspectionHistory = customer.inspection_history || { inspection1: [], inspection2: [] };
                
                // Add completion to history
                inspectionHistory[inspectionType].push(completion);
                
                // Keep only the last 5 completions
                if (inspectionHistory[inspectionType].length > 5) {
                    inspectionHistory[inspectionType] = inspectionHistory[inspectionType].slice(-5);
                }
                
                // Update the customer record in Supabase
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .update({ inspection_history: inspectionHistory })
                    .eq('id', customerId);

                if (error) throw error;
                
                showMessage('Inspection completion recorded successfully!', 'success');
                await loadCustomerData(); // Reload data from Supabase
                closeCompletionModal();
            } catch (error) {
                console.error('Error recording completion:', error);
                showMessage('Error recording completion: ' + error.message, 'error');
            }
        });

        // Handle edit inspection date form submission
        document.getElementById('editInspectionDateForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!editingInspection) return;
            
            const { customerId, inspectionType, originalDate } = editingInspection;
            const newDate = document.getElementById('editCompletionDate').value;
            const newNotes = document.getElementById('editCompletionNotes').value;
            
            console.log('SIMPLE UPDATE: Customer', customerId, inspectionType, 'from', originalDate, 'to', newDate);
            
            try {
                // Get the current customer from the database
                const { data: currentCustomer, error: fetchError } = await supabase
                    .from(TABLE_NAME)
                    .select('*')
                    .eq('id', customerId)
                    .single();

                if (fetchError) throw fetchError;
                
                // Get current inspection history
                let inspectionHistory = currentCustomer.inspection_history || { inspection1: [], inspection2: [] };
                
                // Just find the entry with the original date and update it
                if (inspectionHistory[inspectionType]) {
                    for (let i = 0; i < inspectionHistory[inspectionType].length; i++) {
                        if (inspectionHistory[inspectionType][i].date === originalDate) {
                            inspectionHistory[inspectionType][i].date = newDate;
                            inspectionHistory[inspectionType][i].notes = newNotes;
                            inspectionHistory[inspectionType][i].editedAt = new Date().toISOString();
                            break;
                        }
                    }
                }
                
                // Update the fucking database already!
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .update({ inspection_history: inspectionHistory })
                    .eq('id', customerId);

                if (error) throw error;
                
                showMessage('Date updated!', 'success');
                await loadCustomerData();
                closeEditInspectionDateModal();
                closeMonthlyCompletionsModal();
                
            } catch (error) {
                console.error('FUCK! Error:', error);
                showMessage('ERROR: ' + error.message, 'error');
            }
        });

        // Render customers table
        function renderCustomers() {
            const tbody = document.getElementById('customerTableBody');
            const emptyState = document.getElementById('emptyState');
            const mobileCards = document.getElementById('mobileCustomerCards');
            
            if (customers.length === 0) {
                tbody.innerHTML = '';
                mobileCards.innerHTML = '';
                emptyState.style.display = 'block';
                document.getElementById('customerTable').style.display = 'none';
                return;
            }

            emptyState.style.display = 'none';
            document.getElementById('customerTable').style.display = 'table';

            // Render desktop table
            tbody.innerHTML = customers.map(customer => {
                const inspection1Status = getInspectionStatus(customer, 'inspection1');
                const inspection2Status = customer.inspections_per_year === 2 ? 
                    getInspectionStatus(customer, 'inspection2') : null;
                
                const inspection1History = customer.inspection_history?.inspection1 || [];
                const inspection2History = customer.inspection_history?.inspection2 || [];
                const batteryData = customer.battery_replacement || {};
                
                const inspection1Html = `
                    <div class="inspection-card">
                        <div class="inspection-title">Inspection 1 (${getMonthName(customer.first_inspection_month)})</div>
                        <div>${getStatusBadge(inspection1Status)}</div>
                        <button class="btn btn-success" onclick="recordCompletion(${customer.id}, 'inspection1')" style="margin-top: 5px; padding: 4px 8px; font-size: 11px;">Record Completion</button>
                        ${inspection1History.length > 0 ? `
                            <div class="completion-history">
                                <strong>Last 5 completions:</strong>
                                ${inspection1History.slice(-5).map(h => `
                                    <div class="completion-item">
                                        <span>${new Date(h.date).toLocaleDateString()}</span>
                                        ${h.jobNumber ? `<span style="color: #666; font-size: 10px;">Job: ${h.jobNumber}</span>` : ''}
                                        <span>${h.notes ? '📝' : ''}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                
                const inspection2Html = customer.inspections_per_year === 2 ? `
                    <div class="inspection-card">
                        <div class="inspection-title">Inspection 2 (${getMonthName(customer.second_inspection_month)})</div>
                        <div>${getStatusBadge(inspection2Status)}</div>
                        <button class="btn btn-success" onclick="recordCompletion(${customer.id}, 'inspection2')" style="margin-top: 5px; padding: 4px 8px; font-size: 11px;">Record Completion</button>
                        ${inspection2History.length > 0 ? `
                            <div class="completion-history">
                                <strong>Last 5 completions:</strong>
                                ${inspection2History.slice(-5).map(h => `
                                    <div class="completion-item">
                                        <span>${new Date(h.date).toLocaleDateString()}</span>
                                        ${h.jobNumber ? `<span style="color: #666; font-size: 10px;">Job: ${h.jobNumber}</span>` : ''}
                                        <span>${h.notes ? '📝' : ''}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : '';

                                 const cloudArcBatteryHtml = `
                     <div style="margin-top: 10px; font-size: 12px; color: #666; display: flex; gap: 30px;">
                         <div>
                             <strong>Cloud & ARC:</strong><br>
                             ${customer.cloud_id ? `Cloud ID: ${customer.cloud_id}` : 'Cloud ID: Not set'}<br>
                             ${customer.cloud_renewal_date ? `Cloud Renewal: ${new Date(customer.cloud_renewal_date).toLocaleDateString()}` : 'Cloud Renewal: Not set'}<br>
                             ${customer.arc_no ? `ARC No: ${customer.arc_no}` : 'ARC No: Not set'}<br>
                             ${customer.arc_renewal_date ? `ARC Renewal: ${new Date(customer.arc_renewal_date).toLocaleDateString()}` : 'ARC Renewal: Not set'}
                         </div>
                         <div>
                             <strong>Batteries:</strong><br>
                             ${batteryData.control_panel ? `Control Panel: ${new Date(batteryData.control_panel).toLocaleDateString()}` : 'Control Panel: Not set'}<br>
                             ${batteryData.siren ? `Siren: ${new Date(batteryData.siren).toLocaleDateString()}` : 'Siren: Not set'}<br>
                             ${batteryData.detectors ? `Detectors: ${new Date(batteryData.detectors).toLocaleDateString()}` : 'Detectors: Not set'}
                         </div>
                     </div>
                 `;
                
                                 return `
                     <tr>
                         <td><strong>${customer.name}</strong></td>
                         <td>${customer.address && customer.address !== 'Address not provided' ? customer.address : ''}</td>
                         <td>${customer.postcode && customer.postcode !== 'Postcode not provided' ? customer.postcode : ''}</td>
                         <td>${customer.system_type}</td>
                         <td>${customer.nsi_status || 'NSI'}</td>
                         <td>
                             <div class="inspection-grid">
                                 ${inspection1Html}
                                 ${inspection2Html}
                             </div>
                             ${cloudArcBatteryHtml}
                         </td>
                         <td>
                             ${getOverallStatus(customer)}
                         </td>
                         <td>
                             <button class="btn" onclick="editCustomer(${customer.id})" style="background: #3498db; color: white; margin-right: 5px; padding: 8px; width: 32px;" title="Edit Customer">✏️</button>
                             <button class="btn" onclick="viewCustomerMaintenanceList(${customer.id})" style="background: #27ae60; color: white; margin-right: 5px; padding: 8px; width: 32px;" title="View Maintenance History">📋</button>
                             <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})" style="padding: 8px; width: 32px;" title="Delete Customer">🗑️</button>
                         </td>
                     </tr>
                 `;
            }).join('');

            // Render mobile cards
            mobileCards.innerHTML = customers.map(customer => {
                const inspection1Status = getInspectionStatus(customer, 'inspection1');
                const inspection2Status = customer.inspections_per_year === 2 ? 
                    getInspectionStatus(customer, 'inspection2') : null;
                
                const inspection1History = customer.inspection_history?.inspection1 || [];
                const inspection2History = customer.inspection_history?.inspection2 || [];
                const batteryData = customer.battery_replacement || {};
                
                const inspection1Html = `
                    <div class="inspection-card">
                        <div class="inspection-title">Inspection 1 (${getMonthName(customer.first_inspection_month)})</div>
                        <div>${getStatusBadge(inspection1Status)}</div>
                        <button class="btn btn-success" onclick="recordCompletion(${customer.id}, 'inspection1')" style="margin-top: 5px; padding: 8px 12px; font-size: 14px;">Record Completion</button>
                        ${inspection1History.length > 0 ? `
                            <div class="completion-history">
                                <strong>Last 5 completions:</strong>
                                ${inspection1History.slice(-5).map(h => `
                                    <div class="completion-item">
                                        <span>${new Date(h.date).toLocaleDateString()}</span>
                                        ${h.jobNumber ? `<span style="color: #666; font-size: 10px;">Job: ${h.jobNumber}</span>` : ''}
                                        <span>${h.notes ? '📝' : ''}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                
                const inspection2Html = customer.inspections_per_year === 2 ? `
                    <div class="inspection-card">
                        <div class="inspection-title">Inspection 2 (${getMonthName(customer.second_inspection_month)})</div>
                        <div>${getStatusBadge(inspection2Status)}</div>
                        <button class="btn btn-success" onclick="recordCompletion(${customer.id}, 'inspection2')" style="margin-top: 5px; padding: 8px 12px; font-size: 14px;">Record Completion</button>
                        ${inspection2History.length > 0 ? `
                            <div class="completion-history">
                                <strong>Last 5 completions:</strong>
                                ${inspection2History.slice(-5).map(h => `
                                    <div class="completion-item">
                                        <span>${new Date(h.date).toLocaleDateString()}</span>
                                        ${h.jobNumber ? `<span style="color: #666; font-size: 10px;">Job: ${h.jobNumber}</span>` : ''}
                                        <span>${h.notes ? '📝' : ''}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : '';

                return `
                    <div class="customer-card">
                        <div class="customer-card-header">
                            <div>
                                <div class="customer-name">${customer.name}</div>
                                                                 <div class="customer-details">
                                     ${customer.address && customer.address !== 'Address not provided' ? customer.address + '<br>' : ''}
                                     ${customer.postcode && customer.postcode !== 'Postcode not provided' ? customer.postcode + '<br>' : ''}
                                     <strong>${customer.system_type}</strong><br>
                                     <span style="color: #3498db; font-weight: 500;">${customer.nsi_status || 'NSI'}</span>
                                 </div>
                            </div>
                            <div>
                                ${getOverallStatus(customer)}
                            </div>
                        </div>
                                                 <div class="inspection-grid">
                             ${inspection1Html}
                             ${inspection2Html}
                         </div>
                         <div style="margin: 15px 0; display: flex; gap: 15px;">
                             <div class="cloud-arc-info" style="flex: 1; padding: 10px; background: #e8f4fd; border-radius: 6px; font-size: 14px;">
                                 <strong>☁️ Cloud & ARC:</strong><br>
                                 ${customer.cloud_id ? `Cloud ID: ${customer.cloud_id}` : 'Cloud ID: Not set'}<br>
                                 ${customer.cloud_renewal_date ? `Cloud Renewal: ${new Date(customer.cloud_renewal_date).toLocaleDateString()}` : 'Cloud Renewal: Not set'}<br>
                                 ${customer.arc_no ? `ARC No: ${customer.arc_no}` : 'ARC No: Not set'}<br>
                                 ${customer.arc_renewal_date ? `ARC Renewal: ${new Date(customer.arc_renewal_date).toLocaleDateString()}` : 'ARC Renewal: Not set'}
                             </div>
                             <div class="battery-info" style="flex: 1; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 14px;">
                                 <strong>🔋 Battery Replacement:</strong><br>
                                 ${batteryData.control_panel ? `Control Panel: ${new Date(batteryData.control_panel).toLocaleDateString()}` : 'Control Panel: Not set'}<br>
                                 ${batteryData.siren ? `Siren: ${new Date(batteryData.siren).toLocaleDateString()}` : 'Siren: Not set'}<br>
                                 ${batteryData.detectors ? `Detectors: ${new Date(batteryData.detectors).toLocaleDateString()}` : 'Detectors: Not set'}
                             </div>
                         </div>
                         <div class="customer-actions">
                            <button class="btn" onclick="editCustomer(${customer.id})" style="background: #3498db; color: white; padding: 8px; width: 32px;" title="Edit Customer">✏️</button>
                            <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})" style="padding: 8px; width: 32px;" title="Delete Customer">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Apply current filters after rendering
            filterTable();
        }

        // Get overall status for customer
        function getOverallStatus(customer) {
            const inspection1Status = getInspectionStatus(customer, 'inspection1');
            const inspection2Status = customer.inspections_per_year === 2 ? 
                getInspectionStatus(customer, 'inspection2') : null;
            
            // Priority order: overdue > due-last-month > due-this-month > can-be-done > up-to-date
            if (inspection1Status === 'overdue' || (inspection2Status && inspection2Status === 'overdue')) {
                return getStatusBadge('overdue');
            }
            if (inspection1Status === 'due-last-month' || (inspection2Status && inspection2Status === 'due-last-month')) {
                return getStatusBadge('due-last-month');
            }
            if (inspection1Status === 'due-this-month' || (inspection2Status && inspection2Status === 'due-this-month')) {
                return getStatusBadge('due-this-month');
            }
            if (inspection1Status === 'can-be-done' || (inspection2Status && inspection2Status === 'can-be-done')) {
                return getStatusBadge('can-be-done');
            }
            return getStatusBadge('up-to-date');
        }

        // Get month name
        function getMonthName(monthNumber) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[monthNumber - 1];
        }

        // Calculate monthly completion statistics with NSI 3-month window logic
        function calculateMonthlyStats() {
            const today = new Date();
            const monthlyStats = [];
            
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            
            // Filter customers based on NSI status if needed
            let filteredCustomers = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            // Get last 12 months plus next month (to see what can be done)
            for (let i = 11; i >= -1; i--) {
                const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
                const monthName = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                const currentMonthNumber = monthDate.getMonth() + 1;
                const currentYear = monthDate.getFullYear();
                
                let onTimeCompletions = 0;
                let lateCompletions = 0;
                let totalDue = 0;
                
                filteredCustomers.forEach(customer => {
                    // Check Inspection 1 - is it due this month?
                    if (customer.first_inspection_month === currentMonthNumber) {
                        totalDue++;
                        
                        // Check if completed and whether on time or late using NSI 3-month window
                        const history = customer.inspection_history?.inspection1 || [];
                        const dueMonth = customer.first_inspection_month;
                        
                        // NSI 3-month window: month before due, due month, month after
                        const monthBeforeDue = dueMonth - 1 <= 0 ? 12 + (dueMonth - 1) : dueMonth - 1;
                        const monthAfterDue = dueMonth + 1 > 12 ? (dueMonth + 1) - 12 : dueMonth + 1;
                        
                        let yearBeforeDue = currentYear;
                        let yearAfterDue = currentYear;
                        if (dueMonth === 1 && monthBeforeDue === 12) yearBeforeDue = currentYear - 1;
                        if (dueMonth === 12 && monthAfterDue === 1) yearAfterDue = currentYear + 1;
                        
                        const windowStart = new Date(yearBeforeDue, monthBeforeDue - 1, 1);
                        const windowEnd = new Date(yearAfterDue, monthAfterDue, 0);
                        
                        // Find the most recent completion for this year's cycle
                        const thisYearCompletions = history.filter(h => {
                            const completionDate = new Date(h.date);
                            return completionDate.getFullYear() === currentYear || 
                                   (completionDate >= windowStart && completionDate <= windowEnd);
                        });
                        
                        if (thisYearCompletions.length > 0) {
                            const latestCompletion = thisYearCompletions
                                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                            const completionDate = new Date(latestCompletion.date);
                            
                            if (completionDate >= windowStart && completionDate <= windowEnd) {
                                onTimeCompletions++;
                            } else {
                                lateCompletions++;
                            }
                        }
                    }
                    
                    // Check Inspection 2 - is it due this month?
                    if (customer.inspections_per_year === 2 && customer.second_inspection_month === currentMonthNumber) {
                        totalDue++;
                        
                        // Check if completed and whether on time or late using NSI 3-month window
                        const history = customer.inspection_history?.inspection2 || [];
                        const dueMonth = customer.second_inspection_month;
                        
                        // NSI 3-month window: month before due, due month, month after
                        const monthBeforeDue = dueMonth - 1 <= 0 ? 12 + (dueMonth - 1) : dueMonth - 1;
                        const monthAfterDue = dueMonth + 1 > 12 ? (dueMonth + 1) - 12 : dueMonth + 1;
                        
                        let yearBeforeDue = currentYear;
                        let yearAfterDue = currentYear;
                        if (dueMonth === 1 && monthBeforeDue === 12) yearBeforeDue = currentYear - 1;
                        if (dueMonth === 12 && monthAfterDue === 1) yearAfterDue = currentYear + 1;
                        
                        const windowStart = new Date(yearBeforeDue, monthBeforeDue - 1, 1);
                        const windowEnd = new Date(yearAfterDue, monthAfterDue, 0);
                        
                        // Find the most recent completion for this year's cycle
                        const thisYearCompletions = history.filter(h => {
                            const completionDate = new Date(h.date);
                            return completionDate.getFullYear() === currentYear || 
                                   (completionDate >= windowStart && completionDate <= windowEnd);
                        });
                        
                        if (thisYearCompletions.length > 0) {
                            const latestCompletion = thisYearCompletions
                                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                            const completionDate = new Date(latestCompletion.date);
                            
                            if (completionDate >= windowStart && completionDate <= windowEnd) {
                                onTimeCompletions++;
                            } else {
                                lateCompletions++;
                            }
                        }
                    }
                });
                
                // Calculate "Can Be Done" for this month (inspections still within acceptable window)
                let canBeDoneThisMonth = 0;
                if (currentMonthNumber === today.getMonth() + 1 && currentYear === today.getFullYear()) {
                    // This is the current month - check for "Can Be Done" inspections
                    filteredCustomers.forEach(customer => {
                        // Check Inspection 1
                        if (customer.first_inspection_month === currentMonthNumber) {
                            const inspection1Status = getInspectionStatus(customer, 'inspection1');
                            if (inspection1Status === 'due-this-month' || inspection1Status === 'due-soon') {
                                canBeDoneThisMonth++;
                            }
                        }
                        
                        // Check Inspection 2
                        if (customer.inspections_per_year === 2 && customer.second_inspection_month === currentMonthNumber) {
                            const inspection2Status = getInspectionStatus(customer, 'inspection2');
                            if (inspection2Status === 'due-this-month' || inspection2Status === 'due-soon') {
                                canBeDoneThisMonth++;
                            }
                        }
                    });
                }
                
                // Calculate on-time rate including "Can Be Done" as potential on-time
                const potentialOnTime = onTimeCompletions + canBeDoneThisMonth;
                const onTimeRate = totalDue > 0 ? Math.round((potentialOnTime / totalDue) * 100) : 100;
                
                monthlyStats.push({
                    month: monthDate.toLocaleDateString('en-GB', { month: 'short' }),
                    year: monthDate.getFullYear(),
                    fullMonthName: monthName,
                    monthKey: monthKey,
                    onTime: onTimeCompletions,
                    late: lateCompletions,
                    total: totalDue,
                    rate: onTimeRate
                });
            }
            
            return monthlyStats;
        }

        // Show rolling late inspections for debugging
        function showRollingLateInspections() {
            const today = new Date();
            const lateInspections = [];
            
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            let filteredCustomers = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            filteredCustomers.forEach(customer => {
                // Check Inspection 1
                if (customer.inspection_history?.inspection1) {
                    const completionsInWindow = customer.inspection_history.inspection1.filter(completion => {
                        const completionDate = new Date(completion.date);
                        const currentMonth = today.getMonth() + 1;
                        const currentYear = today.getFullYear();
                        const completionMonth = completionDate.getMonth() + 1;
                        const completionYear = completionDate.getFullYear();
                        
                        const monthsDiff = (currentYear - completionYear) * 12 + (currentMonth - completionMonth);
                        return monthsDiff >= 0 && monthsDiff <= 12;
                    });
                    
                    if (completionsInWindow.length > 0) {
                        const latestCompletion = completionsInWindow
                            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                        
                        const completionDate = new Date(latestCompletion.date);
                        const dueMonth = customer.first_inspection_month;
                        const completionYear = completionDate.getFullYear();
                        const completionMonthNum = completionDate.getMonth() + 1;
                        
                        let dueYear = completionYear;
                        if (completionMonthNum > dueMonth + 1) {
                            dueYear = completionYear;
                        } else if (completionMonthNum < dueMonth - 1) {
                            dueYear = completionYear + 1;
                        }
                        
                        const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                        const monthAfter = new Date(dueYear, dueMonth, 1);
                        
                        if (!(completionDate >= monthBefore && completionDate < monthAfter)) {
                            lateInspections.push({
                                customer: customer.name,
                                inspection: 'Inspection 1',
                                dueMonth: dueMonth,
                                completionDate: latestCompletion.date,
                                notes: latestCompletion.notes || ''
                            });
                        }
                    }
                }
                
                // Check Inspection 2
                if (customer.inspections_per_year === 2 && customer.inspection_history?.inspection2) {
                    const completionsInWindow = customer.inspection_history.inspection2.filter(completion => {
                        const completionDate = new Date(completion.date);
                        const currentMonth = today.getMonth() + 1;
                        const currentYear = today.getFullYear();
                        const completionMonth = completionDate.getMonth() + 1;
                        const completionYear = completionDate.getFullYear();
                        
                        const monthsDiff = (currentYear - completionYear) * 12 + (currentMonth - completionMonth);
                        return monthsDiff >= 0 && monthsDiff <= 12;
                    });
                    
                    if (completionsInWindow.length > 0) {
                        const latestCompletion = completionsInWindow
                            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                        
                        const completionDate = new Date(latestCompletion.date);
                        const dueMonth = customer.second_inspection_month;
                        const completionYear = completionDate.getFullYear();
                        const completionMonthNum = completionDate.getMonth() + 1;
                        
                        let dueYear = completionYear;
                        if (completionMonthNum > dueMonth + 1) {
                            dueYear = completionYear;
                        } else if (completionMonthNum < dueMonth - 1) {
                            dueYear = completionYear + 1;
                        }
                        
                        const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                        const monthAfter = new Date(dueYear, dueMonth, 1);
                        
                        if (!(completionDate >= monthBefore && completionDate < monthAfter)) {
                            lateInspections.push({
                                customer: customer.name,
                                inspection: 'Inspection 2',
                                dueMonth: dueMonth,
                                completionDate: latestCompletion.date,
                                notes: latestCompletion.notes || ''
                            });
                        }
                    }
                }
            });
            
            // Show in modal
            const modal = document.getElementById('monthlyCompletionsModal');
            const tbody = document.querySelector('#monthlyCompletionsModal tbody');
            const title = document.getElementById('monthlyCompletionsTitle');
            
            title.textContent = `Rolling Stats Late Inspections (${lateInspections.length} total)`;
            
            document.querySelector('#monthlyCompletionsModal table thead tr').innerHTML = `
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Customer</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Inspection</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Due Month</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Completion Date</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Notes</th>
            `;
            
            tbody.innerHTML = lateInspections.map(item => `
                <tr>
                    <td><strong>${item.customer}</strong></td>
                    <td>${item.inspection}</td>
                    <td>Month ${item.dueMonth}</td>
                    <td>${new Date(item.completionDate).toLocaleDateString()}</td>
                    <td>${item.notes}</td>
                </tr>
            `).join('');
            
            if (lateInspections.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No late inspections found in rolling window</td></tr>';
            }
            
            modal.style.display = 'block';
        }

        // Render monthly statistics
        function renderMonthlyStats() {
            const monthlyStats = calculateMonthlyStats();
            const monthlyGrid = document.getElementById('monthlyGrid');
            const completionChart = document.getElementById('completionChart');
            
            // Render monthly cards
            monthlyGrid.innerHTML = monthlyStats.map(stat => `
                <div class="monthly-card" onclick="showCustomersDueInMonth('${stat.month}', ${stat.year})" style="cursor: pointer;" title="Click to see customers due in ${stat.month}">
                    <h4>${stat.month}</h4>
                    <div class="monthly-numbers">
                        <div class="monthly-stat">
                            <div class="monthly-stat-number on-time">${stat.onTime}</div>
                            <div class="monthly-stat-label">On Time</div>
                        </div>
                        <div class="monthly-stat">
                            <div class="monthly-stat-number late">${stat.late}</div>
                            <div class="monthly-stat-label">Late</div>
                        </div>
                        <div class="monthly-stat">
                            <div class="monthly-stat-number">${stat.total}</div>
                            <div class="monthly-stat-label">Total</div>
                        </div>
                    </div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: ${stat.rate >= 80 ? '#27ae60' : stat.rate >= 60 ? '#f39c12' : '#e74c3c'};">
                        ${stat.rate}% On Time
                    </div>
                </div>
            `).join('');
            
            // Calculate 12-month rolling percentage EXCLUDING current month using NSI 3-month window logic
            const today = new Date();
            
            // Get current NSI filter (same as monthly stats)
            const nsiFilter = document.getElementById('nsiFilter').value;
            let filteredCustomersForRolling = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomersForRolling = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            // Use monthly stats but EXCLUDE current month for rolling percentage
            const excludeCurrentMonth = monthlyStats.slice(1); // Remove first item which is current month
            const totalOnTime = excludeCurrentMonth.reduce((sum, stat) => sum + stat.onTime, 0);
            const totalLate = excludeCurrentMonth.reduce((sum, stat) => sum + stat.late, 0);
            const totalDueInPeriod = excludeCurrentMonth.reduce((sum, stat) => sum + stat.total, 0);
            
            // Calculate "Can Be Done" inspections - those currently in the acceptable window but not completed
            let canBeDoneInspections = 0;
            
            filteredCustomersForRolling.forEach(customer => {
                // Check Inspection 1 - can it be done now?
                const inspection1Status = getInspectionStatus(customer, 'inspection1');
                if (inspection1Status === 'due-this-month' || inspection1Status === 'due-soon') {
                    canBeDoneInspections++;
                }
                
                // Check Inspection 2 - can it be done now?
                if (customer.inspections_per_year === 2) {
                    const inspection2Status = getInspectionStatus(customer, 'inspection2');
                    if (inspection2Status === 'due-this-month' || inspection2Status === 'due-soon') {
                        canBeDoneInspections++;
                    }
                }
            });
            
            // Calculate rolling percentage including "Can Be Done" as potential on-time
            // This gives a more accurate picture of potential performance
            const potentialOnTime = totalOnTime + canBeDoneInspections;
            const totalInspectionsInPeriod = totalOnTime + totalLate + canBeDoneInspections;
            const rollingPercentage = totalInspectionsInPeriod > 0 ? Math.round((potentialOnTime / totalInspectionsInPeriod) * 100) : 100;
            
            // Debug logging
            console.log(`NSI Filter: "${nsiFilter}", Filtered customers: ${filteredCustomersForRolling.length}, Total customers: ${customers.length}`);
            console.log(`Rolling stats - OnTime: ${totalOnTime}, Late: ${totalLate}, CanBeDone: ${canBeDoneInspections}, Total: ${totalInspectionsInPeriod}, Percentage: ${rollingPercentage}%`);
            
            // Calculate date range for display (exclude current month)
            const startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
            const endDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of previous month
            const startMonth = startDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            const endMonth = endDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            
            // Render simplified rolling 12-month completion chart (excluding current month)
            completionChart.innerHTML = `
                <div class="rolling-period" style="text-align: center; margin-bottom: 15px; color: #666; font-size: 0.9rem;">
                    Rolling Period: ${startMonth} - ${endMonth} (Excluding Current Month)
                </div>
                <div class="rolling-stats-summary" style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #27ae60;">${totalOnTime}</div>
                        <div style="font-size: 0.9rem; color: #666;">On Time</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #e74c3c;">${totalLate}</div>
                        <div style="font-size: 0.9rem; color: #666;">Late</div>
                    </div>
                    <div style="text-align: center; cursor: pointer;" onclick="showCanBeDoneInspections()" title="Click to see which inspections can be done now">
                        <div style="font-size: 2rem; font-weight: bold; color: #f39c12;">${canBeDoneInspections}</div>
                        <div style="font-size: 0.9rem; color: #666;">Can Be Done</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #2c3e50;">${totalOnTime + totalLate + canBeDoneInspections}</div>
                        <div style="font-size: 0.9rem; color: #666;">Total Maintenances</div>
                    </div>
                </div>
                <div class="chart-bar" title="Rolling completion statistics including current potential on-time completions">
                    <div class="chart-label">Rolling 12 Months + Current Potential</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill on-time" style="width: ${totalInspectionsInPeriod > 0 ? (potentialOnTime / totalInspectionsInPeriod) * 100 : 0}%"></div>
                    </div>
                    <div class="chart-percentage">${rollingPercentage}%</div>
                </div>
                <div style="text-align: center; margin-top: 15px; font-size: 1.2rem; font-weight: bold; color: ${rollingPercentage >= 80 ? '#27ae60' : rollingPercentage >= 60 ? '#f39c12' : '#e74c3c'};">
                    ${rollingPercentage}% Potential On Time (Including Can Be Done)
                </div>
            `;
            
            // Initialize carousel buttons
            setTimeout(() => {
                const cards = monthlyGrid.children;
                const totalCards = cards.length;
                const currentCardsPerView = window.innerWidth <= 768 ? 1 : 5;
                const maxSlides = Math.max(0, totalCards - currentCardsPerView);
                
                document.getElementById('monthlyPrev').disabled = true;
                document.getElementById('monthlyNext').disabled = maxSlides === 0;
                currentMonthSlide = 0;
            }, 100);
        }

        // Monthly cards carousel functionality
        let currentMonthSlide = 0;
        const cardsPerView = window.innerWidth <= 768 ? 1 : 5;

        function slideMonthlyCards(direction) {
            const monthlyGrid = document.getElementById('monthlyGrid');
            const cards = monthlyGrid.children;
            const totalCards = cards.length;
            const maxSlides = Math.max(0, totalCards - cardsPerView);
            
            currentMonthSlide += direction;
            
            if (currentMonthSlide < 0) {
                currentMonthSlide = 0;
            }
            if (currentMonthSlide > maxSlides) {
                currentMonthSlide = maxSlides;
            }
            
            const cardWidth = cards[0] ? cards[0].offsetWidth : 220;
            const gap = 20;
            const translateX = -(currentMonthSlide * (cardWidth + gap));
            
            monthlyGrid.style.transform = `translateX(${translateX}px)`;
            
            // Update button states
            document.getElementById('monthlyPrev').disabled = currentMonthSlide === 0;
            document.getElementById('monthlyNext').disabled = currentMonthSlide >= maxSlides;
        }

        // Initialize carousel on window resize
        window.addEventListener('resize', () => {
            currentMonthSlide = 0;
            const monthlyGrid = document.getElementById('monthlyGrid');
            monthlyGrid.style.transform = 'translateX(0px)';
            
            // Update button states
            const cards = monthlyGrid.children;
            const totalCards = cards.length;
            const newCardsPerView = window.innerWidth <= 768 ? 1 : 5;
            const maxSlides = Math.max(0, totalCards - newCardsPerView);
            
            document.getElementById('monthlyPrev').disabled = true;
            document.getElementById('monthlyNext').disabled = maxSlides === 0;
        });

        // Show customers by status modal
        function showCustomersByStatus(statusType) {
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            
            // Filter customers based on NSI status if needed
            let filteredCustomers = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            let customersToShow = [];
            let modalTitle = '';
            
            if (statusType === 'all') {
                customersToShow = filteredCustomers;
                modalTitle = 'All Customers';
            } else {
                // Filter by inspection status
                customersToShow = filteredCustomers.filter(customer => {
                    const inspection1Status = getInspectionStatus(customer, 'inspection1');
                    const inspection2Status = customer.inspections_per_year === 2 ? 
                        getInspectionStatus(customer, 'inspection2') : null;
                    
                    if (statusType === 'overdue') {
                        return inspection1Status === 'overdue' || (inspection2Status && inspection2Status === 'overdue');
                    } else if (statusType === 'due-soon') {
                        return (inspection1Status === 'due-this-month' || (inspection2Status && inspection2Status === 'due-this-month') ||
                               inspection1Status === 'due-last-month' || (inspection2Status && inspection2Status === 'due-last-month')) &&
                               !(inspection1Status === 'overdue' || (inspection2Status && inspection2Status === 'overdue'));
                    } else if (statusType === 'current') {
                        return (inspection1Status === 'up-to-date' || inspection1Status === 'can-be-done') && 
                               (!inspection2Status || inspection2Status === 'up-to-date' || inspection2Status === 'can-be-done');
                    }
                    return false;
                });
                
                modalTitle = statusType === 'overdue' ? 'Overdue Inspections' :
                           statusType === 'due-soon' ? 'Due Soon (This Month or Last Month)' : 'Up to Date';
            }
            
            // Show modal
            document.getElementById('monthlyCompletionsTitle').textContent = modalTitle;
            const tbody = document.getElementById('monthlyCompletionsBody');
            tbody.innerHTML = customersToShow.map(customer => {
                const inspection1Status = getInspectionStatus(customer, 'inspection1');
                const inspection2Status = customer.inspections_per_year === 2 ? 
                    getInspectionStatus(customer, 'inspection2') : null;
                
                const overallStatus = getOverallStatus(customer);
                
                return `
                    <tr>
                        <td><strong>${customer.name}</strong></td>
                        <td>${customer.system_type}</td>
                        <td>${customer.nsi_status || 'NSI'}</td>
                        <td><span class="status-badge ${inspection1Status}">${inspection1Status.replace('-', ' ').toUpperCase()}</span></td>
                        <td>${inspection2Status ? `<span class="status-badge ${inspection2Status}">${inspection2Status.replace('-', ' ').toUpperCase()}</span>` : 'N/A'}</td>
                        <td><button class="btn" onclick="editCustomer(${customer.id})" style="background: #3498db; color: white; padding: 6px; width: 28px;" title="Edit Customer">✏️</button></td>
                    </tr>
                `;
            }).join('');
            
            if (customersToShow.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No customers found</td></tr>';
            }
            
            // Update table headers for customer status view
            const table = document.querySelector('#monthlyCompletionsModal table');
            table.querySelector('thead tr').innerHTML = `
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Customer</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">System Type</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">NSI Status</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Inspection 1</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Inspection 2</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Action</th>
            `;
            
            document.getElementById('monthlyCompletionsModal').style.display = 'block';
        }

        // Show completions that happened in a specific month (for monthly cards)
        function showCustomersDueInMonth(monthName, year) {
            const targetMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName) + 1;
            
            const completions = [];
            
            // Get current NSI filter to match the monthly card calculation
            const nsiFilter = document.getElementById('nsiFilter').value;
            
            // Filter customers based on NSI status if needed - SAME AS calculateMonthlyStats
            let filteredCustomers = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            filteredCustomers.forEach(customer => {
                // Check Inspection 1 - is it due in this month?
                if (customer.first_inspection_month === targetMonth) {
                    const latestCompletion = customer.inspection_history?.inspection1 ? 
                        customer.inspection_history.inspection1.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
                    
                    if (latestCompletion) {
                        const completionDate = new Date(latestCompletion.date);
                        const dueMonth = customer.first_inspection_month;
                        const dueYear = year;
                        const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                        const monthAfter = new Date(dueYear, dueMonth, 1);
                        const isOnTime = completionDate >= monthBefore && completionDate < monthAfter;
                        
                        completions.push({
                            customer: customer,
                            inspectionType: 'Inspection 1',
                            completionDate: latestCompletion.date,
                            notes: latestCompletion.notes || '',
                            status: isOnTime ? 'On Time' : 'Late'
                        });
                    } else {
                        // No completion - show as pending/overdue
                        completions.push({
                            customer: customer,
                            inspectionType: 'Inspection 1',
                            completionDate: null,
                            notes: '',
                            status: 'Not Completed'
                        });
                    }
                }
                
                // Check Inspection 2 - is it due in this month?
                if (customer.inspections_per_year === 2 && customer.second_inspection_month === targetMonth) {
                    const latestCompletion = customer.inspection_history?.inspection2 ? 
                        customer.inspection_history.inspection2.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
                    
                    if (latestCompletion) {
                        const completionDate = new Date(latestCompletion.date);
                        const dueMonth = customer.second_inspection_month;
                        const dueYear = year;
                        const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                        const monthAfter = new Date(dueYear, dueMonth, 1);
                        const isOnTime = completionDate >= monthBefore && completionDate < monthAfter;
                        
                        completions.push({
                            customer: customer,
                            inspectionType: 'Inspection 2',
                            completionDate: latestCompletion.date,
                            notes: latestCompletion.notes || '',
                            status: isOnTime ? 'On Time' : 'Late'
                        });
                    } else {
                        // No completion - show as pending/overdue
                        completions.push({
                            customer: customer,
                            inspectionType: 'Inspection 2',
                            completionDate: null,
                            notes: '',
                            status: 'Not Completed'
                        });
                    }
                }
            });
            
            // Sort by completion date
            completions.sort((a, b) => new Date(a.completionDate) - new Date(b.completionDate));
            
            const onTimeCount = completions.filter(c => c.status === 'On Time').length;
            const lateCount = completions.filter(c => c.status === 'Late').length;
            
            // Show modal
            document.getElementById('monthlyCompletionsTitle').textContent = `Completions in ${monthName} ${year} - ${onTimeCount} On Time, ${lateCount} Late (${completions.length} total)`;
            const tbody = document.getElementById('monthlyCompletionsBody');
            
            // Update table headers for completions view
            const table = document.querySelector('#monthlyCompletionsModal table');
            table.querySelector('thead tr').innerHTML = `
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Customer</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Inspection Type</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Completion Date</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Notes</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Action</th>
            `;
            
            tbody.innerHTML = completions.map(item => `
                <tr>
                    <td><strong>${item.customer.name}</strong></td>
                    <td>${item.inspectionType}</td>
                    <td>
                        ${item.completionDate ? 
                            `<span class="clickable-date" onclick="openEditInspectionDateModal(${item.customer.id}, '${item.inspectionType.toLowerCase().replace(' ', '')}', '${item.completionDate}', '${(item.notes || '').replace(/'/g, '&#39;')}')" style="cursor: pointer; color: #3498db; text-decoration: underline;" title="Click to edit date">${new Date(item.completionDate).toLocaleDateString()}</span>` : 
                            '<span style="color: #999;">Not Completed</span>'
                        }
                    </td>
                    <td><span class="status-badge ${item.status === 'On Time' ? 'on-time' : item.status === 'Late' ? 'late' : 'pending'}">${item.status}</span></td>
                    <td>${item.notes}</td>
                    <td>
                        <button class="btn" onclick="editCustomer(${item.customer.id})" style="background: #3498db; color: white; padding: 6px; width: 28px; margin-right: 5px;" title="Edit Customer">✏️</button>
                        ${item.completionDate ? 
                            `<button class="btn" onclick="deleteInspection(${item.customer.id}, '${item.inspectionType.toLowerCase().replace(' ', '')}', '${item.completionDate}')" style="background: #e74c3c; color: white; padding: 6px; width: 28px;" title="Delete this inspection">🗑️</button>` : 
                            ''
                        }
                    </td>
                </tr>
            `).join('');
            
            if (completions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No completions recorded in this month</td></tr>';
            }
            
            document.getElementById('monthlyCompletionsModal').style.display = 'block';
        }

        // Show inspections that can be done now (within NSI 3-month window)
        function showCanBeDoneInspections() {
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            let filteredCustomers = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            const canBeDoneList = [];
            
            filteredCustomers.forEach(customer => {
                // Check Inspection 1
                const inspection1Status = getInspectionStatus(customer, 'inspection1');
                if (inspection1Status === 'due-this-month' || inspection1Status === 'due-soon') {
                    canBeDoneList.push({
                        customer: customer,
                        inspectionType: 'Inspection 1',
                        dueMonth: getMonthName(customer.first_inspection_month),
                        status: inspection1Status
                    });
                }
                
                // Check Inspection 2
                if (customer.inspections_per_year === 2) {
                    const inspection2Status = getInspectionStatus(customer, 'inspection2');
                    if (inspection2Status === 'due-this-month' || inspection2Status === 'due-soon') {
                        canBeDoneList.push({
                            customer: customer,
                            inspectionType: 'Inspection 2', 
                            dueMonth: getMonthName(customer.second_inspection_month),
                            status: inspection2Status
                        });
                    }
                }
            });
            
            // Sort by customer name
            canBeDoneList.sort((a, b) => a.customer.name.localeCompare(b.customer.name));
            
            // Show modal
            document.getElementById('monthlyCompletionsTitle').textContent = 'Inspections That Can Be Done Now';
            const tbody = document.getElementById('monthlyCompletionsBody');
            
            // Update table headers 
            const table = document.querySelector('#monthlyCompletionsModal table');
            table.querySelector('thead tr').innerHTML = `
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Customer</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Inspection</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Due Month</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Action</th>
            `;
            
            tbody.innerHTML = canBeDoneList.map(item => `
                <tr>
                    <td><strong>${item.customer.name}</strong></td>
                    <td>${item.inspectionType}</td>
                    <td>${item.dueMonth}</td>
                    <td><span class="status-badge ${item.status}">${item.status.replace('-', ' ').toUpperCase()}</span></td>
                    <td>
                        <button class="btn btn-success" onclick="recordCompletion(${item.customer.id}, '${item.inspectionType.toLowerCase().replace(' ', '')}')" style="padding: 4px 8px; font-size: 12px;">Record Completion</button>
                    </td>
                </tr>
            `).join('');
            
            if (canBeDoneList.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No inspections can be done right now</td></tr>';
            }
            
            document.getElementById('monthlyCompletionsModal').style.display = 'block';
        }

        // Show customers due in a specific month (for chart bars - shows completions)
        function showMonthlyCompletions(monthName, year) {
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
            if (monthIndex === -1) return;
            
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            
            // Filter customers based on NSI status if needed
            let filteredCustomers = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            const dueCustomers = [];
            
            filteredCustomers.forEach(customer => {
                // Check if inspection 1 is due in this month
                if (customer.first_inspection_month === (monthIndex + 1)) {
                    const inspection1History = customer.inspection_history?.inspection1 || [];
                    const latestCompletion = inspection1History.length > 0 ? 
                        inspection1History[inspection1History.length - 1] : null;
                    
                    dueCustomers.push({
                        customer: customer,
                        inspectionType: 'Inspection 1',
                        dueMonth: monthName,
                        completionDate: latestCompletion ? latestCompletion.date : null,
                        status: getInspectionStatus(customer, 'inspection1'),
                        notes: latestCompletion ? latestCompletion.notes || '' : ''
                    });
                }
                
                // Check if inspection 2 is due in this month
                if (customer.inspections_per_year === 2 && customer.second_inspection_month === (monthIndex + 1)) {
                    const inspection2History = customer.inspection_history?.inspection2 || [];
                    const latestCompletion = inspection2History.length > 0 ? 
                        inspection2History[inspection2History.length - 1] : null;
                    
                    dueCustomers.push({
                        customer: customer,
                        inspectionType: 'Inspection 2',
                        dueMonth: monthName,
                        completionDate: latestCompletion ? latestCompletion.date : null,
                        status: getInspectionStatus(customer, 'inspection2'),
                        notes: latestCompletion ? latestCompletion.notes || '' : ''
                    });
                }
            });
            
            // Sort by customer name
            dueCustomers.sort((a, b) => a.customer.name.localeCompare(b.customer.name));
            
            // Show modal
            document.getElementById('monthlyCompletionsTitle').textContent = `Customers Due in ${monthName} ${year}`;
            const tbody = document.getElementById('monthlyCompletionsBody');
            
            // Update table headers for monthly due view
            const table = document.querySelector('#monthlyCompletionsModal table');
            table.querySelector('thead tr').innerHTML = `
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Customer</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Inspection</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Last Completion</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Notes</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Action</th>
            `;
            
            tbody.innerHTML = dueCustomers.map(item => `
                <tr>
                    <td><strong>${item.customer.name}</strong></td>
                    <td>${item.inspectionType}</td>
                    <td><span class="status-badge ${item.status}">${item.status.replace('-', ' ').toUpperCase()}</span></td>
                    <td>
                        ${item.completionDate ? 
                            `<span class="clickable-date" onclick="openEditInspectionDateModal(${item.customer.id}, '${item.inspectionType.toLowerCase().replace(' ', '')}', '${item.completionDate}', '${(item.notes || '').replace(/'/g, '&#39;')}')" style="cursor: pointer; color: #3498db; text-decoration: underline;" title="Click to edit date">${new Date(item.completionDate).toLocaleDateString()}</span>` : 
                            '<span style="color: #999;">Never</span>'
                        }
                    </td>
                    <td>${item.notes}</td>
                    <td>
                        <button class="btn" onclick="editCustomer(${item.customer.id})" style="background: #3498db; color: white; padding: 6px; width: 28px; margin-right: 5px;" title="Edit Customer">✏️</button>
                        ${item.completionDate ? 
                            `<button class="btn" onclick="deleteInspection(${item.customer.id}, '${item.inspectionType.toLowerCase().replace(' ', '')}', '${item.completionDate}')" style="background: #e74c3c; color: white; padding: 6px; width: 28px;" title="Delete this inspection">🗑️</button>` : 
                            ''
                        }
                    </td>
                </tr>
            `).join('');
            
            if (dueCustomers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No customers due in this month</td></tr>';
            }
            
            document.getElementById('monthlyCompletionsModal').style.display = 'block';
        }

        // Update statistics with corrected NSI 3-month window logic
        function updateStats() {
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            console.log('UpdateStats called with NSI filter:', nsiFilter);
            
            // Filter customers based on NSI status
            let filteredCustomers = customers;
            if (nsiFilter && nsiFilter !== '') {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            // Count individual inspections due per year (not just customers)
            let totalInspectionsDuePerYear = 0;
            let overdue = 0;
            let dueSoon = 0;
            let upToDate = 0;

            filteredCustomers.forEach(customer => {
                // Count Inspection 1 - every customer has at least one per year
                totalInspectionsDuePerYear++;
                const inspection1Status = getInspectionStatus(customer, 'inspection1');
                
                if (inspection1Status === 'overdue') {
                    overdue++;
                } else if (inspection1Status === 'due-this-month' || inspection1Status === 'due-soon') {
                    dueSoon++;
                } else {
                    upToDate++;
                }
                
                // Count Inspection 2 if customer has 2 inspections per year
                if (customer.inspections_per_year === 2) {
                    totalInspectionsDuePerYear++;
                    const inspection2Status = getInspectionStatus(customer, 'inspection2');
                    
                    if (inspection2Status === 'overdue') {
                        overdue++;
                    } else if (inspection2Status === 'due-this-month' || inspection2Status === 'due-soon') {
                        dueSoon++;
                    } else {
                        upToDate++;
                    }
                }
            });
            
            console.log('Total inspections due per year:', totalInspectionsDuePerYear, 'from', filteredCustomers.length, 'customers');

            document.getElementById('totalCustomers').textContent = totalInspectionsDuePerYear;
            document.getElementById('overdueCount').textContent = overdue;
            document.getElementById('dueSoonCount').textContent = dueSoon;
            document.getElementById('currentCount').textContent = upToDate;
            
            // Update monthly statistics
            renderMonthlyStats();
        }

    // Toggle monthly statistics visibility
    function toggleMonthlyStats() {
        const statsContent = document.getElementById('monthlyStatsContent');
        const toggleText = document.getElementById('statsToggleText');
        
        // Mark that user has manually toggled stats
        userToggledStats = true;
        
        if (statsContent.classList.contains('hidden')) {
            statsContent.classList.remove('hidden');
            statsContent.style.display = 'block';
            toggleText.textContent = 'Hide';
        } else {
            statsContent.classList.add('hidden');
            statsContent.style.display = 'none';
            toggleText.textContent = 'Show';
        }
    }

    // Initialize statistics visibility based on screen size
    function initializeStatsVisibility() {
        const statsContent = document.getElementById('monthlyStatsContent');
        const toggleText = document.getElementById('statsToggleText');
        
        // Check if mobile (width < 768px)
        if (window.innerWidth < 768) {
            statsContent.classList.add('hidden');
            statsContent.style.display = 'none';
            toggleText.textContent = 'Show';
        } else {
            statsContent.classList.remove('hidden');
            statsContent.style.display = 'block';
            toggleText.textContent = 'Hide';
        }
    }

                          // Sort table
         function sortTable(field) {
             const headers = document.querySelectorAll('.customer-table th.sortable');
             
             // Clear previous sort indicators
             headers.forEach(header => {
                 header.classList.remove('sort-asc', 'sort-desc');
                 header.classList.add('sortable');
             });
             
             // Determine sort direction
             if (currentSort.field === field) {
                 currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
             } else {
                 currentSort.field = field;
                 currentSort.direction = 'asc';
             }
             
             // Add sort indicator to current header
             const currentHeader = document.querySelector(`th[onclick="sortTable('${field}')"]`);
             currentHeader.classList.remove('sortable');
             currentHeader.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
             
             // Sort customers array
             customers.sort((a, b) => {
                 let aVal = a[field] || '';
                 let bVal = b[field] || '';
                 
                 // Convert to lowercase for string comparison
                 if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                 if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                 
                 if (currentSort.direction === 'asc') {
                     return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                 } else {
                     return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                 }
             });
             
             // Re-render the table
             renderCustomers();
         }

         // Filter table
          function filterTable() {
              const searchTerm = document.getElementById('searchInput').value.toLowerCase();
              const statusFilter = document.getElementById('statusFilter').value;
              const nsiFilter = document.getElementById('nsiFilter').value;
              const rows = document.querySelectorAll('#customerTableBody tr');
              const mobileCards = document.querySelectorAll('.customer-card');

              // Filter desktop table
              rows.forEach(row => {
                  const text = row.textContent.toLowerCase();
                  const onclickAttr = row.querySelector('button[onclick*="editCustomer"]').getAttribute('onclick');
                  const customerId = onclickAttr.match(/editCustomer\(([^)]+)\)/)[1].replace(/['"]/g, '');
                  const customer = customers.find(c => String(c.id) === String(customerId));
                  
                  if (!customer) return;
                  
                  const overallStatus = getOverallStatus(customer);
                  const status = overallStatus.includes('Overdue') ? 'overdue' : 
                               (overallStatus.includes('Due this month') || overallStatus.includes('Due last month')) ? 'due-soon' : 'current';
                  const nsiStatus = customer.nsi_status || 'NSI';
                  
                  const matchesSearch = text.includes(searchTerm);
                  const matchesStatus = !statusFilter || status === statusFilter;
                  const matchesNsi = !nsiFilter || nsiStatus === nsiFilter;
                  
                  row.style.display = matchesSearch && matchesStatus && matchesNsi ? '' : 'none';
              });

              // Filter mobile cards
              mobileCards.forEach(card => {
                  const text = card.textContent.toLowerCase();
                  const editButton = card.querySelector('button[onclick*="editCustomer"]');
                  if (!editButton) return;

                  const onclickAttr = editButton.getAttribute('onclick');
                  const customerId = onclickAttr.match(/editCustomer\(([^)]+)\)/)[1].replace(/['"]/g, '');
                  const customer = customers.find(c => String(c.id) === String(customerId));

                  if (!customer) return;
                  
                  const overallStatus = getOverallStatus(customer);
                  const status = overallStatus.includes('Overdue') ? 'overdue' : 
                               (overallStatus.includes('Due this month') || overallStatus.includes('Due last month')) ? 'due-soon' : 'current';
                  const nsiStatus = customer.nsi_status || 'NSI';
                  
                  const matchesSearch = text.includes(searchTerm);
                  const matchesStatus = !statusFilter || status === statusFilter;
                  const matchesNsi = !nsiFilter || nsiStatus === nsiFilter;
                  
                  card.style.display = matchesSearch && matchesStatus && matchesNsi ? '' : 'none';
              });
          }

        // Export data
        function exportData() {
            const dataStr = JSON.stringify(customers, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'maintenance_customers_backup.json';
            link.click();
            
            showMessage('Customer data exported successfully!', 'success');
        }

        // Import data
        function importData(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (Array.isArray(importedData)) {
                        if (confirm('This will REPLACE all existing data with fresh data. Continue?')) {
                            showLoading(true);
                            
                                                         try {
                                 // First, delete all existing data
                                 const { error: deleteError } = await supabase
                                     .from(TABLE_NAME)
                                     .delete()
                                     .not('id', 'is', null);
                                 
                                 if (deleteError) {
                                     console.error('Delete error:', deleteError);
                                     const { error: deleteAllError } = await supabase
                                         .from(TABLE_NAME)
                                         .delete();
                                     if (deleteAllError) throw deleteAllError;
                                 }
                                 
                                 // Then insert the new data with generated IDs
                                 const dataWithIds = importedData.map((customer, index) => ({
                                     ...customer,
                                     id: Date.now() + index // Generate unique IDs
                                 }));
                                 
                                 const { error: insertError } = await supabase
                                     .from(TABLE_NAME)
                                     .insert(dataWithIds);
                                 
                                 if (insertError) throw insertError;
                                
                                // Reload data from Supabase
                                await loadCustomerData();
                                showMessage('Data imported successfully!', 'success');
                            } catch (error) {
                                console.error('Error importing data:', error);
                                showMessage('Error importing data: ' + error.message, 'error');
                            } finally {
                                showLoading(false);
                            }
                        }
                    } else {
                        showMessage('Invalid file format. Please select a valid JSON file.', 'error');
                    }
                } catch (error) {
                    showMessage('Error reading file: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
            input.value = '';
        }

        // ===== SCAFFOLD SYSTEM FUNCTIONS =====

        // Load scaffold system data
        async function loadScaffoldData() {
            showScaffoldLoading(true);
            try {
                const { data, error } = await supabase
                    .from(SCAFF_TABLE_NAME)
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw error;
                }

                // Convert database fields to match frontend structure
                scaffSystems = data ? data.map(system => ({
                    id: system.id,
                    pNumber: system.p_number,
                    extraSensors: system.extra_sensors,
                    siteContact: system.site_contact,
                    address1: system.address1 || '',
                    address2: system.address2 || '',
                    postcode: system.postcode || '',
                    sitePhone: system.site_phone,
                    appContact: system.app_contact,
                    appPhone: system.app_phone,
                    arcEnabled: system.arc_enabled,
                    arcContact: system.arc_contact,
                    arcPhone: system.arc_phone,
                    startDate: system.start_date,
                    lastInvoiceDate: system.last_invoice_date,
                    hireStatus: system.hire_status || 'on-hire'
                })) : [];

                console.log('📊 LOADED SCAFFOLD SYSTEMS:', scaffSystems.length);
                console.log('📋 P NUMBERS:', scaffSystems.map(s => `${s.pNumber} (${s.hireStatus})`).join(', '));
                console.log('🔢 First 10:', scaffSystems.slice(0, 10));

                showScaffoldMessage('Scaffold data loaded successfully!', 'success');
                
                // Store data in localStorage for offline access
                localStorage.setItem('scaffoldSystems', JSON.stringify(scaffSystems));
                
            } catch (error) {
                console.error('Error loading scaffold data:', error);
                
                // Try to load from localStorage if online loading fails
                const cachedData = localStorage.getItem('scaffoldSystems');
                if (cachedData) {
                    scaffSystems = JSON.parse(cachedData);
                    showScaffoldMessage('Loaded cached scaffold data (offline mode)', 'warning');
                } else {
                    scaffSystems = [];
                    showScaffoldMessage('Error loading scaffold data: ' + error.message, 'error');
                }
            }
            
            showScaffoldLoading(false);
            renderScaffoldSystems();
            updateScaffoldStats();
        }

        // Show/hide scaffold loading
        function showScaffoldLoading(show = true) {
            const loadingEl = document.getElementById('scaffLoading');
            if (loadingEl) {
                loadingEl.style.display = show ? 'block' : 'none';
            }
        }

        // Show scaffold messages
        function showScaffoldMessage(message, type = 'success') {
            const successEl = document.getElementById('scaffSuccessMessage');
            const errorEl = document.getElementById('scaffErrorMessage');
            
            if (successEl) successEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
            
            if (type === 'success' && successEl) {
                successEl.textContent = message;
                successEl.style.display = 'block';
                setTimeout(() => successEl.style.display = 'none', 3000);
            } else if (errorEl) {
                errorEl.textContent = message;
                errorEl.style.display = 'block';
                setTimeout(() => errorEl.style.display = 'none', 5000);
            }
        }

        // Calculate scaffold costs
        function calculateWeeklyCostBeforeVAT(extraSensors) {
            return STANDARD_WEEKLY_COST + (extraSensors * EXTRA_SENSOR_WEEKLY_COST);
        }

        function calculateMonthlyCostBeforeVAT(extraSensors) {
            return calculateWeeklyCostBeforeVAT(extraSensors) * 4;
        }

        function calculateWeeklyCost(extraSensors) {
            const baseCost = STANDARD_WEEKLY_COST + (extraSensors * EXTRA_SENSOR_WEEKLY_COST);
            const withVAT = baseCost * (1 + VAT_RATE);
            return withVAT;
        }

        function calculateMonthlyCost(extraSensors) {
            return calculateWeeklyCost(extraSensors) * 4;
        }

        // Get next invoice date
        function getNextInvoiceDate(lastInvoiceDate) {
            const lastDate = new Date(lastInvoiceDate);
            lastDate.setDate(lastDate.getDate() + 28); // 4 weeks
            return lastDate;
        }

        // Get days until invoice
        function getDaysUntilInvoice(lastInvoiceDate) {
            const nextInvoice = getNextInvoiceDate(lastInvoiceDate);
            const today = new Date();
            const diffTime = nextInvoice - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }

        // Get invoice status
        function getInvoiceStatus(daysUntil) {
            if (daysUntil < 0) return { status: 'overdue', class: 'overdue' };
            if (daysUntil <= 3) return { status: 'due-soon', class: 'due-soon' };
            return { status: 'current', class: 'current' };
        }

        // ===== RENTAL HISTORY FUNCTIONS =====

        // Create a new rental history record when system goes on hire
        async function createRentalHistory(system) {
            try {
                const rentalData = {
                    system_id: system.id,
                    p_number: system.pNumber,
                    hire_date: new Date().toISOString(),
                    customer_name: system.siteContact,
                    site_address: [system.address1, system.address2, system.postcode].filter(Boolean).join(', '),
                    site_contact: system.siteContact,
                    site_phone: system.sitePhone,
                    extra_sensors: system.extraSensors || 0,
                    arc_enabled: system.arcEnabled || false,
                    arc_contact: system.arcContact || '',
                    arc_phone: system.arcPhone || '',
                    app_contact: system.appContact,
                    app_phone: system.appPhone,
                    invoices: []
                };

                const { data, error } = await supabase
                    .from('scaffold_rental_history')
                    .insert([rentalData])
                    .select();

                if (error) throw error;

                return data[0];
            } catch (error) {
                console.error('Error creating rental history:', error);
                throw error;
            }
        }

        // Close rental history when system goes off hire
        async function closeRentalHistory(systemId, offHireDate = null) {
            try {
                // Find the active rental (one without off_hire_date)
                const { data: activeRentals, error: findError } = await supabase
                    .from('scaffold_rental_history')
                    .select('*')
                    .eq('system_id', systemId)
                    .is('off_hire_date', null)
                    .order('hire_date', { ascending: false })
                    .limit(1);

                if (findError) throw findError;

                if (activeRentals && activeRentals.length > 0) {
                    const { error: updateError } = await supabase
                        .from('scaffold_rental_history')
                        .update({
                            off_hire_date: offHireDate || new Date().toISOString()
                        })
                        .eq('id', activeRentals[0].id);

                    if (updateError) throw updateError;

                    return activeRentals[0];
                }

                return null;
            } catch (error) {
                console.error('Error closing rental history:', error);
                throw error;
            }
        }

        // Load rental history for a system
        async function loadRentalHistory(systemId) {
            try {
                const { data, error } = await supabase
                    .from('scaffold_rental_history')
                    .select('*')
                    .eq('system_id', systemId)
                    .order('hire_date', { ascending: false });

                if (error) throw error;

                return data || [];
            } catch (error) {
                console.error('Error loading rental history:', error);
                return [];
            }
        }

        // Add invoice to current rental history
        async function addInvoiceToRentalHistory(systemId, invoiceData) {
            try {
                // Find the active rental
                const { data: activeRentals, error: findError } = await supabase
                    .from('scaffold_rental_history')
                    .select('*')
                    .eq('system_id', systemId)
                    .is('off_hire_date', null)
                    .order('hire_date', { ascending: false })
                    .limit(1);

                if (findError) throw findError;

                if (activeRentals && activeRentals.length > 0) {
                    const rental = activeRentals[0];
                    const currentInvoices = rental.invoices || [];
                    const updatedInvoices = [...currentInvoices, invoiceData];

                    const { error: updateError } = await supabase
                        .from('scaffold_rental_history')
                        .update({ invoices: updatedInvoices })
                        .eq('id', rental.id);

                    if (updateError) throw updateError;

                    return true;
                }

                return false;
            } catch (error) {
                console.error('Error adding invoice to rental history:', error);
                return false;
            }
        }

        // Open scaffold add modal
        function openScaffAddModal() {
            console.log('Opening scaffold add modal');
            editingScaffId = null;
            document.getElementById('scaffModalTitle').textContent = 'Add Scaffold System';
            document.getElementById('scaffForm').reset();

            // Set default dates
            document.getElementById('scaffStartDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('scaffLastInvoiceDate').value = new Date().toISOString().split('T')[0];

            // Update cost preview
            updateScaffoldCostPreview();

            // Hide ARC fields initially
            document.getElementById('scaffArcFields').style.display = 'none';

            document.getElementById('scaffModal').style.display = 'block';
        }

        // Make function globally accessible
        window.openScaffAddModal = openScaffAddModal;

        // Close scaffold modal
        function closeScaffModal() {
            console.log('Closing scaffold modal');
            const modal = document.getElementById('scaffModal');
            if (modal) {
                modal.style.display = 'none';
            }
            editingScaffId = null;
            // Reset form
            const form = document.getElementById('scaffForm');
            if (form) {
                form.reset();
            }
        }

        // Make sure function is globally accessible
        window.closeScaffModal = closeScaffModal;

        // Update scaffold cost preview
        function updateScaffoldCostPreview() {
            const extraSensors = parseInt(document.getElementById('scaffExtraSensors').value) || 0;
            const weeklyCost = calculateWeeklyCostBeforeVAT(extraSensors);
            const monthlyCost = calculateMonthlyCostBeforeVAT(extraSensors);
            
            document.getElementById('scaffWeeklyCostPreview').textContent = `£${weeklyCost.toFixed(2)}`;
            document.getElementById('scaffMonthlyCostPreview').textContent = `£${monthlyCost.toFixed(2)}`;
        }


        // Show scaffold form (simplified modal)
        async function showScaffoldForm(system = null) {
            const isEdit = system !== null;
            const pNumber = isEdit ? system.pNumber : '';
            const extraSensors = isEdit ? system.extraSensors : 0;
            const siteContact = isEdit ? system.siteContact : '';
            const sitePhone = isEdit ? system.sitePhone : '';
            const appContact = isEdit ? system.appContact : '';
            const appPhone = isEdit ? system.appPhone : '';
            const arcEnabled = isEdit ? system.arcEnabled : false;
            const arcContact = isEdit ? system.arcContact : '';
            const arcPhone = isEdit ? system.arcPhone : '';
            const startDate = isEdit ? system.startDate : new Date().toISOString().split('T')[0];
            const lastInvoiceDate = isEdit ? system.lastInvoiceDate : new Date().toISOString().split('T')[0];

            const formData = prompt(
                `${isEdit ? 'Edit' : 'Add'} Scaffold System\n\n` +
                `Format: pNumber,extraSensors,siteContact,sitePhone,appContact,appPhone,arcEnabled(true/false),arcContact,arcPhone,startDate,lastInvoiceDate\n\n` +
                `Current: ${pNumber},${extraSensors},${siteContact},${sitePhone},${appContact},${appPhone},${arcEnabled},${arcContact},${arcPhone},${startDate},${lastInvoiceDate}`
            );

            if (formData) {
                const parts = formData.split(',');
                if (parts.length >= 11) {
                    try {
                        const systemData = {
                            p_number: parts[0].trim(),
                            extra_sensors: parseInt(parts[1].trim()) || 0,
                            site_contact: parts[2].trim(),
                            site_phone: parts[3].trim(),
                            app_contact: parts[4].trim(),
                            app_phone: parts[5].trim(),
                            arc_enabled: parts[6].trim().toLowerCase() === 'true',
                            arc_contact: parts[7].trim(),
                            arc_phone: parts[8].trim(),
                            start_date: parts[9].trim(),
                            last_invoice_date: parts[10].trim()
                        };

                        if (isEdit) {
                            // Update existing system
                            const { error } = await supabase
                                .from(SCAFF_TABLE_NAME)
                                .update(systemData)
                                .eq('id', system.id);

                            if (error) throw error;
                            showScaffoldMessage('Scaffold system updated successfully!', 'success');
                        } else {
                            // Add new system
                            const newSystemData = {
                                id: Date.now(),
                                ...systemData
                            };

                            const { error } = await supabase
                                .from(SCAFF_TABLE_NAME)
                                .insert([newSystemData]);

                            if (error) throw error;
                            showScaffoldMessage('Scaffold system added successfully!', 'success');
                        }

                        await loadScaffoldData(); // Reload data from Supabase
                    } catch (error) {
                        console.error('Error saving scaffold system:', error);
                        showScaffoldMessage('Error saving scaffold system: ' + error.message, 'error');
                    }
                }
            }
        }

        // Edit scaffold system
        function editScaffoldSystem(id) {
            console.log('Editing scaffold system:', id);
            const system = scaffSystems.find(s => s.id === id);
            if (!system) {
                console.error('Scaffold system not found with ID:', id);
                return;
            }

            editingScaffId = id;
            document.getElementById('scaffModalTitle').textContent = 'Edit Scaffold System';

            // Populate form with system data
            document.getElementById('scaffPNumber').value = system.pNumber;
            document.getElementById('scaffExtraSensors').value = system.extraSensors;
            document.getElementById('scaffSiteContact').value = system.siteContact;
            document.getElementById('scaffAddress1').value = system.address1 || '';
            document.getElementById('scaffAddress2').value = system.address2 || '';
            document.getElementById('scaffPostcode').value = system.postcode || '';
            document.getElementById('scaffSitePhone').value = system.sitePhone;
            document.getElementById('scaffAppContact').value = system.appContact;
            document.getElementById('scaffAppPhone').value = system.appPhone;
            document.getElementById('scaffArcEnabled').checked = system.arcEnabled;
            document.getElementById('scaffArcContact').value = system.arcContact;
            document.getElementById('scaffArcPhone').value = system.arcPhone;
            document.getElementById('scaffStartDate').value = system.startDate;
            document.getElementById('scaffLastInvoiceDate').value = system.lastInvoiceDate;
            document.getElementById('scaffHireStatus').value = system.hireStatus || 'on-hire';

            // Update cost preview
            updateScaffoldCostPreview();

            // Show/hide ARC fields based on checkbox
            document.getElementById('scaffArcFields').style.display = system.arcEnabled ? 'block' : 'none';

            document.getElementById('scaffModal').style.display = 'block';
        }

        // Make function globally accessible
        window.editScaffoldSystem = editScaffoldSystem;

        // Delete scaffold system
        async function deleteScaffoldSystem(id) {
            console.log('Deleting scaffold system:', id);
            if (confirm('Are you sure you want to delete this scaffold system?')) {
                try {
                    const { error } = await supabase
                        .from(SCAFF_TABLE_NAME)
                        .delete()
                        .eq('id', id);

                    if (error) throw error;

                    showScaffoldMessage('Scaffold system deleted successfully!', 'success');
                    await loadScaffoldData(); // Reload data from Supabase
                } catch (error) {
                    console.error('Error deleting scaffold system:', error);
                    showScaffoldMessage('Error deleting scaffold system: ' + error.message, 'error');
                }
            }
        }

        // Make function globally accessible
        window.deleteScaffoldSystem = deleteScaffoldSystem;

        // ===== OFF HIRE / ON HIRE WORKFLOW =====

        let currentOffHireSystemId = null;
        let currentOnHireSystemId = null;

        // Smart change hire status handler - detects current status and shows appropriate modal
        function changeHireStatus(systemId) {
            const system = scaffSystems.find(s => s.id === systemId);
            if (!system) return;

            if (system.hireStatus === 'on-hire') {
                showOffHireModal(systemId);
            } else {
                showOnHireModal(systemId);
            }
        }

        window.changeHireStatus = changeHireStatus;

        // Show off-hire modal
        function showOffHireModal(systemId) {
            const system = scaffSystems.find(s => s.id === systemId);
            if (!system) return;

            currentOffHireSystemId = systemId;
            document.getElementById('offHirePNumber').textContent = system.pNumber;
            document.getElementById('offHireDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('offHireModal').style.display = 'block';
        }

        window.showOffHireModal = showOffHireModal;

        // Close off-hire modal
        function closeOffHireModal() {
            document.getElementById('offHireModal').style.display = 'none';
            currentOffHireSystemId = null;
        }

        window.closeOffHireModal = closeOffHireModal;

        // Confirm off-hire
        async function confirmOffHire() {
            if (!currentOffHireSystemId) return;

            const offHireDate = document.getElementById('offHireDate').value;
            if (!offHireDate) {
                alert('Please select an off-hire date');
                return;
            }

            try {
                showScaffoldLoading(true);

                const system = scaffSystems.find(s => s.id === currentOffHireSystemId);
                if (!system) throw new Error('System not found');

                // Try to close the current rental history
                const closedRental = await closeRentalHistory(currentOffHireSystemId, offHireDate);

                // If no active rental was found, create one first then close it
                // This handles systems that existed before the history feature
                if (!closedRental) {
                    console.log('No active rental found, creating historical record...');

                    // Create a historical rental record
                    const historicalRental = {
                        system_id: system.id,
                        p_number: system.pNumber,
                        hire_date: system.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago if no start date
                        off_hire_date: offHireDate,
                        customer_name: system.siteContact || 'Previous Customer',
                        site_address: [system.address1, system.address2, system.postcode].filter(Boolean).join(', ') || 'Address not recorded',
                        site_contact: system.siteContact,
                        site_phone: system.sitePhone,
                        extra_sensors: system.extraSensors || 0,
                        arc_enabled: system.arcEnabled || false,
                        arc_contact: system.arcContact || '',
                        arc_phone: system.arcPhone || '',
                        app_contact: system.appContact,
                        app_phone: system.appPhone,
                        invoices: []
                    };

                    const { error: historyError } = await supabase
                        .from('scaffold_rental_history')
                        .insert([historicalRental]);

                    if (historyError) throw historyError;
                }

                // Update the system status
                const { error } = await supabase
                    .from(SCAFF_TABLE_NAME)
                    .update({
                        hire_status: 'off-hire',
                        address1: 'In Stock',
                        address2: '',
                        postcode: ''
                    })
                    .eq('id', currentOffHireSystemId);

                if (error) throw error;

                showScaffoldMessage('System marked as off-hire and saved to history!', 'success');
                closeOffHireModal();
                await loadScaffoldData();
            } catch (error) {
                console.error('Error during off-hire:', error);
                showScaffoldMessage('Error during off-hire: ' + error.message, 'error');
            } finally {
                showScaffoldLoading(false);
            }
        }

        window.confirmOffHire = confirmOffHire;

        // Show on-hire modal
        function showOnHireModal(systemId) {
            const system = scaffSystems.find(s => s.id === systemId);
            if (!system) return;

            currentOnHireSystemId = systemId;
            document.getElementById('onHirePNumber').textContent = system.pNumber;
            document.getElementById('onHireDate').value = new Date().toISOString().split('T')[0];

            // Clear form
            document.getElementById('onHireForm').reset();
            document.getElementById('onHireDate').value = new Date().toISOString().split('T')[0];

            document.getElementById('onHireModal').style.display = 'block';
        }

        window.showOnHireModal = showOnHireModal;

        // Close on-hire modal
        function closeOnHireModal() {
            document.getElementById('onHireModal').style.display = 'none';
            currentOnHireSystemId = null;
        }

        window.closeOnHireModal = closeOnHireModal;

        // Handle on-hire form submission
        document.addEventListener('DOMContentLoaded', function() {
            const onHireForm = document.getElementById('onHireForm');
            if (onHireForm) {
                onHireForm.addEventListener('submit', async function(e) {
                    e.preventDefault();

                    if (!currentOnHireSystemId) return;

                    const system = scaffSystems.find(s => s.id === currentOnHireSystemId);
                    if (!system) return;

                    const hireDate = document.getElementById('onHireDate').value;
                    const customerName = document.getElementById('onHireCustomer').value;
                    const address1 = document.getElementById('onHireAddress1').value;
                    const address2 = document.getElementById('onHireAddress2').value;
                    const postcode = document.getElementById('onHirePostcode').value;
                    const siteContact = document.getElementById('onHireSiteContact').value;
                    const sitePhone = document.getElementById('onHireSitePhone').value;

                    try {
                        showScaffoldLoading(true);

                        // Update system with new customer info and status
                        const { error: updateError } = await supabase
                            .from(SCAFF_TABLE_NAME)
                            .update({
                                hire_status: 'on-hire',
                                site_contact: customerName,
                                address1: address1,
                                address2: address2,
                                postcode: postcode,
                                site_phone: sitePhone || system.sitePhone,
                                start_date: hireDate,
                                last_invoice_date: hireDate
                            })
                            .eq('id', currentOnHireSystemId);

                        if (updateError) throw updateError;

                        // Reload to get updated data
                        await loadScaffoldData();

                        // Get the updated system
                        const updatedSystem = scaffSystems.find(s => s.id === currentOnHireSystemId);

                        // Create rental history record
                        await createRentalHistory(updatedSystem);

                        showScaffoldMessage('System marked as on-hire and rental history created!', 'success');
                        closeOnHireModal();
                        await loadScaffoldData();
                    } catch (error) {
                        console.error('Error during on-hire:', error);
                        showScaffoldMessage('Error during on-hire: ' + error.message, 'error');
                    } finally {
                        showScaffoldLoading(false);
                    }
                });
            }
        });

        // Show history modal
        async function showHistoryModal(systemId) {
            const system = scaffSystems.find(s => s.id === systemId);
            if (!system) return;

            document.getElementById('historyPNumber').textContent = system.pNumber;
            document.getElementById('historyModal').style.display = 'block';

            try {
                const history = await loadRentalHistory(systemId);
                const historyContent = document.getElementById('historyContent');

                if (history.length === 0) {
                    historyContent.innerHTML = '<p style="text-align: center; color: #95a5a6;">No rental history found for this system.</p>';
                    return;
                }

                historyContent.innerHTML = history.map((rental, index) => {
                    const isActive = !rental.off_hire_date;
                    const hireDate = new Date(rental.hire_date).toLocaleDateString();
                    const offHireDate = rental.off_hire_date ? new Date(rental.off_hire_date).toLocaleDateString() : null;
                    const duration = rental.off_hire_date ?
                        Math.ceil((new Date(rental.off_hire_date) - new Date(rental.hire_date)) / (1000 * 60 * 60 * 24)) :
                        Math.ceil((new Date() - new Date(rental.hire_date)) / (1000 * 60 * 60 * 24));

                    const invoices = rental.invoices || [];
                    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

                    return `
                        <div style="border: 2px solid ${isActive ? '#27ae60' : '#95a5a6'}; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: ${isActive ? '#eafaf1' : '#f8f9fa'};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3 style="margin: 0; color: ${isActive ? '#27ae60' : '#34495e'};">
                                    Rental #${history.length - index} ${isActive ? '(Current)' : '(Completed)'}
                                </h3>
                                ${isActive ? '<span style="background: #27ae60; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">ACTIVE</span>' : ''}
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                <div>
                                    <strong>Customer:</strong><br>
                                    ${rental.customer_name}
                                </div>
                                <div>
                                    <strong>Location:</strong><br>
                                    ${rental.site_address}
                                </div>
                                <div>
                                    <strong>Contact:</strong><br>
                                    ${rental.site_contact || 'N/A'}<br>
                                    ${rental.site_phone || ''}
                                </div>
                                <div>
                                    <strong>Duration:</strong><br>
                                    ${duration} days
                                </div>
                            </div>

                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                                    <div>
                                        <strong>Hired:</strong> ${hireDate}
                                    </div>
                                    ${offHireDate ? `<div><strong>Off-Hired:</strong> ${offHireDate}</div>` : '<div><strong>Status:</strong> Still on hire</div>'}
                                    <div>
                                        <strong>Sensors:</strong> 4 + ${rental.extra_sensors}
                                    </div>
                                    <div>
                                        <strong>ARC:</strong> ${rental.arc_enabled ? '✓ Enabled' : '✗ Disabled'}
                                    </div>
                                </div>
                            </div>

                            ${invoices.length > 0 ? `
                                <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
                                    <strong>Invoices (${invoices.length}):</strong>
                                    <div style="margin-top: 10px;">
                                        ${invoices.map(inv => `
                                            <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
                                                <span>${new Date(inv.date).toLocaleDateString()}${inv.invoice_number ? ` - ${inv.invoice_number}` : ''}</span>
                                                <span style="font-weight: bold;">£${inv.amount.toFixed(2)}</span>
                                            </div>
                                        `).join('')}
                                        <div style="display: flex; justify-content: space-between; padding: 8px; font-weight: bold; background: #f8f9fa; margin-top: 5px;">
                                            <span>Total Revenue:</span>
                                            <span style="color: #27ae60;">£${totalRevenue.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ` : '<div style="margin-top: 10px; color: #95a5a6; font-style: italic;">No invoices recorded</div>'}
                        </div>
                    `;
                }).join('');

            } catch (error) {
                console.error('Error loading history:', error);
                document.getElementById('historyContent').innerHTML = '<p style="color: #e74c3c;">Error loading rental history.</p>';
            }
        }

        window.showHistoryModal = showHistoryModal;

        // Close history modal
        function closeHistoryModal() {
            document.getElementById('historyModal').style.display = 'none';
        }

        window.closeHistoryModal = closeHistoryModal;

        // ===== INVOICE TRACKING =====

        // Helper function to log an invoice to rental history
        // Call this when you generate invoices for scaffold systems
        async function logInvoiceToHistory(systemId, invoiceDate, amount, invoiceNumber = null) {
            try {
                const invoice = {
                    date: invoiceDate,
                    amount: parseFloat(amount),
                    invoice_number: invoiceNumber,
                    created_at: new Date().toISOString()
                };

                const success = await addInvoiceToRentalHistory(systemId, invoice);

                if (success) {
                    console.log(`Invoice logged to history for system ${systemId}`);
                    return true;
                } else {
                    console.warn(`No active rental found for system ${systemId}`);
                    return false;
                }
            } catch (error) {
                console.error('Error logging invoice to history:', error);
                return false;
            }
        }

        window.logInvoiceToHistory = logInvoiceToHistory;

        // Example usage when updating last invoice date:
        // When the user updates the lastInvoiceDate field, also log it to history
        // You can hook this into your existing invoice generation workflow

        // Render scaffold systems
        function renderScaffoldSystems() {
            const tbody = document.getElementById('scaffTableBody');
            const emptyState = document.getElementById('scaffEmptyState');
            const mobileCards = document.getElementById('mobileScaffCards');
            
            if (!tbody) return;
            
            if (scaffSystems.length === 0) {
                tbody.innerHTML = '';
                if (mobileCards) mobileCards.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
                document.getElementById('scaffTable').style.display = 'none';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';
            document.getElementById('scaffTable').style.display = 'table';

            // Render desktop table
            tbody.innerHTML = scaffSystems.map(system => {
                const daysUntilInvoice = getDaysUntilInvoice(system.lastInvoiceDate);
                const invoiceStatus = getInvoiceStatus(daysUntilInvoice);
                const nextInvoiceDate = getNextInvoiceDate(system.lastInvoiceDate);
                const weeklyCost = calculateWeeklyCostBeforeVAT(system.extraSensors);
                const monthlyCost = calculateMonthlyCostBeforeVAT(system.extraSensors);

                const rowBgColor = system.hireStatus === 'on-hire' ? '#d4edda' : '#f8d7da';

                return `
                    <tr style="background-color: ${rowBgColor};">
                        <td>
                            <strong>${system.pNumber}</strong>${system.address1 ? ` ${system.address1}` : ''}
                        </td>
                        <td>4 + ${system.extraSensors}</td>
                        <td>£${weeklyCost.toFixed(2)}</td>
                        <td>£${monthlyCost.toFixed(2)}</td>
                        <td>
                            <div style="font-size: 14px;">${nextInvoiceDate.toDateString()}</div>
                            <span class="status-badge ${invoiceStatus.class}">
                                ${daysUntilInvoice < 0 ? `${Math.abs(daysUntilInvoice)} days overdue` :
                                  daysUntilInvoice === 0 ? 'Due today' :
                                  `${daysUntilInvoice} days`}
                            </span>
                        </td>
                        <td>
                            <div style="font-size: 14px;">
                                <strong>${system.siteContact}</strong><br>
                                <span style="color: #666;">${system.sitePhone}</span>
                            </div>
                        </td>
                        <td>
                            <div style="font-size: 14px;">
                                <strong>${system.appContact}</strong><br>
                                <span style="color: #666;">${system.appPhone}</span>
                            </div>
                        </td>
                        <td>
                            ${system.arcEnabled ?
                                `<div style="font-size: 14px;"><span style="color: #27ae60;">✓ Enabled</span><br><span style="color: #666;">${system.arcContact}</span></div>` :
                                `<span style="color: #e74c3c;">✗ Disabled</span>`
                            }
                        </td>
                        <td>
                            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                <button class="btn" onclick="editScaffoldSystem(${system.id})" style="background: #3498db; color: white; padding: 8px; width: 32px;" title="Edit Scaffold System">✏️</button>
                                <button class="btn" onclick="changeHireStatus(${system.id})" style="background: #34495e; color: white; padding: 8px; font-size: 12px;" title="Change Hire Status">Change</button>
                                <button class="btn" onclick="showHistoryModal(${system.id})" style="background: #95a5a6; color: white; padding: 8px; width: 32px;" title="View History">📋</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Render mobile cards if container exists
            if (mobileCards) {
                mobileCards.innerHTML = scaffSystems.map(system => {
                    const daysUntilInvoice = getDaysUntilInvoice(system.lastInvoiceDate);
                    const invoiceStatus = getInvoiceStatus(daysUntilInvoice);
                    const nextInvoiceDate = getNextInvoiceDate(system.lastInvoiceDate);
                    const weeklyCost = calculateWeeklyCostBeforeVAT(system.extraSensors);
                    const monthlyCost = calculateMonthlyCostBeforeVAT(system.extraSensors);

                    const cardBgColor = system.hireStatus === 'on-hire' ? '#d4edda' : '#f8d7da';

                    return `
                        <div class="customer-card" style="background-color: ${cardBgColor};">
                            <div class="customer-card-header">
                                <div>
                                    <div class="customer-name">${system.pNumber}${system.address1 ? ` ${system.address1}` : ''}</div>
                                    <div class="customer-details">
                                        Sensors: 4 + ${system.extraSensors}<br>
                                        Weekly: £${weeklyCost.toFixed(2)}<br>
                                        Monthly: £${monthlyCost.toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <span class="status-badge ${invoiceStatus.class}">
                                        ${daysUntilInvoice < 0 ? `${Math.abs(daysUntilInvoice)} days overdue` :
                                          daysUntilInvoice === 0 ? 'Due today' :
                                          `${daysUntilInvoice} days`}
                                    </span>
                                </div>
                            </div>

                            <div style="margin: 10px 0;">
                                <div><strong>Next Invoice:</strong> ${nextInvoiceDate.toDateString()}</div>
                            </div>

                            ${(system.address1 || system.address2 || system.postcode) ? `
                                <div style="padding: 10px; background: #fff3cd; border-radius: 6px; margin: 10px 0; font-size: 14px;">
                                    <strong>📍 Address:</strong><br>
                                    ${system.address1 || ''}<br>
                                    ${system.address2 ? `${system.address2}<br>` : ''}
                                    ${system.postcode || ''}
                                </div>
                            ` : ''}

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                                <div style="padding: 10px; background: #e8f4fd; border-radius: 6px; font-size: 14px;">
                                    <strong>Site Contact:</strong><br>
                                    ${system.siteContact}<br>
                                    ${system.sitePhone}
                                </div>
                                <div style="padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 14px;">
                                    <strong>App Contact:</strong><br>
                                    ${system.appContact}<br>
                                    ${system.appPhone}
                                </div>
                            </div>

                            ${system.arcEnabled ? `
                                <div style="padding: 10px; background: #d4edda; border-radius: 6px; margin: 15px 0; font-size: 14px;">
                                    <strong>ARC: ✓ Enabled</strong><br>
                                    ${system.arcContact}<br>
                                    ${system.arcPhone}
                                </div>
                            ` : `
                                <div style="padding: 10px; background: #f8d7da; border-radius: 6px; margin: 15px 0; font-size: 14px;">
                                    <strong>ARC: ✗ Disabled</strong>
                                </div>
                            `}

                            <div class="customer-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn" onclick="editScaffoldSystem(${system.id})" style="background: #3498db; color: white; padding: 8px; width: 40px;" title="Edit Scaffold System">✏️</button>
                                <button class="btn" onclick="changeHireStatus(${system.id})" style="background: #34495e; color: white; padding: 8px; flex: 1;" title="Change Hire Status">Change</button>
                                <button class="btn" onclick="showHistoryModal(${system.id})" style="background: #95a5a6; color: white; padding: 8px; width: 40px;" title="View History">📋</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Apply filters after DOM has fully updated
            setTimeout(() => {
                filterScaffTable();
            }, 10);
        }

        // Update scaffold statistics
        function updateScaffoldStats() {
            const totalActiveSystems = scaffSystems.length;
            const totalWeeklyRevenue = scaffSystems.reduce((sum, sys) => sum + calculateWeeklyCostBeforeVAT(sys.extraSensors), 0);
            const overdueSystems = scaffSystems.filter(sys => getDaysUntilInvoice(sys.lastInvoiceDate) < 0).length;

            const elements = {
                totalScaffSystems: document.getElementById('totalScaffSystems'),
                weeklyRevenue: document.getElementById('weeklyRevenue'),
                monthlyRevenue: document.getElementById('monthlyRevenue'),
                overdueInvoices: document.getElementById('overdueInvoices')
            };

            if (elements.totalScaffSystems) elements.totalScaffSystems.textContent = totalActiveSystems;
            if (elements.weeklyRevenue) elements.weeklyRevenue.textContent = `£${totalWeeklyRevenue.toFixed(2)}`;
            if (elements.monthlyRevenue) elements.monthlyRevenue.textContent = `£${(totalWeeklyRevenue * 4).toFixed(2)}`;
            if (elements.overdueInvoices) elements.overdueInvoices.textContent = overdueSystems;
        }

        // Filter scaffold table
        function filterScaffTable() {
            const searchInput = document.getElementById('scaffSearchInput');
            const statusFilter = document.getElementById('scaffStatusFilter');
            const hireFilter = document.getElementById('scaffHireFilter');

            if (!searchInput || !statusFilter || !hireFilter) return;

            const searchInputValue = searchInput.value.toLowerCase();
            const hasTrailingSpace = searchInputValue.endsWith(' ');
            const searchTerm = searchInputValue.trim();  // Trim for processing
            const statusFilterValue = statusFilter.value;
            const hireFilterValue = hireFilter.value;
            const rows = document.querySelectorAll('#scaffTableBody tr');
            const mobileCards = document.querySelectorAll('#mobileScaffCards .customer-card');

            console.log('🔍 FILTER DEBUG - Search term:', searchTerm, 'Has trailing space:', hasTrailingSpace);

            // Filter desktop table
            rows.forEach((row, index) => {
                const text = row.textContent.toLowerCase();

                let matchesSearch;

                // If there's a trailing space after a P number, do EXACT match only
                if (hasTrailingSpace && searchTerm.match(/^p\d+$/i)) {
                    const firstCell = row.cells[0];
                    const rowPNumber = firstCell ? firstCell.textContent.trim().split(' ')[0].toLowerCase() : '';

                    // Try exact match with and without leading zero
                    const pNumberOnly = searchTerm.substring(1);
                    const paddedPNumber = 'p' + pNumberOnly.padStart(2, '0');

                    matchesSearch = (rowPNumber === searchTerm || rowPNumber === paddedPNumber);
                } else {
                    // Normal partial matching
                    matchesSearch = text.includes(searchTerm);

                    // If search term looks like a P number, also try with leading zero
                    if (searchTerm.match(/^p\d+$/i)) {
                        const pNumberOnly = searchTerm.substring(1);
                        const paddedPNumber = 'p' + pNumberOnly.padStart(2, '0');
                        matchesSearch = matchesSearch || text.includes(paddedPNumber);
                    }
                }
                
                // Get system status from the row
                let matchesStatus = true;
                if (statusFilterValue) {
                    const statusCell = row.cells[4]; // Next Invoice column
                    if (statusCell) {
                        const statusText = statusCell.textContent.toLowerCase();
                        if (statusFilterValue === 'overdue' && !statusText.includes('overdue')) {
                            matchesStatus = false;
                        } else if (statusFilterValue === 'due-soon' && !statusText.includes('due today') && !statusText.includes('1 days') && !statusText.includes('2 days') && !statusText.includes('3 days')) {
                            matchesStatus = false;
                        } else if (statusFilterValue === 'current' && (statusText.includes('overdue') || statusText.includes('due today') || statusText.includes('1 days') || statusText.includes('2 days') || statusText.includes('3 days'))) {
                            matchesStatus = false;
                        }
                    }
                }
                
                // Get hire status from row data
                let matchesHire = true;
                if (hireFilterValue) {
                    // Find the system by getting the ID from the edit button
                    const editButton = row.querySelector('button[onclick*="editScaffoldSystem"]');
                    if (editButton) {
                        const onclickAttr = editButton.getAttribute('onclick');
                        const systemId = onclickAttr.match(/editScaffoldSystem\(([^)]+)\)/)[1];
                        const system = scaffSystems.find(s => s.id == systemId);
                        if (system) {
                            const systemHireStatus = system.hireStatus || 'on-hire';
                            if (hireFilterValue !== systemHireStatus) {
                                matchesHire = false;
                            }
                        }
                    }
                }
                
                row.style.display = matchesSearch && matchesStatus && matchesHire ? '' : 'none';
            });

            // Filter mobile cards
            mobileCards.forEach(card => {
                const text = card.textContent.toLowerCase();

                let matchesSearch;

                // If there's a trailing space after a P number, do EXACT match only
                if (hasTrailingSpace && searchTerm.match(/^p\d+$/i)) {
                    // Extract P number from card
                    const cardNameDiv = card.querySelector('.customer-name');
                    const cardPNumber = cardNameDiv ? cardNameDiv.textContent.trim().split(' ')[0].toLowerCase() : '';

                    // Try exact match with and without leading zero
                    const pNumberOnly = searchTerm.substring(1);
                    const paddedPNumber = 'p' + pNumberOnly.padStart(2, '0');

                    matchesSearch = (cardPNumber === searchTerm || cardPNumber === paddedPNumber);
                } else {
                    // Normal partial matching
                    matchesSearch = text.includes(searchTerm);

                    // If search term looks like a P number, also try with leading zero
                    if (searchTerm.match(/^p\d+$/i)) {
                        const pNumberOnly = searchTerm.substring(1);
                        const paddedPNumber = 'p' + pNumberOnly.padStart(2, '0');
                        matchesSearch = matchesSearch || text.includes(paddedPNumber);
                    }
                }
                
                let matchesStatus = true;
                if (statusFilterValue) {
                    if (statusFilterValue === 'overdue' && !text.includes('overdue')) {
                        matchesStatus = false;
                    } else if (statusFilterValue === 'due-soon' && !text.includes('due today') && !text.includes('1 days') && !text.includes('2 days') && !text.includes('3 days')) {
                        matchesStatus = false;
                    } else if (statusFilterValue === 'current' && (text.includes('overdue') || text.includes('due today') || text.includes('1 days') || text.includes('2 days') || text.includes('3 days'))) {
                        matchesStatus = false;
                    }
                }
                
                // Get hire status from mobile card data
                let matchesHire = true;
                if (hireFilterValue) {
                    const editButton = card.querySelector('button[onclick*="editScaffoldSystem"]');
                    if (editButton) {
                        const onclickAttr = editButton.getAttribute('onclick');
                        const systemId = onclickAttr.match(/editScaffoldSystem\(([^)]+)\)/)[1];
                        const system = scaffSystems.find(s => s.id == systemId);
                        if (system) {
                            const systemHireStatus = system.hireStatus || 'on-hire';
                            if (hireFilterValue !== systemHireStatus) {
                                matchesHire = false;
                            }
                        }
                    }
                }
                
                card.style.display = matchesSearch && matchesStatus && matchesHire ? '' : 'none';
            });
        }

        // Sort scaffold table
        function sortScaffTable(field) {
            // Determine sort direction
            if (currentScaffSort.field === field) {
                currentScaffSort.direction = currentScaffSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentScaffSort.field = field;
                currentScaffSort.direction = 'asc';
            }
            
            // Sort scaffSystems array
            scaffSystems.sort((a, b) => {
                let aVal, bVal;
                
                switch (field) {
                    case 'pNumber':
                        aVal = a.pNumber || '';
                        bVal = b.pNumber || '';
                        break;
                    case 'sensors':
                        aVal = 4 + a.extraSensors;
                        bVal = 4 + b.extraSensors;
                        break;
                    case 'weeklyCost':
                        aVal = calculateWeeklyCostBeforeVAT(a.extraSensors);
                        bVal = calculateWeeklyCostBeforeVAT(b.extraSensors);
                        break;
                    case 'monthlyCost':
                        aVal = calculateMonthlyCostBeforeVAT(a.extraSensors);
                        bVal = calculateMonthlyCostBeforeVAT(b.extraSensors);
                        break;
                    case 'nextInvoice':
                        aVal = getNextInvoiceDate(a.lastInvoiceDate);
                        bVal = getNextInvoiceDate(b.lastInvoiceDate);
                        break;
                    case 'arcStatus':
                        aVal = a.arcEnabled ? 'enabled' : 'disabled';
                        bVal = b.arcEnabled ? 'enabled' : 'disabled';
                        break;
                    default:
                        aVal = a[field] || '';
                        bVal = b[field] || '';
                }
                
                // Convert to lowercase for string comparison
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                
                if (currentScaffSort.direction === 'asc') {
                    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                } else {
                    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                }
            });
            
            // Re-render the table
            renderScaffoldSystems();
        }

        // Export scaffold data
        function exportScaffData() {
            const dataStr = JSON.stringify(scaffSystems, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'scaffold_systems_backup.json';
            link.click();
            
            showScaffoldMessage('Scaffold data exported successfully!', 'success');
        }

        // Import scaffold data
        async function importScaffData(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (Array.isArray(importedData)) {
                        if (confirm('This will REPLACE all existing scaffold data. Continue?')) {
                            showScaffoldLoading(true);
                            
                            try {
                                // First, delete all existing data
                                const { error: deleteError } = await supabase
                                    .from(SCAFF_TABLE_NAME)
                                    .delete()
                                    .not('id', 'is', null);
                                
                                if (deleteError) {
                                    console.error('Delete error:', deleteError);
                                    // Try alternative delete method
                                    const { error: deleteAllError } = await supabase
                                        .from(SCAFF_TABLE_NAME)
                                        .delete();
                                    if (deleteAllError) throw deleteAllError;
                                }
                                
                                // Then insert the new data with converted field names
                                const dataWithConvertedFields = importedData.map((system, index) => ({
                                    id: Date.now() + index,
                                    p_number: system.pNumber || system.p_number,
                                    extra_sensors: system.extraSensors || system.extra_sensors || 0,
                                    site_contact: system.siteContact || system.site_contact,
                                    site_phone: system.sitePhone || system.site_phone,
                                    app_contact: system.appContact || system.app_contact,
                                    app_phone: system.appPhone || system.app_phone,
                                    arc_enabled: system.arcEnabled !== undefined ? system.arcEnabled : (system.arc_enabled || false),
                                    arc_contact: system.arcContact || system.arc_contact,
                                    arc_phone: system.arcPhone || system.arc_phone,
                                    start_date: system.startDate || system.start_date,
                                    last_invoice_date: system.lastInvoiceDate || system.last_invoice_date,
                                    hire_status: system.hireStatus || system.hire_status || 'on-hire'
                                }));
                                
                                const { error: insertError } = await supabase
                                    .from(SCAFF_TABLE_NAME)
                                    .insert(dataWithConvertedFields);
                                
                                if (insertError) throw insertError;
                               
                                // Reload data from Supabase
                                await loadScaffoldData();
                                showScaffoldMessage('Scaffold data imported successfully!', 'success');
                            } catch (error) {
                                console.error('Error importing scaffold data:', error);
                                showScaffoldMessage('Error importing scaffold data: ' + error.message, 'error');
                            } finally {
                                showScaffoldLoading(false);
                            }
                        }
                    } else {
                        showScaffoldMessage('Invalid file format. Please select a valid JSON file.', 'error');
                    }
                } catch (error) {
                    showScaffoldMessage('Error reading file: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
            input.value = '';
        }

        // ===== END SCAFFOLD SYSTEM FUNCTIONS =====

        // ===== NSI SYSTEM FUNCTIONS =====

        // NSI data variables
        let nsiComplaints = [];
        let nsiIdBadges = [];
        let nsiTestEquipment = [];
        let nsiFirstAid = [];
        let editingComplaintId = null;
        let editingIdBadgeId = null;
        let editingTestEquipId = null;
        let editingFirstAidId = null;

        // Image handling variables
        let currentImages = {
            complaint: [],
            badge: [],
            equipment: [],
            firstAid: []
        };

        // NSI sub-page navigation
        function showNsiSubPage(subPageName) {
            try {
                // Hide all sub-content
                const subContents = document.querySelectorAll('.nsi-sub-content');
                subContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Remove active class from all sub-buttons
                const subButtons = document.querySelectorAll('.nsi-sub-button');
                subButtons.forEach(button => {
                    button.classList.remove('active');
                });
                
                // Show selected sub-content
                const selectedContent = document.getElementById(subPageName + 'SubPage');
                if (selectedContent) {
                    selectedContent.classList.add('active');
                } else {
                    console.error('Sub-page not found:', subPageName + 'SubPage');
                    return;
                }
                
                // Add active class to clicked button
                const selectedButton = document.querySelector(`[onclick="showNsiSubPage('${subPageName}')"]`);
                if (selectedButton) {
                    selectedButton.classList.add('active');
                }

                // Load data for the selected sub-page with delay on mobile
                const loadDelay = isMobileDevice() ? 150 : 0;
                setTimeout(function() {
                    switch(subPageName) {
                        case 'complaints':
                            loadComplaintData();
                            break;
                        case 'id-badge':
                            loadIdBadgeData();
                            break;
                        case 'test-equip':
                            loadTestEquipmentData();
                            break;
                        case 'first-aid':
                            loadFirstAidData();
                            break;
                        default:
                            console.error('Unknown sub-page:', subPageName);
                    }
                }, loadDelay);
            } catch (error) {
                console.error('Error in showNsiSubPage:', error);
                showNsiMessage('Error loading page: ' + error.message, 'error');
            }
        }

        // ===== COMPLAINTS FUNCTIONS =====

        // Load customers into dropdown
        async function loadCustomersIntoDropdown() {
            try {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select('id, name')
                    .order('name', { ascending: true });

                if (error) {
                    console.error('Error loading customers:', error);
                    return;
                }

                const customerSelect = document.getElementById('complaintCustomer');
                if (customerSelect) {
                    // Clear existing options except the first one
                    customerSelect.innerHTML = '<option value="">Select a customer...</option>';
                    
                    // Add customer options
                    data.forEach(customer => {
                        const option = document.createElement('option');
                        option.value = customer.name;
                        option.textContent = customer.name;
                        customerSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error loading customers:', error);
            }
        }

        // Load complaint data with race condition prevention
        let isLoadingComplaints = false;
        async function loadComplaintData() {
            // Prevent multiple simultaneous loading attempts
            if (isLoadingComplaints) {
                console.log('Complaint loading already in progress, skipping...');
                return;
            }
            
            isLoadingComplaints = true;
            
            try {
                // Add loading indicator
                const loadingElement = document.getElementById('loading');
                if (loadingElement) {
                    loadingElement.style.display = 'block';
                }

                // Add small delay on mobile to prevent race conditions
                if (isMobileDevice()) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const { data, error } = await supabase
                    .from(NSI_COMPLAINTS_TABLE)
                    .select('*')
                    .order('date', { ascending: false });

                if (error) {
                    console.error('Error loading complaints:', error);
                    showNsiMessage('Error loading complaints: ' + error.message, 'error');
                    return;
                }

                nsiComplaints = data || [];
                
                // Ensure DOM is ready before rendering
                setTimeout(() => {
                    renderComplaintTable();
                }, 10);
                
            } catch (error) {
                console.error('Error loading complaints:', error);
                showNsiMessage('Error loading complaints: ' + (error.message || 'Unknown error'), 'error');
            } finally {
                // Hide loading indicator
                const loadingElement = document.getElementById('loading');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                isLoadingComplaints = false;
            }
        }

        // Render complaint table with better error handling
        function renderComplaintTable() {
            try {
                const tableBody = document.getElementById('complaintTableBody');
                const emptyState = document.getElementById('complaintEmptyState');
                const mobileCards = document.getElementById('mobileComplaintCards');
                
                console.log('Rendering complaint table, data count:', nsiComplaints.length);
                console.log('Mobile cards element found:', !!mobileCards);
                console.log('Is mobile device:', isMobileDevice());
                
                // Ensure we have valid elements
                if (!tableBody || !emptyState) {
                    console.error('Required DOM elements not found for complaint table');
                    return;
                }
                
                if (!nsiComplaints || nsiComplaints.length === 0) {
                    tableBody.innerHTML = '';
                    if (mobileCards) mobileCards.innerHTML = '';
                    emptyState.style.display = 'block';
                    return;
                }
                
                emptyState.style.display = 'none';
                
                // Render desktop table with safe data handling
                tableBody.innerHTML = nsiComplaints.map(complaint => {
                    // Ensure complaint object has all required properties
                    const safeComplaint = {
                        id: complaint.id || '',
                        date: complaint.date || '',
                        reference: complaint.reference || 'N/A',
                        customer: complaint.customer || 'N/A',
                        type: complaint.type || 'N/A',
                        description: complaint.description || 'N/A',
                        status: complaint.status || 'open',
                        assigned_to: complaint.assigned_to || '',
                        images: complaint.images || ''
                    };
                    
                    return `
                        <tr>
                            <td>${formatDate(safeComplaint.date)}</td>
                            <td>${safeComplaint.reference}</td>
                            <td>${safeComplaint.customer}</td>
                            <td>${safeComplaint.type}</td>
                            <td>${safeComplaint.description}</td>
                            <td><span class="status-badge status-${safeComplaint.status}">${safeComplaint.status}</span></td>
                            <td>${safeComplaint.assigned_to || '-'}</td>
                            <td>${renderImageThumbnails(parseImagesFromBase64(safeComplaint.images))}</td>
                            <td>
                                <button class="btn btn-warning" onclick="editComplaint(${safeComplaint.id})" style="padding: 6px; width: 28px; margin-right: 5px;" title="Edit Complaint">✏️</button>
                                <button class="btn btn-danger" onclick="deleteComplaint(${safeComplaint.id})" style="padding: 6px; width: 28px;" title="Delete Complaint">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Render mobile cards with safe data handling
                if (mobileCards) {
                    mobileCards.innerHTML = nsiComplaints.map(complaint => {
                        // Ensure complaint object has all required properties for mobile cards
                        const safeComplaint = {
                            id: complaint.id || '',
                            reference: complaint.reference || 'N/A',
                            customer: complaint.customer || 'N/A',
                            type: complaint.type || 'N/A',
                            date: complaint.date || '',
                            status: complaint.status || 'open',
                            assigned_to: complaint.assigned_to || '',
                            description: complaint.description || 'No description',
                            images: complaint.images || ''
                        };
                        
                        return `
                            <div class="customer-card">
                                <div class="customer-card-header">
                                    <div>
                                        <div class="customer-name">Ref: ${safeComplaint.reference}</div>
                                        <div class="customer-details">
                                            <div class="nsi-info-line"><strong>Customer:</strong> ${safeComplaint.customer}</div>
                                            <div class="nsi-info-line"><strong>Type:</strong> ${safeComplaint.type}</div>
                                            <div class="nsi-info-line"><strong>Date:</strong> ${formatDate(safeComplaint.date)}</div>
                                            <div class="nsi-info-line"><strong>Status:</strong> <span class="status-badge status-${safeComplaint.status}">${safeComplaint.status}</span></div>
                                            ${safeComplaint.assigned_to ? `<div class="nsi-info-line"><strong>Assigned To:</strong> ${safeComplaint.assigned_to}</div>` : ''}
                                            <div class="nsi-info-line"><strong>Description:</strong> ${safeComplaint.description}</div>
                                        </div>
                                    </div>
                                </div>
                                ${parseImagesFromBase64(safeComplaint.images).length > 0 ? `
                                    <div style="margin: 10px 0;">
                                        <strong>Images:</strong><br>
                                        ${renderImageThumbnails(parseImagesFromBase64(safeComplaint.images))}
                                    </div>
                                ` : ''}
                                <div class="customer-actions">
                                    <button class="btn btn-warning" onclick="editComplaint(${safeComplaint.id})" style="padding: 8px; width: 32px; margin-right: 5px;" title="Edit Complaint">✏️</button>
                                    <button class="btn btn-danger" onclick="deleteComplaint(${safeComplaint.id})" style="padding: 8px; width: 32px;" title="Delete Complaint">🗑️</button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
                
            } catch (error) {
                console.error('Error rendering complaint table:', error);
                showNsiMessage('Error displaying complaints: ' + (error.message || 'Unknown error'), 'error');
                
                // Show empty state as fallback
                const emptyState = document.getElementById('complaintEmptyState');
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
            }
        }

        // Open complaint modal
        async function openComplaintModal() {
            editingComplaintId = null;
            document.getElementById('complaintModalTitle').textContent = 'Add Complaint';
            document.getElementById('complaintForm').reset();
            document.getElementById('complaintDate').value = new Date().toISOString().split('T')[0];
            clearCurrentImages('complaint');
            await loadCustomersIntoDropdown();
            document.getElementById('complaintModal').style.display = 'block';
            initializeImageUpload();
        }

        // Close complaint modal
        function closeComplaintModal() {
            document.getElementById('complaintModal').style.display = 'none';
            editingComplaintId = null;
        }

        // Edit complaint
        async function editComplaint(id) {
            const complaint = nsiComplaints.find(c => c.id === id);
            if (!complaint) return;
            
            editingComplaintId = id;
            document.getElementById('complaintModalTitle').textContent = 'Edit Complaint';
            
            // Load customers first
            await loadCustomersIntoDropdown();
            
            document.getElementById('complaintDate').value = complaint.date;
            document.getElementById('complaintReference').value = complaint.reference;
            document.getElementById('complaintCustomer').value = complaint.customer;
            document.getElementById('complaintType').value = complaint.type;
            document.getElementById('complaintDescription').value = complaint.description;
            document.getElementById('complaintStatus').value = complaint.status;
            document.getElementById('complaintAssignedTo').value = complaint.assigned_to || '';
            document.getElementById('complaintNotes').value = complaint.notes || '';
            
            loadImagesIntoForm(complaint.images, 'complaint');
            document.getElementById('complaintModal').style.display = 'block';
            initializeImageUpload();
        }

        // Delete complaint
        async function deleteComplaint(id) {
            if (!confirm('Are you sure you want to delete this complaint?')) return;
            
            try {
                const { error } = await supabase
                    .from(NSI_COMPLAINTS_TABLE)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                
                await loadComplaintData();
                showNsiMessage('Complaint deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting complaint:', error);
                showNsiMessage('Error deleting complaint: ' + error.message, 'error');
            }
        }

        // Handle complaint form submission
        document.getElementById('complaintForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                date: document.getElementById('complaintDate').value,
                reference: document.getElementById('complaintReference').value || generateComplaintReference(),
                customer: document.getElementById('complaintCustomer').value,
                type: document.getElementById('complaintType').value,
                description: document.getElementById('complaintDescription').value,
                status: document.getElementById('complaintStatus').value,
                assigned_to: document.getElementById('complaintAssignedTo').value,
                notes: document.getElementById('complaintNotes').value,
                images: imagesToBase64String(currentImages.complaint)
            };
            
            try {
                if (editingComplaintId) {
                    // Update existing complaint
                    const { error } = await supabase
                        .from(NSI_COMPLAINTS_TABLE)
                        .update(formData)
                        .eq('id', editingComplaintId);
                        
                    if (error) throw error;
                    showNsiMessage('Complaint updated successfully!', 'success');
                } else {
                    // Add new complaint
                    const { error } = await supabase
                        .from(NSI_COMPLAINTS_TABLE)
                        .insert([formData]);
                        
                    if (error) throw error;
                    showNsiMessage('Complaint added successfully!', 'success');
                }
                
                closeComplaintModal();
                await loadComplaintData();
            } catch (error) {
                console.error('Error saving complaint:', error);
                showNsiMessage('Error saving complaint: ' + error.message, 'error');
            }
        });

        // Generate complaint reference
        function generateComplaintReference() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `COMP-${year}${month}${day}-${random}`;
        }

        // Export complaint data
        function exportComplaintData() {
            const dataStr = JSON.stringify(nsiComplaints, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'nsi_complaints_' + new Date().toISOString().split('T')[0] + '.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNsiMessage('Complaint data exported successfully!', 'success');
        }

        // Filter complaint table
        function filterComplaintTable() {
            // Implementation for filtering complaints
            renderComplaintTable();
        }

        // ===== ID BADGE FUNCTIONS =====

        // Load ID badge data
        async function loadIdBadgeData() {
            try {
                const { data, error } = await supabase
                    .from(NSI_ID_BADGES_TABLE)
                    .select('*')
                    .order('valid_from', { ascending: false });

                if (error) {
                    console.error('Error loading ID badges:', error);
                    showNsiMessage('Error loading ID badges: ' + error.message, 'error');
                    return;
                }

                nsiIdBadges = data || [];
                renderIdBadgeTable();
                
            } catch (error) {
                console.error('Error loading ID badges:', error);
                showNsiMessage('Error loading ID badges: ' + error.message, 'error');
            }
        }

        // Render ID badge table
        function renderIdBadgeTable() {
            const tableBody = document.getElementById('idBadgeTableBody');
            const emptyState = document.getElementById('idBadgeEmptyState');
            const mobileCards = document.getElementById('mobileIdBadgeCards');
            
            if (nsiIdBadges.length === 0) {
                tableBody.innerHTML = '';
                if (mobileCards) mobileCards.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            // Render desktop table
            tableBody.innerHTML = nsiIdBadges.map(badge => {
                const status = getBadgeStatus(badge.valid_to);
                return `
                    <tr>
                        <td>${badge.badge_number}</td>
                        <td>${badge.issued_to}</td>
                        <td>${badge.issued_by}</td>
                        <td>${formatDate(badge.valid_from)}</td>
                        <td>${formatDate(badge.valid_to)}</td>
                        <td><span class="status-badge status-${status}">${status}</span></td>
                        <td>${renderImageThumbnails(parseImagesFromBase64(badge.images))}</td>
                        <td>
                            <button class="btn btn-warning" onclick="editIdBadge(${badge.id})" style="padding: 6px; width: 28px; margin-right: 5px;" title="Edit ID Badge">✏️</button>
                            <button class="btn btn-danger" onclick="deleteIdBadge(${badge.id})" style="padding: 6px; width: 28px;" title="Delete ID Badge">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Render mobile cards
            if (mobileCards) {
                mobileCards.innerHTML = nsiIdBadges.map(badge => {
                    const status = getBadgeStatus(badge.valid_to);
                    return `
                        <div class="customer-card">
                            <div class="customer-card-header">
                                <div>
                                    <div class="customer-name">Badge ID: ${badge.badge_number}</div>
                                    <div class="customer-details">
                                        <div class="nsi-info-line"><strong>Type:</strong> ${badge.badge_type}</div>
                                        <div class="nsi-info-line"><strong>Issued To:</strong> ${badge.issued_to}</div>
                                        <div class="nsi-info-line"><strong>Issued By:</strong> ${badge.issued_by}</div>
                                        <div class="nsi-info-line"><strong>Valid From:</strong> ${formatDate(badge.valid_from)}</div>
                                        <div class="nsi-info-line"><strong>Valid To:</strong> ${formatDate(badge.valid_to)}</div>
                                        <div class="nsi-info-line"><strong>Status:</strong> <span class="status-badge status-${status}">${status}</span></div>
                                    </div>
                                </div>
                            </div>
                            ${parseImagesFromBase64(badge.images).length > 0 ? `
                                <div style="margin: 10px 0;">
                                    <strong>Images:</strong><br>
                                    ${renderImageThumbnails(parseImagesFromBase64(badge.images))}
                                </div>
                            ` : ''}
                            <div class="customer-actions">
                                <button class="btn btn-warning" onclick="editIdBadge(${badge.id})" style="padding: 8px; width: 32px; margin-right: 5px;" title="Edit ID Badge">✏️</button>
                                <button class="btn btn-danger" onclick="deleteIdBadge(${badge.id})" style="padding: 8px; width: 32px;" title="Delete ID Badge">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Get badge status
        function getBadgeStatus(validTo) {
            const today = new Date();
            const expiryDate = new Date(validTo);
            
            if (expiryDate < today) {
                return 'expired';
            } else {
                return 'active';
            }
        }

        // Open ID badge modal
        function openIdBadgeModal() {
            editingIdBadgeId = null;
            document.getElementById('idBadgeModalTitle').textContent = 'Issue ID Badge';
            document.getElementById('idBadgeForm').reset();
            document.getElementById('badgeValidFrom').value = new Date().toISOString().split('T')[0];
            clearCurrentImages('badge');
            document.getElementById('idBadgeModal').style.display = 'block';
            initializeImageUpload();
        }

        // Close ID badge modal
        function closeIdBadgeModal() {
            document.getElementById('idBadgeModal').style.display = 'none';
            editingIdBadgeId = null;
        }

        // Edit ID badge
        function editIdBadge(id) {
            const badge = nsiIdBadges.find(b => b.id === id);
            if (!badge) return;
            
            editingIdBadgeId = id;
            document.getElementById('idBadgeModalTitle').textContent = 'Edit ID Badge';
            
            document.getElementById('badgeNumber').value = badge.badge_number;
            document.getElementById('badgeType').value = badge.badge_type;
            document.getElementById('badgeIssuedTo').value = badge.issued_to;
            document.getElementById('badgeIssuedBy').value = badge.issued_by;
            document.getElementById('badgeValidFrom').value = badge.valid_from;
            document.getElementById('badgeValidTo').value = badge.valid_to;
            document.getElementById('badgeNotes').value = badge.notes || '';
            
            loadImagesIntoForm(badge.images, 'badge');
            document.getElementById('idBadgeModal').style.display = 'block';
            initializeImageUpload();
        }

        // Delete ID badge
        async function deleteIdBadge(id) {
            if (!confirm('Are you sure you want to delete this ID badge record?')) return;
            
            try {
                const { error } = await supabase
                    .from(NSI_ID_BADGES_TABLE)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                
                await loadIdBadgeData();
                showNsiMessage('ID badge record deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting ID badge:', error);
                showNsiMessage('Error deleting ID badge: ' + error.message, 'error');
            }
        }

        // Handle ID badge form submission
        document.getElementById('idBadgeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                badge_number: document.getElementById('badgeNumber').value,
                badge_type: document.getElementById('badgeType').value,
                issued_to: document.getElementById('badgeIssuedTo').value,
                issued_by: document.getElementById('badgeIssuedBy').value,
                valid_from: document.getElementById('badgeValidFrom').value,
                valid_to: document.getElementById('badgeValidTo').value,
                notes: document.getElementById('badgeNotes').value,
                images: imagesToBase64String(currentImages.badge)
            };
            
            try {
                if (editingIdBadgeId) {
                    // Update existing badge
                    const { error } = await supabase
                        .from(NSI_ID_BADGES_TABLE)
                        .update(formData)
                        .eq('id', editingIdBadgeId);
                        
                    if (error) throw error;
                    showNsiMessage('ID badge updated successfully!', 'success');
                } else {
                    // Add new badge
                    const { error } = await supabase
                        .from(NSI_ID_BADGES_TABLE)
                        .insert([formData]);
                        
                    if (error) throw error;
                    showNsiMessage('ID badge issued successfully!', 'success');
                }
                
                closeIdBadgeModal();
                await loadIdBadgeData();
            } catch (error) {
                console.error('Error saving ID badge:', error);
                showNsiMessage('Error saving ID badge: ' + error.message, 'error');
            }
        });

        // Export ID badge data
        function exportIdBadgeData() {
            const dataStr = JSON.stringify(nsiIdBadges, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'nsi_id_badges_' + new Date().toISOString().split('T')[0] + '.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNsiMessage('ID badge data exported successfully!', 'success');
        }

        // Filter ID badge table
        function filterIdBadgeTable() {
            // Implementation for filtering ID badges
            renderIdBadgeTable();
        }

        // ===== TEST EQUIPMENT FUNCTIONS =====

        // Load test equipment data
        async function loadTestEquipmentData() {
            try {
                const { data, error } = await supabase
                    .from(NSI_TEST_EQUIPMENT_TABLE)
                    .select('*')
                    .order('next_calibration', { ascending: true });

                if (error) {
                    console.error('Error loading test equipment:', error);
                    showNsiMessage('Error loading test equipment: ' + error.message, 'error');
                    return;
                }

                nsiTestEquipment = data || [];
                renderTestEquipTable();
                
            } catch (error) {
                console.error('Error loading test equipment:', error);
                showNsiMessage('Error loading test equipment: ' + error.message, 'error');
            }
        }

        // Render test equipment table
        function renderTestEquipTable() {
            const tableBody = document.getElementById('testEquipTableBody');
            const emptyState = document.getElementById('testEquipEmptyState');
            const mobileCards = document.getElementById('mobileTestEquipCards');
            
            if (nsiTestEquipment.length === 0) {
                tableBody.innerHTML = '';
                if (mobileCards) mobileCards.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            // Render desktop table
            tableBody.innerHTML = nsiTestEquipment.map(equipment => {
                const status = getEquipmentStatus(equipment.next_calibration);
                return `
                    <tr>
                        <td>${equipment.equipment_id}</td>
                        <td>${equipment.equipment_type}</td>
                        <td>${equipment.manufacturer}</td>
                        <td>${equipment.model}</td>
                        <td>${formatDate(equipment.purchase_date)}</td>
                        <td>${formatDate(equipment.last_calibration)}</td>
                        <td>${formatDate(equipment.next_calibration)}</td>
                        <td><span class="status-badge status-${status}">${status}</span></td>
                        <td>${renderImageThumbnails(parseImagesFromBase64(equipment.images))}</td>
                        <td>
                            <button class="btn btn-warning" onclick="editTestEquipment(${equipment.id})" style="padding: 6px; width: 28px; margin-right: 5px;" title="Edit Test Equipment">✏️</button>
                            <button class="btn btn-danger" onclick="deleteTestEquipment(${equipment.id})" style="padding: 6px; width: 28px;" title="Delete Test Equipment">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Render mobile cards
            if (mobileCards) {
                mobileCards.innerHTML = nsiTestEquipment.map(equipment => {
                    const status = getEquipmentStatus(equipment.next_calibration);
                    return `
                        <div class="customer-card">
                            <div class="customer-card-header">
                                <div>
                                    <div class="customer-name">Equipment ID: ${equipment.equipment_id}</div>
                                    <div class="customer-details">
                                        <div class="nsi-info-line"><strong>Type:</strong> ${equipment.equipment_type}</div>
                                        <div class="nsi-info-line"><strong>Manufacturer:</strong> ${equipment.manufacturer}</div>
                                        <div class="nsi-info-line"><strong>Model:</strong> ${equipment.model}</div>
                                        <div class="nsi-info-line"><strong>Purchase Date:</strong> ${formatDate(equipment.purchase_date)}</div>
                                        <div class="nsi-info-line"><strong>Last Calibration:</strong> ${formatDate(equipment.last_calibration)}</div>
                                        <div class="nsi-info-line"><strong>Next Calibration:</strong> ${formatDate(equipment.next_calibration)}</div>
                                        <div class="nsi-info-line"><strong>Status:</strong> <span class="status-badge status-${status}">${status}</span></div>
                                    </div>
                                </div>
                            </div>
                            ${parseImagesFromBase64(equipment.images).length > 0 ? `
                                <div style="margin: 10px 0;">
                                    <strong>Images:</strong><br>
                                    ${renderImageThumbnails(parseImagesFromBase64(equipment.images))}
                                </div>
                            ` : ''}
                            <div class="customer-actions">
                                <button class="btn btn-warning" onclick="editTestEquipment(${equipment.id})" style="padding: 8px; width: 32px; margin-right: 5px;" title="Edit Test Equipment">✏️</button>
                                <button class="btn btn-danger" onclick="deleteTestEquipment(${equipment.id})" style="padding: 8px; width: 32px;" title="Delete Test Equipment">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Get equipment calibration status
        function getEquipmentStatus(nextCalibration) {
            const today = new Date();
            const calibrationDate = new Date(nextCalibration);
            const daysDiff = Math.ceil((calibrationDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 0) {
                return 'overdue';
            } else if (daysDiff <= 30) {
                return 'due-calibration';
            } else {
                return 'calibrated';
            }
        }

        // Open test equipment modal
        function openTestEquipModal() {
            editingTestEquipId = null;
            document.getElementById('testEquipModalTitle').textContent = 'Add Test Equipment';
            document.getElementById('testEquipForm').reset();
            clearCurrentImages('equipment');
            document.getElementById('testEquipModal').style.display = 'block';
            initializeImageUpload();
        }

        // Close test equipment modal
        function closeTestEquipModal() {
            document.getElementById('testEquipModal').style.display = 'none';
            editingTestEquipId = null;
        }

        // Edit test equipment
        function editTestEquipment(id) {
            const equipment = nsiTestEquipment.find(e => e.id === id);
            if (!equipment) return;
            
            editingTestEquipId = id;
            document.getElementById('testEquipModalTitle').textContent = 'Edit Test Equipment';
            
            document.getElementById('equipmentId').value = equipment.equipment_id;
            document.getElementById('equipmentType').value = equipment.equipment_type;
            document.getElementById('equipmentManufacturer').value = equipment.manufacturer;
            document.getElementById('equipmentModel').value = equipment.model;
            document.getElementById('equipmentPurchaseDate').value = equipment.purchase_date;
            document.getElementById('equipmentSerialNumber').value = equipment.serial_number || '';
            document.getElementById('equipmentLastCalibration').value = equipment.last_calibration || '';
            document.getElementById('equipmentNextCalibration').value = equipment.next_calibration;
            document.getElementById('equipmentNotes').value = equipment.notes || '';
            
            loadImagesIntoForm(equipment.images, 'equipment');
            document.getElementById('testEquipModal').style.display = 'block';
            initializeImageUpload();
        }

        // Delete test equipment
        async function deleteTestEquipment(id) {
            if (!confirm('Are you sure you want to delete this test equipment record?')) return;
            
            try {
                const { error } = await supabase
                    .from(NSI_TEST_EQUIPMENT_TABLE)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                
                await loadTestEquipmentData();
                showNsiMessage('Test equipment record deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting test equipment:', error);
                showNsiMessage('Error deleting test equipment: ' + error.message, 'error');
            }
        }

        // Handle test equipment form submission
        document.getElementById('testEquipForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                equipment_id: document.getElementById('equipmentId').value,
                equipment_type: document.getElementById('equipmentType').value,
                manufacturer: document.getElementById('equipmentManufacturer').value,
                model: document.getElementById('equipmentModel').value,
                purchase_date: document.getElementById('equipmentPurchaseDate').value,
                serial_number: document.getElementById('equipmentSerialNumber').value,
                last_calibration: document.getElementById('equipmentLastCalibration').value,
                next_calibration: document.getElementById('equipmentNextCalibration').value,
                notes: document.getElementById('equipmentNotes').value,
                images: imagesToBase64String(currentImages.equipment)
            };
            
            try {
                if (editingTestEquipId) {
                    // Update existing equipment
                    const { error } = await supabase
                        .from(NSI_TEST_EQUIPMENT_TABLE)
                        .update(formData)
                        .eq('id', editingTestEquipId);
                        
                    if (error) throw error;
                    showNsiMessage('Test equipment updated successfully!', 'success');
                } else {
                    // Add new equipment
                    const { error } = await supabase
                        .from(NSI_TEST_EQUIPMENT_TABLE)
                        .insert([formData]);
                        
                    if (error) throw error;
                    showNsiMessage('Test equipment added successfully!', 'success');
                }
                
                closeTestEquipModal();
                await loadTestEquipmentData();
            } catch (error) {
                console.error('Error saving test equipment:', error);
                showNsiMessage('Error saving test equipment: ' + error.message, 'error');
            }
        });

        // Export test equipment data
        function exportTestEquipData() {
            const dataStr = JSON.stringify(nsiTestEquipment, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'nsi_test_equipment_' + new Date().toISOString().split('T')[0] + '.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNsiMessage('Test equipment data exported successfully!', 'success');
        }

        // Filter test equipment table
        function filterTestEquipTable() {
            // Implementation for filtering test equipment
            renderTestEquipTable();
        }

        // ===== FIRST AID FUNCTIONS =====

        // Load first aid data
        async function loadFirstAidData() {
            try {
                const { data, error } = await supabase
                    .from(NSI_FIRST_AID_TABLE)
                    .select('*')
                    .order('expiry_date', { ascending: true });

                if (error) {
                    console.error('Error loading first aid kits:', error);
                    showNsiMessage('Error loading first aid kits: ' + error.message, 'error');
                    return;
                }

                nsiFirstAid = data || [];
                renderFirstAidTable();
                
            } catch (error) {
                console.error('Error loading first aid kits:', error);
                showNsiMessage('Error loading first aid kits: ' + error.message, 'error');
            }
        }

        // Render first aid table
        function renderFirstAidTable() {
            const tableBody = document.getElementById('firstAidTableBody');
            const emptyState = document.getElementById('firstAidEmptyState');
            const mobileCards = document.getElementById('mobileFirstAidCards');
            
            if (nsiFirstAid.length === 0) {
                tableBody.innerHTML = '';
                if (mobileCards) mobileCards.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            // Render desktop table
            tableBody.innerHTML = nsiFirstAid.map(kit => {
                const status = getFirstAidStatus(kit.expiry_date);
                return `
                    <tr>
                        <td>${kit.kit_id}</td>
                        <td>${kit.kit_type}</td>
                        <td>${kit.issued_to}</td>
                        <td>${kit.issued_by}</td>
                        <td>${formatDate(kit.issue_date)}</td>
                        <td>${formatDate(kit.expiry_date)}</td>
                        <td>${kit.location}</td>
                        <td><span class="status-badge status-${status}">${status}</span></td>
                        <td>${renderImageThumbnails(parseImagesFromBase64(kit.images))}</td>
                        <td>
                            <button class="btn btn-warning" onclick="editFirstAidKit(${kit.id})" style="padding: 6px; width: 28px; margin-right: 5px;" title="Edit First Aid Kit">✏️</button>
                            <button class="btn btn-danger" onclick="deleteFirstAidKit(${kit.id})" style="padding: 6px; width: 28px;" title="Delete First Aid Kit">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Render mobile cards
            if (mobileCards) {
                mobileCards.innerHTML = nsiFirstAid.map(kit => {
                    const status = getFirstAidStatus(kit.expiry_date);
                    return `
                        <div class="customer-card">
                            <div class="customer-card-header">
                                <div>
                                    <div class="customer-name">Kit ID: ${kit.kit_id}</div>
                                    <div class="customer-details">
                                        <div class="nsi-info-line"><strong>Type:</strong> ${kit.kit_type}</div>
                                        <div class="nsi-info-line"><strong>Issued To:</strong> ${kit.issued_to}</div>
                                        <div class="nsi-info-line"><strong>Issued By:</strong> ${kit.issued_by}</div>
                                        <div class="nsi-info-line"><strong>Issue Date:</strong> ${formatDate(kit.issue_date)}</div>
                                        <div class="nsi-info-line"><strong>Expiry Date:</strong> ${formatDate(kit.expiry_date)}</div>
                                        <div class="nsi-info-line"><strong>Location:</strong> ${kit.location}</div>
                                        <div class="nsi-info-line"><strong>Status:</strong> <span class="status-badge status-${status}">${status}</span></div>
                                    </div>
                                </div>
                            </div>
                            ${parseImagesFromBase64(kit.images).length > 0 ? `
                                <div style="margin: 10px 0;">
                                    <strong>Images:</strong><br>
                                    ${renderImageThumbnails(parseImagesFromBase64(kit.images))}
                                </div>
                            ` : ''}
                            <div class="customer-actions">
                                <button class="btn btn-warning" onclick="editFirstAidKit(${kit.id})" style="padding: 8px; width: 32px; margin-right: 5px;" title="Edit First Aid Kit">✏️</button>
                                <button class="btn btn-danger" onclick="deleteFirstAidKit(${kit.id})" style="padding: 8px; width: 32px;" title="Delete First Aid Kit">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Get first aid kit status
        function getFirstAidStatus(expiryDate) {
            const today = new Date();
            const expiry = new Date(expiryDate);
            const daysDiff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 0) {
                return 'expired';
            } else if (daysDiff <= 30) {
                return 'due-soon';
            } else {
                return 'active';
            }
        }

        // Open first aid modal
        function openFirstAidModal() {
            editingFirstAidId = null;
            document.getElementById('firstAidModalTitle').textContent = 'Issue First Aid Kit';
            document.getElementById('firstAidForm').reset();
            document.getElementById('firstAidIssueDate').value = new Date().toISOString().split('T')[0];
            clearCurrentImages('firstAid');
            document.getElementById('firstAidModal').style.display = 'block';
            initializeImageUpload();
        }

        // Close first aid modal
        function closeFirstAidModal() {
            document.getElementById('firstAidModal').style.display = 'none';
            editingFirstAidId = null;
        }

        // Edit first aid kit
        function editFirstAidKit(id) {
            const kit = nsiFirstAid.find(k => k.id === id);
            if (!kit) return;
            
            editingFirstAidId = id;
            document.getElementById('firstAidModalTitle').textContent = 'Edit First Aid Kit';
            
            document.getElementById('firstAidKitId').value = kit.kit_id;
            document.getElementById('firstAidKitType').value = kit.kit_type;
            document.getElementById('firstAidIssuedTo').value = kit.issued_to;
            document.getElementById('firstAidIssuedBy').value = kit.issued_by;
            document.getElementById('firstAidIssueDate').value = kit.issue_date;
            document.getElementById('firstAidExpiryDate').value = kit.expiry_date;
            document.getElementById('firstAidLocation').value = kit.location;
            document.getElementById('firstAidNotes').value = kit.notes || '';
            
            loadImagesIntoForm(kit.images, 'firstAid');
            document.getElementById('firstAidModal').style.display = 'block';
            initializeImageUpload();
        }

        // Delete first aid kit
        async function deleteFirstAidKit(id) {
            if (!confirm('Are you sure you want to delete this first aid kit record?')) return;
            
            try {
                const { error } = await supabase
                    .from(NSI_FIRST_AID_TABLE)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                
                await loadFirstAidData();
                showNsiMessage('First aid kit record deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting first aid kit:', error);
                showNsiMessage('Error deleting first aid kit: ' + error.message, 'error');
            }
        }

        // Handle first aid form submission
        document.getElementById('firstAidForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                kit_id: document.getElementById('firstAidKitId').value,
                kit_type: document.getElementById('firstAidKitType').value,
                issued_to: document.getElementById('firstAidIssuedTo').value,
                issued_by: document.getElementById('firstAidIssuedBy').value,
                issue_date: document.getElementById('firstAidIssueDate').value,
                expiry_date: document.getElementById('firstAidExpiryDate').value,
                location: document.getElementById('firstAidLocation').value,
                notes: document.getElementById('firstAidNotes').value,
                images: imagesToBase64String(currentImages.firstAid)
            };
            
            try {
                if (editingFirstAidId) {
                    // Update existing kit
                    const { error } = await supabase
                        .from(NSI_FIRST_AID_TABLE)
                        .update(formData)
                        .eq('id', editingFirstAidId);
                        
                    if (error) throw error;
                    showNsiMessage('First aid kit updated successfully!', 'success');
                } else {
                    // Add new kit
                    const { error } = await supabase
                        .from(NSI_FIRST_AID_TABLE)
                        .insert([formData]);
                        
                    if (error) throw error;
                    showNsiMessage('First aid kit issued successfully!', 'success');
                }
                
                closeFirstAidModal();
                await loadFirstAidData();
            } catch (error) {
                console.error('Error saving first aid kit:', error);
                showNsiMessage('Error saving first aid kit: ' + error.message, 'error');
            }
        });

        // Export first aid data
        function exportFirstAidData() {
            const dataStr = JSON.stringify(nsiFirstAid, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'nsi_first_aid_kits_' + new Date().toISOString().split('T')[0] + '.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNsiMessage('First aid kit data exported successfully!', 'success');
        }

        // Filter first aid table
        function filterFirstAidTable() {
            // Implementation for filtering first aid kits
            renderFirstAidTable();
        }

        // ===== IMAGE HANDLING FUNCTIONS =====

        // Initialize image upload functionality
        function initializeImageUpload() {
            // Add delay to ensure DOM is ready on mobile
            setTimeout(function() {
                const imageInputs = [
                    { input: 'complaintImages', preview: 'complaintImagePreview', type: 'complaint' },
                    { input: 'badgeImages', preview: 'badgeImagePreview', type: 'badge' },
                    { input: 'equipmentImages', preview: 'equipmentImagePreview', type: 'equipment' },
                    { input: 'firstAidImages', preview: 'firstAidImagePreview', type: 'firstAid' }
                ];

                imageInputs.forEach(config => {
                    const input = document.getElementById(config.input);
                    const preview = document.getElementById(config.preview);
                    
                    if (input && preview) {
                        input.addEventListener('change', function(e) {
                            handleImageSelection(e.target.files, config.type, preview);
                        });

                        // Add drag and drop functionality (skip on mobile to avoid issues)
                        const uploadArea = input.parentElement.querySelector('.image-upload-area');
                        if (uploadArea && !isMobileDevice()) {
                            uploadArea.addEventListener('dragover', function(e) {
                                e.preventDefault();
                                uploadArea.classList.add('dragover');
                            });

                            uploadArea.addEventListener('dragleave', function(e) {
                                e.preventDefault();
                                uploadArea.classList.remove('dragover');
                            });

                            uploadArea.addEventListener('drop', function(e) {
                                e.preventDefault();
                                uploadArea.classList.remove('dragover');
                                handleImageSelection(e.dataTransfer.files, config.type, preview);
                            });
                        }
                    }
                });
            }, 100);
        }

        // Check if device is mobile
        function isMobileDevice() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            const isMobileWidth = window.innerWidth <= 768 || window.innerHeight <= 768;
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            return isMobileUA || isMobileWidth || isTouchDevice;
        }

        // Handle image selection
        function handleImageSelection(files, type, previewContainer) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const imageData = {
                            name: file.name,
                            data: e.target.result,
                            size: file.size,
                            type: file.type
                        };
                        
                        currentImages[type].push(imageData);
                        renderImagePreview(previewContainer, currentImages[type], type);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Render image preview
        function renderImagePreview(container, images, type) {
            container.innerHTML = images.map((image, index) => `
                <div class="image-preview">
                    <img src="${image.data}" alt="${image.name}" onclick="openImageModal('${image.data}')">
                    <button class="image-preview-remove" onclick="removeImage('${type}', ${index})" type="button">×</button>
                </div>
            `).join('');
        }

        // Remove image from preview
        function removeImage(type, index) {
            currentImages[type].splice(index, 1);
            const previewContainer = document.getElementById(getPreviewContainerId(type));
            if (previewContainer) {
                renderImagePreview(previewContainer, currentImages[type], type);
            }
        }

        // Get preview container ID by type
        function getPreviewContainerId(type) {
            const mapping = {
                complaint: 'complaintImagePreview',
                badge: 'badgeImagePreview',
                equipment: 'equipmentImagePreview',
                firstAid: 'firstAidImagePreview'
            };
            return mapping[type];
        }

        // Open image modal
        function openImageModal(imageSrc) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('imageModalImg');
            modal.style.display = 'block';
            modalImg.src = imageSrc;
        }

        // Close image modal
        function closeImageModal() {
            document.getElementById('imageModal').style.display = 'none';
        }

        // Convert images to base64 string for database storage
        function imagesToBase64String(images) {
            return JSON.stringify(images.map(img => ({
                name: img.name,
                data: img.data,
                size: img.size,
                type: img.type
            })));
        }

        // Parse base64 string back to images
        function parseImagesFromBase64(imageString) {
            // Handle null, undefined, or empty strings
            if (!imageString || imageString === 'null' || imageString === 'undefined') {
                return [];
            }
            
            // Handle already parsed arrays
            if (Array.isArray(imageString)) {
                return imageString;
            }
            
            // Handle non-string types
            if (typeof imageString !== 'string') {
                console.warn('Expected string for image data, got:', typeof imageString);
                return [];
            }
            
            try {
                const parsed = JSON.parse(imageString);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Error parsing images from string:', imageString, e);
                return [];
            }
        }

        // Render image thumbnails for table display with error handling
        function renderImageThumbnails(images, maxDisplay = 3) {
            try {
                // Handle null, undefined, or empty arrays
                if (!images || !Array.isArray(images) || images.length === 0) {
                    return '<span style="color: #999;">No images</span>';
                }

                const imagesToShow = images.slice(0, maxDisplay);
                const remaining = Math.max(0, images.length - maxDisplay);

                let html = '<div class="image-gallery">';
                imagesToShow.forEach(image => {
                    // Ensure image object has required properties
                    if (image && image.data && image.name) {
                        // Escape quotes in image data and name for onclick
                        const escapedData = image.data.replace(/'/g, "\\'");
                        const escapedName = image.name.replace(/'/g, "\\'");
                        html += `<img src="${image.data}" alt="${escapedName}" class="image-thumbnail" onclick="openImageModal('${escapedData}')">`;
                    }
                });
                
                if (remaining > 0) {
                    html += `<span style="font-size: 12px; color: #666;">+${remaining} more</span>`;
                }
                html += '</div>';

                return html;
            } catch (error) {
                console.error('Error rendering image thumbnails:', error);
                return '<span style="color: #f00;">Error loading images</span>';
            }
        }

        // Clear current images
        function clearCurrentImages(type) {
            currentImages[type] = [];
            const previewContainer = document.getElementById(getPreviewContainerId(type));
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
        }

        // Load images into form when editing
        function loadImagesIntoForm(images, type) {
            currentImages[type] = parseImagesFromBase64(images);
            const previewContainer = document.getElementById(getPreviewContainerId(type));
            if (previewContainer) {
                renderImagePreview(previewContainer, currentImages[type], type);
            }
        }

        // ===== UTILITY FUNCTIONS =====

        // Show NSI messages with better error handling
        function showNsiMessage(message, type) {
            try {
                const errorElement = document.getElementById('nsiErrorMessage');
                const successElement = document.getElementById('nsiSuccessMessage');
                
                // Fallback if elements don't exist
                if (!errorElement || !successElement) {
                    console.warn('NSI message elements not found, falling back to console');
                    console.log(`NSI ${type}: ${message}`);
                    return;
                }
                
                if (type === 'error') {
                    errorElement.textContent = message;
                    errorElement.style.display = 'block';
                    if (successElement) successElement.style.display = 'none';
                    setTimeout(() => {
                        if (errorElement) errorElement.style.display = 'none';
                    }, 5000);
                } else {
                    successElement.textContent = message;
                    successElement.style.display = 'block';
                    if (errorElement) errorElement.style.display = 'none';
                    setTimeout(() => {
                        if (successElement) successElement.style.display = 'none';
                    }, 3000);
                }
            } catch (error) {
                console.error('Error showing NSI message:', error);
                console.log(`Original message - ${type}: ${message}`);
            }
        }

        // Format date for display
        function formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB');
        }

        // ===== END NSI SYSTEM FUNCTIONS =====

        // Close modals when clicking outside
        window.onclick = function(event) {
            const customerModal = document.getElementById('customerModal');
            const completionModal = document.getElementById('completionModal');
            const editInspectionDateModal = document.getElementById('editInspectionDateModal');
            const monthlyCompletionsModal = document.getElementById('monthlyCompletionsModal');
            const complaintModal = document.getElementById('complaintModal');
            const idBadgeModal = document.getElementById('idBadgeModal');
            const testEquipModal = document.getElementById('testEquipModal');
            const firstAidModal = document.getElementById('firstAidModal');
            const imageModal = document.getElementById('imageModal');
            
            if (event.target === customerModal) {
                closeModal();
            }
            if (event.target === completionModal) {
                closeCompletionModal();
            }
            if (event.target === editInspectionDateModal) {
                closeEditInspectionDateModal();
            }
            if (event.target === monthlyCompletionsModal) {
                closeMonthlyCompletionsModal();
            }
            if (event.target === complaintModal) {
                closeComplaintModal();
            }
            if (event.target === idBadgeModal) {
                closeIdBadgeModal();
            }
            if (event.target === testEquipModal) {
                closeTestEquipModal();
            }
            if (event.target === firstAidModal) {
                closeFirstAidModal();
            }
            if (event.target === imageModal) {
                closeImageModal();
            }
        };

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initializeMobileFeatures();
            checkLoginStatus();
        });

        // Fallback initialization for older browsers
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initializeMobileFeatures();
                checkLoginStatus();
            });
        } else {
            initializeMobileFeatures();
            checkLoginStatus();
        }