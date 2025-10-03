/**
 * Main application module for Expense Tracker
 * Handles core functionality and user interactions
 * @author Praful Singh
 */

class ExpenseTracker {
    constructor() {
        this.transactions = [];
        this.categories = appConfig.getCategories();
        this.currentEditId = null;
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            await this.loadData();
            this.setupEventListeners();
            this.setupUI();
            this.updateDisplay();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
            this.hideLoading();
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    async loadData() {
        this.transactions = storageManager.getTransactions();
        
        // Load app settings
        const settings = storageManager.getSettings();
        this.applySettings(settings);
    }

    applySettings(settings) {
        // Apply any saved user preferences
        if (settings.theme) {
            document.body.setAttribute('data-theme', settings.theme);
        }
    }

    setupUI() {
        // Set app title and version
        const appTitle = document.getElementById('app-title');
        const appName = document.getElementById('app-name');
        const appVersion = document.getElementById('app-version');
        
        if (appTitle) appTitle.textContent = `${appConfig.get('app.name')} | ${appConfig.get('app.author')}`;
        if (appName) appName.textContent = appConfig.get('app.name');
        if (appVersion) appVersion.textContent = `v${appConfig.get('app.version')}`;

        // Initialize chart
        if (appConfig.get('features.enableCharts')) {
            chartManager.initChart('expenseChart');
        }

        // Setup categories
        this.populateCategories();
        this.updateCategoryFilter();
        
        // Set default date
        this.setDefaultDate();

        // Hide/show features based on config
        this.toggleFeatures();
    }

    toggleFeatures() {
        const exportBtn = document.getElementById('exportData');
        const importBtn = document.getElementById('importButton');
        
        if (!appConfig.get('features.enableExport') && exportBtn) {
            exportBtn.style.display = 'none';
        }
        
        if (!appConfig.get('features.enableImport') && importBtn) {
            importBtn.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Form submission
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Type change for categories
        const transactionType = document.getElementById('transactionType');
        if (transactionType) {
            transactionType.addEventListener('change', () => this.populateCategories());
        }

        const editType = document.getElementById('editType');
        if (editType) {
            editType.addEventListener('change', () => this.populateEditCategories());
        }

        // Clear form
        const clearForm = document.getElementById('clearForm');
        if (clearForm) {
            clearForm.addEventListener('click', () => this.clearForm());
        }

        // Filters
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.updateDisplay());
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.updateDisplay());
        }

        // Export/Import
        const exportData = document.getElementById('exportData');
        const importButton = document.getElementById('importButton');
        const importData = document.getElementById('importData');
        
        if (exportData) {
            exportData.addEventListener('click', () => this.exportData());
        }
        
        if (importButton) {
            importButton.addEventListener('click', () => importData.click());
        }
        
        if (importData) {
            importData.addEventListener('change', (e) => this.importData(e.target.files[0]));
        }

