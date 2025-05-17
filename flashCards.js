// Biến lưu trữ dữ liệu flashcards
let flashcards = []; // Mảng chứa dữ liệu các thẻ từ vựng

// Biến trạng thái
// Sử dụng biến currentCardIndex đã khai báo trong script.js
// let currentCardIndex = 0; // Chỉ số của thẻ hiện tại
let isFlipped = false; // Trạng thái lật thẻ (true: đã lật, false: chưa lật)
let timer = null; // Timer cho tự động lật thẻ (lưu trữ ID của setInterval)
let timerValue = 0; // Giá trị hiện tại của timer (đếm ngược theo giây)
let isTimerRunning = false; // Trạng thái timer đang chạy (true: đang chạy, false: đã dừng)

// Biến cài đặt
let autoPlay = false; // Tự động phát âm khi hiển thị thẻ mới (true: bật, false: tắt)
let autoFlip = false; // Tự động lật thẻ sau một khoảng thời gian (true: bật, false: tắt)
let showImage = true; // Hiển thị hình ảnh minh họa cho từ vựng (true: hiển thị, false: ẩn)

// Lưu trữ hình ảnh tải lên
let uploadedImages = {};

// Tham chiếu đến các biến và hàm từ script.js
// Kiểm tra và khởi tạo các biến toàn cục nếu chưa được định nghĩa
if (typeof wordList === 'undefined') {
  window.wordList = []; // Danh sách từ vựng
}

if (typeof topics === 'undefined') {
  window.topics = {}; // Danh sách chủ đề
}

if (typeof userStats === 'undefined') {
  window.userStats = {
    wordsLearned: 0 // Số từ đã học
  };
}

if (typeof wordImages === 'undefined') {
  window.wordImages = {}; // Lưu trữ URL hình ảnh cho từng từ
}

// Tải các hình ảnh đã tải lên từ localStorage
function loadUploadedImages() {
  const savedImages = localStorage.getItem('uploadedImages');
  if (savedImages) {
    uploadedImages = JSON.parse(savedImages);
    console.log('Đã tải hình ảnh từ localStorage:', Object.keys(uploadedImages).length);
  }
}

// Lưu hình ảnh đã tải lên vào localStorage
function saveUploadedImages() {
  // Kiểm tra kích thước dữ liệu trước khi lưu
  const imageDataString = JSON.stringify(uploadedImages);
  const dataSizeInMB = (imageDataString.length * 2) / (1024 * 1024);
  
  if (dataSizeInMB > 4.5) {
    // Nếu dữ liệu gần đến giới hạn 5MB của localStorage, thực hiện dọn dẹp
    cleanupOldestImages();
  }
  
  try {
    localStorage.setItem('uploadedImages', imageDataString);
    console.log('Đã lưu hình ảnh vào localStorage:', Object.keys(uploadedImages).length);
  } catch (e) {
    console.error('Lỗi khi lưu hình ảnh:', e);
    showToast('Không thể lưu hình ảnh do dung lượng quá lớn. Một số hình ảnh cũ đã bị xóa.', 'error');
    // Nếu không thể lưu do đầy bộ nhớ, xóa bớt hình ảnh
    cleanupOldestImages();
    try {
      localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
    } catch (e) {
      console.error('Vẫn không thể lưu hình ảnh sau khi dọn dẹp:', e);
    }
  }
}

// Xóa hình ảnh cũ nhất để giải phóng bộ nhớ
function cleanupOldestImages() {
  const imageKeys = Object.keys(uploadedImages);
  
  // Nếu có ít hơn 5 hình, không cần dọn dẹp
  if (imageKeys.length < 5) return;
  
  // Xóa 30% hình ảnh cũ nhất
  const removeCount = Math.ceil(imageKeys.length * 0.3);
  const keysToRemove = imageKeys.slice(0, removeCount);
  
  keysToRemove.forEach(key => {
    delete uploadedImages[key];
  });
  
  console.log(`Đã xóa ${removeCount} hình ảnh cũ để giải phóng bộ nhớ`);
  showToast(`Đã xóa ${removeCount} hình ảnh cũ để tiết kiệm dung lượng`, 'info');
}

