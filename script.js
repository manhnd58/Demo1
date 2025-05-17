// Cấu hình ban đầu và dữ liệu
let wordList = [];
let categories = [];
let currentCardIndex = 0;
let selectedCategories = [];
let currentTab = 'home';
let currentGame = null;

// Thống kê người dùng
let userStats = {
  wordsLearned: 0,
  wordsReviewed: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  streak: 14,
  longestStreak: 21,
  totalLearningDays: 45,
  learningHistory: [],
  achievements: [],
  lastUpdated: null
};

let topics = {
  food: { name: "Thức ăn", progress: 0, totalWords: 0, words: [] },
  animals: { name: "Động vật", progress: 0, totalWords: 0, words: [] },
  travel: { name: "Du lịch", progress: 0, totalWords: 0, words: [] },
  technology: { name: "Công nghệ", progress: 0, totalWords: 0, words: [] },
  health: { name: "Sức khỏe", progress: 0, totalWords: 0, words: [] },
  education: { name: "Giáo dục", progress: 0, totalWords: 0, words: [] }
};
let quizScore = 0;
let currentQuizQuestions = [];
let selectedAnswer = null;
let isDarkMode = false;
let timerInterval = null;
let quizTimerInterval = null;
let quizStartTime = 0;
let quizEndTime = 0;
let quizTimeLimit = 0;
let cardFlipTimer = null;
let wordImages = {};
let audioCache = {};
let learningHistory = [];
let scheduleEvents = [];
let wrongAnswers = [];

// Khởi tạo ứng dụng khi trang đã tải xong
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM đã được tải xong, khởi tạo ứng dụng...');
  
  // Thử tải dữ liệu từ vựng từ file JSON
  try {
    fetchWords();
  } catch (error) {
    console.error('Không thể tải dữ liệu từ vựng:', error);
    // Nếu không tải được dữ liệu, dùng dữ liệu mẫu và khởi tạo ứng dụng
    generateSampleData();
    initializeApp();
  }
});

// Fetch từ vựng từ file JSON
async function fetchWords() {
  // Sử dụng dữ liệu mẫu ngay lập tức thay vì chờ
  generateSampleData();
  initializeApp();
  
  try {
    // Tải dữ liệu trong nền mà không hiển thị loading
    const response = await fetch('data/words.json');
    
    // Kiểm tra trạng thái response
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Kiểm tra dữ liệu
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data is not in expected format or empty!');
    }
    
    wordList = data.map(item => ({
      ...item,
      example: item.example || `This is an example with the word "${item.word}".`,
      isLearned: false,
      lastReviewed: null,
      correctCount: 0,
      wrongCount: 0,
      topic: item.topic || 'general',
      phonetic: item.phonetic || getPhoneticPlaceholder(item.word),
      wordType: item.wordType || 'noun'
    }));
    
    // Classify words into topics
    classifyWordsByTopic();
    
    // Preload images
    preloadWordImages();
    
    console.log('Words loaded successfully:', wordList.length);
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu từ vựng:', error);
    // Đã sử dụng dữ liệu mẫu ở đầu hàm rồi nên không cần làm gì thêm
  }
}

