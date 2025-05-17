// Load Games content
function loadGamesContent() {
  const placeholder = document.getElementById('games-content-placeholder');
  if (!placeholder) {
    console.error('Không tìm thấy placeholder để tải nội dung games');
    return;
  }
  
  console.log('Đang tải nội dung trò chơi...');
  
  // Thêm loading indicator
  placeholder.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải trò chơi...</p></div>';
  
  const gamesSection = document.getElementById('games');
  if(gamesSection){
    gamesSection.style.display = 'block';
  }

  // Load games CSS first
  const existingCss = document.querySelector('link[href="Game/games.css"]');
  if(!existingCss){
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'Game/games.css';
    document.head.appendChild(link);
    console.log('Đã thêm games.css');

  }

  // Ensure games.js is loaded
  loadScript('Game/games.js')
  .then(() => {
    // Then load the HTML content
    return fetch('Game/games.html')
    .then(response =>{
      if(!response.ok){
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    });
  })
  .then(html => {
    console.log('Đã tải nội dung trò chơi thành công');
    
    // Xóa nội dung cũ nếu có
    const existingContent = document.querySelector('#games-content');
    if(existingContent){
      existingContent.remove();
    }
    
    // Thêm nội dung mới
    placeholder.innerHTML = html;

    // Đảm bảo trò chơi hiển thị
    if(gamesSection){
      gamesSection.style.display = 'block';
    }

    // Đảm bảo các scripts được thực thi
    if(typeof setupGamesEventListeners === 'function'){
      console.log('Thiết lập event listeners cho trò chơi');
      setupGamesEventListeners();
      
    }

  })

}


// Load a specific game
function loadSpecificGame(gameId) {
  console.log(`Loading game: ${gameId}`);
  
  // Get the game content container
  const gameContent = document.getElementById('game-content');
  if (!gameContent) {
    console.error('Game content container not found');
    return;
  }
  
  // Show loading
  gameContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải trò chơi...</p></div>';
  
  // Load the specific game content
  fetch(`Game/${gameId}.html`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      // Update game content
      gameContent.innerHTML = html;
      
      // Initialize the specific game
      if (typeof window[`init${gameId.charAt(0).toUpperCase() + gameId.slice(1)}`] === 'function') {
        window[`init${gameId.charAt(0).toUpperCase() + gameId.slice(1)}`]();
      }
      
      // Update game title
      const gameTitle = document.getElementById('currentGameTitle');
      if (gameTitle) {
        const gameName = document.querySelector(`#${gameId} .game-info h3`);
        if (gameName) {
          gameTitle.textContent = gameName.textContent;
        }
      }
      
      // Show the game view and hide the game list
      const gameView = document.getElementById('game-view');
      const gamesList = document.getElementById('games-list');
      
      if (gameView && gamesList) {
        gamesList.style.display = 'none';
        gameView.style.display = 'block';
      }
    })
    .catch(error => {
      console.error(`Error loading game ${gameId}:`, error);
      gameContent.innerHTML = `<div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Không thể tải trò chơi</p>
        <p class="error-details">${error.message}</p>
        <button onclick="loadSpecificGame('${gameId}')" class="btn btn-primary">Thử lại</button>
        <button onclick="loadGamesContent()" class="btn btn-secondary">Quay lại danh sách</button>
      </div>`;
    });
}

// Return to games list
function returnToGamesList() {
  const gameView = document.getElementById('game-view');
  const gamesList = document.getElementById('games-list');
  
  if (gameView && gamesList) {
    gameView.style.display = 'none';
    gamesList.style.display = 'block';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing games loader');
  
  // Preload games content when the tab is clicked
  const gamesTab = document.querySelector('li[data-tab="games"]');
  if (gamesTab) {
    gamesTab.addEventListener('click', function() {
      loadGamesContent();
    });
  }
});

// Export functions for use elsewhere
window.loadGamesContent = loadGamesContent;
window.loadSpecificGame = loadSpecificGame;
window.returnToGamesList = returnToGamesList;

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


  // Định nghĩa các hàm init đơn giản cho hiển thị giao diện