// Xóa hình ảnh cho từ hiện tại
function deleteCurrentImage() {
  const currentWord = wordList[currentCardIndex];
  if (!currentWord) return;
  
  if (uploadedImages[currentWord.word]) {
    delete uploadedImages[currentWord.word];
    saveUploadedImages();
    showToast('Đã xóa hình ảnh tùy chỉnh', 'success');
    updateFlashcardUI(); // Cập nhật lại giao diện
  } else {
    showToast('Không có hình ảnh tùy chỉnh để xóa', 'info');
  }
}

// Xử lý việc tải lên hình ảnh
function handleImageUpload() {
  // Lấy phần tử input file
  const imageUploadInput = document.getElementById('imageUpload');
  
  // Thêm sự kiện change cho input file
  if (imageUploadInput) {
    imageUploadInput.addEventListener('change', function(e) {
      // Lấy file được chọn
      const file = e.target.files[0];
      if (!file) return;
      
      // Kiểm tra nếu file không phải là hình ảnh
      if (!file.type.match('image.*')) {
        showToast('Vui lòng chọn file hình ảnh', 'error');
        return;
      }
      
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước file không được vượt quá 5MB', 'error');
        return;
      }
      
      // Đọc file thành base64
      const reader = new FileReader();
      reader.onload = function(event) {
        // Lấy dữ liệu base64
        const imageData = event.target.result;
        
        // Lấy từ hiện tại
        const currentWord = wordList[currentCardIndex];
        if (!currentWord) return;
        
        // Lưu hình ảnh vào đối tượng uploadedImages
        uploadedImages[currentWord.word] = imageData;
        
        // Lưu vào localStorage
        saveUploadedImages();
        
        // Cập nhật hiển thị
        const imageElement = document.querySelector('.flashcard .word-image img');
        if (imageElement) {
          imageElement.src = imageData;
          imageElement.classList.remove('loading');
        }
        
        // Ẩn placeholder
        const imagePlaceholder = document.querySelector('.flashcard .image-placeholder');
        if (imagePlaceholder) {
          imagePlaceholder.style.display = 'none';
        }
        
        // Hiển thị thông báo thành công
        showToast('Đã tải lên hình ảnh thành công', 'success');
      };
      
      // Đọc file dưới dạng URL dữ liệu
      reader.readAsDataURL(file);
      
      // Reset input file để có thể chọn lại cùng một file
      e.target.value = null;
    });
  }
}

