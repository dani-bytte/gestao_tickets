// public/js/scripts.js

// Modal utilities
if (typeof activeModal === 'undefined') {
  var activeModal = null;
}

function openModal(modalId) {
  console.log('Opening modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    activeModal = modal;
    document.addEventListener('keydown', handleEscapeKey);
  }
}

function closeModal(modalId) {
  console.log('Closing modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    activeModal = null;
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape' && activeModal) {
    closeModal(activeModal.id);
  }
}

function openProofModal(fileName) {
  console.log('Opening proof:', fileName);

  // Encode the file name to handle special characters
  const encodedFileName = encodeURIComponent(fileName);

  // Fetch the signed URL from the server
  fetch(`/tickets/proof-url/${encodedFileName}`)
    .then(response => response.json())
    .then(data => {
      if (data.signedUrl) {
        const img = document.createElement('img');
        img.src = data.signedUrl;
        img.alt = 'Comprovante';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';

        const proofContent = document.getElementById('proofContent');
        proofContent.innerHTML = ''; // Clear previous content
        proofContent.appendChild(img);

        openModal('proofModal');
      } else {
        console.error('Failed to get signed URL');
      }
    })
    .catch(error => {
      console.error('Error fetching signed URL:', error);
    });
}

function openTicketModal(ticketId) {
  console.log('Opening ticket:', ticketId);
  fetch(`/tickets/${ticketId}`)
    .then(response => response.json())
    .then(ticket => {
      document.getElementById('editTicketId').value = ticket._id;
      document.getElementById('editTicket').value = ticket.ticket;
      document.getElementById('editService').value = ticket.service.name;
      document.getElementById('editClient').value = ticket.client;
      document.getElementById('editEmail').value = ticket.email;
      document.getElementById('editStartDate').value = ticket.startDate.split('T')[0];
      document.getElementById('editEndDate').value = ticket.endDate.split('T')[0];
      document.getElementById('editStatus').value = ticket.status;
      document.getElementById('editPayment').value = ticket.payment;
      openModal('ticketModal');
    })
    .catch(error => {
      console.error('Error fetching ticket:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Setting up modal handlers');

  // Proof button handlers
  document.querySelectorAll('.proof-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const proofUrl = button.dataset.proofUrl;
      if (proofUrl) {
        console.log('Opening proof URL:', proofUrl);
        openProofModal(proofUrl);
      }
    });
  });

  // Action button handlers
  document.querySelectorAll('.action-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const ticketId = button.dataset.ticketId;
      if (ticketId) {
        console.log('Opening ticket ID:', ticketId);
        openTicketModal(ticketId);
      }
    });
  });

  // Close button handlers
  const closeTicketModalButton = document.getElementById('closeTicketModal');
  if (closeTicketModalButton) {
    closeTicketModalButton.addEventListener('click', () => {
      closeModal('ticketModal');
    });
  } else {
    console.error("Close ticket modal button not found!");
  }

  const closeProofModalButton = document.getElementById('closeProofModal');
  if (closeProofModalButton) {
    closeProofModalButton.addEventListener('click', () => {
      closeModal('proofModal');
    });
  } else {
    console.error("Close proof modal button not found!");
  }

  // Close on outside click
  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      closeModal(event.target.id);
    }
  });

  // Form submission handler
  document.getElementById('editTicketForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ticketId = document.getElementById('editTicketId').value;
    const status = document.getElementById('editStatus').value;
    const payment = document.getElementById('editPayment').value;

    fetch(`/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, payment })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        closeModal('ticketModal');
        location.reload(); // Reload the page to reflect changes
      } else {
        console.error('Failed to update ticket');
      }
    })
    .catch(error => {
      console.error('Error updating ticket:', error);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ticketForm');
  const timeZoneInput = document.createElement('input');
  timeZoneInput.type = 'hidden';
  timeZoneInput.name = 'timeZone';
  timeZoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  form.appendChild(timeZoneInput);
});