// Loading indicator functions
function showLoadingIndicator() {
  // Xóa loading cũ nếu còn
  const existingIndicator = document.querySelector('.loading-overlay');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  const loadingIndicator = document.createElement('div');
  loadingIndicator.classList.add('loading-overlay');
  loadingIndicator.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Đang tải từ vựng...</p>
    </div>
  `;
  document.body.appendChild(loadingIndicator);
}

function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-overlay');
    if (loadingIndicator) {
      loadingIndicator.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(loadingIndicator)) {
          loadingIndicator.remove();
        }
        document.body.classList.remove('loading');
      }, 500);
    } else {
      console.log('No loading indicator found to hide');
    }
  }

// Generate sample data if fetch fails
function generateSampleData() {
  wordList = [
    { word: "apple", meaning: "quả táo", example: "I eat an apple every day.", isLearned: false, topic: "food", phonetic: "/ˈæpl/", wordType: "noun" },
    { word: "banana", meaning: "quả chuối", example: "The monkey is eating a banana.", isLearned: false, topic: "food", phonetic: "/bəˈnɑːnə/", wordType: "noun" },
    { word: "cat", meaning: "con mèo", example: "The cat is sleeping on the sofa.", isLearned: false, topic: "animals", phonetic: "/kæt/", wordType: "noun" },
    { word: "dog", meaning: "con chó", example: "She walks her dog every morning.", isLearned: false, topic: "animals", phonetic: "/dɒɡ/", wordType: "noun" },
    { word: "elephant", meaning: "con voi", example: "The elephant has a long trunk.", isLearned: false, topic: "animals", phonetic: "/ˈelɪfənt/", wordType: "noun" },
    { word: "flower", meaning: "bông hoa", example: "She received a beautiful flower.", isLearned: false, topic: "general", phonetic: "/ˈflaʊər/", wordType: "noun" },
    { word: "guitar", meaning: "đàn ghi-ta", example: "He plays the guitar very well.", isLearned: false, topic: "general", phonetic: "/ɡɪˈtɑːr/", wordType: "noun" },
    { word: "house", meaning: "ngôi nhà", example: "They live in a big house.", isLearned: false, topic: "general", phonetic: "/haʊs/", wordType: "noun" },
    { word: "ice cream", meaning: "kem", example: "Children love ice cream in summer.", isLearned: false, topic: "food", phonetic: "/ˌaɪs ˈkriːm/", wordType: "noun" },
    { word: "jacket", meaning: "áo khoác", example: "Wear a jacket when it's cold outside.", isLearned: false, topic: "general", phonetic: "/ˈdʒækɪt/", wordType: "noun" },
    { word: "computer", meaning: "máy tính", example: "She uses her computer to study English.", isLearned: false, topic: "technology", phonetic: "/kəmˈpjuːtər/", wordType: "noun" },
    { word: "internet", meaning: "mạng internet", example: "We use the internet every day.", isLearned: false, topic: "technology", phonetic: "/ˈɪntərnet/", wordType: "noun" },
    { word: "travel", meaning: "du lịch", example: "I love to travel to new countries.", isLearned: false, topic: "travel", phonetic: "/ˈtrævl/", wordType: "verb" },
    { word: "hospital", meaning: "bệnh viện", example: "My friend works at the hospital.", isLearned: false, topic: "health", phonetic: "/ˈhɒspɪtl/", wordType: "noun" },
    { word: "school", meaning: "trường học", example: "Children go to school to learn.", isLearned: false, topic: "education", phonetic: "/skuːl/", wordType: "noun" }
  ];
  
  // Classify words into topics
  classifyWordsByTopic();
}

// Khởi tạo ứng dụng
function initializeApp() {
  console.log('Initializing app...');
  
  // Xóa tất cả màn hình loading nếu có
  const loadingOverlays = document.querySelectorAll('.loading-overlay');
  loadingOverlays.forEach(overlay => overlay.remove());
  document.body.classList.remove('loading');
  
  // Generate sample data first if needed (to ensure data is ready)
  if (!wordList || wordList.length === 0) {
    generateSampleData();
  }
  
  // Load user data
  loadUserData();
  
  // Set word of the day - Di chuyển lên trước các thiết lập event để đảm bảo từ vựng có sẵn ngay khi trang tải
  setWordOfDay();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up modal event listeners
  setupModalEventListeners();
  
  // Initialize calendar
  initializeCalendar();
  
  // Animate home elements
  animateHomeElements();
  
  // Create toast container
  createToastContainer();
  
  // Check if we need to preload flashcards
  if (window.location.hash === '#flashcards') {
    console.log('Preloading flashcards từ hash URL');
    switchTab('flashcards');
  }
  
  // Check if flashcards tab is active
  const activeTab = document.querySelector('.nav-links li.active');
  if (activeTab && activeTab.getAttribute('data-tab') === 'flashcards') {
    console.log('Preloading flashcards từ tab active');
    if (typeof loadFlashcardsContent === 'function') {
      setTimeout(loadFlashcardsContent, 500);
    }
  }
  
  console.log('App initialized');
}

// Animate home elements
function animateHomeElements() {
  const statsCard = document.querySelector('.stats-card');
  const calendarCard = document.querySelector('.calendar-card');
  const dailyWordSection = document.querySelector('.daily-word-section');
  const quickStartSection = document.querySelector('.quick-start-section');
  
  // Apply staggered animations
  if (statsCard) {
    setTimeout(() => statsCard.classList.add('animate-in'), 100);
  }
  
  if (calendarCard) {
    setTimeout(() => calendarCard.classList.add('animate-in'), 200);
  }
  
  if (dailyWordSection) {
    setTimeout(() => dailyWordSection.classList.add('animate-in'), 300);
  }
  
  if (quickStartSection) {
    setTimeout(() => quickStartSection.classList.add('animate-in'), 400);
  }
  
  // Animate stats containers
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    setTimeout(() => card.classList.add('animate-in'), 500 + (index * 100));
  });
  
  // Animate topic cards
  const topicCards = document.querySelectorAll('.topic-card');
  topicCards.forEach((card, index) => {
    setTimeout(() => card.classList.add('animate-in'), 800 + (index * 100));
  });
}

// Chuyển tab
function switchTab(tabName) {
  if (currentTab === tabName) return;
  
  // Add exit animation to current tab
  const currentTabElement = document.getElementById(currentTab);
  if (currentTabElement) {
    currentTabElement.classList.add('tab-exit');
    
    setTimeout(() => {
      // Remove active class and exit animation
      currentTabElement.classList.remove('active');
      currentTabElement.classList.remove('tab-exit');
      
      // Update navigation
      document.querySelectorAll('.nav-links li').forEach(item => {
        item.classList.remove('active');
      });
      
      const tabLink = document.querySelector(`.nav-links li[data-tab="${tabName}"]`);
      if (tabLink) {
        tabLink.classList.add('active');
      }
      
      // Hide all tabs first
      document.querySelectorAll('.tab-content section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
      });
      
      // Show the new tab
      const newTabElement = document.getElementById(tabName);
      if (newTabElement) {
        newTabElement.classList.add('active');
        newTabElement.classList.add('tab-enter');
        newTabElement.style.display = 'block';
        
        // Remove entrance animation after it completes
        setTimeout(() => {
          newTabElement.classList.remove('tab-enter');
        }, 150);
      }
      
      // Update current tab
      currentTab = tabName;
      
      // Perform tab-specific initializations
      initializeTabContent(tabName);
    }, 150);
  } else {
    // If there's no current tab element, just switch immediately
    document.querySelectorAll('.nav-links li').forEach(item => {
      item.classList.remove('active');
    });
    
    const tabLink = document.querySelector(`.nav-links li[data-tab="${tabName}"]`);
    if (tabLink) {
      tabLink.classList.add('active');
    }
    
    // Hide all tabs first
    document.querySelectorAll('.tab-content section').forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });
    
    const newSection = document.getElementById(tabName);
    if (newSection) {
      newSection.classList.add('active');
      newSection.style.display = 'block';
    }
    
    currentTab = tabName;
    
    // Initialize tab content
    initializeTabContent(tabName);
  }
}

// Initialize tab-specific content
function initializeTabContent(tabName) {
  console.log('Khởi tạo nội dung cho tab:', tabName);
  switch (tabName) {
    case 'home':
      animateHomeElements();
      break;
    case 'flashcards':
      console.log('Đang khởi tạo flashcards...');
      // Đảm bảo phần flashcards hiển thị
      const flashcardsSection = document.getElementById('flashcards');
      if (flashcardsSection) {
        flashcardsSection.style.display = 'block';
      }
      
      if (typeof loadFlashcardsContent === 'function') {
        console.log('Gọi hàm loadFlashcardsContent');
        loadFlashcardsContent();
      } else {
        console.error('loadFlashcardsContent function not found');
        // Thử tải script FlashCards/loaderFlashCards.js
        const script = document.createElement('script');
        script.src = 'FlashCards/loaderFlashCards.js';
        script.onload = function() {
          if (typeof loadFlashcardsContent === 'function') {
            console.log('Đã tải lại script loaderFlashCards.js');
            loadFlashcardsContent();
          }
        };
        document.body.appendChild(script);
      }
      break;
    case 'quiz':
      setupQuizEventListeners();
      break;
    case 'topics':
      animateTopicCards();
      break;
    case 'games':
      setupGamesEventListeners();
      break;
    case 'progress':
      updateLearningChart();
      setupProgressEventListeners();
      break;
    case 'schedule':
      setupScheduleEventListeners();
      break;
    case 'profile':
      setupProfilePage();
      break;
  }
}


// Animate topic cards entrance
function animateTopicCards() {
  const topicCards = document.querySelectorAll('.topic-large-card');
  topicCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-in');
    }, 100 * index);
  });
}

// Toggle dark mode with improved animation
function toggleDarkMode() {
  console.log('toggleDarkMode được gọi');
  
  // Đảo ngược trạng thái hiện tại
  isDarkMode = !isDarkMode;
  console.log('Dark mode mới:', isDarkMode);
  
  // Lấy tham chiếu đến nút và các icon
  const darkModeToggle = document.getElementById('darkModeToggle');
  const moonIcon = darkModeToggle ? darkModeToggle.querySelector('.fa-moon') : null;
  const sunIcon = darkModeToggle ? darkModeToggle.querySelector('.fa-sun') : null;
  
  if (!darkModeToggle) {
    console.error('Không tìm thấy nút darkModeToggle');
  }
  
  if (!moonIcon || !sunIcon) {
    console.error('Không tìm thấy icon mặt trăng hoặc mặt trời');
    console.log('Moon icon:', moonIcon);
    console.log('Sun icon:', sunIcon);
  }
  
  // Thêm class và thay đổi icon dựa trên trạng thái mới
  if (isDarkMode) {
    // Thêm lớp chuyển đổi
    document.body.classList.add('dark-mode-transition');
    // Thêm lớp dark mode
    document.body.classList.add('dark-mode');
    
    // Thay đổi icon
    if (moonIcon && sunIcon) {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    }
  } else {
    // Thêm lớp chuyển đổi
    document.body.classList.add('dark-mode-transition');
    // Xóa lớp dark mode
    document.body.classList.remove('dark-mode');
    
    // Thay đổi icon
    if (moonIcon && sunIcon) {
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    }
  }
  
  // Lưu trạng thái vào localStorage
  localStorage.setItem('darkMode', isDarkMode);
  
  // Xóa lớp chuyển đổi sau khi hoàn thành animation
  setTimeout(() => {
    document.body.classList.remove('dark-mode-transition');
  }, 500);
  
  // Hiển thị thông báo
  // if (isDarkMode) {
  //   showToast('Đã chuyển sang chế độ tối', 'info');
  // } else {
  //   showToast('Đã chuyển sang chế độ sáng', 'info');
  // }
}

// Classify words into topics
function classifyWordsByTopic() {
  // Reset topic data
  Object.keys(topics).forEach(key => {
    topics[key].words = [];
    topics[key].totalWords = 0;
    topics[key].progress = 0;
  });
  
  // Add general topic if not exists
  if (!topics.general) {
    topics.general = { name: "Cơ bản", progress: 0, totalWords: 0, words: [] };
  }
  
  // Classify words
  wordList.forEach(word => {
    const topic = word.topic || 'general';
    
    // Create topic if not exists
    if (!topics[topic]) {
      topics[topic] = { name: topic.charAt(0).toUpperCase() + topic.slice(1), progress: 0, totalWords: 0, words: [] };
    }
    
    // Add word to topic
    topics[topic].words.push(word);
    topics[topic].totalWords++;
    
    // Update progress
    if (word.isLearned) {
      topics[topic].progress++;
    }
  });
  
  // Calculate completion percentage for each topic
  Object.keys(topics).forEach(key => {
    if (topics[key].totalWords > 0) {
      topics[key].completion = Math.round((topics[key].progress / topics[key].totalWords) * 100);
    } else {
      topics[key].completion = 0;
    }
  });
}

// Update topic progress in UI
function updateTopicProgress() {
  // Update small topic cards in home page
  const topicCards = document.querySelectorAll('.topic-card:not(.more)');
  topicCards.forEach(card => {
    const topicKey = card.dataset.topic;
    if (topics[topicKey]) {
      const progressBar = card.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.width = `${topics[topicKey].completion}%`;
      }
    }
  });
  
  // Update large topic cards in topics page
  const topicLargeCards = document.querySelectorAll('.topic-large-card');
  topicLargeCards.forEach(card => {
    const topicKey = card.dataset.topic;
    if (topics[topicKey]) {
      const progressText = card.querySelector('.topic-stat span');
      if (progressText) {
        progressText.textContent = `${topics[topicKey].progress}/${topics[topicKey].totalWords} từ`;
      }
    }
  });
}

// Thiết lập tất cả event listeners
function setupEventListeners() {
  console.log('Thiết lập event listeners');
  
  // Tab navigation
  document.querySelectorAll('.nav-links li').forEach(item => {
    item.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      if (tabName) {
        console.log('Chuyển đến tab:', tabName);
        switchTab(tabName);
      }
    });
  });
  
  // Đặc biệt xử lý cho tab Flashcards
  const flashcardsTab = document.querySelector('.nav-links li[data-tab="flashcards"]');
  if (flashcardsTab) {
    flashcardsTab.addEventListener('click', function() {
      console.log('Click vào tab Flashcards');
      const flashcardsSection = document.getElementById('flashcards');
      if (flashcardsSection) {
        flashcardsSection.style.display = 'block';
      }
      
      // Đảm bảo loadFlashcardsContent được gọi
      if (typeof loadFlashcardsContent === 'function') {
        console.log('Gọi hàm loadFlashcardsContent từ event listener');
        setTimeout(loadFlashcardsContent, 100);
      }
    });
  }
  
  // Dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    console.log('Đã tìm thấy nút darkModeToggle, thiết lập event listener');
    // Xóa tất cả event listener cũ (nếu có) để tránh trùng lặp
    darkModeToggle.removeEventListener('click', toggleDarkMode);
    // Thêm event listener mới
    darkModeToggle.addEventListener('click', toggleDarkMode);
  } else {
    console.error('Không tìm thấy nút darkModeToggle để thiết lập event listener');
  }
  
  // Topic card click events
  const topicCards = document.querySelectorAll('.topic-card:not(.more)');
  topicCards.forEach(card => {
    card.addEventListener('click', function() {
      const topicKey = this.dataset.topic;
      if (topics[topicKey]) {
        selectTopic(topicKey);
        switchTab('topics');
      }
    });
  });
  
  // View all topics button
  const viewAllTopicsBtn = document.getElementById('viewAllTopics');
  if (viewAllTopicsBtn) {
    viewAllTopicsBtn.addEventListener('click', function() {
      switchTab('topics');
    });
  }
  
  // Topic large cards in topics tab
  const topicLargeCards = document.querySelectorAll('.topic-large-card');
  topicLargeCards.forEach(card => {
    const learnButton = card.querySelector('.btn-primary');
    if (learnButton) {
      learnButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent card click event
        const topicKey = card.dataset.topic;
        startLearningTopic(topicKey);
      });
    }
    
    // Make the entire card clickable
    card.addEventListener('click', function() {
      const topicKey = this.dataset.topic;
      startLearningTopic(topicKey);
    });
  });
  
  // Quick action buttons
  const startLearningBtn = document.getElementById('startLearning');
  if (startLearningBtn) {
    startLearningBtn.addEventListener('click', function() {
      switchTab('topics');
    });
  }
  
  const dailyChallengeBtn = document.getElementById('dailyChallenge');
  if (dailyChallengeBtn) {
    dailyChallengeBtn.addEventListener('click', function() {
      startDailyChallenge();
    });
  }
  
  const reviewMistakesBtn = document.getElementById('reviewMistakesBtn');
  if (reviewMistakesBtn) {
    reviewMistakesBtn.addEventListener('click', function() {
      reviewMistakes();
    });
  }
  
  const startPracticeBtn = document.getElementById('startPractice');
  if (startPracticeBtn) {
    startPracticeBtn.addEventListener('click', function() {
      switchTab('flashcards');
    });
  }
  
  // Word of the day actions
  const refreshWordBtn = document.getElementById('refreshWord');
  if (refreshWordBtn) {
    refreshWordBtn.addEventListener('click', function() {
      setWordOfDay();
      showToast('Đã làm mới từ vựng hôm nay');
    });
  }
  
  const markLearnedBtn = document.getElementById('markLearned');
  if (markLearnedBtn) {
    markLearnedBtn.addEventListener('click', function() {
      markWordAsLearned();
    });
  }
  
  const addToReviewBtn = document.getElementById('addToReview');
  if (addToReviewBtn) {
    addToReviewBtn.addEventListener('click', function() {
      addWordToReview();
    });
  }
  
  const pronounceWordBtn = document.getElementById('pronounceWord');
  if (pronounceWordBtn) {
    pronounceWordBtn.addEventListener('click', function() {
      pronounceCurrentWord();
    });
  }
  
  // Setup other specific area event listeners
  setupFlashcardEventListeners();
  setupQuizEventListeners();
  setupGamesEventListeners();
  setupProgressEventListeners();
  setupScheduleEventListeners();
}

// Select topic for learning
function selectTopic(topicKey) {
  console.log(`Topic selected: ${topicKey}`);
  // Implementation...
}

// Start learning a specific topic
function startLearningTopic(topicKey) {
  console.log(`Starting to learn topic: ${topicKey}`);
  // Implementation...
}

// Start daily challenge
function startDailyChallenge() {
  console.log('Starting daily challenge');
  // Implementation...
}

// Review mistakes
function reviewMistakes() {
  console.log('Starting review of mistakes');
  // Implementation...
}

// Mark word as learned
function markWordAsLearned() {
  console.log('Marking word as learned');
  // Implementation...
}

// Add word to review list
function addWordToReview() {
  console.log('Adding word to review list');
  // Implementation...
}

// Pronounce current word
function pronounceCurrentWord() {
  console.log('Pronouncing current word');
  // Implementation...
}


// Quiz event listeners
function setupQuizEventListeners() {
  // Range slider for question count
  const questionCountSlider = document.getElementById('questionCount');
  const questionCountDisplay = document.getElementById('questionCountDisplay');
  if (questionCountSlider && questionCountDisplay) {
    questionCountSlider.addEventListener('input', () => {
      questionCountDisplay.textContent = questionCountSlider.value;
    });
  }
  
  // Quiz start button
  const startQuizBtn = document.getElementById('startQuizBtn');
  // if (startQuizBtn) {
  //   startQuizBtn.addEventListener('click', function() {
  //     // Hiển thị giao diện quiz
  //     const quizSettings = document.getElementById('quizSettings');
  //     const quizContainer = document.getElementById('quizContainer');
      
  //     if (quizSettings && quizContainer) {
  //       quizSettings.style.display = 'none';
  //       quizContainer.style.display = 'block';
        
  //       // Khởi tạo quiz
  //       initializeQuiz();
  //     }
  //   });
  // }
  
  // Quiz interaction buttons
  const checkAnswerBtn = document.getElementById('checkAnswer');
  if (checkAnswerBtn) {
    checkAnswerBtn.addEventListener('click', function() {
      checkQuizAnswer();
    });
  }
  
  const nextQuestionBtn = document.getElementById('nextQuestion');
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', function() {
      moveToNextQuestion();
    });
  }
  
  const endQuizBtn = document.getElementById('endQuiz');
  if (endQuizBtn) {
    endQuizBtn.addEventListener('click', function() {
      endQuiz();
      // Quay lại màn hình cài đặt quiz
      const quizSettings = document.getElementById('quizSettings');
      const quizContainer = document.getElementById('quizContainer');
      
      if (quizSettings && quizContainer) {
        quizSettings.style.display = 'block';
        quizContainer.style.display = 'none';
      }
    });
  }
  
  // Quiz result buttons
  const retakeQuizBtn = document.getElementById('retakeQuiz');
  if (retakeQuizBtn) {
    retakeQuizBtn.addEventListener('click', function() {
      // Reset quiz and start over
      initializeQuiz();
    });
  }
  
  const reviewWordsBtn = document.getElementById('reviewWords');
  if (reviewWordsBtn) {
    reviewWordsBtn.addEventListener('click', function() {
      reviewQuizMistakes();
    });
  }
  
  const returnToSettingsBtn = document.getElementById('returnToSettings');
  if (returnToSettingsBtn) {
    returnToSettingsBtn.addEventListener('click', function() {
      // Return to quiz settings
      const quizSettings = document.getElementById('quizSettings');
      const quizContainer = document.getElementById('quizContainer');
      const quizResults = document.getElementById('quizResults');
      
      if (quizSettings && quizContainer && quizResults) {
        quizSettings.style.display = 'block';
        quizContainer.style.display = 'none';
        quizResults.style.display = 'none';
      }
    });
  }
  
  // Audio pronunciation in quiz
  const pronounceQuestionBtn = document.getElementById('pronounceQuestion');
  if (pronounceQuestionBtn) {
    pronounceQuestionBtn.addEventListener('click', function() {
      // Get current question
      const currentQuestionIndex = parseInt(document.getElementById('currentQuestionIndex').textContent) - 1;
      const question = currentQuizQuestions[currentQuestionIndex];
      if (question) {
        pronounceWord(question.word.word);
      }
    });
  }
}

// Initialize Quiz
function initializeQuiz() {
  console.log('Initializing quiz...');
  
  // Get quiz settings
  const questionCount = parseInt(document.getElementById('questionCount').value) || 10;
  const selectedTopics = Array.from(document.querySelectorAll('#topicSelect input:checked')).map(input => input.value);
  const quizTime = parseInt(document.getElementById('quizTime').value) || 0;
  
  console.log('Quiz settings:', { questionCount, selectedTopics, quizTime });
  
  // Reset quiz state
  quizScore = 0;
  currentQuizQuestions = [];
  
  // Update UI elements
  document.getElementById('currentScore').textContent = quizScore;
  document.getElementById('totalQuestions').textContent = questionCount;
  document.getElementById('currentQuestionIndex').textContent = '1';
  document.getElementById('quizProgress').style.width = `${(1 / questionCount) * 100}%`;
  
  // Generate quiz questions
  generateQuizQuestions(questionCount, selectedTopics);
  
  // Display first question
  if (currentQuizQuestions.length > 0) {
    displayQuestion(0);
  } else {
    console.error('No questions could be generated');
    showToast('Không thể tạo câu hỏi. Vui lòng thử lại với các chủ đề khác.', 'error');
  }
  
  // Setup timer if needed
  if (quizTime > 0) {
    setupQuizTimer(quizTime);
  } else {
    const timerContainer = document.getElementById('quizTimerContainer');
    if (timerContainer) {
      timerContainer.style.display = 'none';
    }
  }
}

// Generate quiz questions
function generateQuizQuestions(count, topics) {
  console.log('Generating quiz questions...');
  
  // Filter words by selected topics
  let availableWords = [];
  
  if (topics.length === 0 || topics.includes('all')) {
    // If no topic selected or "all" is selected, use all words
    availableWords = [...wordList];
  } else {
    // Otherwise filter by selected topics
    availableWords = wordList.filter(word => topics.includes(word.topic));
  }
  
  // If not enough words available, use all words
  if (availableWords.length < count) {
    console.warn(`Not enough words in selected topics (${availableWords.length}). Using all available words.`);
    availableWords = [...wordList];
  }
  
  // Shuffle words and take the required count
  shuffleArray(availableWords);
  const selectedWords = availableWords.slice(0, count);
  
  // Create questions
  currentQuizQuestions = selectedWords.map((word, index) => {
    // Create different question types
    const questionType = getRandomQuestionType();
    
    return {
      id: index,
      word: word,
      type: questionType,
      options: generateOptionsForWord(word, availableWords),
      userAnswer: null,
      isCorrect: false,
      answered: false
    };
  });
  
  console.log(`Generated ${currentQuizQuestions.length} questions`);
}

// Helper function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Get random question type
function getRandomQuestionType() {
  const types = ['multiple-choice', 'fill-blank', 'listening'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}

// Generate options for a word
function generateOptionsForWord(word, allWords) {
  // Create one correct option and three wrong options
  const correctOption = word.meaning;
  
  // Get 3 random wrong meanings
  const wrongOptions = allWords
    .filter(w => w.word !== word.word) // Exclude the current word
    .map(w => w.meaning) // Get meanings
    .sort(() => 0.5 - Math.random()) // Shuffle
    .slice(0, 3); // Take 3
  
  // Combine and shuffle
  const options = [correctOption, ...wrongOptions];
  shuffleArray(options);
  
  return options;
}

// Display a question
function displayQuestion(questionIndex) {
  if (questionIndex >= currentQuizQuestions.length) {
    console.error('Question index out of bounds');
    return;
  }
  
  const question = currentQuizQuestions[questionIndex];
  
  // Update progress
  document.getElementById('currentQuestionIndex').textContent = (questionIndex + 1).toString();
  document.getElementById('quizProgress').style.width = `${((questionIndex + 1) / currentQuizQuestions.length) * 100}%`;
  
  // Hide all question containers
  document.querySelectorAll('.question-container').forEach(container => {
    container.style.display = 'none';
  });
  
  // Show the appropriate question container based on type
  switch (question.type) {
    case 'multiple-choice':
      displayMultipleChoiceQuestion(question);
      break;
    case 'fill-blank':
      displayFillBlankQuestion(question);
      break;
    case 'listening':
      displayListeningQuestion(question);
      break;
    default:
      displayMultipleChoiceQuestion(question);
  }
}

// Display multiple choice question
function displayMultipleChoiceQuestion(question) {
  const container = document.getElementById('multiChoiceQuestion');
  container.style.display = 'block';
  
  // Set question text
  document.getElementById('questionText').textContent = `Đâu là nghĩa của từ "${question.word.word}"?`;
  
  // Set options
  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const optionElement = document.createElement('div');
    optionElement.className = 'quiz-option';
    optionElement.textContent = option;
    optionElement.dataset.index = index.toString();
    
    // Add click handler
    optionElement.addEventListener('click', function() {
      // Remove selected class from all options
      document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      this.classList.add('selected');
      
      // Enable check answer button
      document.getElementById('checkAnswer').disabled = false;
      
      // Store user's answer
      selectedAnswer = option;
    });
    
    optionsContainer.appendChild(optionElement);
  });
}

// Display fill in the blank question
function displayFillBlankQuestion(question) {
  const container = document.getElementById('fillBlankQuestion');
  container.style.display = 'block';
  
  // Create a sentence with the word
  const sentence = question.word.example || `This is an example with the word "${question.word.word}".`;
  
  // Replace the word with blank
  const blankSentence = sentence.replace(new RegExp(question.word.word, 'gi'), '_____');
  
  // Set the text
  document.getElementById('fillBlankText').textContent = blankSentence;
  
  // Clear and focus the input
  const input = document.getElementById('blankAnswer');
  input.value = '';
  setTimeout(() => input.focus(), 100);
  
  // Add input handler
  input.addEventListener('input', function() {
    // Enable check answer button if there's text
    document.getElementById('checkAnswer').disabled = this.value.trim() === '';
    
    // Store user's answer
    selectedAnswer = this.value.trim();
  });
}

// Display listening question
function displayListeningQuestion(question) {
  const container = document.getElementById('listeningQuestion');
  container.style.display = 'block';
  
  // Set up audio button
  const playAudioBtn = document.getElementById('playAudio');
  playAudioBtn.onclick = function() {
    // Play pronunciation of the word
    pronounceWord(question.word.word);
  };
  
  // Set options (words that sound similar)
  const optionsContainer = document.getElementById('listeningOptions');
  optionsContainer.innerHTML = '';
  
  // Create options including the correct word and similar sounding words
  const options = [question.word.word];
  
  // Add some similar words or random words if not enough similar ones
  const similarWords = wordList
    .filter(w => w.word !== question.word.word)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.word);
  
  options.push(...similarWords);
  shuffleArray(options);
  
  // Add options to the container
  options.forEach((option, index) => {
    const optionElement = document.createElement('div');
    optionElement.className = 'quiz-option';
    optionElement.textContent = option;
    optionElement.dataset.index = index.toString();
    
    // Add click handler
    optionElement.addEventListener('click', function() {
      // Remove selected class from all options
      document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      this.classList.add('selected');
      
      // Enable check answer button
      document.getElementById('checkAnswer').disabled = false;
      
      // Store user's answer
      selectedAnswer = option;
    });
    
    optionsContainer.appendChild(optionElement);
  });
}

// Setup quiz timer
function setupQuizTimer(seconds) {
  const timerContainer = document.getElementById('quizTimerContainer');
  const timerDisplay = document.getElementById('quizTimer');
  
  if (timerContainer && timerDisplay) {
    timerContainer.style.display = 'flex';
    
    // Clear any existing timer
    if (quizTimerInterval) {
      clearInterval(quizTimerInterval);
    }
    
    // Set start time
    quizStartTime = Date.now();
    quizTimeLimit = seconds;
    
    // Update timer display
    updateTimerDisplay(seconds, timerDisplay);
    
    // Start timer
    quizTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
      const remaining = seconds - elapsed;
      
      if (remaining <= 0) {
        // Time's up
        clearInterval(quizTimerInterval);
        endQuiz();
        return;
      }
      
      // Update display
      updateTimerDisplay(remaining, timerDisplay);
      
      // Add warning class when time is running low
      if (remaining <= 10) {
        timerDisplay.classList.add('time-warning');
      }
    }, 1000);
  }
}

// Update timer display
function updateTimerDisplay(seconds, display) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  display.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Pronounce a word
function pronounceWord(word) {
  // Check if we have a cached audio
  if (audioCache[word]) {
    audioCache[word].play();
    return;
  }
  
  // Otherwise create new audio
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  
  speechSynthesis.speak(utterance);
  
  // Cache the audio for future use
  try {
    // This is a simplified version - in a real app you'd use proper audio caching
    audioCache[word] = utterance;
  } catch (e) {
    console.error('Error caching audio:', e);
  }
}


// Progress event listeners
function setupProgressEventListeners() {
  // Time period filter
  document.querySelectorAll('.time-filter button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.time-filter button').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      updateProgressCharts(button.dataset.period);
    });
  });
  
  // History filters
  document.getElementById('historySearch').addEventListener('input', filterLearningHistory);
  document.getElementById('historyFilter').addEventListener('change', filterLearningHistory);
}

// Schedule event listeners
function setupScheduleEventListeners() {
  // Calendar navigation
  document.getElementById('prevMonthMini').addEventListener('click', () => navigateMiniCalendar(-1));
  document.getElementById('nextMonthMini').addEventListener('click', () => navigateMiniCalendar(1));
  document.getElementById('prevDay').addEventListener('click', () => navigateDay(-1));
  document.getElementById('nextDay').addEventListener('click', () => navigateDay(1));
  document.getElementById('today').addEventListener('click', () => goToToday());
  
  // Add activity
  document.getElementById('addActivityBtn').addEventListener('click', showActivityModal);
  document.getElementById('closeActivityModal').addEventListener('click', hideActivityModal);
  document.getElementById('cancelActivity').addEventListener('click', hideActivityModal);
  
  // Reminder toggle
  document.getElementById('reminderEnabled').addEventListener('change', toggleReminderOptions);
  
  // Form submission
  document.getElementById('activityForm').addEventListener('submit', saveActivity);
}

// Thiết lập event listeners cho modals
function setupModalEventListeners() {
  // About modal events
  const aboutBtn = document.getElementById('aboutBtn');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => openModal('aboutModal'));
    console.log('Event listener cho nút giới thiệu đã được thiết lập');
  }
  
  const contactBtn = document.getElementById('contactBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => openModal('contactModal'));
    console.log('Event listener cho nút liên hệ đã được thiết lập');
  }
  
  const startLearningFromAbout = document.getElementById('startLearningFromAbout');
  if (startLearningFromAbout) {
    startLearningFromAbout.addEventListener('click', () => {
      closeModal('aboutModal');
      switchTab('topics');
    });
  }
  
  const contactFromAbout = document.getElementById('contactFromAbout');
  if (contactFromAbout) {
    contactFromAbout.addEventListener('click', () => {
      closeModal('aboutModal');
      openModal('contactModal');
    });
  }
  
  // Contact form submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
  
  // Chat functionality
  const sendChatBtn = document.getElementById('sendChatBtn');
  if (sendChatBtn) {
    sendChatBtn.addEventListener('click', sendChatMessage);
  }
  
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  // Profile modal events
  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => openModal('editProfileModal'));
  }
  
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      saveProfileChanges();
      closeModal('editProfileModal');
    });
  }
  
  const avatarUpload = document.getElementById('avatarUpload');
  if (avatarUpload) {
    avatarUpload.addEventListener('change', handleAvatarUpload);
  }
  
  // Add click events to close buttons for all modals
  const closeButtons = document.querySelectorAll('.btn-close, [data-bs-dismiss="modal"]');
  console.log(`Tìm thấy ${closeButtons.length} nút đóng modal`);
  
  closeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Find the closest modal parent
      const modal = this.closest('.modal');
      if (modal) {
        console.log(`Đóng modal: ${modal.id}`);
        closeModal(modal.id);
      } else {
        console.error('Không tìm thấy modal cha cho nút đóng');
      }
    });
  });
  
  // Add click events for modal backdrops
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
      // Only close if clicking directly on the modal background, not its contents
      if (e.target === this) {
        console.log(`Đóng modal (click vào backdrop): ${modal.id}`);
        closeModal(this.id);
      }
    });
  });
  
  console.log('Hoàn tất thiết lập event listeners cho modals');
}

// Xử lý tải lên ảnh đại diện
function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (file) {
    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh không được vượt quá 5MB', 'error');
      return;
    }

    // Kiểm tra định dạng file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      // Cập nhật ảnh đại diện ngay lập tức
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar) {
        userAvatar.src = event.target.result;
        // Thêm hiệu ứng fade
        userAvatar.style.opacity = '0';
        setTimeout(() => {
          userAvatar.style.opacity = '1';
        }, 50);
      }

      // Lưu avatar vào localStorage
      localStorage.setItem('userAvatar', event.target.result);
      
      // Hiển thị thông báo thành công
      showToast('Đã cập nhật ảnh đại diện thành công!');
    };

    reader.onerror = function() {
      showToast('Có lỗi xảy ra khi đọc file ảnh', 'error');
    };

    reader.readAsDataURL(file);
  }
}

// Lưu thay đổi hồ sơ người dùng
function saveProfileChanges() {
  const name = document.getElementById('editName').value;
  const email = document.getElementById('editEmail').value;
  const bio = document.getElementById('editBio').value;
  const goal = document.getElementById('editGoal').value;
  const level = document.getElementById('editLevel').value;
  
  // Cập nhật giao diện
  document.getElementById('profileName').textContent = name;
  document.getElementById('userLevel').textContent = level === 'beginner' ? 'Sơ Cấp' : (level === 'intermediate' ? 'Trung Cấp' : 'Cao Cấp');
  
  // Lưu vào localStorage
  const userProfile = {
    name,
    email,
    bio,
    goal,
    level,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  
  showToast('Đã lưu thông tin hồ sơ thành công!');
}

// Tải dữ liệu hồ sơ người dùng
function loadUserProfile() {
  // Kiểm tra và tải ảnh đại diện
  const userAvatar = localStorage.getItem('userAvatar');
  if (userAvatar) {
    document.getElementById('userAvatar').src = userAvatar;
  }
  
  // Kiểm tra và tải thông tin người dùng
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile) {
    try {
      const profile = JSON.parse(userProfile);
      document.getElementById('profileName').textContent = profile.name;
      document.getElementById('userLevel').textContent = profile.level === 'beginner' ? 'Sơ Cấp' : (profile.level === 'intermediate' ? 'Trung Cấp' : 'Cao Cấp');
      
      // Cập nhật giá trị form chỉnh sửa
      document.getElementById('editName').value = profile.name;
      document.getElementById('editEmail').value = profile.email;
      document.getElementById('editBio').value = profile.bio;
      document.getElementById('editGoal').value = profile.goal;
      document.getElementById('editLevel').value = profile.level;
    } catch (error) {
      console.error('Lỗi khi tải thông tin hồ sơ:', error);
    }
  }
}

// Cập nhật hiển thị streak học tập
function updateStreakDisplay() {
  // Hiển thị chuỗi streak hiện tại
  const streakBadge = document.getElementById('streakBadge');
  if (streakBadge) {
    streakBadge.textContent = `${userStats.streak} Ngày`;
  }
  
  // Lấy thông tin các ngày đã học trong tháng
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Nếu lịch sử học tập không tồn tại, tạo một lịch sử giả
  if (!userStats.learningHistory) {
    userStats.learningHistory = [];
    
    // Tạo lịch sử giả cho 14 ngày gần đây
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userStats.learningHistory.push({
        date: date.toISOString().split('T')[0],
        minutes: Math.floor(Math.random() * 60) + 15,
        wordsLearned: Math.floor(Math.random() * 10) + 1
      });
    }
    
    // Lưu vào localStorage
    localStorage.setItem('userStats', JSON.stringify(userStats));
  }
  
  // Hiển thị lịch tháng
  generateStreakCalendar(currentMonth, currentYear);
}

// Tạo lịch streak học tập
function generateStreakCalendar(month, year) {
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
                      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  
  const streakMonth = document.getElementById('streakMonth');
  if (streakMonth) {
    streakMonth.textContent = `${monthNames[month]}, ${year}`;
  }
  
  // Xóa nội dung cũ
  const streakDaysContainer = document.querySelector('.streak-days');
  if (!streakDaysContainer) return;
  
  streakDaysContainer.innerHTML = '';
  
  // Lấy ngày đầu tiên của tháng
  const firstDay = new Date(year, month, 1);
  // Lấy ngày cuối cùng của tháng
  const lastDay = new Date(year, month + 1, 0);
  
  // Tạo ngày trong tháng
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const currentDate = new Date(year, month, i);
    const dateString = currentDate.toISOString().split('T')[0];
    const isToday = new Date().toISOString().split('T')[0] === dateString;
    
    // Kiểm tra xem ngày đó đã học chưa
    const hasLearned = userStats.learningHistory?.some(item => item.date === dateString);
    
    // Tạo phần tử ngày
    const dayElement = document.createElement('div');
    dayElement.className = `streak-day ${hasLearned ? 'active' : ''} ${isToday ? 'today' : ''}`;
    
    const span = document.createElement('span');
    span.textContent = i;
    dayElement.appendChild(span);
    
    // Thêm tooltip cho ngày đã học
    if (hasLearned) {
      const learningData = userStats.learningHistory.find(item => item.date === dateString);
      dayElement.title = `Đã học ${learningData.wordsLearned} từ mới\nThời gian học: ${learningData.minutes} phút`;
    }
    
    // Thêm vào container
    streakDaysContainer.appendChild(dayElement);
  }
}

// Điều hướng qua các tháng trong lịch streak
function navigateStreakMonth(direction) {
  const streakMonth = document.getElementById('streakMonth');
  if (!streakMonth) return;
  
  const currentMonth = streakMonth.textContent;
  const [monthName, year] = currentMonth.split(', ');
  
  // Lấy tháng từ tên
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
                      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const monthIndex = monthNames.indexOf(monthName);
  
  // Tính toán tháng mới
  let newMonth = monthIndex + direction;
  let newYear = parseInt(year);
  
  if (newMonth < 0) {
    newMonth = 11;
    newYear--;
  } else if (newMonth > 11) {
    newMonth = 0;
    newYear++;
  }
  
  // Cập nhật lịch
  generateStreakCalendar(newMonth, newYear);
}


// Helper function to save word progress
function saveWordProgress() {
  // Create a minimal version of words to save in localStorage
  const wordsToSave = wordList.map(word => ({
    word: word.word,
    isLearned: word.isLearned,
    lastReviewed: word.lastReviewed,
    correctCount: word.correctCount,
    wrongCount: word.wrongCount
  }));
  
  localStorage.setItem('wordProgress', JSON.stringify(wordsToSave));
  
  // Also update user stats
  localStorage.setItem('userStats', JSON.stringify(userStats));
}



// Enhanced toast notification system
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = createToastContainer();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Generate unique ID for the toast
  const toastId = 'toast-' + Math.random().toString(36).substr(2, 9);
  toast.id = toastId;
  
  // Toast content
  toast.innerHTML = `
    <div class="toast-header">
      <i class="${getToastIcon(type)}"></i>
      <span class="me-auto">${getToastTitle(type)}</span>
      <button type="button" class="btn-close" onclick="dismissToast('${toastId}')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Show toast with animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(toastId);
  }, 5000);
  
  // Return toast ID for potential programmatic dismissal
  return toastId;
}

