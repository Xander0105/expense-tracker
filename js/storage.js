/**
 * Storage module for Expense Tracker
 * Handles local storage operations with encryption
 * @author Praful Singh
 */

class StorageManager {
    constructor() {
        this.prefix = appConfig.get('storage.prefix');
        this.version = appConfig.get('storage.version');
        this.encryptionKey = appConfig.get('security.encryptionKey');
        this.init();
    }

    init() {
        this.checkStorageAvailability();
        this.migrateData();
    }

    checkStorageAvailability() {
        try {
            const test = 'storage-test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            this.isAvailable = true;
        } catch (e) {
            this.isAvailable = false;
            console.warn('Local storage is not available. Data will not persist.');
        }
    }

    migrateData() {
        const currentVersion = this.getItem('version');
        if (currentVersion !== this.version) {
            // Perform any necessary data migrations here
            this.setItem('version', this.version);
        }
    }

    generateKey(key) {
        return `${this.prefix}${key}`;
    }

    encrypt(data) {
        try {
            // Simple encryption for demo purposes
            // In production, use a proper encryption library
            const jsonString = JSON.stringify(data);
            const encrypted = btoa(jsonString);
            return encrypted;
        } catch (error) {
            console.error('Encryption failed:', error);
            return JSON.stringify(data);
        }
    }

    decrypt(encryptedData) {
        try {
            // Simple decryption for demo purposes
            const decrypted = atob(encryptedData);
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            try {
                return JSON.parse(encryptedData);
            } catch (parseError) {
                return null;
            }
        }
    }

    setItem(key, value) {
        if (!this.isAvailable) return false;

        try {
            const fullKey = this.generateKey(key);
            const encryptedValue = this.encrypt(value);
            localStorage.setItem(fullKey, encryptedValue);
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;

        try {
            const fullKey = this.generateKey(key);
            const encryptedValue = localStorage.getItem(fullKey);
            
            if (encryptedValue === null) return defaultValue;
            
            const decryptedValue = this.decrypt(encryptedValue);
            return decryptedValue !== null ? decryptedValue : defaultValue;
        } catch (error) {
            console.error('Failed to retrieve from storage:', error);
            return defaultValue;
        }
    }

    removeItem(key) {
        if (!this.isAvailable) return false;

        try {
            const fullKey = this.generateKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Failed to remove from storage:', error);
            return false;
        }
    }

    clear() {
        if (!this.isAvailable) return false;

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    getStorageSize() {
        if (!this.isAvailable) return 0;

        let totalSize = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                totalSize += localStorage.getItem(key).length;
            }
        });

        return totalSize;
    }

    exportData() {
        if (!this.isAvailable) return null;

        const data = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                const shortKey = key.replace(this.prefix, '');
                const encryptedValue = localStorage.getItem(key);
                data[shortKey] = this.decrypt(encryptedValue);
            }
        });

        return {
            version: this.version,
            timestamp: new Date().toISOString(),
            data: data
        };
    }

    importData(importedData) {
        if (!this.isAvailable) return false;

        try {
            // Validate imported data structure
            if (!importedData || !importedData.data) {
                throw new Error('Invalid data format');
            }

            // Clear existing data
            this.clear();

            // Import new data
            Object.keys(importedData.data).forEach(key => {
                this.setItem(key, importedData.data[key]);
            });

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Transaction-specific methods
    saveTransactions(transactions) {
        return this.setItem('transactions', transactions);
    }

    getTransactions() {
        return this.getItem('transactions', []);
    }

    saveSettings(settings) {
        return this.setItem('settings', settings);
    }

    getSettings() {
        return this.getItem('settings', {});
    }

    saveBackup(data) {
        const backupKey = `backup_${Date.now()}`;
        return this.setItem(backupKey, data);
    }

    getBackups() {
        if (!this.isAvailable) return [];

        const backups = [];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.generateKey('backup_'))) {
                const timestamp = key.replace(this.generateKey('backup_'), '');
                backups.push({
                    timestamp: parseInt(timestamp),
                    key: key,
                    data: this.getItem(`backup_${timestamp}`)
                });
            }
        });

        return backups.sort((a, b) => b.timestamp - a.timestamp);
    }

    cleanupOldBackups(maxBackups = 5) {
        const backups = this.getBackups();
        if (backups.length > maxBackups) {
            const backupsToDelete = backups.slice(maxBackups);
            backupsToDelete.forEach(backup => {
                const key = backup.key.replace(this.generateKey(''), '');
                this.removeItem(key);
            });
        }
    }

    getStorageInfo() {
        return {
            isAvailable: this.isAvailable,
            prefix: this.prefix,
            version: this.version,
            totalSize: this.getStorageSize(),
            itemCount: this.getItemCount()
        };
    }

    getItemCount() {
        if (!this.isAvailable) return 0;

        const keys = Object.keys(localStorage);
        return keys.filter(key => key.startsWith(this.prefix)).length;
    }
}

// Create global storage manager instance
const storageManager = new StorageManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
