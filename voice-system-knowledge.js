// Voice Control System Knowledge Base
// Complete field definitions for all dashboard sections

const SYSTEM_KNOWLEDGE = {
    // ============================================
    // SCAFFOLD ALARM SYSTEMS (Scaff Tab)
    // ============================================
    scaffoldSystems: {
        tableName: 'perim_scaff_systems',
        description: 'Scaffold alarm systems for rental tracking',
        fields: {
            // Required fields
            pNumber: {
                type: 'string',
                required: true,
                format: 'P{number}',
                example: 'P7, P14, P22',
                description: 'Unique system identifier',
                voiceAliases: ['P number', 'system number', 'reference']
            },
            siteContact: {
                type: 'string',
                required: true,
                example: 'St Margarets Church, John Smith',
                description: 'Customer or site name',
                voiceAliases: ['customer', 'site', 'church', 'location name']
            },
            address1: {
                type: 'string',
                required: false,
                example: 'St Marys Church, High Street',
                description: 'First line of site address',
                voiceAliases: ['address', 'location', 'where', 'site location', 'address line 1']
            },
            address2: {
                type: 'string',
                required: false,
                example: 'Oxford',
                description: 'Second line of site address',
                voiceAliases: ['address line 2', 'city', 'town']
            },
            postcode: {
                type: 'string',
                required: false,
                example: 'OX1 1AA',
                description: 'Site postcode',
                voiceAliases: ['postcode', 'post code', 'zip code']
            },
            appContact: {
                type: 'string',
                required: true,
                example: '1st Choice Scaffolding, ABC Contractors',
                description: 'Scaffolder or contractor name',
                voiceAliases: ['scaffolder', 'contractor', 'scaffolding company']
            },
            startDate: {
                type: 'date',
                required: true,
                defaultToCurrent: true,
                description: 'Date system was installed/hire started',
                voiceAliases: ['install date', 'hire start date', 'installation date']
            },
            lastInvoiceDate: {
                type: 'date',
                required: true,
                defaultToCurrent: true,
                description: 'Date of last invoice',
                voiceAliases: ['invoice date', 'last billed']
            },
            hireStatus: {
                type: 'enum',
                required: true,
                options: ['on-hire', 'off-hire'],
                default: 'on-hire',
                description: 'Current hire status',
                voiceAliases: ['status', 'hire state']
            },

            // Optional fields
            extraSensors: {
                type: 'number',
                required: false,
                default: 0,
                min: 0,
                description: 'Number of extra sensors (standard is 4)',
                voiceAliases: ['additional sensors', 'extra sensor count']
            },
            sitePhone: {
                type: 'phone',
                required: false,
                format: 'UK mobile',
                description: 'Site contact phone number',
                voiceAliases: ['site number', 'customer phone', 'site telephone']
            },
            appPhone: {
                type: 'phone',
                required: false,
                format: 'UK mobile',
                description: 'App contact phone number',
                voiceAliases: ['scaffolder phone', 'contractor number', 'app number']
            },
            arcEnabled: {
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether ARC (Alarm Receiving Centre) is enabled',
                voiceAliases: ['ARC', 'alarm receiving centre', 'monitoring']
            },
            arcContact: {
                type: 'string',
                required: false,
                conditionalOn: 'arcEnabled',
                description: 'ARC contact name',
                voiceAliases: ['ARC name', 'monitoring contact']
            },
            arcPhone: {
                type: 'phone',
                required: false,
                conditionalOn: 'arcEnabled',
                description: 'ARC contact phone',
                voiceAliases: ['ARC number', 'monitoring phone']
            },
            weeklyCost: {
                type: 'currency',
                calculated: true,
                formula: '(100 + extraSensors * 15) * 1.2',
                description: 'Weekly hire cost (inc VAT)',
                readonly: true
            },
            monthlyCost: {
                type: 'currency',
                calculated: true,
                formula: 'weeklyCost * 4',
                description: 'Monthly hire cost (inc VAT)',
                readonly: true
            }
        }
    },

    // ============================================
    // MAINTENANCE CUSTOMERS (Maint Tab)
    // ============================================
    maintenanceCustomers: {
        tableName: 'perim_customers',
        description: 'Security system maintenance customers',
        fields: {
            // Required fields
            customerName: {
                type: 'string',
                required: true,
                description: 'Customer or business name',
                voiceAliases: ['name', 'customer', 'business']
            },
            address: {
                type: 'string',
                required: true,
                description: 'Full street address',
                voiceAliases: ['location', 'street address']
            },
            postcode: {
                type: 'string',
                required: true,
                format: 'UK postcode',
                description: 'UK postcode',
                voiceAliases: ['postal code', 'zip code']
            },
            systemType: {
                type: 'enum',
                required: true,
                options: ['Intruder', 'CCTV'],
                description: 'Type of security system',
                voiceAliases: ['system', 'alarm type']
            },
            nsiStatus: {
                type: 'enum',
                required: true,
                options: ['NSI', 'Non-NSI'],
                default: 'NSI',
                description: 'NSI accreditation status',
                voiceAliases: ['NSI', 'accreditation']
            },
            dateInstalled: {
                type: 'date',
                required: true,
                description: 'Original installation date',
                voiceAliases: ['installed', 'installation date']
            },
            inspectionsPerYear: {
                type: 'number',
                required: true,
                options: [1, 2],
                default: 1,
                description: 'Number of annual inspections',
                voiceAliases: ['service frequency', 'inspections']
            },
            firstInspectionMonth: {
                type: 'number',
                required: true,
                min: 1,
                max: 12,
                description: 'Month for first/annual inspection',
                voiceAliases: ['inspection month', 'service month']
            },

            // Optional fields
            secondInspectionMonth: {
                type: 'number',
                required: false,
                conditionalOn: 'inspectionsPerYear === 2',
                min: 1,
                max: 12,
                description: 'Month for second inspection (if 2 per year)',
                voiceAliases: ['second service month']
            },
            cloudId: {
                type: 'string',
                required: false,
                description: 'Cloud service ID',
                voiceAliases: ['cloud reference', 'cloud number']
            },
            cloudRenewalDate: {
                type: 'date',
                required: false,
                description: 'Cloud service renewal date',
                voiceAliases: ['cloud renewal', 'cloud expiry']
            },
            arcNo: {
                type: 'string',
                required: false,
                description: 'ARC reference number',
                voiceAliases: ['ARC number', 'ARC reference', 'monitoring number']
            },
            arcRenewalDate: {
                type: 'date',
                required: false,
                description: 'ARC contract renewal date',
                voiceAliases: ['ARC renewal', 'ARC expiry', 'monitoring renewal']
            },
            notes: {
                type: 'text',
                required: false,
                description: 'Additional notes about customer or system',
                voiceAliases: ['comments', 'remarks', 'notes']
            },
            controlPanelBattery: {
                type: 'date',
                required: false,
                description: 'Last control panel battery replacement',
                voiceAliases: ['panel battery', 'control battery']
            },
            sirenBattery: {
                type: 'date',
                required: false,
                description: 'Last siren battery replacement',
                voiceAliases: ['bell battery', 'siren battery']
            },
            detectorBatteries: {
                type: 'date',
                required: false,
                description: 'Last detector batteries replacement',
                voiceAliases: ['sensor batteries', 'PIR batteries', 'detector battery']
            }
        }
    },

    // ============================================
    // NSI COMPLIANCE TRACKING (NSI Tab)
    // ============================================
    nsiCompliance: {
        complaints: {
            tableName: 'perim_nsi_complaints',
            fields: {
                date: { type: 'date', required: true },
                reference: { type: 'string', required: false },
                customer: { type: 'string', required: true },
                type: { type: 'enum', options: ['Service', 'Technical', 'Billing', 'Installation', 'Response Time', 'Other'] },
                description: { type: 'text', required: true },
                status: { type: 'enum', options: ['open', 'investigating', 'resolved', 'closed'] },
                assignedTo: { type: 'string', required: false },
                notes: { type: 'text', required: false }
            }
        },
        idBadges: {
            tableName: 'perim_nsi_id_badges',
            fields: {
                badgeNumber: { type: 'string', required: true },
                type: { type: 'enum', options: ['Employee', 'Contractor', 'Visitor', 'Temporary'] },
                issuedTo: { type: 'string', required: true },
                issuedBy: { type: 'string', required: true },
                validFrom: { type: 'date', required: true },
                validTo: { type: 'date', required: true },
                notes: { type: 'text', required: false }
            }
        },
        testEquipment: {
            tableName: 'perim_nsi_test_equipment',
            fields: {
                equipmentId: { type: 'string', required: true },
                type: { type: 'enum', options: ['Multimeter', 'Loop Tester', 'PAT Tester', 'Insulation Tester', 'RCD Tester', 'Other'] },
                manufacturer: { type: 'string', required: true },
                model: { type: 'string', required: true },
                purchaseDate: { type: 'date', required: true },
                lastCalibration: { type: 'date', required: false },
                nextCalibration: { type: 'date', required: true },
                notes: { type: 'text', required: false }
            }
        },
        firstAid: {
            tableName: 'perim_nsi_first_aid',
            fields: {
                kitId: { type: 'string', required: true },
                type: { type: 'enum', options: ['Basic (1-10 people)', 'Standard (11-25 people)', 'Large (26-50 people)', 'Travel Kit', 'Vehicle Kit', 'Burns Kit'] },
                issuedTo: { type: 'string', required: true },
                issuedBy: { type: 'string', required: true },
                issueDate: { type: 'date', required: true },
                expiryDate: { type: 'date', required: true },
                location: { type: 'string', required: true },
                notes: { type: 'text', required: false }
            }
        }
    }
};

