/**
 * RACING ZONE - Django REST API Client
 */

class RacingAPI {
  static getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  static async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const csrfToken = this.getCookie('csrftoken');
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${url}:`, err);
      throw err;
    }
  }

  // Profile & Auth
  static async getProfile() {
    return this.request('/api/profile/');
  }

  static async login(username, password) {
    return this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  static async register(username, password, nickname) {
    return this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname })
    });
  }

  static async logout() {
    return this.request('/api/auth/logout/', { method: 'POST' });
  }

  // Cars & Garage
  static async getCars() {
    return this.request('/api/cars/');
  }

  static async buyCar(slug) {
    return this.request('/api/garage/buy/', {
      method: 'POST',
      body: JSON.stringify({ slug })
    });
  }

  static async selectCar(slug) {
    return this.request('/api/garage/select/', {
      method: 'POST',
      body: JSON.stringify({ slug })
    });
  }

  static async paintCar(slug, color) {
    return this.request('/api/garage/paint/', {
      method: 'POST',
      body: JSON.stringify({ slug, color })
    });
  }

  static async upgradeCar(slug, type) {
    return this.request('/api/garage/upgrade/', {
      method: 'POST',
      body: JSON.stringify({ slug, type })
    });
  }

  // Tracks & Races
  static async getTracks() {
    return this.request('/api/tracks/');
  }

  static async submitRace(resultData) {
    return this.request('/api/races/', {
      method: 'POST',
      body: JSON.stringify(resultData)
    });
  }

  static async getRaceHistory() {
    return this.request('/api/races/history/');
  }

  // Leaderboard & Rewards
  static async getLeaderboard(category = 'wins', trackSlug = '') {
    const q = new URLSearchParams({ category, track: trackSlug });
    return this.request(`/api/leaderboard/?${q.toString()}`);
  }

  static async getRewards() {
    return this.request('/api/rewards/');
  }
}

window.RacingAPI = RacingAPI;
