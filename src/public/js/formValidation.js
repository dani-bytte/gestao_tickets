// public/js/formValidation.js
const VALIDATION_RULES = {
    ticket: {
        minLength: 3,
        maxLength: 50,
        required: true
    },
    email: {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    }
};

class TicketFormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = [];
        this.setupValidation();
    }

    setupValidation() {
        this.form.addEventListener('submit', (e) => {
            this.errors = [];
            if (!this.validateForm()) {
                e.preventDefault();
                this.showErrors();
            }
        });

        // Validação em tempo real
        this.form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    validateForm() {
        const ticket = this.form.querySelector('#ticket');
        const service = this.form.querySelector('#service');
        const client = this.form.querySelector('#client');
        const email = this.form.querySelector('#email');
        const startDate = this.form.querySelector('#start-date');
        const endDate = this.form.querySelector('#end-date');

        let isValid = true;

        // Validar ticket
        if (!this.validateTicket(ticket.value)) {
            isValid = false;
        }

        // Validar serviço
        if (!this.validateService(service.value)) {
            isValid = false;
        }

        // Validar cliente
        if (!this.validateClient(client.value)) {
            isValid = false;
        }

        // Validar email
        if (!this.validateEmail(email.value)) {
            isValid = false;
        }

        // Validar datas
        if (!this.validateDates(startDate.value, endDate.value)) {
            isValid = false;
        }

        return isValid;
    }

    validateTicket(value) {
        if (!value || value.length < VALIDATION_RULES.ticket.minLength) {
            this.addError('ticket', `Ticket deve ter no mínimo ${VALIDATION_RULES.ticket.minLength} caracteres`);
            return false;
        }
        return true;
    }

    validateService(value) {
        if (!value) {
            this.addError('service', 'Selecione um serviço');
            return false;
        }
        return true;
    }

    validateClient(value) {
        if (!value || value.length < 3) {
            this.addError('client', 'Nome do cliente deve ter no mínimo 3 caracteres');
            return false;
        }
        return true;
    }

    validateEmail(value) {
        if (!VALIDATION_RULES.email.pattern.test(value)) {
            this.addError('email', 'Email inválido');
            return false;
        }
        return true;
    }

    validateDates(startDate, endDate) {
        if (!startDate || !endDate) {
            this.addError('dates', 'Datas são obrigatórias');
            return false;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            this.addError('dates', 'Data final deve ser posterior à data inicial');
            return false;
        }
        return true;
    }

    addError(field, message) {
        this.errors.push({ field, message });
        this.showFieldError(field, message);
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('error');
        
        // Remover erro anterior se existir
        const existingError = field.nextElementSibling;
        if (existingError && existingError.classList.contains('error-message')) {
            existingError.remove();
        }

        // Adicionar nova mensagem de erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    showErrors() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-messages';
        errorDiv.innerHTML = this.errors.map(error => 
            `<p class="error">${error.message}</p>`
        ).join('');

        const existing = document.querySelector('.error-messages');
        if (existing) {
            existing.remove();
        }

        this.form.insertBefore(errorDiv, this.form.firstChild);
    }
}

// Inicializar validação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new TicketFormValidator('ticketForm');
});