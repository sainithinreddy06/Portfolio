import { reportApiFailure } from '../../server/apiErrors';
import type { Handler } from './types';
import { getPortfolioStore, savePortfolioStore } from '../../server/deployedPortfolioStore';
import { verifyAdminToken } from '../../server/deployedAuthService';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
  if (event.httpMethod === 'POST') {
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (event.headers['x-admin-token'] || event.headers['X-Admin-Token']);

    const authCheck = await verifyAdminToken(token);
    if (!authCheck.valid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Unauthorized. Valid admin session token required.' }),
      };
    }
    try {
      const { fileUrl, fileName, fileSize, comingSoonMessage, isAvailable, reset } = JSON.parse(event.body || '{}');
      const store = await getPortfolioStore();

      if (reset) {
        store.content.profile.resume = {
          fileUrl: '#resume-view',
          fileName: undefined,
          fileSize: undefined,
          uploadedAt: undefined,
          isAvailable: true,
          comingSoonMessage: 'Verified curriculum vitae available to view and download.',
        };
        await savePortfolioStore(store);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, resume: store.content.profile.resume }),
        };
      }

      if (fileUrl) {
        store.content.profile.resume = {
          fileUrl: fileUrl.trim(),
          fileName: fileName || (fileUrl.split('/').pop() || 'Resume_Document'),
          fileSize: fileSize || 'Cloud Document',
          uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isAvailable: isAvailable !== false,
          comingSoonMessage: comingSoonMessage || 'Verified curriculum vitae available.',
        };
        await savePortfolioStore(store);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, resume: store.content.profile.resume }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Provide fileUrl or reset flag.' }),
      };
    } catch (err: any) {
    reportApiFailure('resume', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Portfolio service failed. Check function logs and database configuration.' }),
      };
    }
  }

  const store = await getPortfolioStore();
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, resume: store.content.profile.resume }),
  };
  } catch (error) {
    reportApiFailure('resume', error);
    return { statusCode: 503, headers, body: JSON.stringify({ success: false, error: 'Portfolio storage or authentication configuration is unavailable.' }) };
  }
};
