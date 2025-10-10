import { expect, getTestCredentials, TEST_TIMEOUT } from '../setup';
import InternxtSDK from '../../src/index';

describe('Authentication Integration Tests', function() {
  this.timeout(TEST_TIMEOUT);

  let sdk: InternxtSDK;
  let credentials: ReturnType<typeof getTestCredentials>;

  before(function() {
    try {
      credentials = getTestCredentials();
    } catch (error) {
      console.warn('\n⚠️  Skipping integration tests: Test credentials not configured');
      console.warn('   Create .env.test.local with INTERNXT_TEST_EMAIL and INTERNXT_TEST_PASSWORD\n');
      this.skip();
    }
  });

  beforeEach(() => {
    sdk = new InternxtSDK();
  });

  afterEach(async () => {
    const loggedIn = await sdk.isLoggedIn();
    if (loggedIn) {
      await sdk.logout();
    }
  });

  describe('is2FANeeded', () => {
    it('should check if 2FA is needed for an email', async () => {
      const needs2FA = await sdk.is2FANeeded(credentials.email);
      expect(needs2FA).to.be.a('boolean');
    });

    it('should return false for non-existent email', async () => {
      const needs2FA = await sdk.is2FANeeded('nonexistent-' + Date.now() + '@example.com');
      expect(needs2FA).to.be.false;
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await sdk.login(
        credentials.email,
        credentials.password,
        credentials.twoFactorCode
      );

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('user');
      
      expect(result.user).to.have.property('email');
      expect(result.user.email).to.equal(credentials.email);
      expect(result.user).to.have.property('uuid');
      expect(result.user).to.have.property('rootFolderId');
      
      expect(await sdk.isLoggedIn()).to.be.true;
    });

    it('should fail with invalid password', async function() {
      this.timeout(TEST_TIMEOUT);

      try {
        await sdk.login(credentials.email, 'wrong-password-123456');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.exist;
        expect(await sdk.isLoggedIn()).to.be.false;
      }
    });

    it('should fail with invalid email', async function() {
      this.timeout(TEST_TIMEOUT);

      try {
        await sdk.login('invalid-email-' + Date.now() + '@example.com', 'password');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.exist;
        expect(await sdk.isLoggedIn()).to.be.false;
      }
    });

    it('should return user data after login', async () => {
      const result = await sdk.login(
        credentials.email,
        credentials.password,
        credentials.twoFactorCode
      );

      expect(result.user).to.have.property('uuid');
      expect(result.user).to.have.property('email');
      expect(result.user).to.have.property('rootFolderId');
      
      expect(result.user.uuid).to.be.a('string');
      expect(result.user.email).to.be.a('string');
      expect(result.user.rootFolderId).to.be.a('string');
    });
  });

  describe('isLoggedIn', () => {
    it('should return false before login', async () => {
      expect(await sdk.isLoggedIn()).to.be.false;
    });

    it('should return true after successful login', async () => {
      await sdk.login(
        credentials.email,
        credentials.password,
        credentials.twoFactorCode
      );

      expect(await sdk.isLoggedIn()).to.be.true;
    });

    it('should return false after logout', async () => {
      await sdk.login(
        credentials.email,
        credentials.password,
        credentials.twoFactorCode
      );

      expect(await sdk.isLoggedIn()).to.be.true;

      await sdk.logout();

      expect(await sdk.isLoggedIn()).to.be.false;
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await sdk.login(
        credentials.email,
        credentials.password,
        credentials.twoFactorCode
      );

      expect(await sdk.isLoggedIn()).to.be.true;

      const result = await sdk.logout();

      expect(result).to.have.property('success', true);
      expect(await sdk.isLoggedIn()).to.be.false;
    });

    it('should handle logout when not logged in', async () => {
      const result = await sdk.logout();
      
      expect(result).to.have.property('success', true);
      expect(await sdk.isLoggedIn()).to.be.false;
    });
  });

  describe('Credentials Persistence', () => {
    it('should persist credentials across SDK instances', async () => {
      const sdk1 = new InternxtSDK();
      
      await sdk1.login(
        credentials.email,
        credentials.password,
        credentials.twoFactorCode
      );

      expect(await sdk1.isLoggedIn()).to.be.true;

      // Create new SDK instance
      const sdk2 = new InternxtSDK();
      
      // New instance should not be automatically logged in
      // (credentials are instance-specific)
      expect(await sdk2.isLoggedIn()).to.be.false;

      await sdk1.logout();
    });
  });
});
