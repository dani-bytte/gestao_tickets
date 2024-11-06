// public/js/tableFilter.js
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const paymentFilter = document.getElementById('paymentFilter');
    const tbody = document.querySelector('table tbody');
    const rows = tbody.getElementsByTagName('tr');

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusTerm = statusFilter.value.toLowerCase();
        const paymentTerm = paymentFilter.value.toLowerCase();

        Array.from(rows).forEach(row => {
            const ticket = row.querySelector('[data-label="Ticket"]').textContent.toLowerCase();
            const status = row.querySelector('[data-label="Status"]').textContent.toLowerCase();
            const payment = row.querySelector('[data-label="Pagamento"]').textContent.toLowerCase();
            const matchesSearch = ticket.includes(searchTerm);
            const matchesStatus = statusTerm === '' || status.includes(statusTerm);
            const matchesPayment = paymentTerm === '' || payment.includes(paymentTerm);
            
            row.style.display = matchesSearch && matchesStatus && matchesPayment ? '' : 'none';
        });

        // Show/hide "no results" message
        const noResults = document.getElementById('noResults');
        const hasVisibleRows = Array.from(rows).some(row => row.style.display !== 'none');
        if (noResults) {
            noResults.style.display = hasVisibleRows ? 'none' : 'block';
        }
    }

    // Add event listeners
    searchInput.addEventListener('input', filterTable);
    statusFilter.addEventListener('change', filterTable);
    paymentFilter.addEventListener('change', filterTable);
});