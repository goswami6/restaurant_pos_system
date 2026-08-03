// API Base URL configuration for E-Menu (uses Vercel proxy rewrite in production to prevent CORS errors)
export const API_BASE_URL = '/api';

/**
 * Extract restaurant_id from URL query parameters (or sessionStorage / localStorage fallback)
 * Supports params: id, restaurant_id, restaurantId, restaurant, rest_id, rid
 */
export const getRestaurantId = (): number => {
  const queryParams = new URLSearchParams(window.location.search);
  const urlRid =
    queryParams.get('id') ||
    queryParams.get('restaurant_id') ||
    queryParams.get('restaurantId') ||
    queryParams.get('restaurant') ||
    queryParams.get('rest_id') ||
    queryParams.get('rid');

  if (urlRid) {
    const cleanId = parseInt(urlRid, 10);
    if (!isNaN(cleanId) && cleanId > 0) {
      sessionStorage.setItem('emenu_restaurant_id', String(cleanId));
      return cleanId;
    }
  }

  const storedRid = sessionStorage.getItem('emenu_restaurant_id');
  if (storedRid) {
    const cleanId = parseInt(storedRid, 10);
    if (!isNaN(cleanId) && cleanId > 0) {
      return cleanId;
    }
  }

  const savedUser = localStorage.getItem('emenu_user');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      const userRid = parsed?.restaurant_id || parsed?.restaurent_id;
      if (userRid) {
        const cleanId = parseInt(userRid, 10);
        if (!isNaN(cleanId) && cleanId > 0) {
          return cleanId;
        }
      }
    } catch {
      // ignore
    }
  }

  return 9;
};

export const clearEmenuCart = () => {
  const rid = getRestaurantId();
  localStorage.removeItem(`emenu_cart_${rid}`);
  localStorage.removeItem('emenu_cart');
  localStorage.setItem(`emenu_cart_${rid}`, '{}');
  localStorage.setItem('emenu_cart', '{}');
  window.dispatchEvent(new Event('emenu_cart_updated'));
};
