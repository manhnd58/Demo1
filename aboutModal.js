// Open modal function
function openModal(modalId) {
    console.log(`Opening modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with ID ${modalId} not found`);
      return;
    }
    
    // Ensure modal is in the body for proper stacking
    if (modal.parentElement !== document.body) {
      console.log(`Moving modal ${modalId} to body for proper display`);
      document.body.appendChild(modal);
    }
    
    // Create backdrop if it doesn't exist
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }
    
    // Make sure modal has proper styling
    modal.style.zIndex = '1050';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.backdropFilter = 'none';
    
    // Find the modal dialog inside
    const modalDialog = modal.querySelector('.modal-dialog');
    if (modalDialog) {
      modalDialog.style.zIndex = '1051';
      modalDialog.style.opacity = '1';
      modalDialog.style.display = 'block';
      modalDialog.style.position = 'relative';
      modalDialog.style.maxWidth = '800px';
      modalDialog.style.width = '100%';
      modalDialog.style.margin = '1.75rem auto';
      modalDialog.style.pointerEvents = 'auto';
    } else {
      console.warn(`Modal dialog not found inside ${modalId}, may need additional setup`);
    }
    
    // Add show class to backdrop with slight delay for animation
    setTimeout(() => {
      backdrop.classList.add('show');
      backdrop.style.opacity = '1';
    }, 10);
    
    // Show the modal
    modal.classList.add('show');
    
    // Add modal-open class to body to prevent scrolling
    document.body.classList.add('modal-open');
    
    // Add event listener to backdrop to close modal on click
    backdrop.addEventListener('click', function(e) {
      closeModal(modalId);
    });
    
    console.log(`Modal ${modalId} should now be visible`);
  }


  // Close modal function
function closeModal(modalId) {
    console.log(`Closing modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with ID ${modalId} not found`);
      return;
    }
    
    // Hide the modal
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
    
    // Find and remove backdrop with animation
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('show');
      backdrop.style.opacity = '0';
      
      // Remove backdrop after animation completes
      setTimeout(() => {
        if (document.body.contains(backdrop)) {
          backdrop.remove();
        }
      }, 300);
    }
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
  }

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Setting up modal event listeners in aboutModal.js');
  
  // Set up contact button event listener
  const contactBtn = document.getElementById('contactBtn');
  if (contactBtn) {
    const newContactBtn = contactBtn.cloneNode(true);
    contactBtn.parentNode.replaceChild(newContactBtn, contactBtn);
    newContactBtn.addEventListener('click', function() {
      openModal('contactModal');
    });
  }
  
  // Set up about button event listener
  const aboutBtn = document.getElementById('aboutBtn');
  if (aboutBtn) {
    const newAboutBtn = aboutBtn.cloneNode(true);
    aboutBtn.parentNode.replaceChild(newAboutBtn, aboutBtn);
    newAboutBtn.addEventListener('click', function() {
      console.log('About button clicked in aboutModal.js');
      openModal('aboutModal');
    });
  } else {
    console.error('About button not found!');
  }
  
  // Set up close buttons for all modals
  document.querySelectorAll('.modal .btn-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
  
  // Close modal when clicking outside content
  window.addEventListener('click', function(e) {
    document.querySelectorAll('.modal').forEach(modal => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
});

// Make functions available globally
window.openModal = openModal;
window.closeModal = closeModal;