/**
 * Configuration module for Expense Tracker
 * Handles environment variables and app settings
 * @author Praful Singh
 */

class Config {
    constructor() {
        this.loadConfig();
    }

    loadConfig() {
        // Default configuration
        this.config = {
            app: {
                name: 'Expense Tracker',
                version: '1.0.0',
                environment: 'production',
                author: 'Praful Singh'
            },
            api: {
                baseUrl: 'https://api.expensetracker.com',
                timeout: 10000
            },
            chart: {
                animationDuration: 500,
                responsive: true
            },
            storage: {
                prefix: 'exp_track_',
                version: '1.0'
            },
            features: {
                enableExport: true,
                enableImport: true,
                enableCharts: true,
                enableCategoriesEdit: false
            },
            security: {
                encryptionKey: 'secure-key-2024',
                sessionTimeout: 1800000 // 30 minutes
            },
            validation: {
                maxDescriptionLength: 100,
                maxAmount: 999999.99,
                minAmount: 0.01
            }
        };

        // Override with environment variables if available
        this.loadEnvironmentVariables();
    }

    loadEnvironmentVariables() {
        // In a real environment, these would come from process.env or similar
        // For client-side, we'll use a mock implementation
        const envVars = this.getEnvironmentVariables();
        
        if (envVars.APP_NAME) this.config.app.name = envVars.APP_NAME;
        if (envVars.APP_VERSION) this.config.app.version = envVars.APP_VERSION;
        if (envVars.API_BASE_URL) this.config.api.baseUrl = envVars.API_BASE_URL;
        if (envVars.CHART_ANIMATION_DURATION) this.config.chart.animationDuration = parseInt(envVars.CHART_ANIMATION_DURATION);
        if (envVars.STORAGE_PREFIX) this.config.storage.prefix = envVars.STORAGE_PREFIX;
        if (envVars.ENABLE_EXPORT) this.config.features.enableExport = envVars.ENABLE_EXPORT === 'true';
        if (envVars.ENABLE_IMPORT) this.config.features.enableImport = envVars.ENABLE_IMPORT === 'true';
        if (envVars.ENABLE_CHARTS) this.config.features.enableCharts = envVars.ENABLE_CHARTS === 'true';
    }

    getEnvironmentVariables() {
        // Mock environment variables for demo
        // In production, these would be loaded securely
        return {
            APP_NAME: 'Expense Tracker',
            APP_VERSION: '1.0.0',
            API_BASE_URL: 'https://api.expensetracker.com',
            CHART_ANIMATION_DURATION: '500',
            STORAGE_PREFIX: 'exp_track_',
            ENABLE_EXPORT: 'true',
            ENABLE_IMPORT: 'true',
            ENABLE_CHARTS: 'true'
        };
    }

    get(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
    }

    getCategories() {
        return {
            income: [
                'Salary',
                'Freelance',
                'Investment',
                'Business',
                'Rental Income',
                'Dividends',
                'Bonus',
                'Other Income'
            ],
            expense: [
                'Food & Dining',
                'Transportation',
                'Entertainment',
                'Shopping',
                'Bills & Utilities',
                'Healthcare',
                'Education',
                'Travel',
                'Insurance',
                'Taxes',
                'Other Expense'
            ]
        };
    }

    getCurrencyFormat() {
        return {
            currency: 'USD',
            locale: 'en-US',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };
    }
}

// Create global config instance
const appConfig = new Config();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
