// Games event listeners
function setupGamesEventListeners() {
    // Game card events
    document.querySelectorAll('.game-card').forEach(card => {
      const playButton = card.querySelector('.play-btn');
      if (playButton) {
        playButton.addEventListener('click', (e) => {
          e.stopPropagation();
          startGame(card.id);
        });
      }
      
      card.addEventListener('click', () => startGame(card.id));
    });
    
    // Game modal close event
    document.querySelector('#gameModal .btn-close')?.addEventListener('click', closeGameModal);
  }