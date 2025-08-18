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

        // Show login screen
        function showLoginScreen() {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('mainDashboard').style.display = 'none';
            document.getElementById('passwordInput').focus();
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
            
            // Remove active class from all tab buttons
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // Show selected tab content
            const selectedContent = document.getElementById(tabName + 'Tab');
            if (selectedContent) {
                selectedContent.classList.add('active');
            }
            
            // Add active class to clicked button
            const selectedButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
            if (selectedButton) {
                selectedButton.classList.add('active');
            }

            // Load scaffold data when scaff tab is selected
            if (tabName === 'scaff') {
                loadScaffoldData();
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

            // Check for PWA install prompt
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                showInstallPrompt();
            });

            // Check login status first
            checkLoginStatus();
            
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

        // Handle window resize to adjust statistics visibility
        window.addEventListener('resize', function() {
            if (document.getElementById('mainDashboard').style.display !== 'none') {
                initializeStatsVisibility();
            }
        });

        // Show install prompt for PWA
        function showInstallPrompt() {
            const installButton = document.createElement('button');
            installButton.textContent = '📱 Install App';
            installButton.className = 'btn btn-primary';
            installButton.style.position = 'fixed';
            installButton.style.top = '20px';
            installButton.style.right = '20px';
            installButton.style.zIndex = '10000';
            installButton.onclick = () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                    installButton.remove();
                });
            };
            document.body.appendChild(installButton);
        }

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

        // Get inspection status
        function getInspectionStatus(customer, inspectionType) {
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            
            let dueMonth = customer.first_inspection_month;
            if (inspectionType === 'inspection2' && customer.inspections_per_year === 2) {
                dueMonth = customer.second_inspection_month;
            }
            
            // Calculate key dates for this year
            const dueDate = new Date(currentYear, dueMonth - 1, 1);
            const monthBefore = new Date(currentYear, dueMonth - 2, 1);
            const monthAfter = new Date(currentYear, dueMonth, 1);
            const twoMonthsAfter = new Date(currentYear, dueMonth + 1, 1);
            
            // Check if inspection was completed in the last 12 months
            const history = customer.inspection_history?.[inspectionType] || [];
            const lastCompletion = history.length > 0 ? new Date(history[history.length - 1].date) : null;
            
            if (lastCompletion) {
                const monthsSinceCompletion = (currentYear - lastCompletion.getFullYear()) * 12 + 
                                            (currentMonth - lastCompletion.getMonth() - 1);
                if (monthsSinceCompletion < 12) {
                    return 'up-to-date';
                }
            }
            
            // Check current status based on timing
            if (today >= monthBefore && today < dueDate) {
                // Month before due month
                return 'can-be-done';
            } else if (today >= dueDate && today < monthAfter) {
                // Due month
                return 'due-this-month';
            } else if (today >= monthAfter && today < twoMonthsAfter) {
                // Month after due month
                return 'due-last-month';
            } else if (today >= twoMonthsAfter) {
                // More than a month overdue
                return 'overdue';
            }
            
            // Before the month before due month
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
            document.getElementById('completionNotes').value = '';
            document.getElementById('completionModal').style.display = 'block';
        }

        // Close completion modal
        function closeCompletionModal() {
            document.getElementById('completionModal').style.display = 'none';
            completingInspection = null;
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
                             <button class="btn" onclick="editCustomer(${customer.id})" style="background: #3498db; color: white; margin-right: 5px; padding: 6px 12px;">Edit</button>
                             <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})" style="padding: 6px 12px;">Delete</button>
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
                            <button class="btn" onclick="editCustomer(${customer.id})" style="background: #3498db; color: white;">Edit</button>
                            <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})">Delete</button>
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

        // Calculate monthly completion statistics
        function calculateMonthlyStats() {
            const today = new Date();
            const monthlyStats = [];
            
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            
            // Filter customers based on NSI status if needed
            let filteredCustomers = customers;
            if (nsiFilter) {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            // Get last 5 months
            for (let i = 4; i >= 0; i--) {
                const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
                const monthName = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                
                let onTimeCompletions = 0;
                let lateCompletions = 0;
                let totalDue = 0;
                
                filteredCustomers.forEach(customer => {
                    // Check Inspection 1
                    if (customer.inspection_history?.inspection1) {
                        customer.inspection_history.inspection1.forEach(completion => {
                            const completionDate = new Date(completion.date);
                            const completionMonth = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}`;
                            
                            if (completionMonth === monthKey) {
                                // Check if completion was on time (within flexible window)
                                const dueMonth = customer.first_inspection_month;
                                const dueYear = monthDate.getFullYear();
                                const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                                const monthAfter = new Date(dueYear, dueMonth, 1);
                                
                                if (completionDate >= monthBefore && completionDate < monthAfter) {
                                    onTimeCompletions++;
                                } else {
                                    lateCompletions++;
                                }
                            }
                        });
                    }
                    
                    // Check Inspection 2
                    if (customer.inspections_per_year === 2 && customer.inspection_history?.inspection2) {
                        customer.inspection_history.inspection2.forEach(completion => {
                            const completionDate = new Date(completion.date);
                            const completionMonth = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}`;
                            
                            if (completionMonth === monthKey) {
                                // Check if completion was on time (within flexible window)
                                const dueMonth = customer.second_inspection_month;
                                const dueYear = monthDate.getFullYear();
                                const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                                const monthAfter = new Date(dueYear, dueMonth, 1);
                                
                                if (completionDate >= monthBefore && completionDate < monthAfter) {
                                    onTimeCompletions++;
                                } else {
                                    lateCompletions++;
                                }
                            }
                        });
                    }
                });
                
                totalDue = onTimeCompletions + lateCompletions;
                const onTimeRate = totalDue > 0 ? Math.round((onTimeCompletions / totalDue) * 100) : 0;
                
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
            
            // Render completion chart
            completionChart.innerHTML = monthlyStats.map(stat => {
                const onTimeWidth = stat.total > 0 ? (stat.onTime / stat.total) * 100 : 0;
                const lateWidth = stat.total > 0 ? (stat.late / stat.total) * 100 : 0;
                
                return `
                    <div class="chart-bar" title="Completion statistics for ${stat.month}">
                        <div class="chart-label">${stat.month}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar-fill on-time" style="width: ${onTimeWidth}%"></div>
                            <div class="chart-bar-fill late" style="width: ${lateWidth}%"></div>
                        </div>
                        <div class="chart-percentage">${stat.rate}%</div>
                    </div>
                `;
            }).join('');
        }

        // Show customers by status modal
        function showCustomersByStatus(statusType) {
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            
            // Filter customers based on NSI status if needed
            let filteredCustomers = customers;
            if (nsiFilter) {
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
                        <td><button class="btn" onclick="editCustomer(${customer.id})" style="background: #3498db; color: white; padding: 4px 8px; font-size: 12px;">Edit</button></td>
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
            const monthKey = `${year}-${String(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName) + 1).padStart(2, '0')}`;
            const monthDate = new Date(year, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName), 1);
            
            const completions = [];
            
            // Get current NSI filter to match the monthly card calculation
            const nsiFilter = document.getElementById('nsiFilter').value;
            
            // Filter customers based on NSI status if needed - SAME AS calculateMonthlyStats
            let filteredCustomers = customers;
            if (nsiFilter) {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            filteredCustomers.forEach(customer => {
                // Check Inspection 1 completions in this month
                if (customer.inspection_history?.inspection1) {
                    customer.inspection_history.inspection1.forEach(completion => {
                        const completionDate = new Date(completion.date);
                        const completionMonth = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (completionMonth === monthKey) {
                            // Check if completion was on time (within flexible window) - EXACT SAME LOGIC
                            const dueMonth = customer.first_inspection_month;
                            const dueYear = monthDate.getFullYear();
                            const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                            const monthAfter = new Date(dueYear, dueMonth, 1);
                            const isOnTime = completionDate >= monthBefore && completionDate < monthAfter;
                            
                            completions.push({
                                customer: customer,
                                inspectionType: 'Inspection 1',
                                completionDate: completion.date,
                                notes: completion.notes || '',
                                status: isOnTime ? 'On Time' : 'Late'
                            });
                        }
                    });
                }
                
                // Check Inspection 2 completions in this month
                if (customer.inspections_per_year === 2 && customer.inspection_history?.inspection2) {
                    customer.inspection_history.inspection2.forEach(completion => {
                        const completionDate = new Date(completion.date);
                        const completionMonth = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (completionMonth === monthKey) {
                            // Check if completion was on time (within flexible window) - EXACT SAME LOGIC
                            const dueMonth = customer.second_inspection_month;
                            const dueYear = monthDate.getFullYear();
                            const monthBefore = new Date(dueYear, dueMonth - 2, 1);
                            const monthAfter = new Date(dueYear, dueMonth, 1);
                            const isOnTime = completionDate >= monthBefore && completionDate < monthAfter;
                            
                            completions.push({
                                customer: customer,
                                inspectionType: 'Inspection 2',
                                completionDate: completion.date,
                                notes: completion.notes || '',
                                status: isOnTime ? 'On Time' : 'Late'
                            });
                        }
                    });
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
                    <td>${new Date(item.completionDate).toLocaleDateString()}</td>
                    <td><span class="status-badge ${item.status === 'On Time' ? 'on-time' : 'late'}">${item.status}</span></td>
                    <td>${item.notes}</td>
                    <td>
                        <button class="btn" onclick="editCustomer(${item.customer.id})" style="background: #3498db; color: white; padding: 4px 8px; font-size: 12px;">Edit Customer</button>
                    </td>
                </tr>
            `).join('');
            
            if (completions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No completions recorded in this month</td></tr>';
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
            if (nsiFilter) {
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
                    <td>${item.completionDate ? new Date(item.completionDate).toLocaleDateString() : 'Never'}</td>
                    <td>${item.notes}</td>
                    <td><button class="btn" onclick="editCustomer(${item.customer.id})" style="background: #3498db; color: white; padding: 4px 8px; font-size: 12px;">Edit</button></td>
                </tr>
            `).join('');
            
            if (dueCustomers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No customers due in this month</td></tr>';
            }
            
            document.getElementById('monthlyCompletionsModal').style.display = 'block';
        }

        // Update statistics
        function updateStats() {
            // Get current NSI filter
            const nsiFilter = document.getElementById('nsiFilter').value;
            console.log('UpdateStats called with NSI filter:', nsiFilter);
            
            // Filter customers based on NSI status
            let filteredCustomers = customers;
            if (nsiFilter) {
                filteredCustomers = customers.filter(customer => {
                    const nsiStatus = customer.nsi_status || 'NSI';
                    return nsiStatus === nsiFilter;
                });
            }
            
            const total = filteredCustomers.length;
            console.log('Filtered customers count:', total, 'out of', customers.length);
            let overdue = 0;
            let dueSoon = 0;
            let current = 0;

            filteredCustomers.forEach(customer => {
                const inspection1Status = getInspectionStatus(customer, 'inspection1');
                const inspection2Status = customer.inspections_per_year === 2 ? 
                    getInspectionStatus(customer, 'inspection2') : null;
                
                if (inspection1Status === 'overdue' || (inspection2Status && inspection2Status === 'overdue')) {
                    overdue++;
                } else if (inspection1Status === 'due-this-month' || (inspection2Status && inspection2Status === 'due-this-month') ||
                          inspection1Status === 'due-last-month' || (inspection2Status && inspection2Status === 'due-last-month')) {
                    dueSoon++;
                } else {
                    current++;
                }
            });

            document.getElementById('totalCustomers').textContent = total;
            document.getElementById('overdueCount').textContent = overdue;
            document.getElementById('dueSoonCount').textContent = dueSoon;
            document.getElementById('currentCount').textContent = current;
            
                    // Update monthly statistics
        renderMonthlyStats();
    }

    // Toggle monthly statistics visibility
    function toggleMonthlyStats() {
        const statsContent = document.getElementById('monthlyStatsContent');
        const toggleText = document.getElementById('statsToggleText');
        
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
                  
                  // Debug logging for NSI filter issues
                  if (nsiFilter && !matchesNsi) {
                      console.log(`Filtering out: ${customer.name}, NSI Status: "${nsiStatus}", Filter: "${nsiFilter}"`);
                  }
                  
                  row.style.display = matchesSearch && matchesStatus && matchesNsi ? '' : 'none';
              });

              // Filter mobile cards
              mobileCards.forEach(card => {
                  const text = card.textContent.toLowerCase();
                  const onclickAttr = card.querySelector('button[onclick*="editCustomer"]').getAttribute('onclick');
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

        // Open scaffold add modal
        function openScaffAddModal() {
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

        // Close scaffold modal
        function closeScaffModal() {
            document.getElementById('scaffModal').style.display = 'none';
            editingScaffId = null;
        }

        // Update scaffold cost preview
        function updateScaffoldCostPreview() {
            const extraSensors = parseInt(document.getElementById('scaffExtraSensors').value) || 0;
            const weeklyCost = calculateWeeklyCost(extraSensors);
            const monthlyCost = calculateMonthlyCost(extraSensors);
            
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

        // Delete scaffold system
        async function deleteScaffoldSystem(id) {
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
                const weeklyCost = calculateWeeklyCost(system.extraSensors);
                const monthlyCost = calculateMonthlyCost(system.extraSensors);

                return `
                    <tr>
                        <td><strong>${system.pNumber}</strong></td>
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
                            <button class="btn" onclick="editScaffoldSystem(${system.id})" style="background: #3498db; color: white; margin-right: 5px; padding: 6px 12px;">Edit</button>
                            <button class="btn btn-danger" onclick="deleteScaffoldSystem(${system.id})" style="padding: 6px 12px;">Delete</button>
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
                    const weeklyCost = calculateWeeklyCost(system.extraSensors);
                    const monthlyCost = calculateMonthlyCost(system.extraSensors);

                    return `
                        <div class="customer-card">
                            <div class="customer-card-header">
                                <div>
                                    <div class="customer-name">${system.pNumber}</div>
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
                            
                            <div class="customer-actions">
                                <button class="btn" onclick="editScaffoldSystem(${system.id})" style="background: #3498db; color: white;">Edit</button>
                                <button class="btn btn-danger" onclick="deleteScaffoldSystem(${system.id})">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Apply current filters
            filterScaffTable();
        }

        // Update scaffold statistics
        function updateScaffoldStats() {
            const totalActiveSystems = scaffSystems.length;
            const totalWeeklyRevenue = scaffSystems.reduce((sum, sys) => sum + calculateWeeklyCost(sys.extraSensors), 0);
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
            
            const searchTerm = searchInput.value.toLowerCase();
            const statusFilterValue = statusFilter.value;
            const hireFilterValue = hireFilter.value;
            const rows = document.querySelectorAll('#scaffTableBody tr');
            const mobileCards = document.querySelectorAll('#mobileScaffCards .customer-card');

            // Filter desktop table
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const matchesSearch = text.includes(searchTerm);
                
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
                const matchesSearch = text.includes(searchTerm);
                
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
                        aVal = calculateWeeklyCost(a.extraSensors);
                        bVal = calculateWeeklyCost(b.extraSensors);
                        break;
                    case 'monthlyCost':
                        aVal = calculateMonthlyCost(a.extraSensors);
                        bVal = calculateMonthlyCost(b.extraSensors);
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

        // Close modals when clicking outside
        window.onclick = function(event) {
            const customerModal = document.getElementById('customerModal');
            const completionModal = document.getElementById('completionModal');
            const monthlyCompletionsModal = document.getElementById('monthlyCompletionsModal');
            
            if (event.target === customerModal) {
                closeModal();
            }
            if (event.target === completionModal) {
                closeCompletionModal();
            }
            if (event.target === monthlyCompletionsModal) {
                closeMonthlyCompletionsModal();
            }
        };