// Dismiss a specific toast
function dismissToast(toastId) {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
      toast.remove();
      
      // Clean up empty container
      const toastContainer = document.querySelector('.toast-container');
      if (toastContainer && toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300);
  }
}

// Get toast icon based on type
function getToastIcon(type) {
  switch (type) {
    case 'success': return 'fas fa-check-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    case 'error': return 'fas fa-times-circle';
    default: return 'fas fa-info-circle';
  }
}

// Get toast title based on type
function getToastTitle(type) {
  switch (type) {
    case 'success': return 'Thành công';
    case 'warning': return 'Cảnh báo';
    case 'error': return 'Lỗi';
    default: return 'Thông báo';
  }
}

// Function to set Word of the Day
function setWordOfDay() {
  // Get a random word from the wordList
  if (wordList.length === 0) {
    console.error('No words available for Word of the Day');
    return;
  }

  // Kiểm tra xem có từ vựng đã lưu từ ngày hôm trước không 
  const savedWordOfDay = localStorage.getItem('currentWordOfDay');
  let wordOfDay;
  
  if (savedWordOfDay) {
    try {
      wordOfDay = JSON.parse(savedWordOfDay);
      console.log('Loaded saved word of the day:', wordOfDay.word);
    } catch (error) {
      console.error('Error parsing saved word of day:', error);
      // Nếu có lỗi khi parse, chọn một từ ngẫu nhiên
      const randomIndex = Math.floor(Math.random() * wordList.length);
      wordOfDay = wordList[randomIndex];
    }
  } else {
    // Nếu không có từ đã lưu, chọn ngẫu nhiên
    const randomIndex = Math.floor(Math.random() * wordList.length);
    wordOfDay = wordList[randomIndex];
  }

  // Update UI elements - Áp dụng dữ liệu ngay lập tức
  const wordElement = document.getElementById('wordOfDay');
  const meaningElement = document.getElementById('meaningOfDay');
  const phoneticElement = document.getElementById('phonetic');
  const exampleElement = document.getElementById('exampleOfDay');
  const wordCategoryElement = document.getElementById('wordCategory');
  const wordImageElement = document.getElementById('wordImage');

  if (wordElement) wordElement.textContent = wordOfDay.word;
  if (meaningElement) meaningElement.textContent = wordOfDay.meaning || 'Chưa có nghĩa cho từ này';
  if (phoneticElement) phoneticElement.textContent = wordOfDay.phonetic || `/${wordOfDay.word.toLowerCase()}/`;
  if (exampleElement) exampleElement.textContent = wordOfDay.example || `Hãy sử dụng "${wordOfDay.word}" trong một câu.`;
  
  // Set category
  if (wordCategoryElement) {
    const topicName = wordOfDay.topic || 'general';
    const topicDisplay = topics[topicName] ? topics[topicName].name : topicName.charAt(0).toUpperCase() + topicName.slice(1);
    wordCategoryElement.textContent = topicDisplay;
  }

  // Set image
  if (wordImageElement) {
    const imagePlaceholder = document.querySelector('.image-placeholder');
    
    // Ẩn nhanh placeholder loading
    if (imagePlaceholder) imagePlaceholder.style.display = 'none';
    wordImageElement.classList.remove('loading');
    
    // Sử dụng hình ảnh có sẵn hoặc tạo URL ảnh mặc định
    if (wordImages[wordOfDay.word]) {
      wordImageElement.src = wordImages[wordOfDay.word];
    } else {
      // Sử dụng URL ảnh mặc định thay vì tải từ API
      wordImageElement.src = `https://source.unsplash.com/400x300/?${encodeURIComponent(wordOfDay.word)}`;
      
      // Tải ảnh trong nền để lần sau không phải "đang tải"
      getPexelsImage(wordOfDay.word)
        .then(imageUrl => {
          // Lưu url cho lần sau
          wordImages[wordOfDay.word] = imageUrl;
        })
        .catch(error => {
          console.error('Error getting image:', error);
        });
    }
  }

  // Save the current word of day to be used by other functions
  localStorage.setItem('currentWordOfDay', JSON.stringify(wordOfDay));
  
  console.log('Word of the day updated:', wordOfDay.word);
}