// Fallback cho các hàm phụ thuộc
// Định nghĩa các hàm dự phòng nếu chưa được định nghĩa trong script.js
if (typeof showToast !== 'function') {
  // Hàm hiển thị thông báo toast đơn giản
  window.showToast = function(message, type, duration = 3000) {
    console.log(`[${type || 'info'}] ${message}`);
    // Tạo phần tử toast
    const toast = document.createElement('div');
    toast.className = `simple-toast ${type || 'info'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    // Hiệu ứng hiển thị và ẩn toast
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, duration);
    }, 100);
  };
}

if (typeof saveWordProgress !== 'function') {
  // Hàm lưu tiến độ học từ vựng vào localStorage
  window.saveWordProgress = function() {
    localStorage.setItem('wordProgress', JSON.stringify(
      wordList.map(word => ({
        word: word.word,
        isLearned: word.isLearned,
        lastReviewed: word.lastReviewed,
        correctCount: word.correctCount,
        wrongCount: word.wrongCount
      }))
    ));
    localStorage.setItem('userStats', JSON.stringify(userStats));
  };
}

if (typeof classifyWordsByTopic !== 'function') {
  // Hàm phân loại từ vựng theo chủ đề
  window.classifyWordsByTopic = function() {
    console.log('Classifying words by topic');
  };
}

if (typeof updateTopicProgress !== 'function') {
  // Hàm cập nhật tiến độ học theo chủ đề
  window.updateTopicProgress = function() {
    console.log('Updating topic progress');
  };
}

if (typeof pronounceCurrentWord !== 'function') {
  // Hàm phát âm từ vựng hiện tại sử dụng Web Speech API
  window.pronounceCurrentWord = function() {
    const currentWord = wordList[currentCardIndex];
    if (!currentWord) return;
    
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };
}


// Animate flashcard entrance
// Hàm tạo hiệu ứng animation khi hiển thị thẻ mới
function animateFlashcard() {
  const flashcard = document.querySelector('.flashcard');
  if (flashcard) {
    // Thêm class để kích hoạt animation
    flashcard.classList.add('entrance-animation');
    // Xóa class sau khi animation hoàn thành để có thể tái sử dụng
    setTimeout(() => {
      flashcard.classList.remove('entrance-animation');
    }, 1000);
  }
}


// Chức năng Flashcard event listeners
// Hàm thiết lập các sự kiện cho các nút điều khiển flashcard
function setupFlashcardEventListeners() {
  // Thiết lập sự kiện cho các nút điều khiển flashcard
  const prevCardBtn = document.getElementById('prevCard');
  if (prevCardBtn) prevCardBtn.addEventListener('click', showPreviousCard);
  
  const nextCardBtn = document.getElementById('nextCard');
  if (nextCardBtn) nextCardBtn.addEventListener('click', showNextCard);
  
  // Thiết lập sự kiện cho các nút tương tác với thẻ
  const flipCardBtn = document.getElementById('flipCard');
  if (flipCardBtn) flipCardBtn.addEventListener('click', flipCurrentCard);
  
  const markAsKnownBtn = document.getElementById('markAsKnown');
  if (markAsKnownBtn) markAsKnownBtn.addEventListener('click', markCurrentCardAsKnown);
  
  const markForReviewBtn = document.getElementById('markForReview');
  if (markForReviewBtn) markForReviewBtn.addEventListener('click', markCurrentCardForReview);
  
  // Thiết lập sự kiện cho nút phát âm
  const pronounceBtn = document.querySelector('.flashcard .pronounce');
  if (pronounceBtn) {
    pronounceBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Ngăn sự kiện lan truyền lên phần tử cha
      pronounceCurrentWord();
    });
  }
  
  // Thiết lập sự kiện cho các điều khiển timer
  const timerDuration = document.getElementById('timerDuration');
  if (timerDuration) timerDuration.addEventListener('change', setCardTimer);
  
  const toggleTimer = document.getElementById('toggleTimer');
  if (toggleTimer) toggleTimer.addEventListener('click', toggleCardTimer);
  
  // Thiết lập sự kiện cho các tùy chọn bổ sung
  const autoPlayBox = document.getElementById('autoPlay');
  if (autoPlayBox) autoPlayBox.addEventListener('change', toggleAutoPlay);
  
  const autoFlipBox = document.getElementById('autoFlip');
  if (autoFlipBox) autoFlipBox.addEventListener('change', toggleAutoFlip);
  
  const showImageBox = document.getElementById('showImage');
  if (showImageBox) showImageBox.addEventListener('change', toggleShowImage);

  // Thiết lập sự kiện cho tải lên hình ảnh
  handleImageUpload();
  
  // Thiết lập sự kiện cho nút xóa hình ảnh
  const deleteImageBtn = document.getElementById('deleteImage');
  if (deleteImageBtn) {
    deleteImageBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      deleteCurrentImage();
    });
  }

  console.log('Đã thiết lập event listeners cho flashcards');
}

// Hàm thiết lập bộ đếm thời gian cho thẻ flashcard
function setCardTimer() {
  // Lấy giá trị thời gian từ phần tử HTML có id 'timerDuration' và chuyển đổi thành số nguyên
  const duration = parseInt(document.getElementById('timerDuration').value);
  // Xóa bỏ bất kỳ interval timer nào đang chạy để tránh nhiều timer chạy cùng lúc
  clearInterval(timer);
  // Đặt lại giá trị thời gian về 0
  timerValue = 0;
  
  if (duration === 0) {
    // Nếu thời gian được đặt là 0, tắt timer hoàn toàn
    isTimerRunning = false;
    // Hiển thị "00:00" trên giao diện người dùng
    document.getElementById('timerDisplay').textContent = '00:00';
    // Kết thúc hàm tại đây nếu duration = 0
    return;
  }
  
  // Nếu duration > 0, thiết lập timer mới
  isTimerRunning = true;
  // Đặt giá trị thời gian bằng với thời lượng đã chọn
  timerValue = duration;

  // Cập nhật hiển thị thời gian trên giao diện
  // updateTimerDisplay();
  
  // Tạo interval để đếm ngược mỗi giây (1000ms)
  timer = setInterval(() => {
    // Giảm giá trị thời gian đi 1 giây
    timerValue--;

    // Cập nhật hiển thị thời gian mới
    // updateTimerDisplay();
    
    // Kiểm tra nếu thời gian đã hết (đạt 0 hoặc âm)
    if (timerValue <= 0) {
      if (!isFlipped) {
        // Nếu thẻ chưa được lật, thực hiện lật thẻ
        flipCurrentCard();
        
        // Đặt lại thời gian cho mặt sau của thẻ
        timerValue = duration;
      } else {
        // Nếu thẻ đã được lật, chuyển sang thẻ tiếp theo
        showNextCard();
        
        // Đặt lại thời gian cho thẻ mới
        timerValue = duration;
        // Đặt trạng thái lật về false vì thẻ mới chưa được lật
        isFlipped = false;
      }
    }
  }, 1000); // Thực hiện callback mỗi 1000ms (1 giây)
}

// Hàm bật/tắt bộ đếm thời gian
function toggleCardTimer() {
  const toggleBtn = document.getElementById('toggleTimer');
  
  if (isTimerRunning) {
    // Tạm dừng timer bằng cách xóa interval
    clearInterval(timer);
    isTimerRunning = false;
    // Thay đổi biểu tượng nút thành biểu tượng play
    toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
  } else {
    // Tiếp tục timer
    isTimerRunning = true;
    // Thay đổi biểu tượng nút thành biểu tượng pause
    toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
    
    // Khởi động lại timer với thời gian hiện tại
    timer = setInterval(() => {
      // Giảm giá trị thời gian đi 1 giây
      timerValue--;
      // Cập nhật hiển thị thời gian
      updateTimerDisplay();
      
      // Xử lý khi thời gian đếm ngược kết thúc
      if (timerValue <= 0) {
        if (!isFlipped) {
          // Nếu thẻ chưa lật, lật thẻ và đặt lại thời gian
          flipCurrentCard();
          timerValue = parseInt(document.getElementById('timerDuration').value);
        } else {
          // Nếu thẻ đã lật, chuyển sang thẻ tiếp theo và đặt lại thời gian
          showNextCard();
          timerValue = parseInt(document.getElementById('timerDuration').value);
          isFlipped = false;
        }
      }
    }, 1000);
  }
}

// Hàm cập nhật hiển thị thời gian trên giao diện
function updateTimerDisplay() {
  // Tính toán số phút bằng cách chia timerValue cho 60 và làm tròn xuống
  const minutes = Math.floor(timerValue / 60);
  
  // Tính toán số giây bằng cách lấy phần dư khi chia timerValue cho 60
  const seconds = timerValue % 60;
  
  // Cập nhật nội dung của phần tử HTML có id 'timerDisplay'
  // Sử dụng padStart(2, '0') để đảm bảo số phút và giây luôn có 2 chữ số
  // Ví dụ: 1 phút 5 giây sẽ hiển thị là "01:05"
  document.getElementById('timerDisplay').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Hàm bật/tắt tự động phát âm
function toggleAutoPlay() {
  // Lấy trạng thái của checkbox autoPlay
  autoPlay = document.getElementById('autoPlay').checked;
  // Nếu bật tự động phát âm, phát âm từ hiện tại ngay lập tức
  if (autoPlay) {
    pronounceCurrentWord();
  }
}

// Hàm bật/tắt tự động lật thẻ
function toggleAutoFlip() {
  // Lấy trạng thái của checkbox autoFlip
  autoFlip = document.getElementById('autoFlip').checked;
}

// Hàm bật/tắt hiển thị hình ảnh
function toggleShowImage() {
  // Lấy trạng thái của checkbox showImage
  showImage = document.getElementById('showImage').checked;
  // Tìm container chứa hình ảnh
  const imageContainer = document.querySelector('.flashcard .word-image');
  // Hiển thị hoặc ẩn container hình ảnh dựa trên trạng thái showImage
  if (imageContainer) {
    imageContainer.style.display = showImage ? 'block' : 'none';
  }
}


// Flashcard navigation functions
// Hàm hiển thị thẻ tiếp theo
function showNextCard() {
  // Kiểm tra nếu danh sách từ vựng trống
  if (wordList.length === 0) return;
  
  // Tăng chỉ số thẻ hiện tại, quay lại thẻ đầu tiên nếu đã đến thẻ cuối cùng
  currentCardIndex = (currentCardIndex + 1) % wordList.length;
  // Cập nhật giao diện với thẻ mới
  updateFlashcardUI();
  // Thêm hiệu ứng animation cho thẻ mới
  animateFlashcard();
}

// Hàm hiển thị thẻ trước đó
function showPreviousCard() {
  // Kiểm tra nếu danh sách từ vựng trống
  if (wordList.length === 0) return;
  
  // Giảm chỉ số thẻ hiện tại, quay lại thẻ cuối cùng nếu đã ở thẻ đầu tiên
  currentCardIndex = (currentCardIndex - 1 + wordList.length) % wordList.length;
  // Cập nhật giao diện với thẻ mới
  updateFlashcardUI();
  // Thêm hiệu ứng animation cho thẻ mới
  animateFlashcard();
}

// Hàm lật thẻ hiện tại
function flipCurrentCard() {
  // Tìm phần tử flashcard
  const flashcard = document.querySelector('.flashcard');
  if (flashcard) {
    // Thêm/xóa class 'flipped' để lật thẻ
    flashcard.classList.toggle('flipped');
    
    // Thêm hiệu ứng âm thanh khi lật thẻ
    const flipSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-light-card-flip-1923.mp3');
    flipSound.volume = 0.3; // Giảm âm lượng xuống 30%
    flipSound.play();
  }
}

// Hàm đánh dấu thẻ hiện tại là đã biết
function markCurrentCardAsKnown() {
  // Kiểm tra nếu danh sách từ vựng trống
  if (wordList.length === 0) return;
  
  // Lấy từ vựng hiện tại
  const currentWord = wordList[currentCardIndex];
  // Đánh dấu từ là đã học
  currentWord.isLearned = true;
  // Cập nhật thời gian ôn tập gần nhất
  currentWord.lastReviewed = new Date().toISOString();
  // Tăng số lần trả lời đúng
  currentWord.correctCount = (currentWord.correctCount || 0) + 1;
  
  // Cập nhật thống kê người dùng
  userStats.wordsLearned++;
  
  // Lưu tiến độ vào localStorage
  saveWordProgress();
  
  // Hiển thị thông báo thành công
  showToast(`Đã đánh dấu từ "${currentWord.word}" là đã học!`, 'success');
  
  // Cập nhật tiến độ chủ đề
  classifyWordsByTopic();
  updateTopicProgress();
  
  // Chuyển sang thẻ tiếp theo sau một khoảng thời gian ngắn
  setTimeout(() => {
    showNextCard();
  }, 1000);
}

// Hàm đánh dấu thẻ hiện tại cần ôn tập
function markCurrentCardForReview() {
  // Kiểm tra nếu danh sách từ vựng trống
  if (wordList.length === 0) return;
  
  // Lấy từ vựng hiện tại
  const currentWord = wordList[currentCardIndex];
  
  // Lấy danh sách ôn tập từ localStorage
  let reviewList = JSON.parse(localStorage.getItem('reviewWords') || '[]');
  
  // Kiểm tra xem từ đã có trong danh sách ôn tập chưa
  if (!reviewList.some(w => w.word === currentWord.word)) {
    // Thêm vào danh sách ôn tập
    reviewList.push({
      word: currentWord.word,
      meaning: currentWord.meaning,
      addedAt: new Date().toISOString() // Thời điểm thêm vào danh sách
    });
    
    // Lưu lại vào localStorage
    localStorage.setItem('reviewWords', JSON.stringify(reviewList));
    
    // Hiển thị thông báo thành công
    showToast(`Đã thêm từ "${currentWord.word}" vào danh sách ôn tập!`, 'success');
  } else {
    // Hiển thị thông báo nếu từ đã có trong danh sách
    showToast(`Từ "${currentWord.word}" đã có trong danh sách ôn tập!`, 'info');
  }
  
  // Chuyển sang thẻ tiếp theo sau một khoảng thời gian ngắn
  setTimeout(() => {
    showNextCard();
  }, 1000);
}

// Hàm cập nhật giao diện flashcard
function updateFlashcardUI() {
  console.log('Updating flashcard UI...');
  
  // Kiểm tra xem danh sách từ vựng có sẵn và không trống
  if (!wordList || wordList.length === 0) {
    console.error('Word list not available or empty');
    // Hiển thị trạng thái trống nếu không có từ vựng
    const flashcardContainer = document.querySelector('.flashcard-container');
    if (flashcardContainer) {
      flashcardContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Không có từ vựng để hiển thị</p>
          <p>Vui lòng thêm từ vựng hoặc tải lại trang</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Tải lại</button>
        </div>
      `;
    }
    return;
  }

  // Đặt lại chỉ số thẻ hiện tại nếu nằm ngoài phạm vi
  if (currentCardIndex < 0 || currentCardIndex >= wordList.length) {
    currentCardIndex = 0;
  }

  // Đảm bảo container flashcard tồn tại
  const flashcardContainer = document.querySelector('.flashcard-container');
  if (!flashcardContainer) {
    console.error('Flashcard container not found');
    return;
  }

  // Cập nhật bộ đếm thẻ (vị trí hiện tại / tổng số thẻ)
  const cardCounter = document.getElementById('cardCounter');
  if (cardCounter) {
    cardCounter.textContent = `${currentCardIndex + 1}/${wordList.length}`;
  }

  // Lấy từ vựng hiện tại
  const currentWord = wordList[currentCardIndex];
  if (!currentWord) {
    console.error('Current word not found at index:', currentCardIndex);
    return;
  }

  // Cập nhật mặt trước của thẻ
  const wordElement = document.querySelector('.flashcard .word');
  const phoneticElement = document.querySelector('.flashcard .phonetic');
  
  // Cập nhật từ vựng
  if (wordElement) {
    wordElement.textContent = currentWord.word;
  } else {
    console.error('Word element not found in flashcard');
  }
  
  // Cập nhật phiên âm
  if (phoneticElement) {
    phoneticElement.textContent = currentWord.phonetic || '';
  }

  // Cập nhật mặt sau của thẻ
  const meaningElement = document.querySelector('.flashcard .meaning');
  const exampleElement = document.querySelector('.flashcard .example');
  const wordTypeElement = document.querySelector('.flashcard .word-type span');
  const wordCategoryElement = document.querySelector('.flashcard .word-category span');
  
  // Cập nhật nghĩa của từ
  if (meaningElement) {
    meaningElement.textContent = currentWord.meaning || '';
  }
  
  // Cập nhật ví dụ
  if (exampleElement) {
    exampleElement.textContent = currentWord.example || '';
  }
  
  // Cập nhật loại từ (danh từ, động từ, tính từ...)
  if (wordTypeElement) {
    const wordType = currentWord.wordType || 'noun';
    wordTypeElement.textContent = wordType.charAt(0).toUpperCase() + wordType.slice(1);
  }
  
  // Cập nhật chủ đề của từ
  if (wordCategoryElement && topics) {
    const topicKey = currentWord.topic || 'general';
    const topicName = topics[topicKey] ? topics[topicKey].name : topicKey.charAt(0).toUpperCase() + topicKey.slice(1);
    wordCategoryElement.textContent = topicName;
  }

  // Cập nhật hình ảnh nếu showImage là true
  const imageContainer = document.querySelector('.flashcard .word-image');
  const imageElement = document.querySelector('.flashcard .word-image img');
  const imagePlaceholder = document.querySelector('.flashcard .image-placeholder');
  const deleteImageBtn = document.getElementById('deleteImage');
  
  if (imageContainer && imageElement) {
    if (showImage) {
      // Hiển thị container hình ảnh
      imageContainer.style.display = 'block';
      
      // Hiển thị placeholder trong khi đang tải hình ảnh
      if (imagePlaceholder) {
        imagePlaceholder.style.display = 'flex';
      }
      
      // Ẩn/hiện nút xóa hình ảnh dựa vào việc có hình tùy chỉnh hay không
      if (deleteImageBtn) {
        if (uploadedImages[currentWord.word]) {
          deleteImageBtn.style.display = 'flex';
        } else {
          deleteImageBtn.style.display = 'none';
        }
      }
      
      // Thêm class loading để hiển thị trạng thái đang tải
      imageElement.classList.add('loading');
      
      // Kiểm tra nếu có hình ảnh đã tải lên
      if (uploadedImages[currentWord.word]) {
        // Sử dụng hình ảnh đã tải lên
        imageElement.src = uploadedImages[currentWord.word];
        imageElement.classList.remove('loading');
        if (imagePlaceholder) {
          imagePlaceholder.style.display = 'none';
        }
      } 
      // Thiết lập nguồn hình ảnh từ cache nếu có
      else if (wordImages[currentWord.word]) {
        // Sử dụng hình ảnh đã lưu trong cache
        imageElement.src = wordImages[currentWord.word];
      } else {
        // Tải hình ảnh mới từ Pexels API
        getPexelsImage(currentWord.word)
          .then(imageUrl => {
            // Cập nhật nguồn hình ảnh
            imageElement.src = imageUrl;
            // Lưu URL vào cache để sử dụng sau này
            wordImages[currentWord.word] = imageUrl;
          })
          .catch(error => {
            // Xử lý lỗi khi không thể tải hình ảnh
            console.error(`Failed to load image for word: ${currentWord.word}`, error);
            // Sử dụng hình ảnh placeholder thay thế
            imageElement.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(currentWord.word)}`;
            // Xóa class loading
            imageElement.classList.remove('loading');
            // Ẩn placeholder
            if (imagePlaceholder) {
              imagePlaceholder.style.display = 'none';
            }
          });
      }
      
      // Xử lý sự kiện khi hình ảnh đã tải xong
      imageElement.onload = function() {
        // Xóa class loading
        imageElement.classList.remove('loading');
        // Ẩn placeholder
        if (imagePlaceholder) {
          imagePlaceholder.style.display = 'none';
        }
      };
      
      // Xử lý sự kiện khi không thể tải hình ảnh
      imageElement.onerror = function() {
        console.error(`Failed to load image for word: ${currentWord.word}`);
        // Sử dụng hình ảnh placeholder thay thế
        imageElement.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(currentWord.word)}`;
        // Xóa class loading
        imageElement.classList.remove('loading');
        // Ẩn placeholder
        if (imagePlaceholder) {
          imagePlaceholder.style.display = 'none';
        }
      };
    } else {
      // Ẩn container hình ảnh nếu showImage là false
      imageContainer.style.display = 'none';
    }
  }

  // Đặt lại thẻ về mặt trước nếu nó đã được lật
  const flashcard = document.querySelector('.flashcard');
  if (flashcard) {
    if (flashcard.classList.contains('flipped')) {
      flashcard.classList.remove('flipped');
    }
    isFlipped = false;
    
    // Thêm hiệu ứng animation
    flashcard.classList.add('entrance-animation');
    setTimeout(() => {
      flashcard.classList.remove('entrance-animation');
    }, 500);
  }

  // Cập nhật trạng thái nút đánh dấu đã biết/cần ôn tập
  const markAsKnownBtn = document.getElementById('markAsKnown');
  const markForReviewBtn = document.getElementById('markForReview');
  
  // Cập nhật trạng thái nút "Đã biết"
  if (markAsKnownBtn && currentWord.isLearned) {
    // Nếu từ đã được đánh dấu là đã học
    // Thêm class 'active' để hiển thị trạng thái đã được đánh dấu là biết
    markAsKnownBtn.classList.add('active');
    // Cập nhật nội dung nút với biểu tượng đánh dấu đã hoàn thành (solid) và văn bản "Đã biết"
    markAsKnownBtn.innerHTML = '<i class="fas fa-check"></i> Đã biết';
  } else if (markAsKnownBtn) {
    // Nếu từ chưa được đánh dấu là đã học
    markAsKnownBtn.classList.remove('active');
    markAsKnownBtn.innerHTML = '<i class="far fa-check"></i> Đánh dấu đã biết';
  }

  
  // Cập nhật trạng thái nút "Ôn tập"
  if (markForReviewBtn && currentWord.needsReview) {
    // Nếu từ đã được đánh dấu cần ôn tập
    markForReviewBtn.classList.add('active');
    markForReviewBtn.innerHTML = '<i class="fas fa-bookmark"></i> Đang ôn tập';
  } else if (markForReviewBtn) {
    // Nếu từ chưa được đánh dấu cần ôn tập
    markForReviewBtn.classList.remove('active');
    markForReviewBtn.innerHTML = '<i class="far fa-bookmark"></i> Đánh dấu ôn tập';
  }

  // Auto-pronounce if enabled
  if (autoPlay) {
    setTimeout(pronounceCurrentWord, 500);
  }

  console.log('Flashcard UI updated successfully');
}

