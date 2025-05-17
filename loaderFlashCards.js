// Load flashcards content
function loadFlashcardsContent() {
  const placeholder = document.getElementById('flashcards-content-placeholder');
  if (!placeholder) {
    console.error('Không tìm thấy placeholder để tải nội dung flashcards');
    return;
  }
  
  console.log('Đang tải nội dung flashcards...');
  
  // Thêm loading indicator
  placeholder.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải flashcards...</p></div>';
  
  // Ensure the flashcards section is visible
  const flashcardsSection = document.getElementById('flashcards');
  if (flashcardsSection) {
    flashcardsSection.style.display = 'block';
  }
  
  // Load flashcards CSS first
  const existingCss = document.querySelector('link[href="FlashCards/flashCards.css"]');
  if (!existingCss) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'FlashCards/flashCards.css';
    document.head.appendChild(link);
    console.log('Đã thêm flashCards.css');
  }
  
  // Ensure flashCards.js is loaded
  loadScript('FlashCards/flashCards.js')
    .then(() => {
      // Then load the HTML content
      return fetch('FlashCards/flashCards.html')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        });
    })
    .then(html => {
      console.log('Đã tải nội dung flashcards thành công');
      
      // Xóa nội dung cũ nếu có
      const existingContent = document.querySelector('#flashcards-content');
      if (existingContent) {
        existingContent.remove();
      }
      
      // Thêm nội dung mới
      placeholder.innerHTML = html;
      
      // Đảm bảo flashcards hiển thị
      if (flashcardsSection) {
        flashcardsSection.style.display = 'block';
      }
      
      // Đảm bảo các scripts được thực thi
      if (typeof setupFlashcardEventListeners === 'function') {
        console.log('Thiết lập event listeners cho flashcards');
        setupFlashcardEventListeners();
        
        // Cập nhật UI flashcard
        if (typeof updateFlashcardUI === 'function') {
          console.log('Cập nhật UI flashcard');
          setTimeout(updateFlashcardUI, 100); // Thêm chút delay để DOM kịp cập nhật
        } else {
          console.error('Không tìm thấy hàm updateFlashcardUI');
        }
      } else {
        console.error('Không tìm thấy hàm setupFlashcardEventListeners sau khi tải HTML');
        // Thử tải lại script
        loadScript('FlashCards/flashCards.js')
          .then(() => {
            if (typeof setupFlashcardEventListeners === 'function') {
              console.log('Đã tải lại script flashCards.js');
              setupFlashcardEventListeners();
              
              if (typeof updateFlashcardUI === 'function') {
                setTimeout(updateFlashcardUI, 100);
              }
            }
          })
          .catch(err => {
            console.error('Không thể tải lại script flashCards.js:', err);
          });
      }
    })
    .catch(error => {
      console.error('Error loading flashcards content:', error);
      placeholder.innerHTML = `<div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Không thể tải nội dung flashcards</p>
        <p class="error-details">${error.message}</p>
        <button onclick="loadFlashcardsContent()" class="btn btn-primary">Thử lại</button>
      </div>`;
    });
}

// Helper function to load scripts with Promise
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      console.log(`Script ${src} đã được tải trước đó`);
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      console.log(`Đã tải script ${src} thành công`);
      resolve();
    };
    script.onerror = (error) => {
      console.error(`Lỗi khi tải script ${src}:`, error);
      reject(new Error(`Không thể tải script ${src}`));
    };
    document.body.appendChild(script);
  });
}

// Initialize content loaders
function initContentLoaders() {
  // Add event listener for flashcards tab
  const flashcardsTab = document.querySelector('.nav-links li[data-tab="flashcards"]');
  if (flashcardsTab) {
    // Remove existing click listener to prevent duplicates
    const newElement = flashcardsTab.cloneNode(true);
    flashcardsTab.parentNode.replaceChild(newElement, flashcardsTab);
    
    newElement.addEventListener('click', function() {
      console.log('Đã nhấp vào tab Flashcards');
      setTimeout(loadFlashcardsContent, 100);
    });
  } else {
    console.error('Không tìm thấy tab flashcards');
  }

  // Check if current tab is flashcards
  if (window.location.hash === '#flashcards' || 
      document.querySelector('.nav-links li[data-tab="flashcards"].active')) {
    setTimeout(loadFlashcardsContent, 300);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentLoaders);
} else {
  // If DOMContentLoaded has already fired
  initContentLoaders();
}

// Export functions for use elsewhere
window.loadFlashcardsContent = loadFlashcardsContent; 