// Word Match Game - Chỉ hiển thị giao diện
function initWordMatch() {
  console.log('Initializing Word Match game interface...');
  
  // Tạo một số thẻ trò chơi mẫu để hiển thị
  const container = document.getElementById('wordMatchContainer');
  if (container) {
    // Xóa nội dung cũ nếu có
    container.innerHTML = '';
    
    // Tạo các thẻ mẫu
    const samplePairs = [
      {word: "apple", meaning: "quả táo"},
      {word: "banana", meaning: "quả chuối"},
      {word: "cat", meaning: "con mèo"},
      {word: "dog", meaning: "con chó"},
      {word: "elephant", meaning: "con voi"},
      {word: "flower", meaning: "bông hoa"}
    ];
    
    // Tạo mảng chứa tất cả các thẻ
    const allCards = [];
    
    samplePairs.forEach(pair => {
      // Thẻ từ
      const wordCard = document.createElement('div');
      wordCard.className = 'match-card';
      wordCard.textContent = pair.word;
      
      // Thẻ nghĩa
      const meaningCard = document.createElement('div');
      meaningCard.className = 'match-card';
      meaningCard.textContent = pair.meaning;
      
      // Thêm vào mảng
      allCards.push(wordCard, meaningCard);
    });
    
    // Trộn thẻ
    shuffleArray(allCards);
    
    // Thêm vào container
    allCards.forEach(card => {
      container.appendChild(card);
    });
    
    // Cập nhật các số liệu hiển thị
    document.getElementById('totalPairs').textContent = samplePairs.length;
  }
}

// Word Scramble Game - Chỉ hiển thị giao diện
function initWordScramble() {
  console.log('Initializing Word Scramble game interface...');
  
  // Tạo các chữ cái mẫu
  const tilesContainer = document.getElementById('letterTiles');
  if (tilesContainer) {
    tilesContainer.innerHTML = '';
    
    // Từ mẫu: BANANA
    const letters = ['B', 'A', 'N', 'A', 'N', 'A'];
    
    // Trộn chữ cái
    shuffleArray(letters);
    
    // Tạo các ô chữ cái
    letters.forEach(letter => {
      const tile = document.createElement('div');
      tile.className = 'letter-tile';
      tile.textContent = letter;
      tilesContainer.appendChild(tile);
    });
    
    // Đặt từ đã xáo trộn
    const scrambledWord = document.getElementById('scrambledWord');
    if (scrambledWord) {
      scrambledWord.textContent = 'NABANA';
    }
  }
}

// Hangman Game - Chỉ hiển thị giao diện
function initHangman() {
  console.log('Initializing Hangman game interface...');
  
  // Tạo bàn phím
  const keyboard = document.getElementById('hangmanKeyboard');
  if (keyboard) {
    keyboard.innerHTML = '';
    
    // Chữ cái bàn phím
    const keys = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ];
    
    // Tạo các phím
    keys.forEach(key => {
      const keyButton = document.createElement('div');
      keyButton.className = 'keyboard-key';
      keyButton.textContent = key;
      keyboard.appendChild(keyButton);
    });
    
    // Tạo chỗ hiển thị từ
    const wordDisplay = document.getElementById('hangmanWord');
    if (wordDisplay) {
      wordDisplay.innerHTML = '';
      
      // Từ mẫu: APPLE (5 chữ cái)
      for (let i = 0; i < 5; i++) {
        const letterSpace = document.createElement('div');
        letterSpace.className = 'hangman-letter';
        letterSpace.textContent = i === 0 ? 'A' : ''; // Chỉ hiển thị chữ cái đầu tiên
        wordDisplay.appendChild(letterSpace);
      }
    }
    
    // Vẽ hình người treo cổ cơ bản
    const svg = document.getElementById('hangmanSvg');
    if (svg) {
      svg.innerHTML = `
        <line x1="40" y1="230" x2="160" y2="230" stroke="black" stroke-width="4"/>
        <line x1="60" y1="230" x2="60" y2="50" stroke="black" stroke-width="4"/>
        <line x1="58" y1="50" x2="130" y2="50" stroke="black" stroke-width="4"/>
        <line x1="130" y1="50" x2="130" y2="80" stroke="black" stroke-width="4"/>
      `;
    }
  }
}