// Load saved images when the script initializes
loadUploadedImages();

// Hiển thị hướng dẫn sử dụng tính năng tải lên ảnh
function showImageUploadTutorial() {
  // Kiểm tra xem người dùng đã thấy thông báo hướng dẫn chưa
  const hasSeenTutorial = localStorage.getItem('hasSeenImageUploadTutorial');
  
  if (!hasSeenTutorial) {
    // Hiển thị thông báo hướng dẫn
    setTimeout(() => {
      showToast('Bạn có thể tải lên hình ảnh riêng cho từ vựng bằng cách nhấp vào biểu tượng tải lên ở góc trên bên phải ảnh', 'info', 6000);
      
      // Đánh dấu đã hiển thị hướng dẫn
      localStorage.setItem('hasSeenImageUploadTutorial', 'true');
    }, 2000);
  }
}

// Hàm khởi tạo khi trang được tải
function initFlashcards() {
  // Tải hình ảnh đã lưu
  loadUploadedImages();
  
  // Hiển thị hướng dẫn
  showImageUploadTutorial();
  
  // Thiết lập các listener
  setupFlashcardEventListeners();
  
  // Cập nhật UI
  setTimeout(updateFlashcardUI, 100);
}

// Khởi tạo khi DOM đã sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlashcards);
} else {
  // Nếu DOMContentLoaded đã kích hoạt
  initFlashcards();
}