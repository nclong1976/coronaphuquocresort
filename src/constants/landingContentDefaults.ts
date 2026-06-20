/** Khóa lưu trong SiteContent + giá trị mặc định (trang chủ) */
export const LANDING_CONTENT_DEFAULTS: Record<string, string> = {
  'landing.heroVideoUrl': 'https://casinocorona.vn/wp-content/uploads/2022/09/tvc-vi-en.mp4',
    'landing.heroVideoUrl2': 'https://casinocorona.vn/wp-content/uploads/2022/09/tvc-vi-en.mp4',
  'landing.aboutKicker': 'Về chúng tôi',
  'landing.aboutTitle': 'CORONA RESORT & CASINO',
  'landing.aboutImageUrl': 'https://casinocorona.vn/wp-content/uploads/2025/07/homepage-web3-1024x768.jpg',
  'landing.aboutParagraph':
    'Tọa lạc tại vị trí phía Bắc của Phú Quốc, Corona Resort & Casino tự hào là đơn vị tiên phong trong việc đầu tư, xây dựng và vận hành mô hình du lịch nghỉ dưỡng kết hợp giải trí cao cấp đầu tiên tại Việt Nam.',
  'landing.statRooms': '3000+',
  'landing.statRestaurants': '20+',
  'landing.statCasino': '1',
  'landing.statGolf': '18 Lỗ',
  'landing.alertTitle': 'CẢNH GIÁC VỚI CÁC CHIÊU TRÒ LỪA ĐẢO',
  'landing.alertBody':
    'Cảnh giác với các chiêu trò sử dụng hình ảnh Casino Corona với mục đích lừa đảo.',
  'landing.promoImageUrl': 'https://casinocorona.vn/wp-content/uploads/2025/11/chao-don-khach-viet-tro-lai-kgh-web.jpg',
  'landing.promoTitle': 'CHÍNH THỨC ĐÓN KHÁCH VIỆT TRỞ LẠI',
  'landing.promoBody':
    'Corona Resort & Casino Phú Quốc chính thức mở cửa đón khách Việt trở lại từ 26/11/2025.',
};

export const LANDING_CONTENT_KEYS = Object.keys(LANDING_CONTENT_DEFAULTS);

/** Quảng cáo / bài đăng thêm (super chỉnh trong CMS) — Trang chủ, Khách sạn, Nhà hàng, Ưu đãi */
export const MARKETING_CONTENT_DEFAULTS: Record<string, string> = {
  'marketing.home.postTitle': '',
  'marketing.home.postImageUrl': '',
  'marketing.home.postBody': '',
  'marketing.hotel.heroUrl': '',
  'marketing.hotel.intro': '',
  'marketing.hotel.postTitle': '',
  'marketing.hotel.postImageUrl': '',
  'marketing.hotel.postBody': '',
  'marketing.hotel.post2Title': '',
  'marketing.hotel.post2ImageUrl': '',
  'marketing.hotel.post2Body': '',
  'marketing.restaurant.heroUrl': '',
  'marketing.restaurant.intro': '',
  'marketing.restaurant.postTitle': '',
  'marketing.restaurant.postImageUrl': '',
  'marketing.restaurant.postBody': '',
  'marketing.restaurant.post2Title': '',
  'marketing.restaurant.post2ImageUrl': '',
  'marketing.restaurant.post2Body': '',
  'marketing.uudai.postTitle': '',
  'marketing.uudai.postImageUrl': '',
  'marketing.uudai.postBody': '',
  'marketing.uudai.post2Title': '',
  'marketing.uudai.post2ImageUrl': '',
  'marketing.uudai.post2Body': '',
};

export const MARKETING_CONTENT_KEYS = Object.keys(MARKETING_CONTENT_DEFAULTS);

/** Toàn bộ khóa lưu SiteContent (trang chủ + marketing) */
export const CMS_ALL_CONTENT_KEYS = [...LANDING_CONTENT_KEYS, ...MARKETING_CONTENT_KEYS];

export function mergeLandingContent(fetched: Record<string, string>) {
  return { ...LANDING_CONTENT_DEFAULTS, ...fetched };
}

export function mergeAllSiteContent(fetched: Record<string, string>) {
  return { ...mergeLandingContent({}), ...MARKETING_CONTENT_DEFAULTS, ...fetched };
}