// Function to create toast container
function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Helper function to generate a simple phonetic placeholder
function getPhoneticPlaceholder(word) {
  // A very simple placeholder - in a real app, you'd use a phonetic API
  return `/${word.toLowerCase()}/`;
}

// Function to preload word images
function preloadWordImages() {
  // Preload a few images for common words to improve user experience
  const commonWords = wordList.slice(0, 10); // Just preload first 10 words
  
  commonWords.forEach(word => {
    // Use the modified getPexelsImage function instead of getUnsplashImage
    getPexelsImage(word.word)
      .then(imageUrl => {
        wordImages[word.word] = imageUrl;
        console.log(`Image loaded for word: ${word.word}`);
      })
      .catch(error => {
        console.error(`Failed to load image for word: ${word.word}`, error);
        // Use a fallback image URL instead
        const fallbackUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(word.word)}`;
        wordImages[word.word] = fallbackUrl;
      });
  });
  
  console.log('Preloaded images for common words');
}

// Function to load user data from localStorage
function loadUserData() {
  // Try to load user stats from localStorage
  const savedStats = localStorage.getItem('userStats');
  if (savedStats) {
    try {
      const parsedStats = JSON.parse(savedStats);
      userStats = {...userStats, ...parsedStats};
      console.log('Loaded user stats from localStorage');
    } catch (error) {
      console.error('Error parsing user stats from localStorage:', error);
    }
  }

  // Try to load user progress for words
  const savedProgress = localStorage.getItem('wordProgress');
  if (savedProgress) {
    try {
      const progress = JSON.parse(savedProgress);
      
      // Apply saved progress to words
      wordList.forEach(word => {
        const savedWord = progress.find(w => w.word === word.word);
        if (savedWord) {
          word.isLearned = savedWord.isLearned;
          word.lastReviewed = savedWord.lastReviewed;
          word.correctCount = savedWord.correctCount || 0;
          word.wrongCount = savedWord.wrongCount || 0;
        }
      });
      
      console.log('Loaded word progress from localStorage');
    } catch (error) {
      console.error('Error parsing word progress from localStorage:', error);
    }
  }
}

// Function to update user stats display
function updateStatsDisplay() {
  // Update stats in the home page
  const learnedWordsEl = document.getElementById('learnedWords');
  const completionRateEl = document.getElementById('completionRate');
  const streakEl = document.getElementById('streak');
  const totalScoreEl = document.getElementById('totalScore');
  
  if (learnedWordsEl) {
    learnedWordsEl.textContent = userStats.wordsLearned;
  }
  
  if (completionRateEl) {
    // Calculate completion rate
    const totalWords = wordList.length;
    const completionRate = totalWords > 0 ? Math.round((userStats.wordsLearned / totalWords) * 100) : 0;
    completionRateEl.textContent = `${completionRate}%`;
  }
  
  if (streakEl) {
    streakEl.textContent = `${userStats.streak} ngày`;
  }
  
  if (totalScoreEl) {
    totalScoreEl.textContent = userStats.totalScore || 0;
  }
}

// Function to update flashcard display
function updateFlashcard() {
  // If no words are available, show an error
  if (wordList.length === 0) {
    console.error('No words available for flashcards');
    return;
  }
  
  // Get the current card based on the index
  const currentWord = wordList[currentCardIndex];
  
  // Update card counter
  const cardCounter = document.getElementById('cardCounter');
  if (cardCounter) {
    cardCounter.textContent = `${currentCardIndex + 1}/${wordList.length}`;
  }
  
  // Update front of card
  const wordElement = document.querySelector('.flashcard .word');
  const phoneticElement = document.querySelector('.flashcard .phonetic');
  
  if (wordElement) {
    wordElement.textContent = currentWord.word;
  }
  
  if (phoneticElement) {
    phoneticElement.textContent = currentWord.phonetic;
  }
  
  // Update back of card
  const meaningElement = document.querySelector('.flashcard .meaning');
  const exampleElement = document.querySelector('.flashcard .example');
  const wordTypeElement = document.querySelector('.flashcard .word-type span');
  const wordCategoryElement = document.querySelector('.flashcard .word-category span');
  
  if (meaningElement) {
    meaningElement.textContent = currentWord.meaning;
  }
  
  if (exampleElement) {
    exampleElement.textContent = currentWord.example;
  }
  
  if (wordTypeElement) {
    wordTypeElement.textContent = currentWord.wordType.charAt(0).toUpperCase() + currentWord.wordType.slice(1);
  }
  
  if (wordCategoryElement) {
    const topicName = currentWord.topic || 'general';
    const topicDisplay = topics[topicName] ? topics[topicName].name : topicName.charAt(0).toUpperCase() + topicName.slice(1);
    wordCategoryElement.textContent = topicDisplay;
  }
  
  // Update image
  const imageElement = document.querySelector('.flashcard .word-image img');
  const imageContainer = document.querySelector('.flashcard .word-image');
  const imagePlaceholder = document.querySelector('.flashcard .image-placeholder');
  
  if (imageElement && imageContainer) {
    // Show placeholder during loading
    if (imagePlaceholder) {
      imagePlaceholder.style.display = 'flex';
    }
    
    imageElement.classList.add('loading');
    
    // Set a timeout for image loading
    const imageLoadTimeout = setTimeout(() => {
      console.log(`Image loading timeout for flashcard word: ${currentWord.word}`);
      imageElement.classList.remove('loading');
      if (imagePlaceholder) {
        imagePlaceholder.style.display = 'none';
      }
      // Use a fallback image if loading times out
      imageElement.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(currentWord.word)}`;
    }, 5000); // 5 second timeout
    
    // Check if we already have this image preloaded
    if (wordImages[currentWord.word]) {
      imageElement.src = wordImages[currentWord.word];
    } else {
      // Use getPexelsImage instead of direct Unsplash URL
      getPexelsImage(currentWord.word)
        .then(imageUrl => {
          imageElement.src = imageUrl;
          // Store for future use
          wordImages[currentWord.word] = imageUrl;
        })
        .catch(error => {
          console.error(`Failed to load image for flashcard word: ${currentWord.word}`, error);
          // Use a fallback image
          imageElement.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(currentWord.word)}`;
        });
    }
    
    // Handle image loading completion
    imageElement.onload = function() {
      clearTimeout(imageLoadTimeout);
      imageElement.classList.remove('loading');
      if (imagePlaceholder) {
        imagePlaceholder.style.display = 'none';
      }
    };
    
    // Handle image loading error
    imageElement.onerror = function() {
      clearTimeout(imageLoadTimeout);
      console.error(`Failed to load image for flashcard word: ${currentWord.word}`);
      imageElement.classList.remove('loading');
      if (imagePlaceholder) {
        imagePlaceholder.style.display = 'none';
      }
      // Use a fallback image
      imageElement.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(currentWord.word)}`;
    };
  }
  
  // Reset flashcard to front side
  const flashcard = document.querySelector('.flashcard');
  if (flashcard && flashcard.classList.contains('flipped')) {
    flashcard.classList.remove('flipped');
  }
}

// Function to initialize calendar
function initializeCalendar() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Display current month and year
  const currentMonthEl = document.getElementById('currentMonth');
  if (currentMonthEl) {
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
                        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    currentMonthEl.textContent = `${monthNames[currentMonth]}, ${currentYear}`;
  }
  
  const calendarDays = document.getElementById('calendarDays');
  if (!calendarDays) return;
  
  // Clear previous calendar days
  calendarDays.innerHTML = '';
  
  // Get the first day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Get the last day of the month
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();
  
  // Add day labels (Sun-Sat)
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  dayLabels.forEach(day => {
    const dayLabel = document.createElement('div');
    dayLabel.className = 'calendar-day-label';
    dayLabel.textContent = day;
    calendarDays.appendChild(dayLabel);
  });
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarDays.appendChild(emptyDay);
  }
  
  // Generate calendar days for the current month
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    const isToday = dateString === new Date().toISOString().split('T')[0];
    
    // Check if user has learning history for this day
    const hasLearned = userStats.learningHistory?.some(item => item.date === dateString);
    
    // Check if there are scheduled events for this day
    const hasEvents = scheduleEvents.some(event => event.date === dateString);
    
    const calendarDay = document.createElement('div');
    calendarDay.className = `calendar-day${isToday ? ' today' : ''}${hasLearned ? ' learned' : ''}${hasEvents ? ' has-events' : ''}`;
    calendarDay.textContent = day;
    
    // Make the day clickable to view/add events
    calendarDay.addEventListener('click', () => {
      // Set the selected date in the schedule view
      const selectedDate = document.getElementById('selectedDate');
      if (selectedDate) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        selectedDate.textContent = date.toLocaleDateString('vi-VN', options);
        
        // Store the selected date for other functions
        localStorage.setItem('selectedDate', dateString);
        
        // Update schedule events display
        updateScheduleEvents(dateString);
        
        // Switch to schedule tab
        switchTab('schedule');
      }
    });
    
    calendarDays.appendChild(calendarDay);
  }
}

