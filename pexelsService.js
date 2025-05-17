/**
 * Pexels API Service
 * Handles fetching images from Pexels API with proper authentication
 */

// TODO: Replace this with your actual Pexels API key
const PEXELS_API_KEY = 'GdFCV1H1NBZVPbpbXUv4gyM2Q477w9gXX0KYslV5ZBzDZX9i2Y1oUC3N'; // Lấy từ https://www.pexels.com/api/new/

// Biến kiểm soát sử dụng hình ảnh local thay vì API
const USE_LOCAL_IMAGES = true;

// Đường dẫn tới thư mục hình ảnh local
const LOCAL_IMAGES_PATH = 'assets/images/vocab/';

/**
 * Fetch an image URL from Pexels based on search term
 * @param {string} searchTerm - The search term to find relevant images
 * @returns {Promise<string>} - Promise resolving to image URL
 */
async function getPexelsImage(searchTerm) {
  try {
    // Handle invalid search terms
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
      searchTerm = 'vocabulary';
    }
    
    // Nếu chọn dùng hình ảnh local
    if (USE_LOCAL_IMAGES) {
      // Chuyển search term về dạng không dấu, không ký tự đặc biệt và thêm đuôi .jpg
      const fileName = searchTerm.toLowerCase()
                               .trim()
                               .replace(/\s+/g, '_')
                               .replace(/[^\w\s]/gi, '') + '.jpg';
      
      // Đường dẫn đến hình ảnh local
      const localImagePath = LOCAL_IMAGES_PATH + fileName;
      
      // Kiểm tra hình ảnh có tồn tại không (đây chỉ là kiểm tra ảo, trên thực tế bạn không thể
      // kiểm tra file có tồn tại bằng JavaScript phía client, nhưng browser sẽ tự xử lý)
      console.log(`Sử dụng hình ảnh local: ${localImagePath}`);
      
      // Return đường dẫn đến hình ảnh local
      return localImagePath;
    }

    // Nếu không dùng local, tiếp tục dùng API Pexels như cũ
    // Make request to Pexels API
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=1`,
      {
        method: 'GET',
        headers: {
          Authorization: PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pexels API Response Error:', errorText);
      throw new Error(`Pexels API error: ${response.status}`);
    }

    // Parse JSON data
    const data = await response.json();

    // Check if valid results exist
    if (data.photos?.length > 0 && data.photos[0]?.src?.large) {
      return data.photos[0].src.large;
    }

    // Fallback if no results
    return getFallbackImage(searchTerm);
  } catch (error) {
    console.error('Error fetching Pexels image:', error);
    return getFallbackImage(searchTerm);
  }
}

/**
 * Get a fallback image when Pexels API fails
 * @param {string} searchTerm - Original search term
 * @returns {string} - URL to fallback image
 */
function getFallbackImage(searchTerm) {
  const fallbackImages = {
    food: 'assets/images/fallback/food.jpg',
    animal: 'assets/images/fallback/animal.jpg',
    technology: 'assets/images/fallback/technology.jpg',
    default: 'assets/images/fallback/default.jpg'
  };

  if (!searchTerm || typeof searchTerm !== 'string') {
    return fallbackImages.default;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  for (const category in fallbackImages) {
    if (lowerSearchTerm.includes(category)) {
      return fallbackImages[category];
    }
  }

  return fallbackImages.default;
}

// Export the function for use in other files
window.getPexelsImage = getPexelsImage;

// Add alias for backward compatibility
window.getUnsplashImage = getPexelsImage;