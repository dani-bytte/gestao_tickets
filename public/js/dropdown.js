// dropdown.js
document.addEventListener('DOMContentLoaded', function() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  const handleDropdownClick = (dropdown, dropdownContent) => {
      dropdownContent.style.display = 
          dropdownContent.style.display === 'block' ? 'none' : 'block';
  };

  const setupDropdowns = () => {
      dropdowns.forEach(dropdown => {
          const dropbtn = dropdown.querySelector('.dropbtn');
          const dropdownContent = dropdown.querySelector('.dropdown-content');
          
          dropbtn.addEventListener('click', () => 
              handleDropdownClick(dropdown, dropdownContent));
      });
  };

  const handleOutsideClick = (event) => {
      dropdowns.forEach(dropdown => {
          const dropdownContent = dropdown.querySelector('.dropdown-content');
          if (!dropdown.contains(event.target)) {
              dropdownContent.style.display = 'none';
          }
      });
  };

  // Setup event listeners
  setupDropdowns();
  window.addEventListener('click', handleOutsideClick);

  // Cleanup function
  const cleanup = () => {
      window.removeEventListener('click', handleOutsideClick);
      dropdowns.forEach(dropdown => {
          const dropbtn = dropdown.querySelector('.dropbtn');
          dropbtn.removeEventListener('click');
      });
  };

  // Return cleanup for memory management
  return cleanup;
});