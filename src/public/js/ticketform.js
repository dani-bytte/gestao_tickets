function updateEndDate() {
    const selectedService = document.getElementById('service').options[document.getElementById('service').selectedIndex];
    const dueDate = parseInt(selectedService.getAttribute('data-due-date'), 10);
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
  
    const startDate = new Date(startDateInput.value);
    if (!isNaN(startDate.getTime())) {
      startDate.setDate(startDate.getDate() + dueDate);
      endDateInput.value = startDate.toISOString().split('T')[0];
    }
  }
  
  document.getElementById('service').addEventListener('change', updateEndDate);
  document.getElementById('start-date').addEventListener('change', updateEndDate);
  
  document.getElementById('ticketForm').addEventListener('submit', function(e) {
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    
    if (endDate <= startDate) {
      e.preventDefault();
      alert('A data final deve ser posterior à data inicial');
    }
  });

function updateEndDate() {
    const selectedService = document.getElementById('service').options[document.getElementById('service').selectedIndex];
    const dueDate = parseInt(selectedService.getAttribute('data-due-date'), 10);
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
  
    const startDate = new Date(startDateInput.value);
    if (!isNaN(startDate.getTime())) {
        startDate.setDate(startDate.getDate() + dueDate);
        endDateInput.value = startDate.toISOString().split('T')[0];
    }
}

// Initialize Select2 on the service select
$(document).ready(function() {
    $('#service').select2({
        placeholder: 'Selecione um serviço',
        width: '100%',
        language: {
            noResults: function() {
                return "Nenhum serviço encontrado";
            }
        }
    });

    // Maintain the existing end date update functionality
    $('#service').on('change', updateEndDate);
});
