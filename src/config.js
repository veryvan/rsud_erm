const API_BASE_URL = import.meta.env.VITE_API_BASE || (window.location.port === '5173' ? 'http://localhost/erm/api/public/index.php/api/hd' : '/erm/api/public/index.php/api/hd');

export default API_BASE_URL;