        // Edit modal
        const editForm = document.getElementById('editForm');
        const cancelEdit = document.getElementById('cancelEdit');
        const editModal = document.getElementById('editModal');
        
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }
        
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.closeEditModal());
        }
        
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target.id === 'editModal') this.closeEditModal();
            });
        }

        // Real-time validation
        this.setupRealTimeValidation();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Window resize for chart
        window.addEventListener('resize', () => {
            if (chartManager.chart) {
                chartManager.resizeChart();
            }
        });
    }

    setupRealTimeValidation() {
        const fields = ['transactionType', 'transactionDate', 'transactionDescription', 'transactionCategory', 'transactionAmount'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => validator.clearFieldError(fieldId));
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const form = document.getElementById('transactionForm');
                if (form) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit'));
                }
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                this.closeEditModal();
            }
        });
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const value = field.value;
        let rules = [];

        switch (fieldId) {
            case 'transactionType':
                rules = ['required'];
                break;
            case 'transactionDate':
                rules = ['required', 'dateValid'];
                break;
            case 'transactionDescription':
                rules = ['required', { name: 'maxLength', params: [appConfig.get('validation.maxDescriptionLength')] }];
                break;
            case 'transactionCategory':
                rules = ['required'];
                break;
            case 'transactionAmount':
                rules = ['required', 'amount'];
                break;
        }

        const validation = validator.validate(value, rules);
        
        if (!validation.isValid) {
            validator.showFieldError(fieldId, validation.errors[0]);
        } else {
            validator.clearFieldError(fieldId);
        }

        return validation.isValid;
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateField = document.getElementById('transactionDate');
        if (dateField) {
            dateField.value = today;
        }
    }

    populateCategories() {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        
        if (!typeSelect || !categorySelect) return;

        const selectedType = typeSelect.value;
        
        // Clear existing options
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        if (selectedType && this.categories[selectedType]) {
            this.categories[selectedType].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }

        this.updateCategoryFilter();
    }

    populateEditCategories() {
        const typeSelect = document.getElementById('editType');
        const categorySelect = document.getElementById('editCategory');
        
        if (!typeSelect || !categorySelect) return;

        const selectedType = typeSelect.value;
        
        // Clear existing options
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        if (selectedType && this.categories[selectedType]) {
            this.categories[selectedType].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const allCategories = [...this.categories.income, ...this.categories.expense];
        const currentSelection = categoryFilter.value;
        
        // Clear and repopulate
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        [...new Set(allCategories)].sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentSelection) {
            categoryFilter.value = currentSelection;
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        this.addTransaction();
    }

    handleEditSubmit(e) {
        e.preventDefault();
        this.updateTransaction();
    }

    addTransaction() {
        // Clear previous errors
        validator.clearAllErrors();

        // Get form data
        const transactionData = {
            type: document.getElementById('transactionType').value,
            date: document.getElementById('transactionDate').value,
            description: validator.sanitizeInput(document.getElementById('transactionDescription').value),
            category: document.getElementById('transactionCategory').value,
            amount: parseFloat(document.getElementById('transactionAmount').value)
        };

        // Validate transaction
        const validation = validator.validateTransaction(transactionData);
        
        if (!validation.isValid) {
            Object.keys(validation.errors).forEach(field => {
                const fieldId = `transaction${field.charAt(0).toUpperCase() + field.slice(1)}`;
                validator.showFieldError(fieldId, validation.errors[field]);
            });
            return;
        }

        // Create transaction object
        const transaction = {
            id: this.generateId(),
            ...transactionData,
            timestamp: new Date().toISOString()
        };

        // Add to transactions array
        this.transactions.unshift(transaction);
        
        // Save to storage
        this.saveData();
        
        // Update display
        this.updateDisplay();
        
        // Clear form
        this.clearForm();
        
        // Show success message
        this.showSuccess('Transaction added successfully!');
    }

    updateTransaction() {
        const id = document.getElementById('editId').value;
        if (!id) return;

        // Get form data
        const transactionData = {
            type: document.getElementById('editType').value,
            date: document.getElementById('editDate').value,
            description: validator.sanitizeInput(document.getElementById('editDescription').value),
            category: document.getElementById('editCategory').value,
            amount: parseFloat(document.getElementById('editAmount').value)
        };

        // Validate transaction
        const validation = validator.validateTransaction(transactionData);
        
        if (!validation.isValid) {
            let errorMessage = Object.values(validation.errors).join('\n');
            alert(errorMessage);
            return;
        }

        // Find and update transaction
        const transactionIndex = this.transactions.findIndex(t => t.id === id);
        if (transactionIndex === -1) return;

        this.transactions[transactionIndex] = {
            ...this.transactions[transactionIndex],
            ...transactionData,
            updatedAt: new Date().toISOString()
        };

        // Save to storage
        this.saveData();
        
        // Update display
        this.updateDisplay();
        
        // Close modal
        this.closeEditModal();
        
        // Show success message
        this.showSuccess('Transaction updated successfully!');
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Populate edit form
        document.getElementById('editId').value = transaction.id;
        document.getElementById('editType').value = transaction.type;
        document.getElementById('editDate').value = transaction.date;
        document.getElementById('editDescription').value = transaction.description;
        document.getElementById('editAmount').value = transaction.amount;

        // Populate categories for the selected type
        this.populateEditCategories();
        
        // Set category after populating options
        setTimeout(() => {
            document.getElementById('editCategory').value = transaction.category;
        }, 0);

        // Show modal
        this.showEditModal();
    }

    deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveData();
        this.updateDisplay();
        this.showSuccess('Transaction deleted successfully!');
    }

    showEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            modal.setAttribute('aria-hidden', 'false');
            
            // Focus first input
            const firstInput = modal.querySelector('select, input');
            if (firstInput) firstInput.focus();
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    clearForm() {
        const form = document.getElementById('transactionForm');
        if (form) {
            form.reset();
            this.setDefaultDate();
            this.populateCategories();
            validator.clearAllErrors();
        }
    }

    updateDisplay() {
        this.updateSummary();
        this.updateTransactionsList();
        if (appConfig.get('features.enableCharts')) {
            this.updateChart();
        }
    }

    updateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netBalance = totalIncome - totalExpenses;

        // Update display
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpensesEl = document.getElementById('totalExpenses');
        const netBalanceEl = document.getElementById('netBalance');

        if (totalIncomeEl) totalIncomeEl.textContent = this.formatCurrency(totalIncome);
        if (totalExpensesEl) totalExpensesEl.textContent = this.formatCurrency(totalExpenses);
        if (netBalanceEl) {
            netBalanceEl.textContent = this.formatCurrency(netBalance);
            
            // Update color based on balance
            netBalanceEl.className = `text-2xl font-bold ${
                netBalance > 0 ? 'text-green-400' : 
                netBalance < 0 ? 'text-red-400' : 'text-gold'
            }`;
        }
    }

    getFilteredTransactions() {
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const typeFilter = document.getElementById('typeFilter')?.value || '';

        return this.transactions.filter(transaction => {
            const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
            const matchesType = !typeFilter || transaction.type === typeFilter;
            return matchesCategory && matchesType;
        });
    }

    updateTransactionsList() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;

        const filteredTransactions = this.getFilteredTransactions();

        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-inbox text-4xl mb-4" aria-hidden="true"></i>
                    <p class="text-lg font-medium">No transactions found</p>
                    <p class="text-sm">Try adjusting your filters or add a new transaction</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = filteredTransactions.map(transaction => `
            <div class="bg-gray-800 rounded-lg p-4 border-l-4 ${
                transaction.type === 'income' ? 'border-green-500' : 'border-red-500'
            } hover:bg-gray-750 transition-colors" role="listitem">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas ${
                                transaction.type === 'income' 
                                    ? 'fa-arrow-up text-green-400' 
                                    : 'fa-arrow-down text-red-400'
                            }" aria-hidden="true"></i>
                            <span class="font-medium text-white">${this.escapeHtml(transaction.description)}</span>
                            <span class="bg-gray-700 text-xs px-2 py-1 rounded-full text-gray-300">
                                ${transaction.category}
                            </span>
                        </div>
                        <div class="text-sm text-gray-400">
                            <i class="fas fa-calendar-alt mr-1" aria-hidden="true"></i>
                            ${this.formatDate(transaction.date)}
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-lg font-bold ${
                            transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                        }">
                            ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                        </span>
                        <div class="flex gap-2">
                            <button onclick="expenseTracker.editTransaction('${transaction.id}')" 
                                    class="text-gold hover:text-darkGold transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-gold"
                                    aria-label="Edit transaction">
                                <i class="fas fa-edit" aria-hidden="true"></i>
                            </button>
                            <button onclick="expenseTracker.deleteTransaction('${transaction.id}')" 
                                    class="text-red-400 hover:text-red-300 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                                    aria-label="Delete transaction">
                                <i class="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateChart() {
        if (chartManager.chart) {
            chartManager.updateChart(this.transactions);
        }
    }

    exportData() {
        if (!appConfig.get('features.enableExport')) return;

        try {
            const exportData = {
                version: appConfig.get('app.version'),
                timestamp: new Date().toISOString(),
                transactions: this.transactions,
                categories: this.categories,
                summary: {
                    totalTransactions: this.transactions.length,
                    totalIncome: this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                    totalExpenses: this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `expense-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export data. Please try again.');
        }
    }

    importData(file) {
        if (!appConfig.get('features.enableImport') || !file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!this.validateImportData(importedData)) {
                    this.showError('Invalid file format. Please select a valid expense tracker data file.');
                    return;
                }

                if (confirm('This will replace all existing data. Are you sure you want to continue?')) {
                    this.transactions = importedData.transactions || [];
                    this.saveData();
                    this.updateDisplay();
                    this.showSuccess('Data imported successfully!');
                }
            } catch (error) {
                console.error('Import failed:', error);
                this.showError('Error reading file. Please make sure it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);
    }

    validateImportData(data) {
        return data && 
               Array.isArray(data.transactions) &&
               data.transactions.every(t => 
                   t.id && t.type && t.date && t.description && t.category && typeof t.amount === 'number'
               );
    }

    saveData() {
        storageManager.saveTransactions(this.transactions);
        
        // Create backup every 10 transactions
        if (this.transactions.length % 10 === 0) {
            storageManager.saveBackup({
                transactions: this.transactions,
                timestamp: new Date().toISOString()
            });
        }
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    formatCurrency(amount) {
        const format = appConfig.getCurrencyFormat();
        return new Intl.NumberFormat(format.locale, {
            style: 'currency',
            currency: format.currency,
            minimumFractionDigits: format.minimumFractionDigits,
            maximumFractionDigits: format.maximumFractionDigits
        }).format(amount).replace('$', 'USD ');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageId = type === 'success' ? 'successMessage' : 'errorMessage';
        const messageEl = document.getElementById(messageId);
        
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 5000);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpenseTracker;
}
