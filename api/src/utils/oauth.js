const axios = require('axios');

// OAuth utility functions for Google and GitHub
class OAuthService {
  // Google OAuth validation
  static async validateGoogleToken(idToken) {
    try {
      // In a real implementation, you would call Google's tokeninfo endpoint
      // For this example, we'll just verify the token format and return mock user data
      // In production, use: https://oauth2.googleapis.com/tokeninfo?id_token=ID_TOKEN

      // This is a simplified validation - in production, properly verify the JWT with Google's public keys
      if (!idToken || typeof idToken !== 'string') {
        throw new Error('Invalid token format');
      }

      // In a real implementation, you would:
      // 1. Decode the JWT without verification to get the header and payload
      // 2. Get the kid (key ID) from the header
      // 3. Fetch Google's public keys from https://www.googleapis.com/oauth2/v3/certs
      // 4. Verify the JWT using the appropriate public key
      // 5. Validate the payload contents (audience, issuer, expiration, etc.)

      // For this example, return mock user data
      return {
        id: `google_${Date.now()}`, // In real implementation, this would come from the token
        email: 'mock@example.com', // In real implementation, this would come from the token
        name: 'Mock User', // In real implementation, this would come from the token
        provider: 'google'
      };
    } catch (error) {
      console.error('Google token validation error:', error);
      throw new Error('Failed to validate Google token');
    }
  }

  // GitHub OAuth validation
  static async validateGitHubToken(code, redirectUri) {
    try {
      // Exchange the authorization code for an access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri
      }, {
        headers: {
          Accept: 'application/json'
        }
      });

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error('Failed to obtain access token from GitHub');
      }

      // Get user profile using the access token
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      const githubUser = userResponse.data;

      // Get user email (GitHub may require additional request for private emails)
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      const primaryEmail = emailResponse.data.find(email => email.primary)?.email || githubUser.email;

      return {
        id: `github_${githubUser.id}`,
        email: primaryEmail,
        name: githubUser.name || githubUser.login,
        provider: 'github',
        username: githubUser.login
      };
    } catch (error) {
      console.error('GitHub token validation error:', error);
      throw new Error('Failed to validate GitHub token');
    }
  }

  // Generate OAuth login URL for Google
  static getGoogleAuthUrl(state = null) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID, // Note: This should be Google client ID in a real implementation
      redirect_uri: `${process.env.API_BASE_URL}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      ...(state && { state })
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  // Generate OAuth login URL for GitHub
  static getGitHubAuthUrl(state = null) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: `${process.env.API_BASE_URL}/auth/github/callback`,
      scope: 'user:email',
      ...(state && { state })
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }
}

module.exports = OAuthService;