// Function to update learning history
function updateLearningHistory() {
  const historyTimeline = document.getElementById('historyTimeline');
  if (!historyTimeline) return;
  
  // Clear current timeline
  historyTimeline.innerHTML = '';
  
  // If no learning history, show a message
  if (!userStats.learningHistory || userStats.learningHistory.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-history';
    emptyMessage.innerHTML = '<p>Chưa có hoạt động học tập nào. Hãy bắt đầu học từ vựng!</p>';
    historyTimeline.appendChild(emptyMessage);
    return;
  }
  
  // Group activities by date
  const groupedActivities = {};
  userStats.learningHistory.forEach(activity => {
    if (!groupedActivities[activity.date]) {
      groupedActivities[activity.date] = [];
    }
    groupedActivities[activity.date].push(activity);
  });
  
  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedActivities).sort((a, b) => new Date(b) - new Date(a));
  
  // Create timeline entries for each date
  sortedDates.forEach((date, index) => {
    const activities = groupedActivities[date];
    
    // Calculate relative date description
    let dateDescription;
    const activityDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (activityDate.toDateString() === today.toDateString()) {
      dateDescription = 'Hôm nay';
    } else if (activityDate.toDateString() === yesterday.toDateString()) {
      dateDescription = 'Hôm qua';
    } else {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      dateDescription = activityDate.toLocaleDateString('vi-VN', options);
    }
    
    // Create date section
    const timelineDay = document.createElement('div');
    timelineDay.className = 'timeline-day';
    
    // Date marker
    const dateMarker = document.createElement('div');
    dateMarker.className = 'date-marker';
    dateMarker.innerHTML = `<span>${dateDescription}</span>`;
    timelineDay.appendChild(dateMarker);
    
    // Timeline entries container
    const entriesContainer = document.createElement('div');
    entriesContainer.className = 'timeline-entries';
    
    // Add each activity
    activities.forEach(activity => {
      const entry = document.createElement('div');
      entry.className = 'timeline-entry';
      
      // Format time
      const time = activity.time || '00:00';
      
      // Create entry HTML based on activity type
      let iconClass, title, description;
      
      if (activity.type === 'learned') {
        iconClass = 'fas fa-book';
        title = 'Đã học từ mới';
        description = activity.words ? `${activity.words.join(', ')}` : `${activity.wordsLearned} từ`;
      } else if (activity.type === 'quiz') {
        iconClass = 'fas fa-check-circle';
        title = 'Hoàn thành bài kiểm tra';
        description = `Điểm: ${activity.score}/${activity.total}`;
      } else if (activity.type === 'game') {
        iconClass = 'fas fa-gamepad';
        title = `Chơi trò chơi ${activity.gameName || ''}`;
        description = `Điểm: ${activity.score}`;
      } else {
        iconClass = 'fas fa-clock';
        title = 'Học tập';
        description = `${activity.minutes || 0} phút`;
      }
      
      entry.innerHTML = `
        <div class="entry-time">${time}</div>
        <div class="entry-content">
          <div class="entry-icon"><i class="${iconClass}"></i></div>
          <div class="entry-details">
            <h4>${title}</h4>
            <p>${description}</p>
          </div>
        </div>
      `;
      
      entriesContainer.appendChild(entry);
    });
    
    timelineDay.appendChild(entriesContainer);
    historyTimeline.appendChild(timelineDay);
  });
}

