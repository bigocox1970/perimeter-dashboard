// Voice Control Dashboard Bridge
// Connects voice commands to dashboard data and operations

class VoiceDashboardBridge {
    constructor() {
        this.initialized = false;
        this.conversationState = null; // Tracks multi-step conversations (on-hire, off-hire)
    }

    // Initialize the bridge and override voice control methods
    async initialize() {
        if (this.initialized) return;

        // Wait for dashboard data to be loaded
        await this.waitForDashboard();

        // Override voice control query methods with real implementations
        this.connectQueryMethods();
        this.connectModificationMethods();

        this.initialized = true;
        console.log('✅ Voice Dashboard Bridge initialized');
    }

    // Wait for dashboard to be ready
    waitForDashboard() {
        return new Promise((resolve) => {
            const check = () => {
                // Check if global dashboard variables exist
                if (typeof customers !== 'undefined' && typeof scaffSystems !== 'undefined') {
                    // Ensure scaffold data is loaded
                    if (typeof loadScaffoldData === 'function' && scaffSystems.length === 0) {
                        console.log('🔄 Loading scaffold data for voice control...');
                        loadScaffoldData().then(() => {
                            console.log(`✅ Scaffold data loaded: ${scaffSystems.length} systems`);
                            resolve();
                        }).catch(() => {
                            console.warn('⚠️ Failed to load scaffold data, continuing anyway');
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    // Connect query methods to real data
    connectQueryMethods() {
        // Count systems on hire
        voiceControl.queryOnHireCount = async () => {
            try {
                const onHire = scaffSystems.filter(s => s.hireStatus === 'on-hire');
                const count = onHire.length;
                return {
                    success: true,
                    message: `You currently have ${count} scaffold ${count === 1 ? 'system' : 'systems'} on hire.`,
                    data: { count, systems: onHire }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Calculate monthly revenue
        voiceControl.queryMonthlyRevenue = async () => {
            try {
                const onHireSystems = scaffSystems.filter(s => s.hireStatus === 'on-hire');
                let total = 0;

                onHireSystems.forEach(system => {
                    const extraSensors = system.extraSensors || 0;
                    const baseWeekly = 100;
                    const sensorWeekly = extraSensors * 15;
                    const weeklyTotal = baseWeekly + sensorWeekly;
                    const monthly = weeklyTotal * 4;
                    total += monthly;
                });

                return {
                    success: true,
                    message: `Your total monthly revenue is £${total.toFixed(2)} (excluding VAT).`,
                    data: { total, systemCount: onHireSystems.length }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t calculate that.' };
            }
        };

        // Calculate weekly revenue
        voiceControl.queryWeeklyRevenue = async () => {
            try {
                const onHireSystems = scaffSystems.filter(s => s.hireStatus === 'on-hire');
                let total = 0;

                onHireSystems.forEach(system => {
                    const extraSensors = system.extraSensors || 0;
                    const baseWeekly = 100;
                    const sensorWeekly = extraSensors * 15;
                    const weeklyTotal = baseWeekly + sensorWeekly;
                    total += weeklyTotal;
                });

                return {
                    success: true,
                    message: `Your total weekly revenue is £${total.toFixed(2)} (excluding VAT).`,
                    data: { total, systemCount: onHireSystems.length }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t calculate that.' };
            }
        };

        // Count overdue inspections
        voiceControl.queryOverdueInspections = async () => {
            try {
                const today = new Date();
                let overdueCount = 0;

                customers.forEach(customer => {
                    customer.inspections.forEach(inspection => {
                        if (!inspection.completionDate) {
                            const dueDate = new Date(inspection.dueDate);
                            // Add 3 months for NSI window
                            const overdueDate = new Date(dueDate);
                            overdueDate.setMonth(overdueDate.getMonth() + 3);

                            if (today > overdueDate) {
                                overdueCount++;
                            }
                        }
                    });
                });

                return {
                    success: true,
                    message: `You have ${overdueCount} overdue ${overdueCount === 1 ? 'inspection' : 'inspections'}.`,
                    data: { count: overdueCount }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Get total customer count
        voiceControl.queryTotalCustomers = async () => {
            try {
                const count = customers.length;
                return {
                    success: true,
                    message: `You have ${count} ${count === 1 ? 'customer' : 'customers'} in total.`,
                    data: { count }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Get NSI customer count
        voiceControl.queryNSICustomers = async () => {
            try {
                const nsiCustomers = customers.filter(c => c.nsi_status === 'NSI');
                const count = nsiCustomers.length;

                // Calculate total inspections per year
                const totalInspections = nsiCustomers.reduce((sum, c) => sum + (c.inspections_per_year || 0), 0);

                return {
                    success: true,
                    message: `You have ${count} NSI ${count === 1 ? 'customer' : 'customers'}, with a total of ${totalInspections} ${totalInspections === 1 ? 'inspection' : 'inspections'} per year.`,
                    data: { count, customers: nsiCustomers, totalInspections }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Analyze data to answer custom analytical questions
        voiceControl.analyzeData = async (params) => {
            try {
                const question = params.question?.toLowerCase();

                if (!question) {
                    return { success: false, message: 'Please specify what you want to know.' };
                }

                // Busiest month analysis
                if (question.includes('busiest month') || question.includes('most maintenance')) {
                    // Make sure we have customer data loaded
                    if (typeof loadCustomerData === 'function') {
                        await loadCustomerData();
                    }

                    console.log('📊 Analyzing maintenance schedule. Customers count:', customers?.length || 0);

                    if (!customers || customers.length === 0) {
                        return { success: false, message: "I couldn't find any customer data to analyze." };
                    }

                    // Debug: Check first customer structure
                    if (customers.length > 0) {
                        console.log('📊 Sample customer fields:', Object.keys(customers[0]));
                        console.log('📊 Sample customer:', customers[0]);
                    }

                    const monthCounts = {};
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                       'July', 'August', 'September', 'October', 'November', 'December'];

                    customers.forEach(customer => {
                        // Count first inspection month (handle both camelCase and snake_case)
                        const firstMonth = customer.firstInspectionMonth || customer.first_inspection_month;
                        if (firstMonth) {
                            const month = monthNames[firstMonth - 1];
                            monthCounts[month] = (monthCounts[month] || 0) + 1;
                        }
                        // Count second inspection month if exists
                        const secondMonth = customer.secondInspectionMonth || customer.second_inspection_month;
                        if (secondMonth) {
                            const month = monthNames[secondMonth - 1];
                            monthCounts[month] = (monthCounts[month] || 0) + 1;
                        }
                    });

                    console.log('📊 Month counts:', monthCounts);

                    // Find busiest month
                    let busiestMonth = null;
                    let maxCount = 0;
                    for (const [month, count] of Object.entries(monthCounts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            busiestMonth = month;
                        }
                    }

                    if (busiestMonth && maxCount > 0) {
                        // Create breakdown
                        const breakdown = Object.entries(monthCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([month, count]) => `${month}: ${count}`)
                            .join(', ');

                        return {
                            success: true,
                            message: `Your busiest month is ${busiestMonth} with ${maxCount} maintenances due. Top 5: ${breakdown}.`,
                            data: { busiestMonth, count: maxCount, allMonths: monthCounts }
                        };
                    } else {
                        return { success: false, message: "I couldn't find any maintenance schedule data." };
                    }
                }

                // Average revenue analysis
                if (question.includes('average revenue') || question.includes('average cost')) {
                    // Make sure we have scaffold data loaded
                    if (typeof loadScaffoldData === 'function') {
                        await loadScaffoldData();
                    }

                    const onHireSystems = scaffSystems.filter(s => s.hireStatus === 'on-hire');
                    if (onHireSystems.length === 0) {
                        return { success: false, message: 'No systems are currently on hire.' };
                    }

                    let totalWeekly = 0;
                    onHireSystems.forEach(system => {
                        const extraSensors = system.extraSensors || 0;
                        const weeklyTotal = (100 + extraSensors * 15) * 1.2;
                        totalWeekly += weeklyTotal;
                    });

                    const avgWeekly = totalWeekly / onHireSystems.length;
                    const avgMonthly = avgWeekly * 4;

                    return {
                        success: true,
                        message: `Average weekly revenue per system is £${avgWeekly.toFixed(2)}, or £${avgMonthly.toFixed(2)} per month.`,
                        data: { avgWeekly, avgMonthly, systemCount: onHireSystems.length }
                    };
                }

                // NSI maintenance analysis
                if (question.includes('nsi') && (question.includes('maintenance') || question.includes('inspection'))) {
                    // Make sure we have customer data loaded
                    if (typeof loadCustomerData === 'function') {
                        await loadCustomerData();
                    }

                    const nsiCustomers = customers.filter(c => c.nsi_status === 'NSI');
                    const count = nsiCustomers.length;
                    const totalInspections = nsiCustomers.reduce((sum, c) => sum + (c.inspections_per_year || 0), 0);

                    return {
                        success: true,
                        message: `You have ${count} NSI approved ${count === 1 ? 'customer' : 'customers'}, requiring a total of ${totalInspections} ${totalInspections === 1 ? 'inspection' : 'inspections'} per year.`,
                        data: { count, totalInspections, customers: nsiCustomers }
                    };
                }

                // Default: Can't answer this question
                return {
                    success: false,
                    message: "I'm not sure how to analyze that. Try asking about busiest months, average revenue, or use the specific commands I know."
                };

            } catch (error) {
                console.error('Data analysis error:', error);
                return { success: false, message: 'Sorry, I couldn\'t analyze that data.' };
            }
        };

        // Search/filter systems by location or building type
        voiceControl.searchSystems = async (params) => {
            try {
                const searchTerm = params.searchTerm?.toLowerCase();
                const exclude = params.exclude || false; // true for "outside Oxford"

                if (!searchTerm) {
                    return { success: false, message: 'Please specify what to search for.' };
                }

                // Search across all location/address fields for on-hire systems
                const onHireSystems = scaffSystems.filter(s => s.hireStatus === 'on-hire');

                let matchingSystems = onHireSystems.filter(system => {
                    // Build searchable text from all relevant fields
                    const searchableText = [
                        system.siteContact,
                        system.address1,
                        system.address2,
                        system.postcode,
                        system.location
                    ].filter(Boolean).join(' ').toLowerCase();

                    const matches = searchableText.includes(searchTerm);

                    // If exclude=true (e.g., "outside Oxford"), invert the match
                    return exclude ? !matches : matches;
                });

                const count = matchingSystems.length;

                // Build response message
                let message;
                if (count === 0) {
                    message = exclude
                        ? `You don't have any scaffold systems on hire outside ${searchTerm}.`
                        : `You don't have any scaffold systems on hire at ${searchTerm} locations.`;
                } else {
                    // Create a list of matching systems with their locations
                    const systemsList = matchingSystems.map(s => {
                        const location = [s.address1, s.address2, s.postcode].filter(Boolean).join(', ') || s.siteContact;
                        return `${s.pNumber} at ${location}`;
                    }).join(', ');

                    const locationPhrase = exclude ? `outside ${searchTerm}` : `at ${searchTerm} locations`;
                    message = `You have ${count} scaffold ${count === 1 ? 'system' : 'systems'} on hire ${locationPhrase}: ${systemsList}.`;
                }

                return {
                    success: true,
                    message: message,
                    data: { count, systems: matchingSystems, searchTerm, exclude }
                };
            } catch (error) {
                console.error('Search systems error:', error);
                return { success: false, message: 'Sorry, I couldn\'t search for that information.' };
            }
        };

        // Get specific system info
        voiceControl.getSystemInfo = async (params) => {
            try {
                let pNumber = params.pNumber?.toUpperCase();
                if (!pNumber) {
                    return { success: false, message: 'Please specify a P number.' };
                }

                // Try to find the system - handle P1 vs P01 conversion
                let system = scaffSystems.find(s => s.pNumber === pNumber);
                if (!system && pNumber.match(/^P\d$/)) {
                    // P1-P9: try P01-P09
                    const paddedPNumber = 'P0' + pNumber.substring(1);
                    system = scaffSystems.find(s => s.pNumber === paddedPNumber);
                    if (system) pNumber = paddedPNumber;
                }

                if (!system) {
                    return { success: false, message: `I couldn't find system ${pNumber}.` };
                }

                const status = system.hireStatus === 'on-hire' ? 'on hire' : 'off hire';
                const sensors = 4 + (system.extraSensors || 0);
                const arcStatus = system.arcEnabled ? 'enabled' : 'disabled';

                // Build comprehensive details
                let message = `${pNumber} is currently ${status} with ${sensors} sensors. ARC is ${arcStatus}. `;

                // Add location/address
                const addressParts = [system.address1, system.address2, system.postcode].filter(p => p && p.trim());
                if (addressParts.length > 0) {
                    message += `Location: ${addressParts.join(', ')}. `;
                }

                // Add contacts
                if (system.siteContact) {
                    message += `Site contact: ${system.siteContact}`;
                    if (system.sitePhone) message += ` at ${system.sitePhone}`;
                    message += '. ';
                }

                if (system.appContact) {
                    message += `Customer/App contact: ${system.appContact}`;
                    if (system.appPhone) message += ` at ${system.appPhone}`;
                    message += '. ';
                }

                // Add ARC phone if available
                if (system.arcPhone) {
                    message += `ARC phone: ${system.arcPhone}. `;
                }

                return {
                    success: true,
                    message: message.trim(),
                    data: system
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Locate a specific system
        voiceControl.locateSystem = async (params) => {
            try {
                let pNumber = params.pNumber?.toUpperCase();
                if (!pNumber) {
                    return { success: false, message: 'Please specify a P number.' };
                }

                // Try to find the system - handle P1 vs P01 conversion
                let system = scaffSystems.find(s => s.pNumber === pNumber);
                if (!system && pNumber.match(/^P\d$/)) {
                    // P1-P9: try P01-P09
                    const paddedPNumber = 'P0' + pNumber.substring(1);
                    system = scaffSystems.find(s => s.pNumber === paddedPNumber);
                    if (system) pNumber = paddedPNumber;
                }

                if (!system) {
                    return { success: false, message: `I couldn't find system ${pNumber}.` };
                }

                const status = system.hireStatus === 'on-hire' ? 'on hire' : 'off hire';

                // Build address from new address fields
                const addressParts = [system.address1, system.address2, system.postcode].filter(p => p && p.trim());
                const location = addressParts.length > 0 ? addressParts.join(', ') : system.siteContact;

                let message = `${pNumber} is currently at ${location}. `;
                message += `It's ${status}`;

                if (system.appContact) {
                    message += ` with ${system.appContact}`;
                }

                message += '.';

                return {
                    success: true,
                    message,
                    data: system
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Query systems by hire status
        voiceControl.queryOffHireCount = async () => {
            try {
                const offHire = scaffSystems.filter(s => s.hireStatus === 'off-hire');
                const count = offHire.length;
                return {
                    success: true,
                    message: `You have ${count} scaffold ${count === 1 ? 'system' : 'systems'} off hire.`,
                    data: { count, systems: offHire }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Count systems in stock (off-hire)
        voiceControl.countInStock = async () => {
            try {
                const inStock = scaffSystems.filter(s => s.hireStatus === 'off-hire');
                const count = inStock.length;

                if (count === 0) {
                    return {
                        success: true,
                        message: 'You currently have no systems in stock. All systems are on hire.',
                        data: { count: 0, systems: [] }
                    };
                }

                let message = `You have ${count} scaffold ${count === 1 ? 'alarm' : 'alarms'} in stock.`;

                return {
                    success: true,
                    message,
                    data: { count, systems: inStock }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // List systems in stock (off-hire)
        voiceControl.listInStock = async () => {
            try {
                const inStock = scaffSystems.filter(s => s.hireStatus === 'off-hire');
                const count = inStock.length;

                if (count === 0) {
                    return {
                        success: true,
                        message: 'You currently have no systems in stock. All systems are on hire.',
                        data: { count: 0, systems: [] }
                    };
                }

                // Build detailed list
                const systemList = inStock.map(s => {
                    const addressParts = [s.address1, s.address2, s.postcode].filter(p => p && p.trim());
                    const location = addressParts.length > 0 ? ` at ${addressParts.join(', ')}` : '';
                    return `${s.pNumber}${location}`;
                }).join(', ');

                let message = `You have ${count} ${count === 1 ? 'system' : 'systems'} in stock: ${systemList}.`;

                return {
                    success: true,
                    message,
                    data: { count, systems: inStock }
                };
            } catch (error) {
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };

        // Check maintenance due this month
        voiceControl.checkMaintenanceDue = async (params) => {
            try {
                const today = new Date();
                let targetMonthNumber = today.getMonth() + 1; // 1-12, default to current month
                let targetYear = today.getFullYear();
                let timeframeDescription = 'this month';

                // Parse timeframe from parameters
                if (params && params.timeframe) {
                    const timeframe = params.timeframe.toLowerCase();

                    if (timeframe.includes('next month')) {
                        targetMonthNumber = today.getMonth() + 2; // getMonth() is 0-indexed
                        if (targetMonthNumber > 12) {
                            targetMonthNumber = 1;
                            targetYear++;
                        }
                        timeframeDescription = 'next month';
                    } else if (timeframe.includes('november') || timeframe.includes('nov')) {
                        targetMonthNumber = 11;
                        timeframeDescription = 'in November';
                        // If November already passed this year, assume next year
                        if (today.getMonth() >= 10) { // October or later
                            targetYear++;
                        }
                    } else if (timeframe.includes('december') || timeframe.includes('dec')) {
                        targetMonthNumber = 12;
                        timeframeDescription = 'in December';
                        if (today.getMonth() >= 11) targetYear++;
                    } else if (timeframe.includes('january') || timeframe.includes('jan')) {
                        targetMonthNumber = 1;
                        timeframeDescription = 'in January';
                        if (today.getMonth() >= 0 && today.getMonth() < 11) targetYear++;
                    } else if (timeframe.includes('february') || timeframe.includes('feb')) {
                        targetMonthNumber = 2;
                        timeframeDescription = 'in February';
                    } else if (timeframe.includes('march') || timeframe.includes('mar')) {
                        targetMonthNumber = 3;
                        timeframeDescription = 'in March';
                    } else if (timeframe.includes('april') || timeframe.includes('apr')) {
                        targetMonthNumber = 4;
                        timeframeDescription = 'in April';
                    } else if (timeframe.includes('may')) {
                        targetMonthNumber = 5;
                        timeframeDescription = 'in May';
                    } else if (timeframe.includes('june') || timeframe.includes('jun')) {
                        targetMonthNumber = 6;
                        timeframeDescription = 'in June';
                    } else if (timeframe.includes('july') || timeframe.includes('jul')) {
                        targetMonthNumber = 7;
                        timeframeDescription = 'in July';
                    } else if (timeframe.includes('august') || timeframe.includes('aug')) {
                        targetMonthNumber = 8;
                        timeframeDescription = 'in August';
                    } else if (timeframe.includes('september') || timeframe.includes('sep')) {
                        targetMonthNumber = 9;
                        timeframeDescription = 'in September';
                    } else if (timeframe.includes('october') || timeframe.includes('oct')) {
                        targetMonthNumber = 10;
                        timeframeDescription = 'in October';
                    }
                }

                const dueMaintenances = [];

                customers.forEach(customer => {
                    // Check if Inspection 1 is due in target month
                    if (customer.first_inspection_month === targetMonthNumber) {
                        const history = customer.inspection_history?.inspection1 || [];
                        const dueMonth = customer.first_inspection_month;

                        // NSI 3-month window: month before due, due month, month after
                        const monthBeforeDue = dueMonth - 1 <= 0 ? 12 + (dueMonth - 1) : dueMonth - 1;
                        const monthAfterDue = dueMonth + 1 > 12 ? (dueMonth + 1) - 12 : dueMonth + 1;

                        let yearBeforeDue = targetYear;
                        let yearAfterDue = targetYear;
                        if (dueMonth === 1 && monthBeforeDue === 12) yearBeforeDue = targetYear - 1;
                        if (dueMonth === 12 && monthAfterDue === 1) yearAfterDue = targetYear + 1;

                        const windowStart = new Date(yearBeforeDue, monthBeforeDue - 1, 1);
                        const windowEnd = new Date(yearAfterDue, monthAfterDue, 0);

                        // Check if completed this year within NSI window
                        const thisYearCompletions = history.filter(h => {
                            const completionDate = new Date(h.date);
                            return completionDate >= windowStart && completionDate <= windowEnd;
                        });

                        if (thisYearCompletions.length === 0) {
                            dueMaintenances.push({
                                customer: customer.name,
                                type: 'Inspection 1',
                                dueMonth: targetMonthNumber
                            });
                        }
                    }

                    // Check if Inspection 2 is due in target month
                    if (customer.inspections_per_year === 2 && customer.second_inspection_month === targetMonthNumber) {
                        const history = customer.inspection_history?.inspection2 || [];
                        const dueMonth = customer.second_inspection_month;

                        // NSI 3-month window
                        const monthBeforeDue = dueMonth - 1 <= 0 ? 12 + (dueMonth - 1) : dueMonth - 1;
                        const monthAfterDue = dueMonth + 1 > 12 ? (dueMonth + 1) - 12 : dueMonth + 1;

                        let yearBeforeDue = targetYear;
                        let yearAfterDue = targetYear;
                        if (dueMonth === 1 && monthBeforeDue === 12) yearBeforeDue = targetYear - 1;
                        if (dueMonth === 12 && monthAfterDue === 1) yearAfterDue = targetYear + 1;

                        const windowStart = new Date(yearBeforeDue, monthBeforeDue - 1, 1);
                        const windowEnd = new Date(yearAfterDue, monthAfterDue, 0);

                        // Check if completed this year within NSI window
                        const thisYearCompletions = history.filter(h => {
                            const completionDate = new Date(h.date);
                            return completionDate >= windowStart && completionDate <= windowEnd;
                        });

                        if (thisYearCompletions.length === 0) {
                            dueMaintenances.push({
                                customer: customer.name,
                                type: 'Inspection 2',
                                dueMonth: targetMonthNumber
                            });
                        }
                    }
                });

                const count = dueMaintenances.length;

                if (count === 0) {
                    return {
                        success: true,
                        message: `You have no maintenance tasks due ${timeframeDescription}.`,
                        data: { count: 0, maintenances: [] }
                    };
                }

                // Build list of customers with due maintenance
                const customerList = dueMaintenances.map(m => m.customer).join(', ');
                let message = `You have ${count} maintenance ${count === 1 ? 'task' : 'tasks'} due ${timeframeDescription} for: ${customerList}.`;

                return {
                    success: true,
                    message,
                    data: { count, maintenances: dueMaintenances }
                };
            } catch (error) {
                console.error('Error checking maintenance due:', error);
                return { success: false, message: 'Sorry, I couldn\'t retrieve that information.' };
            }
        };
    }

    // Complete on-hire workflow
    async completeOnHire(state) {
        try {
            const system = scaffSystems.find(s => s.id === state.systemId);
            if (!system) {
                this.conversationState = null;
                return { success: false, message: `System ${state.pNumber} not found.` };
            }

            const hireDate = new Date().toISOString().split('T')[0];

            // Update system in database
            const { error: updateError } = await supabase
                .from(SCAFF_TABLE_NAME)
                .update({
                    hire_status: 'on-hire',
                    customer_name: state.data.customerName,
                    site_contact: '',
                    address1: state.data.address,
                    address2: '',
                    postcode: '',
                    start_date: hireDate,
                    last_invoice_date: hireDate
                })
                .eq('id', state.systemId);

            if (updateError) throw updateError;

            // Reload scaffold data
            await loadScaffoldData();

            // Get updated system
            const updatedSystem = scaffSystems.find(s => s.id === state.systemId);

            // Create rental history
            await createRentalHistory(updatedSystem);

            this.conversationState = null;

            return {
                success: true,
                message: `Perfect. I've put ${state.pNumber} on hire to ${state.data.customerName} at ${state.data.address}. The rental history has been created and you're all set.`
            };
        } catch (error) {
            console.error('Error completing on-hire:', error);
            this.conversationState = null;
            return { success: false, message: `Sorry, I couldn't complete the on-hire. ${error.message}` };
        }
    }

    // Complete update details workflow
    async completeUpdateDetails(state, newValue) {
        try {
            const system = scaffSystems.find(s => s.id === state.systemId);
            if (!system) {
                this.conversationState = null;
                return { success: false, message: `System ${state.pNumber} not found.` };
            }

            // Map field key to database column
            const fieldMap = {
                siteContact: 'site_contact',
                appContact: 'app_contact',
                address1: 'address1',
                address2: 'address2',
                postcode: 'postcode',
                sitePhone: 'site_phone',
                appPhone: 'app_phone',
                arcContact: 'arc_contact',
                arcPhone: 'arc_phone',
                extraSensors: 'extra_sensors'
            };

            const dbColumn = fieldMap[state.field];
            if (!dbColumn) {
                this.conversationState = null;
                return { success: false, message: 'Invalid field.' };
            }

            // Update in database
            const updates = { [dbColumn]: newValue };
            const { error } = await supabase
                .from(SCAFF_TABLE_NAME)
                .update(updates)
                .eq('id', state.systemId);

            if (error) throw error;

            // Reload data
            await loadScaffoldData();

            this.conversationState = null;

            return {
                success: true,
                message: `Done. I've updated the ${state.fieldName} for ${state.pNumber} to ${newValue}.`
            };

        } catch (error) {
            console.error('Error completing update details:', error);
            this.conversationState = null;
            return { success: false, message: `Sorry, I couldn't complete the update. ${error.message}` };
        }
    }

    // Complete off-hire workflow
    async completeOffHire(state, offHireDate) {
        try {
            const system = scaffSystems.find(s => s.id === state.systemId);
            if (!system) {
                this.conversationState = null;
                return { success: false, message: `System ${state.pNumber} not found.` };
            }

            // Close rental history
            const closedRental = await closeRentalHistory(state.systemId, offHireDate);

            // If no active rental found, create historical one
            if (!closedRental) {
                const historicalRental = {
                    system_id: system.id,
                    p_number: system.pNumber,
                    hire_date: system.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
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

            // Update system status
            const { error } = await supabase
                .from(SCAFF_TABLE_NAME)
                .update({
                    hire_status: 'off-hire',
                    address1: 'In Stock',
                    address2: '',
                    postcode: ''
                })
                .eq('id', state.systemId);

            if (error) throw error;

            // Reload scaffold data
            await loadScaffoldData();

            this.conversationState = null;

            return {
                success: true,
                message: `Done. ${state.pNumber} is now off-hire and back in stock. I've saved it to the rental history.`
            };
        } catch (error) {
            console.error('Error completing off-hire:', error);
            this.conversationState = null;
            return { success: false, message: `Sorry, I couldn't complete the off-hire. ${error.message}` };
        }
    }

    // Parse natural language dates into YYYY-MM-DD format
    parseNaturalDate(input) {
        const lowerInput = input.toLowerCase().trim();

        // Handle "today"
        if (lowerInput === 'today') {
            return new Date().toISOString().split('T')[0];
        }

        // Handle "yesterday"
        if (lowerInput === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        }

        // Handle "last [day of week]" e.g., "last Thursday"
        const lastDayMatch = lowerInput.match(/last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
        if (lastDayMatch) {
            const dayName = lastDayMatch[1];
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());
            const today = new Date();
            const currentDay = today.getDay();

            let daysBack = currentDay - targetDay;
            if (daysBack <= 0) daysBack += 7; // Go back to last week if target day hasn't happened yet this week

            const resultDate = new Date();
            resultDate.setDate(today.getDate() - daysBack);
            return resultDate.toISOString().split('T')[0];
        }

        // Handle formats like "16th of the 10th 2025" or "16th October 2025"
        const ordinalMatch = input.match(/(\d+)(?:st|nd|rd|th)?\s+(?:of\s+)?(?:the\s+)?(\d+|january|february|march|april|may|june|july|august|september|october|november|december)(?:th)?\s+(\d{4})/i);
        if (ordinalMatch) {
            const day = parseInt(ordinalMatch[1]);
            let month = ordinalMatch[2];
            const year = parseInt(ordinalMatch[3]);

            // Convert month name to number
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            const monthIndex = monthNames.indexOf(month.toLowerCase());
            if (monthIndex !== -1) {
                month = monthIndex + 1;
            } else {
                month = parseInt(month);
            }

            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }

        // Handle DD/MM/YYYY format
        const slashMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (slashMatch) {
            const day = parseInt(slashMatch[1]);
            const month = parseInt(slashMatch[2]);
            const year = parseInt(slashMatch[3]);
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }

        // Handle YYYY-MM-DD format (already correct)
        const isoMatch = input.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            return input;
        }

        // Couldn't parse
        return null;
    }

    //Connect modification methods to real operations
    connectModificationMethods() {
        const self = this; // Capture this for use in nested functions

        // Handle conversation continuation for multi-step workflows
        voiceControl.continueConversation = async (userInput) => {
            if (!self.conversationState) {
                return { success: false, message: "I'm not sure what you're referring to. Can you start over?" };
            }

            const state = self.conversationState;
            console.log('📍 Continuing conversation:', state);

            // ON-HIRE workflow
            if (state.workflow === 'on-hire') {
                if (state.step === 'customer_name') {
                    // Clean up the response - extract just the name
                    let customerName = userInput;
                    customerName = customerName.replace(/^(?:the\s+)?(?:customer|site\s+contact|name)\s+(?:is\s+|should\s+be\s+)?/i, '');
                    customerName = customerName.replace(/^(?:it'?s\s+)/i, '');
                    customerName = customerName.trim();

                    state.data.customerName = customerName;
                    state.step = 'address';
                    return {
                        success: true,
                        needsMoreInfo: true,
                        message: `Thanks. And what's the site address or location?`
                    };
                } else if (state.step === 'address') {
                    // Clean up the response - extract just the address
                    let address = userInput;
                    address = address.replace(/^(?:the\s+)?(?:address|location|site)\s+(?:is\s+|should\s+be\s+)?/i, '');
                    address = address.replace(/^(?:it'?s\s+(?:at\s+|located\s+at\s+)?)/i, '');
                    address = address.trim();

                    state.data.address = address;
                    // We have enough info, complete the on-hire
                    return await self.completeOnHire(state);
                }
            }

            // OFF-HIRE workflow
            if (state.workflow === 'off-hire') {
                if (state.step === 'off_hire_date') {
                    const parsedDate = self.parseNaturalDate(userInput);
                    if (!parsedDate) {
                        return {
                            success: false,
                            needsMoreInfo: true,
                            message: `I couldn't understand that date. Please say it in a different way, like "today", "yesterday", "last Thursday", or "16th October 2025".`
                        };
                    }
                    return await self.completeOffHire(state, parsedDate);
                }
            }

            // UPDATE DETAILS workflow
            if (state.workflow === 'update-details') {
                if (state.step === 'get_value') {
                    // Extract the actual value from the user's conversational response
                    // User might say "Mark Murphy" or "The site contact should be Mark Murphy"
                    // We need to extract just "Mark Murphy"

                    let newValue = userInput;
                    console.log('🔍 Value extraction - Original input:', newValue);

                    // AGGRESSIVE extraction: Strip ALL conversational fluff
                    // This needs to handle any variation the user might say

                    // First pass: Remove complete conversational phrases at the start
                    const startPhrases = [
                        /^(?:the\s+)?(?:correct\s+|new\s+)?site\s+contact\s+(?:name\s+)?(?:is\s+|should\s+be\s+|will\s+be\s+)/i,
                        /^(?:the\s+)?(?:correct\s+|new\s+)?customer\s+(?:name\s+)?(?:is\s+|should\s+be\s+|will\s+be\s+)/i,
                        /^(?:the\s+)?(?:correct\s+|new\s+)?app\s+contact\s+(?:name\s+)?(?:is\s+|should\s+be\s+|will\s+be\s+)/i,
                        /^(?:the\s+)?(?:correct\s+|new\s+)?address\s+(?:is\s+|should\s+be\s+|will\s+be\s+)/i,
                        /^(?:the\s+)?(?:correct\s+|new\s+)?location\s+(?:is\s+|should\s+be\s+|will\s+be\s+)/i,
                        /^(?:change\s+it\s+to\s+)/i,
                        /^(?:update\s+it\s+to\s+)/i,
                        /^(?:set\s+it\s+to\s+)/i,
                        /^(?:make\s+it\s+)/i,
                        /^(?:it\s+is\s+)/i,
                        /^(?:it\s+should\s+be\s+)/i,
                        /^(?:it\s+will\s+be\s+)/i,
                        /^(?:it's\s+)/i
                    ];

                    let cleaned = false;
                    for (const pattern of startPhrases) {
                        const before = newValue;
                        newValue = newValue.replace(pattern, '');
                        if (before !== newValue) {
                            console.log('✂️ Matched pattern:', pattern, '| Result:', newValue);
                            cleaned = true;
                            break; // Only apply first matching pattern
                        }
                    }

                    // Remove trailing conversational phrases
                    newValue = newValue.split(/\s+and\s+please\s+/i)[0];
                    newValue = newValue.split(/\s+also\s+/i)[0];
                    newValue = newValue.trim();

                    // If nothing matched, try a more aggressive approach
                    if (!cleaned) {
                        // Look for patterns like "X is Y" or "X should be Y" and extract Y
                        const extractionMatch = newValue.match(/(?:is|should\s+be|will\s+be)\s+(.+)$/i);
                        if (extractionMatch) {
                            newValue = extractionMatch[1].trim();
                            console.log('✂️ Extracted using "is/should be" pattern:', newValue);
                        }
                    }

                    console.log('✅ Final extracted value:', newValue);

                    return await self.completeUpdateDetails(state, newValue);
                }
            }

            return { success: false, message: "Sorry, I got confused. Let's start over." };
        };

        // Add/Install new scaffold system with conversational prompting
        voiceControl.addScaffoldSystem = async (params) => {
            try {
                console.log('📝 Adding scaffold system with params:', params);

                // Required fields for scaffold system
                const requiredFields = {
                    pNumber: params.pNumber,
                    siteContact: params.siteContact || params.customer,
                    appContact: params.appContact || params.scaffolder || params.contractor,
                    startDate: params.startDate || params.installDate || new Date().toISOString().split('T')[0],
                    lastInvoiceDate: params.lastInvoiceDate || params.startDate || new Date().toISOString().split('T')[0]
                };

                // Optional fields
                const optionalFields = {
                    extraSensors: params.extraSensors || 0,
                    sitePhone: params.sitePhone,
                    address1: params.address1 || params.siteAddress || params.location || params.address || '',
                    address2: params.address2 || '',
                    postcode: params.postcode || '',
                    appPhone: params.appPhone,
                    arcEnabled: params.arcEnabled || false,
                    arcContact: params.arcContact,
                    arcPhone: params.arcPhone,
                    hireStatus: params.hireStatus || 'on-hire'
                };

                // Check what's missing
                const missing = [];
                if (!requiredFields.pNumber) missing.push('P number');
                if (!requiredFields.siteContact) missing.push('site contact name');
                if (!requiredFields.appContact) missing.push('app contact name (scaffolder/contractor)');

                // If we have missing required fields, ask for them
                if (missing.length > 0) {
                    const missingList = missing.join(', ');
                    return {
                        success: false,
                        needsMoreInfo: true,
                        missingFields: missing,
                        message: `I need a few more details. Please provide: ${missingList}.`,
                        collectedSoFar: { ...requiredFields, ...optionalFields }
                    };
                }

                // Calculate costs
                const extraSensors = optionalFields.extraSensors || 0;
                const baseWeekly = 100;
                const sensorWeekly = extraSensors * 15;
                const weeklyTotal = baseWeekly + sensorWeekly;
                const weeklyCost = weeklyTotal * 1.2; // With VAT
                const monthlyCost = weeklyCost * 4;

                // Build the new system object
                const newSystem = {
                    id: Date.now(),
                    p_number: requiredFields.pNumber.toUpperCase(),
                    extra_sensors: extraSensors,
                    site_contact: requiredFields.siteContact,
                    address1: optionalFields.address1 || '',
                    address2: optionalFields.address2 || '',
                    postcode: optionalFields.postcode || '',
                    site_phone: optionalFields.sitePhone || '',
                    app_contact: requiredFields.appContact,
                    app_phone: optionalFields.appPhone || '',
                    start_date: requiredFields.startDate,
                    last_invoice_date: requiredFields.lastInvoiceDate,
                    arc_enabled: optionalFields.arcEnabled || false,
                    arc_contact: optionalFields.arcContact || '',
                    arc_phone: optionalFields.arcPhone || '',
                    hire_status: 'on-hire'
                };

                // Insert into Supabase
                const { data, error } = await supabase
                    .from(SCAFF_TABLE_NAME)
                    .insert([newSystem])
                    .select();

                if (error) throw error;

                // Add to local array
                const localSystem = {
                    id: data[0].id,
                    pNumber: newSystem.p_number,
                    extraSensors: newSystem.extra_sensors,
                    siteContact: newSystem.site_contact,
                    address1: newSystem.address1,
                    address2: newSystem.address2,
                    postcode: newSystem.postcode,
                    sitePhone: newSystem.site_phone,
                    appContact: newSystem.app_contact,
                    appPhone: newSystem.app_phone,
                    startDate: newSystem.start_date,
                    lastInvoiceDate: newSystem.last_invoice_date,
                    arcEnabled: newSystem.arc_enabled,
                    arcContact: newSystem.arc_contact,
                    arcPhone: newSystem.arc_phone,
                    hireStatus: newSystem.hire_status
                };

                scaffSystems.push(localSystem);

                // Refresh UI
                if (typeof renderScaffTable === 'function') renderScaffTable();
                if (typeof renderMobileScaffCards === 'function') renderMobileScaffCards();
                if (typeof updateScaffStats === 'function') updateScaffStats();

                let message = `Successfully installed ${newSystem.p_number}${optionalFields.address1 ? ' at ' + optionalFields.address1 : ''}. `;
                message += `It's now on hire with ${4 + extraSensors} sensors at £${weeklyCost.toFixed(2)} per week.`;

                // Ask about ARC if not provided
                if (!optionalFields.arcEnabled) {
                    message += ' Would you like to add ARC details for this system?';
                }

                return {
                    success: true,
                    message,
                    data: localSystem,
                    askAboutARC: !optionalFields.arcEnabled
                };

            } catch (error) {
                console.error('Error adding scaffold system:', error);
                return { success: false, message: `Sorry, I couldn't add that system. ${error.message}` };
            }
        };

        // Update hire status - FULLY VOICE-DRIVEN workflow
        voiceControl.updateHireStatus = async (params) => {
            try {
                // FORCE RELOAD scaffold data to ensure we have latest
                console.log('🔄 Reloading scaffold data before processing...');
                await loadScaffoldData();

                let pNumber = params.pNumber?.toUpperCase();
                const newStatus = params.status?.toLowerCase();
                const location = params.location; // Optional: user might specify location instead of P number

                console.log('🔍 Looking for system:', { pNumber, location, status: newStatus });

                if (!newStatus) {
                    return { success: false, message: 'Please specify the status (on hire or off hire).' };
                }

                let system;

                // If P number provided, find by P number
                if (pNumber) {
                    // Try to find system - first as-is, then with leading zero (P1 -> P01)
                    system = scaffSystems.find(s => s.pNumber?.toUpperCase() === pNumber);

                    if (!system && pNumber.match(/^P\d$/)) {
                        // Try with leading zero: P1 -> P01
                        const paddedPNumber = 'P0' + pNumber.substring(1);
                        system = scaffSystems.find(s => s.pNumber?.toUpperCase() === paddedPNumber);
                        if (system) {
                            pNumber = paddedPNumber; // Update for later use
                            console.log('✅ Found system with padded number:', paddedPNumber);
                        }
                    }

                    if (!system) {
                        return {
                            success: false,
                            message: `I couldn't find system ${pNumber}. I can see ${scaffSystems.length} systems. Available systems are ${scaffSystems.map(s => s.pNumber).slice(0, 5).join(', ')}.`
                        };
                    }
                }
                // If location provided instead, search by location
                else if (location) {
                    const searchTerm = location.toLowerCase();
                    const matchingSystems = scaffSystems.filter(s => {
                        const searchableText = [
                            s.siteContact,
                            s.address1,
                            s.address2,
                            s.postcode,
                            s.location
                        ].filter(Boolean).join(' ').toLowerCase();
                        return searchableText.includes(searchTerm);
                    });

                    if (matchingSystems.length === 0) {
                        return {
                            success: false,
                            message: `I couldn't find any systems at ${location}. Could you provide the P number instead?`
                        };
                    } else if (matchingSystems.length > 1) {
                        const systemsList = matchingSystems.map(s => `${s.pNumber} at ${s.address1 || s.siteContact}`).join(', ');
                        return {
                            success: false,
                            message: `I found ${matchingSystems.length} systems matching ${location}: ${systemsList}. Please specify which P number you meant.`
                        };
                    } else {
                        // Exactly one match - perfect!
                        system = matchingSystems[0];
                        pNumber = system.pNumber;
                        console.log('✅ Found system by location:', pNumber, 'at', system.address1);
                    }
                }
                // Neither P number nor location provided
                else {
                    return { success: false, message: 'Please specify either a P number or location.' };
                }

                if (!system) {
                    return { success: false, message: 'I couldn\'t find that system.' };
                }

                const validStatuses = ['on-hire', 'off-hire'];
                if (!validStatuses.includes(newStatus)) {
                    return { success: false, message: 'Status must be either on hire or off hire.' };
                }

                // Check if status is already correct
                if (system.hireStatus === newStatus) {
                    const statusText = newStatus === 'on-hire' ? 'already on hire' : 'already off hire';
                    return { success: false, message: `System ${pNumber} is ${statusText}.` };
                }

                // VOICE-DRIVEN workflow - save state and ask for details
                if (newStatus === 'on-hire') {
                    // Start ON-HIRE conversation
                    self.conversationState = {
                        workflow: 'on-hire',
                        step: 'customer_name',
                        systemId: system.id,
                        pNumber: pNumber,
                        data: {}
                    };

                    return {
                        success: true,
                        needsMoreInfo: true,
                        message: `I'm going to need some more information. What's the customer name or site name for ${pNumber}?`
                    };
                } else {
                    // OFF-HIRE workflow
                    // Check if date was provided in the initial command
                    if (params.offHireDate) {
                        // Date provided - complete immediately
                        const parsedDate = self.parseNaturalDate(params.offHireDate);
                        if (!parsedDate) {
                            return {
                                success: false,
                                message: `I couldn't understand the date "${params.offHireDate}". Please try again with a different format.`
                            };
                        }

                        // Create state for completeOffHire
                        self.conversationState = {
                            workflow: 'off-hire',
                            step: 'off_hire_date',
                            systemId: system.id,
                            pNumber: pNumber,
                            data: {}
                        };

                        return await self.completeOffHire(self.conversationState, parsedDate);
                    } else {
                        // No date provided - start conversation
                        self.conversationState = {
                            workflow: 'off-hire',
                            step: 'off_hire_date',
                            systemId: system.id,
                            pNumber: pNumber,
                            data: {}
                        };

                        return {
                            success: true,
                            needsMoreInfo: true,
                            message: `What date should I mark ${pNumber} as off-hire? Say today for today's date.`
                        };
                    }
                }
            } catch (error) {
                console.error('Error updating hire status:', error);
                return { success: false, message: 'Sorry, I couldn\'t update that. Error: ' + error.message };
            }
        };

        // Update system details (site contact, app contact, address, etc.)
        voiceControl.updateSystemDetails = async (params) => {
            try {
                await loadScaffoldData();

                let pNumber = params.pNumber?.toUpperCase();
                const location = params.location;

                let system;

                // If P number provided, find by P number
                if (pNumber) {
                    // Try to find system - first as-is, then with leading zero
                    system = scaffSystems.find(s => s.pNumber?.toUpperCase() === pNumber);

                    if (!system && pNumber.match(/^P\d$/)) {
                        const paddedPNumber = 'P0' + pNumber.substring(1);
                        system = scaffSystems.find(s => s.pNumber?.toUpperCase() === paddedPNumber);
                        if (system) {
                            pNumber = paddedPNumber;
                        }
                    }

                    if (!system) {
                        return { success: false, message: `I couldn't find system ${pNumber}.` };
                    }
                }
                // If location provided instead, search by location
                else if (location) {
                    const searchTerm = location.toLowerCase();
                    const matchingSystems = scaffSystems.filter(s => {
                        const searchableText = [
                            s.siteContact,
                            s.address1,
                            s.address2,
                            s.postcode,
                            s.location
                        ].filter(Boolean).join(' ').toLowerCase();
                        return searchableText.includes(searchTerm);
                    });

                    if (matchingSystems.length === 0) {
                        return { success: false, message: `I couldn't find any systems at ${location}. Could you provide the P number instead?` };
                    } else if (matchingSystems.length > 1) {
                        const systemsList = matchingSystems.map(s => `${s.pNumber} at ${s.address1 || s.siteContact}`).join(', ');
                        return { success: false, message: `I found ${matchingSystems.length} systems matching ${location}: ${systemsList}. Please specify which P number you meant.` };
                    } else {
                        // Exactly one match
                        system = matchingSystems[0];
                        pNumber = system.pNumber;
                    }
                }
                // Neither provided
                else {
                    return { success: false, message: 'Please specify either a P number or location.' };
                }

                if (!system) {
                    return { success: false, message: 'I couldn\'t find that system.' };
                }

                // Check what fields they want to update
                const requestedFields = [];
                if (params.siteContact !== undefined) requestedFields.push({ key: 'siteContact', name: 'site contact', value: params.siteContact });
                if (params.appContact !== undefined) requestedFields.push({ key: 'appContact', name: 'customer', value: params.appContact });
                if (params.address1 !== undefined) requestedFields.push({ key: 'address1', name: 'address', value: params.address1 });
                if (params.address2 !== undefined) requestedFields.push({ key: 'address2', name: 'address line 2', value: params.address2 });
                if (params.postcode !== undefined) requestedFields.push({ key: 'postcode', name: 'postcode', value: params.postcode });
                if (params.sitePhone !== undefined) requestedFields.push({ key: 'sitePhone', name: 'site phone', value: params.sitePhone });
                if (params.appPhone !== undefined) requestedFields.push({ key: 'appPhone', name: 'customer phone', value: params.appPhone });
                if (params.arcContact !== undefined) requestedFields.push({ key: 'arcContact', name: 'ARC contact', value: params.arcContact });
                if (params.arcPhone !== undefined) requestedFields.push({ key: 'arcPhone', name: 'ARC phone', value: params.arcPhone });
                if (params.extraSensors !== undefined) requestedFields.push({ key: 'extraSensors', name: 'extra sensors', value: params.extraSensors });

                // Check if they specified what to update but not the value
                const fieldsWithoutValues = requestedFields.filter(f => f.value === null || f.value === '');

                if (fieldsWithoutValues.length > 0) {
                    // Start conversation to get the missing value
                    const field = fieldsWithoutValues[0];

                    self.conversationState = {
                        workflow: 'update-details',
                        step: 'get_value',
                        systemId: system.id,
                        pNumber: pNumber,
                        field: field.key,
                        fieldName: field.name,
                        data: {}
                    };

                    return {
                        success: true,
                        needsMoreInfo: true,
                        message: `What would you like to change the ${field.name} to?`
                    };
                }

                // Build update object with values
                const updates = {};
                if (params.siteContact) updates.site_contact = params.siteContact;
                if (params.appContact) updates.app_contact = params.appContact;
                if (params.address1) updates.address1 = params.address1;
                if (params.address2) updates.address2 = params.address2;
                if (params.postcode) updates.postcode = params.postcode;
                if (params.sitePhone) updates.site_phone = params.sitePhone;
                if (params.appPhone) updates.app_phone = params.appPhone;
                if (params.arcContact) updates.arc_contact = params.arcContact;
                if (params.arcPhone) updates.arc_phone = params.arcPhone;
                if (params.extraSensors !== undefined) updates.extra_sensors = params.extraSensors;

                if (Object.keys(updates).length === 0) {
                    return { success: false, message: 'No changes specified.' };
                }

                // Update in database
                const { error } = await supabase
                    .from(SCAFF_TABLE_NAME)
                    .update(updates)
                    .eq('id', system.id);

                if (error) throw error;

                // Reload data
                await loadScaffoldData();

                // Build success message
                const changedFields = Object.keys(updates).map(key => {
                    const fieldNames = {
                        site_contact: 'site contact',
                        app_contact: 'customer',
                        address1: 'address',
                        address2: 'address line 2',
                        postcode: 'postcode',
                        site_phone: 'site phone',
                        app_phone: 'customer phone',
                        arc_contact: 'ARC contact',
                        arc_phone: 'ARC phone',
                        extra_sensors: 'extra sensors'
                    };
                    return fieldNames[key] || key;
                }).join(', ');

                return {
                    success: true,
                    message: `Updated ${changedFields} for ${pNumber}.`
                };

            } catch (error) {
                console.error('Error updating system details:', error);
                return { success: false, message: 'Sorry, I couldn\'t update that.' };
            }
        };

        // Update contact number
        voiceControl.updateContactNumber = async (params) => {
            try {
                let pNumber = params.pNumber?.toUpperCase();
                const contactType = params.contactType?.toLowerCase(); // 'arc', 'site', 'app'
                const phoneNumber = params.phoneNumber;

                if (!pNumber || !contactType || !phoneNumber) {
                    return { success: false, message: 'Please specify P number, contact type, and phone number.' };
                }

                // Try to find the system - handle P1 vs P01 conversion
                let systemIndex = scaffSystems.findIndex(s => s.pNumber === pNumber);
                if (systemIndex === -1 && pNumber.match(/^P\d$/)) {
                    // P1-P9: try P01-P09
                    const paddedPNumber = 'P0' + pNumber.substring(1);
                    systemIndex = scaffSystems.findIndex(s => s.pNumber === paddedPNumber);
                    if (systemIndex !== -1) pNumber = paddedPNumber;
                }

                if (systemIndex === -1) {
                    return { success: false, message: `I couldn't find system ${pNumber}.` };
                }

                // Determine which field to update
                let fieldName, displayName;
                switch (contactType) {
                    case 'arc':
                        fieldName = 'arcPhone';
                        displayName = 'ARC contact number';
                        break;
                    case 'site':
                        fieldName = 'sitePhone';
                        displayName = 'site contact number';
                        break;
                    case 'app':
                        fieldName = 'appPhone';
                        displayName = 'app contact number';
                        break;
                    default:
                        return { success: false, message: 'Contact type must be ARC, site, or app.' };
                }

                // Update local data
                scaffSystems[systemIndex][fieldName] = phoneNumber;

                // Update in Supabase
                const dbFieldName = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
                const { error } = await supabase
                    .from(SCAFF_TABLE_NAME)
                    .update({ [dbFieldName]: phoneNumber })
                    .eq('id', scaffSystems[systemIndex].id);

                if (error) throw error;

                // Refresh UI
                if (typeof renderScaffTable === 'function') renderScaffTable();
                if (typeof renderMobileScaffCards === 'function') renderMobileScaffCards();

                return {
                    success: true,
                    message: `Successfully updated ${pNumber} ${displayName} to ${phoneNumber}.`,
                    data: scaffSystems[systemIndex]
                };
            } catch (error) {
                console.error('Error updating contact number:', error);
                return { success: false, message: 'Sorry, I couldn\'t update that.' };
            }
        };

        // Mark inspection complete
        voiceControl.markInspectionComplete = async (params) => {
            try {
                const customerName = params.customerName;
                const completionDate = params.completionDate || new Date().toISOString().split('T')[0];

                if (!customerName) {
                    return { success: false, message: 'Please specify a customer name.' };
                }

                // Find customer
                const customer = customers.find(c =>
                    c.name.toLowerCase().includes(customerName.toLowerCase())
                );

                if (!customer) {
                    return { success: false, message: `I couldn't find customer ${customerName}.` };
                }

                // Find next incomplete inspection
                const inspection = customer.inspections.find(i => !i.completionDate);
                if (!inspection) {
                    return { success: false, message: `${customer.name} has no pending inspections.` };
                }

                // Update inspection
                inspection.completionDate = completionDate;

                // Update in Supabase
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .update({ inspections: customer.inspections })
                    .eq('id', customer.id);

                if (error) throw error;

                // Refresh UI
                if (typeof renderTable === 'function') renderTable();
                if (typeof updateStats === 'function') updateStats();

                return {
                    success: true,
                    message: `Successfully marked ${customer.name}'s inspection as complete for ${completionDate}.`,
                    data: { customer, inspection }
                };
            } catch (error) {
                console.error('Error marking inspection complete:', error);
                return { success: false, message: 'Sorry, I couldn\'t update that.' };
            }
        };
    }

    // Helper: Format currency
    formatCurrency(amount) {
        return `£${amount.toFixed(2)}`;
    }

    // Helper: Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-GB');
    }
}

// Create and initialize global instance
const voiceDashboardBridge = new VoiceDashboardBridge();