// Helper function to get field info
function getFieldInfo(section, fieldName) {
    const sectionData = SYSTEM_KNOWLEDGE[section];
    if (!sectionData) return null;
    return sectionData.fields[fieldName] || null;
}

// Helper to get all editable fields for a section
function getEditableFields(section) {
    const sectionData = SYSTEM_KNOWLEDGE[section];
    if (!sectionData) return [];

    return Object.entries(sectionData.fields)
        .filter(([_, field]) => !field.readonly && !field.calculated)
        .map(([name, field]) => ({
            name,
            ...field
        }));
}

// Generate field descriptions for AI prompt
function generateFieldDescriptionsForAI() {
    let descriptions = '';

    for (const [sectionKey, section] of Object.entries(SYSTEM_KNOWLEDGE)) {
        if (section.description) {
            descriptions += `\n## ${section.description.toUpperCase()}\n`;
            descriptions += `Database: ${section.tableName || 'N/A'}\n\n`;

            if (section.fields) {
                descriptions += 'Fields:\n';
                for (const [fieldName, field] of Object.entries(section.fields)) {
                    const required = field.required ? ' *REQUIRED*' : '';
                    const aliases = field.voiceAliases ? ` (also: ${field.voiceAliases.join(', ')})` : '';
                    descriptions += `- ${fieldName}${required}: ${field.description}${aliases}\n`;
                    if (field.options) descriptions += `  Options: ${field.options.join(', ')}\n`;
                    if (field.default) descriptions += `  Default: ${field.default}\n`;
                }
            }
        }
    }

    return descriptions;
}