// Speed Match Game - Chỉ hiển thị giao diện
function initSpeedMatch() {
  console.log('Initializing Speed Match game interface...');
  
  // Đã được thiết lập trong HTML
  const currentWord = document.getElementById('currentSpeedWord');
  if (currentWord) {
    currentWord.textContent = 'Apple';
  }
  
  // Các nút bấm đã được thiết lập trong HTML
}

// Word Search Game - Chỉ hiển thị giao diện
function initWordSearch() {
  console.log('Initializing Word Search game interface...');
  
  // Tạo bảng tìm từ mẫu
  const grid = document.getElementById('wordSearchGrid');
  if (grid) {
    grid.innerHTML = '';
    
    // Kích thước bảng 10x10
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const cell = document.createElement('div');
        cell.className = 'word-search-cell';
        
        // Tạo chữ cái ngẫu nhiên
        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        cell.textContent = randomLetter;
        
        grid.appendChild(cell);
      }
    }
    
    // Tạo danh sách từ cần tìm
    const wordList = document.querySelector('#wordList ul');
    if (wordList) {
      wordList.innerHTML = '';
      
      const words = ['APPLE', 'BANANA', 'CAT', 'DOG', 'ELEPHANT'];
      
      words.forEach(word => {
        const item = document.createElement('li');
        item.className = 'word-item';
        item.textContent = word;
        wordList.appendChild(item);
      });
      
      // Cập nhật số từ
      const totalWords = document.getElementById('totalWords');
      if (totalWords) {
        totalWords.textContent = words.length;
      }
    }
  }
}

// Memory Game - Chỉ hiển thị giao diện
function initMemoryGame() {
  console.log('Initializing Memory Game interface...');
  
  // Tạo lưới thẻ bài
  const grid = document.getElementById('memoryGrid');
  if (grid) {
    grid.innerHTML = '';
    
    // Tạo 16 thẻ (8 cặp)
    for (let i = 0; i < 16; i++) {
      const card = document.createElement('div');
      card.className = 'memory-card';
      
      // Tạo mặt trước và sau
      const front = document.createElement('div');
      front.className = 'front';
      front.textContent = ['dog', 'cat', 'apple', 'book', 'house', 'car', 'sun', 'moon'][Math.floor(i/2)];
      
      const back = document.createElement('div');
      back.className = 'back';
      back.innerHTML = '<i class="fas fa-question"></i>';
      
      card.appendChild(front);
      card.appendChild(back);
      
      grid.appendChild(card);
    }
    
    // Cập nhật số cặp
    const totalPairs = document.getElementById('memoryTotalPairs');
    if (totalPairs) {
      totalPairs.textContent = '8';
    }
  }
}

// Hàm trộn mảng
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Đảm bảo các hàm có thể gọi được từ bên ngoài
window.initWordMatch = initWordMatch;
window.initWordScramble = initWordScramble;
window.initHangman = initHangman;
window.initSpeedMatch = initSpeedMatch;
window.initWordSearch = initWordSearch;
window.initMemoryGame = initMemoryGame;
// Định nghĩa hàm startGame
function startGame(gameId) {
  console.log(`Starting game: ${gameId}`);
  // Sử dụng hàm loadSpecificGame từ loaderGames.js để tải trò chơi
  if (typeof loadSpecificGame === 'function') {
    loadSpecificGame(gameId);
  } else {
    console.error('Hàm loadSpecificGame không tồn tại');
  }
}

// Định nghĩa hàm closeGameModal
function closeGameModal() {
  const gameModal = document.getElementById('gameModal');
  if (gameModal) {
    gameModal.classList.remove('show');
  }
  
  // Quay trở lại danh sách trò chơi
  returnToGamesList();
}
