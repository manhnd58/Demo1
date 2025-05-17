// Load About modal content
function loadAboutModalContent() {
  const placeholder = document.getElementById('aboutModal-content-placeholder');
  if (!placeholder) {
    console.error('Không tìm thấy placeholder để tải nội dung aboutModal');
    return;
  }
  
  console.log('Đang tải nội dung modal giới thiệu...');
  
  // Thêm loading indicator
  placeholder.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải nội dung...</p></div>';
  
  // Đảm bảo modal hiển thị đúng cách
  const aboutModal = document.getElementById('aboutModal');
  if (aboutModal) {
    aboutModal.className = 'modal';
    
    // Đảm bảo modal đặt ở đúng vị trí
    if (aboutModal.parentElement !== document.body) {
      document.body.appendChild(aboutModal);
    }
  }
  
  // Tải nội dung từ file HTML
  fetch('ModalAbout/aboutModal.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      console.log('Đã tải nội dung modal giới thiệu thành công');
      
      // Thêm nội dung mới - Ensure we preserve the modal structure
      placeholder.innerHTML = html;
      
      // Đảm bảo các class và style đúng cho modal
      const aboutModal = document.getElementById('aboutModal');
      if (aboutModal) {
        // Make sure modal has proper styling
        aboutModal.style.zIndex = '1100';
        aboutModal.style.position = 'fixed';
        aboutModal.style.top = '0';
        aboutModal.style.left = '0';
        aboutModal.style.width = '100%';
        aboutModal.style.height = '100%';
        aboutModal.style.display = 'none';
        aboutModal.style.alignItems = 'center';
        aboutModal.style.justifyContent = 'center';
        aboutModal.style.overflow = 'auto';
      }
      
      // Thiết lập event listeners cho các nút trong modal
      setupAboutModalEventListeners();
      
      console.log('About modal content loaded successfully');
    })
    .catch(error => {
      console.error('Error loading about modal content:', error);
      placeholder.innerHTML = `<div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Không thể tải nội dung giới thiệu</p>
        <p class="error-details">${error.message}</p>
        <button onclick="loadAboutModalContent()" class="btn btn-primary">Thử lại</button>
      </div>`;
    });
}

// Setup event listeners for about modal
function setupAboutModalEventListeners() {
  // Close button
  const closeBtn = document.querySelector('#aboutModal .btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal('aboutModal'));
  }
  
  // Start learning button
  const startLearningBtn = document.getElementById('startLearningFromAbout');
  if (startLearningBtn) {
    startLearningBtn.addEventListener('click', () => {
      closeModal('aboutModal');
      switchTab('topics');
    });
  }
  
  // Contact from about button
  const contactFromAboutBtn = document.getElementById('contactFromAbout');
  if (contactFromAboutBtn) {
    contactFromAboutBtn.addEventListener('click', () => {
      closeModal('aboutModal');
      openModal('contactModal');
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing about modal loader');
  
  // Preload about modal content
  loadAboutModalContent();
  
  // Add event listener for about button
  const aboutBtn = document.getElementById('aboutBtn');
  if (aboutBtn) {
    // Remove any existing event listeners to prevent duplicates
    const newBtn = aboutBtn.cloneNode(true);
    aboutBtn.parentNode.replaceChild(newBtn, aboutBtn);
    
    // Add new event listener
    newBtn.addEventListener('click', function() {
      console.log('About button clicked');
      openModal('aboutModal');
    });
  } else {
    console.error('About button not found');
  }
});

// Export function for use elsewhere
window.loadAboutModalContent = loadAboutModalContent;