// Function to update schedule events for a specific date
function updateScheduleEvents(dateString) {
  const timelineEvents = document.getElementById('timelineEvents');
  if (!timelineEvents) return;
  
  // Clear current events
  timelineEvents.innerHTML = '';
  
  // Filter events for the selected date
  const dayEvents = scheduleEvents.filter(event => event.date === dateString);
  
  // If no events, show empty state
  if (dayEvents.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-schedule';
    emptyState.innerHTML = `
      <div class="empty-message">
        <i class="fas fa-calendar-day"></i>
        <p>Không có hoạt động nào cho ngày này</p>
        <button id="addNewActivity" class="btn-primary"><i class="fas fa-plus"></i> Thêm hoạt động</button>
      </div>
    `;
    timelineEvents.appendChild(emptyState);
    
    // Add event listener to the new button
    const addNewActivityBtn = document.getElementById('addNewActivity');
    if (addNewActivityBtn) {
      addNewActivityBtn.addEventListener('click', showActivityModal);
    }
    
    return;
  }
  
  // Sort events by start time
  dayEvents.sort((a, b) => {
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });
  
  // Add each event to the timeline
  dayEvents.forEach(event => {
    // Calculate position and height based on time
    const startParts = event.startTime.split(':').map(Number);
    const endParts = event.endTime.split(':').map(Number);
    
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    const duration = endMinutes - startMinutes;
    
    // Position is relative to 6:00 (360 minutes)
    const topPosition = Math.max(0, (startMinutes - 360) * 0.5); // 0.5px per minute
    const height = Math.max(30, duration * 0.5); // Minimum height of 30px
    
    // Create event element
    const eventElement = document.createElement('div');
    eventElement.className = `schedule-event ${event.type || 'default'}`;
    eventElement.style.top = `${topPosition}px`;
    eventElement.style.height = `${height}px`;
    
    // Format time for display
    const formatTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };
    
    // Set event content
    eventElement.innerHTML = `
      <div class="event-content">
        <div class="event-header">
          <h4>${event.title}</h4>
          <span class="event-time">${formatTime(event.startTime)} - ${formatTime(event.endTime)}</span>
        </div>
        <p>${event.description || ''}</p>
      </div>
    `;
    
    // Add event listeners for edit/delete
    eventElement.addEventListener('click', () => {
      // Store selected event for editing
      localStorage.setItem('selectedEvent', JSON.stringify(event));
      showActivityModal(true); // true indicates editing mode
    });
    
    timelineEvents.appendChild(eventElement);
  });
}

