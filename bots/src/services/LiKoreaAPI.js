const axios = require('axios');

class LiKoreaAPI {
  constructor(config) {
    this.apiUrl = process.env.LIKOREA_API_URL || config.likorea.apiUrl;
    this.adminToken = process.env.LIKOREA_ADMIN_TOKEN || config.likorea.adminToken;
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${this.apiUrl}/auth/login`, {
        username,
        password
      });
      return response.data.token;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async createPost(token, postData) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/posts`,
        postData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  async createBotAccount(botData) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/auth/register`,
        {
          username: botData.persona.likoreaAccount.username,
          email: botData.persona.likoreaAccount.email,
          password: botData.persona.likoreaAccount.password,
          name: botData.name
        },
        {
          headers: {
            'Authorization': `Bearer ${this.adminToken}`
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`Bot account ${botData.persona.likoreaAccount.username} already exists`);
        return { exists: true };
      }
      throw new Error(`Failed to create bot account: ${error.message}`);
    }
  }


  async getCategories() {
    try {
      const response = await axios.get(`${this.apiUrl}/categories`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error.message);
      return [];
    }
  }

  async getTags() {
    try {
      const response = await axios.get(`${this.apiUrl}/tags`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tags:', error.message);
      return [];
    }
  }
}

module.exports = LiKoreaAPI;