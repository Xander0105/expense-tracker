/**
 * Validation module for Expense Tracker
 * Handles form validation and input sanitization
 * @author Praful Singh
 */

class Validator {
    constructor() {
        this.rules = {
            required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            number: (value) => !isNaN(value) && isFinite(value),
            positiveNumber: (value) => this.rules.number(value) && parseFloat(value) > 0,
            maxLength: (value, max) => value.toString().length <= max,
            minLength: (value, min) => value.toString().length >= min,
            dateValid: (value) => !isNaN(Date.parse(value)),
            futureDate: (value) => new Date(value) <= new Date(),
            amount: (value) => {
                const num = parseFloat(value);
                return this.rules.positiveNumber(num) && 
                       num >= appConfig.get('validation.minAmount') && 
                       num <= appConfig.get('validation.maxAmount');
            }
        };
    }

    validate(value, rules) {
        const errors = [];
        
        for (const rule of rules) {
            if (typeof rule === 'string') {
                if (!this.rules[rule](value)) {
                    errors.push(this.getErrorMessage(rule, value));
                }
            } else if (typeof rule === 'object') {
                const { name, params } = rule;
                if (!this.rules[name](value, ...params)) {
                    errors.push(this.getErrorMessage(name, value, params));
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getErrorMessage(rule, value, params = []) {
        const messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            number: 'Please enter a valid number',
            positiveNumber: 'Please enter a positive number',
            maxLength: `Maximum ${params[0]} characters allowed`,
            minLength: `Minimum ${params[0]} characters required`,
            dateValid: 'Please enter a valid date',
            futureDate: 'Date cannot be in the future',
            amount: `Amount must be between ${appConfig.get('validation.minAmount')} and ${appConfig.get('validation.maxAmount')}`
        };

        return messages[rule] || 'Invalid input';
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }

    validateTransaction(transaction) {
        const errors = {};

        // Validate type
        const typeValidation = this.validate(transaction.type, ['required']);
        if (!typeValidation.isValid) {
            errors.type = typeValidation.errors[0];
        } else if (!['income', 'expense'].includes(transaction.type)) {
            errors.type = 'Invalid transaction type';
        }

        // Validate date
        const dateValidation = this.validate(transaction.date, ['required', 'dateValid']);
        if (!dateValidation.isValid) {
            errors.date = dateValidation.errors[0];
        }

        // Validate description
        const descriptionValidation = this.validate(transaction.description, [
            'required',
            { name: 'maxLength', params: [appConfig.get('validation.maxDescriptionLength')] }
        ]);
        if (!descriptionValidation.isValid) {
            errors.description = descriptionValidation.errors[0];
        }

        // Validate category
        const categoryValidation = this.validate(transaction.category, ['required']);
        if (!categoryValidation.isValid) {
            errors.category = categoryValidation.errors[0];
        } else {
            const validCategories = appConfig.getCategories();
            const allCategories = [...validCategories.income, ...validCategories.expense];
            if (!allCategories.includes(transaction.category)) {
                errors.category = 'Invalid category selected';
            }
        }

        // Validate amount
        const amountValidation = this.validate(transaction.amount, ['required', 'amount']);
        if (!amountValidation.isValid) {
            errors.amount = amountValidation.errors[0];
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId.replace('transaction', '').replace('edit', '').toLowerCase()}Error`);
        
        if (field) {
            field.classList.add('border-red-500');
            field.classList.remove('border-gray-600');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId.replace('transaction', '').replace('edit', '').toLowerCase()}Error`);
        
        if (field) {
            field.classList.remove('border-red-500');
            field.classList.add('border-gray-600');
        }
        
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    clearAllErrors() {
        const errorElements = document.querySelectorAll('[id$="Error"]');
        errorElements.forEach(element => {
            element.classList.add('hidden');
        });

        const fields = document.querySelectorAll('input, select');
        fields.forEach(field => {
            field.classList.remove('border-red-500');
            field.classList.add('border-gray-600');
        });
    }
}

// Create global validator instance
const validator = new Validator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}