// Function to show activity modal
function showActivityModal(isEdit = false) {
  const modal = document.getElementById('activityModal');
  if (!modal) return;
  
  // Show the modal
  modal.style.display = 'block';
  
  // Update form title based on mode
  const modalTitle = modal.querySelector('.modal-header h3');
  if (modalTitle) {
    modalTitle.textContent = isEdit ? 'Chỉnh sửa hoạt động học tập' : 'Thêm hoạt động học tập';
  }
  
  // Clear form fields or populate with event data if editing
  const form = document.getElementById('activityForm');
  if (form) {
    form.reset();
    
    // Set default date to selected date from calendar
    const selectedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('activityDate');
    if (dateInput) {
      dateInput.value = selectedDate;
    }
    
    // If editing, populate form with selected event data
    if (isEdit) {
      const selectedEvent = localStorage.getItem('selectedEvent');
      if (selectedEvent) {
        try {
          const event = JSON.parse(selectedEvent);
          
          // Populate form fields
          document.getElementById('activityTitle').value = event.title || '';
          document.getElementById('activityType').value = event.type || 'learning';
          document.getElementById('activityDate').value = event.date || selectedDate;
          document.getElementById('activityStartTime').value = event.startTime || '';
          document.getElementById('activityEndTime').value = event.endTime || '';
          document.getElementById('activityDescription').value = event.description || '';
          
          // Set reminder status
          const reminderEnabled = document.getElementById('reminderEnabled');
          if (reminderEnabled) {
            reminderEnabled.checked = event.reminder;
            
            // Show reminder options if enabled
            const reminderOptions = document.getElementById('reminderOptions');
            if (reminderOptions) {
              reminderOptions.style.display = event.reminder ? 'block' : 'none';
            }
            
            // Set reminder time
            const reminderTime = document.getElementById('reminderTime');
            if (reminderTime && event.reminderTime) {
              reminderTime.value = event.reminderTime;
            }
          }
        } catch (e) {
          console.error('Error parsing selected event:', e);
        }
      }
    }
  }
}

// Function to hide activity modal
function hideActivityModal() {
  const modal = document.getElementById('activityModal');
  if (modal) {
    modal.style.display = 'none';
    
    // Clear any selected event data
    localStorage.removeItem('selectedEvent');
  }
}

