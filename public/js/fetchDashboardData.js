// public/js/fetchDashboardData.js
document.addEventListener('DOMContentLoaded', () => {
    fetch('/home/admin/dashboard-data', {
      credentials: 'include' // Inclui os cookies na requisição
    })
      .then(response => response.json())
      .then(data => {
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('totalTickets').textContent = data.totalTickets;
        document.getElementById('pendingTickets').textContent = data.pendingTickets;
        document.getElementById('completedTickets').textContent = data.completedTickets;
        document.getElementById('dueTickets').textContent = data.dueTickets;
        document.getElementById('todayTickets').textContent = data.todayTickets;
        document.getElementById('upcomingTickets').textContent = data.upcomingTickets;
      })
      .catch(error => {
        console.error('Erro ao buscar dados da dashboard:', error);
      });

    // Add click handler for overdue tickets card
    function setupCardModal(cardId, endpoint, title) {
      const card = document.querySelector(`#${cardId}`).parentElement;
      card.style.cursor = 'pointer';
      
      card.addEventListener('click', async () => {
        try {
          const response = await fetch(`/home/admin/${endpoint}`, {
            credentials: 'include'
          });
          const tickets = await response.json();
          
          const modalContent = document.getElementById('overdueTicketsList');
          if (tickets && tickets.length > 0) {
            modalContent.innerHTML = `
              <h3>${title}</h3>
              ${tickets.map(ticket => `
                <div class="overdue-ticket-item">
                  <p><strong>Ticket:</strong> ${ticket.ticket}</p>
                  <p><strong>Usuário:</strong> ${ticket.createdBy.username}</p>
                  <p><strong>Status:</strong> ${ticket.status}</p>
                  <p><strong>Vencimento:</strong> ${new Date(ticket.endDate)
                    .toLocaleDateString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              `).join('')}
            `;
          } else {
            modalContent.innerHTML = '<div class="no-tickets-message">Nenhum ticket encontrado</div>';
          }
  
          const modal = document.getElementById('overdueTicketsModal');
          modal.style.display = 'block';
        } catch (error) {
          console.error('Error fetching tickets:', error);
        }
      });
    }
  
    // Setup click handlers for all cards
    setupCardModal('todayTickets', 'today-tickets', 'Tickets que Vencem Hoje');
    setupCardModal('upcomingTickets', 'upcoming-tickets', 'Tickets dos Próximos 2 Dias');
    setupCardModal('dueTickets', 'overdue-tickets', 'Tickets Vencidos');

    // Close modal handler
    const closeOverdueModal = document.getElementById('closeOverdueModal');
    closeOverdueModal.addEventListener('click', () => {
      const modal = document.getElementById('overdueTicketsModal');
      modal.style.display = 'none';
    });

    // Adicionar handler para fechar modal clicando fora
    window.addEventListener('click', (event) => {
      const modal = document.getElementById('overdueTicketsModal');
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Adicionar handler para tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('overdueTicketsModal');
        modal.style.display = 'none';
      }
    });
  });