// Set up profile page elements
function setupProfilePage() {
  // Update user streak display
  updateStreakDisplay();
  
  // Load profile image if available
  const userAvatar = localStorage.getItem('userAvatar');
  if (userAvatar) {
    const avatarImg = document.getElementById('userAvatar');
    if (avatarImg) {
      avatarImg.src = userAvatar;
    }
  }
  
  // Set up profile edit button
  const editProfileBtn = document.getElementById('editProfileBtn');
  // if (editProfileBtn) {
  //   editProfileBtn.addEventListener('click', () => {
  //     // Get modal element
  //     const editProfileModal = document.getElementById('editProfileModal');
  //     if (editProfileModal) {
  //       // Show modal
  //       openModal('editProfileModal');
  //     }
  //   });
  // }
  
  // Set up share profile button
  // const shareProfileBtn = document.getElementById('shareProfileBtn');
  // if (shareProfileBtn) {
  //   shareProfileBtn.addEventListener('click', () => {
  //     try {
  //       // Create share data
  //       const shareData = {
  //         title: 'My Vocab English Profile',
  //         text: 'Check out my progress learning English vocabulary!',
  //         url: window.location.href
  //       };
        
  //       // Use Web Share API if available
  //       if (navigator.share) {
  //         navigator.share(shareData)
  //           .then(() => showToast('Đã chia sẻ hồ sơ thành công!', 'success'))
  //           .catch(error => {
  //             console.error('Lỗi khi chia sẻ:', error);
  //             showToast('Không thể chia sẻ hồ sơ.', 'error');
  //           });
  //       } else {
  //         // Fallback for browsers that don't support Web Share API
  //         showToast('Trình duyệt không hỗ trợ chia sẻ trực tiếp.', 'info');
          
  //         // Copy profile URL to clipboard
  //         navigator.clipboard.writeText(window.location.href)
  //           .then(() => showToast('Đã sao chép liên kết vào clipboard!', 'success'))
  //           .catch(() => showToast('Không thể sao chép liên kết.', 'error'));
  //       }
  //     } catch (error) {
  //       console.error('Lỗi khi chia sẻ:', error);
  //       showToast('Có lỗi xảy ra khi chia sẻ.', 'error');
  //     }
  //   });
  // }
  
  // // Set up streak navigation
  // const prevStreakMonthBtn = document.getElementById('prevStreakMonth');
  // const nextStreakMonthBtn = document.getElementById('nextStreakMonth');
  
  // if (prevStreakMonthBtn) {
  //   prevStreakMonthBtn.addEventListener('click', () => navigateStreakMonth(-1));
  // }
  
  // if (nextStreakMonthBtn) {
  //   nextStreakMonthBtn.addEventListener('click', () => navigateStreakMonth(1));
  // }
}

// Check quiz answer
function checkQuizAnswer() {
  // Get current question index
  const currentQuestionIndex = parseInt(document.getElementById('currentQuestionIndex').textContent) - 1;
  
  if (currentQuestionIndex < 0 || currentQuestionIndex >= currentQuizQuestions.length) {
    console.error('Invalid question index');
    return;
  }
  
  // Get current question
  const question = currentQuizQuestions[currentQuestionIndex];
  
  // If already answered, do nothing
  if (question.answered) {
    return;
  }
  
  // Get user's answer based on question type
  let userAnswer;
  
  switch (question.type) {
    case 'multiple-choice':
      const selectedOption = document.querySelector('.quiz-option.selected');
      if (!selectedOption) {
        showToast('Vui lòng chọn một đáp án', 'warning');
        return;
      }
      userAnswer = selectedOption.textContent;
      break;
      
    case 'fill-blank':
      userAnswer = document.getElementById('blankAnswer').value.trim();
      if (!userAnswer) {
        showToast('Vui lòng nhập đáp án của bạn', 'warning');
        return;
      }
      break;
      
    case 'listening':
      const selectedWord = document.querySelector('.quiz-option.selected');
      if (!selectedWord) {
        showToast('Vui lòng chọn một từ', 'warning');
        return;
      }
      userAnswer = selectedWord.textContent;
      break;
      
    default:
      console.error('Unknown question type');
      return;
  }
  
  // Store user's answer
  question.userAnswer = userAnswer;
  question.answered = true;
  
  // Check if answer is correct
  let isCorrect = false;
  
  switch (question.type) {
    case 'multiple-choice':
      isCorrect = userAnswer === question.word.meaning;
      break;
      
    case 'fill-blank':
      isCorrect = userAnswer.toLowerCase() === question.word.word.toLowerCase();
      break;
      
    case 'listening':
      isCorrect = userAnswer.toLowerCase() === question.word.word.toLowerCase();
      break;
  }
  
  question.isCorrect = isCorrect;
  
  // Update score if correct
  if (isCorrect) {
    quizScore++;
    document.getElementById('currentScore').textContent = quizScore;
  }
  
  // Show feedback
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(option => {
    const isSelected = option.classList.contains('selected');
    
    if (question.type === 'multiple-choice') {
      if (option.textContent === question.word.meaning) {
        option.classList.add('correct');
      } else if (isSelected) {
        option.classList.add('incorrect');
      }
    } else if (question.type === 'listening') {
      if (option.textContent.toLowerCase() === question.word.word.toLowerCase()) {
        option.classList.add('correct');
      } else if (isSelected) {
        option.classList.add('incorrect');
      }
    }
  });
  
  if (question.type === 'fill-blank') {
    const inputField = document.getElementById('blankAnswer');
    if (inputField) {
      inputField.classList.add(isCorrect ? 'correct' : 'incorrect');
      inputField.disabled = true;
      
      // Show correct answer if wrong
      if (!isCorrect) {
        const correctAnswer = document.createElement('div');
        correctAnswer.className = 'correct-answer';
        correctAnswer.textContent = `Đáp án đúng: ${question.word.word}`;
        
        // Insert after input field
        const container = document.getElementById('fillBlankQuestion');
        if (container) {
          container.appendChild(correctAnswer);
        }
      }
    }
  }
  
  // Disable check answer button
  document.getElementById('checkAnswer').disabled = true;
  
  // Enable next question button
  document.getElementById('nextQuestion').disabled = false;
  
  // Show feedback message
  if (isCorrect) {
    showToast('Chính xác!', 'success');
  } else {
    showToast('Chưa chính xác. Hãy xem lại đáp án.', 'error');
    
    // Add to wrong answers list
    wrongAnswers.push(question.word);
  }
}

// Move to next question
function moveToNextQuestion() {
  // Get current question index
  const currentQuestionIndex = parseInt(document.getElementById('currentQuestionIndex').textContent) - 1;
  const nextIndex = currentQuestionIndex + 1;
  
  if (nextIndex >= currentQuizQuestions.length) {
    // End of quiz
    endQuiz();
    return;
  }
  
  // Update question index
  document.getElementById('currentQuestionIndex').textContent = (nextIndex + 1).toString();
  
  // Update progress bar
  const progressPercentage = ((nextIndex + 1) / currentQuizQuestions.length) * 100;
  document.getElementById('quizProgress').style.width = `${progressPercentage}%`;
  
  // Display next question
  displayQuestion(nextIndex);
  
  // Reset buttons
  document.getElementById('checkAnswer').disabled = false;
  document.getElementById('nextQuestion').disabled = true;
}

// End quiz and show results
function endQuiz() {
  // Stop timer if running
  if (quizTimerInterval) {
    clearInterval(quizTimerInterval);
    quizTimerInterval = null;
  }
  
  // Record end time
  quizEndTime = Date.now();
  
  // Hide quiz container
  const quizContainer = document.getElementById('quizContainer');
  if (quizContainer) {
    quizContainer.style.display = 'none';
  }
  
  // Show results container
  const quizResults = document.getElementById('quizResults');
  if (quizResults) {
    quizResults.style.display = 'block';
  }
  
  // Calculate stats
  const totalQuestions = currentQuizQuestions.length;
  const correctAnswers = quizScore;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  // Calculate time taken
  const timeTaken = Math.floor((quizEndTime - quizStartTime) / 1000);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  
  // Update results UI
  document.getElementById('resultScore').textContent = quizScore;
  document.getElementById('resultTotal').textContent = totalQuestions;
  document.getElementById('resultPercentage').textContent = `${percentage}%`;
  document.getElementById('resultTime').textContent = `${minutes}m ${seconds}s`;
  
  // Generate result message based on score
  let resultMessage = '';
  let resultIcon = '';
  
  if (percentage >= 90) {
    resultMessage = 'Xuất sắc! Bạn đã thể hiện sự hiểu biết từ vựng tuyệt vời.';
    resultIcon = '<i class="fas fa-trophy"></i>';
  } else if (percentage >= 70) {
    resultMessage = 'Rất tốt! Bạn đã nắm vững phần lớn từ vựng.';
    resultIcon = '<i class="fas fa-medal"></i>';
  } else if (percentage >= 50) {
    resultMessage = 'Khá tốt! Nhưng bạn cần luyện tập thêm.';
    resultIcon = '<i class="fas fa-thumbs-up"></i>';
  } else {
    resultMessage = 'Cần cải thiện. Hãy tiếp tục học và thử lại nhé!';
    resultIcon = '<i class="fas fa-book"></i>';
  }
  
  document.getElementById('resultMessage').innerHTML = resultMessage;
  document.getElementById('resultIcon').innerHTML = resultIcon;
  
  // Update wrong answers count
  document.getElementById('wrongAnswersCount').textContent = incorrectAnswers;
  
  // Save quiz result to learning history
  const quizResult = {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    type: 'quiz',
    score: correctAnswers,
    total: totalQuestions,
    percentage: percentage,
    timeTaken: timeTaken,
    wrongAnswers: wrongAnswers.map(word => word.word)
  };
  
  // Add to user stats
  if (!userStats.quizHistory) {
    userStats.quizHistory = [];
  }
  
  userStats.quizHistory.push(quizResult);
  
  // Add to learning history
  if (!userStats.learningHistory) {
    userStats.learningHistory = [];
  }
  
  userStats.learningHistory.push({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    type: 'quiz',
    score: correctAnswers,
    total: totalQuestions
  });
  
  // Save to localStorage
  localStorage.setItem('userStats', JSON.stringify(userStats));
  
  // Update statistics on learning chart
  if (typeof updateLearningChart === 'function') {
    updateLearningChart();
  }
}

// Review quiz mistakes
function reviewQuizMistakes() {
  // If no wrong answers, show message
  if (wrongAnswers.length === 0) {
    showToast('Không có từ nào trả lời sai để ôn tập', 'info');
    return;
  }
  
  // Switch to flashcards tab
  switchTab('flashcards');
  
  // Filter flashcards to show only mistaken words
  if (typeof filterFlashcards === 'function') {
    filterFlashcards('custom', wrongAnswers);
  } else {
    // If filterFlashcards function doesn't exist, fall back to standard flashcards
    console.warn('filterFlashcards function not found');
  }
  
  // Clear wrong answers after review
  wrongAnswers = [];
}
