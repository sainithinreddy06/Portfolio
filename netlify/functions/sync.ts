import { reportApiFailure } from '../../server/apiErrors';
import { env } from '../../server/runtimeEnv';
import type { Handler } from './types';
import { syncAllPortfolioRepositories } from '../../server/githubService';
import { syncGitHubProjects } from '../../server/deployedPortfolioStore';
import { verifyAdminToken } from '../../server/deployedAuthService';


export const handler: Handler = async (event) => {
  const GITHUB_USERNAME = env('GITHUB_USERNAME') || 'sainithinreddy06';

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { ...headers, Allow: 'POST' }, body: JSON.stringify({ success: false, error: 'Method not allowed.' }) };

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
    const targetUser = GITHUB_USERNAME;
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        if (parsed.username && String(parsed.username).toLowerCase() !== GITHUB_USERNAME.toLowerCase()) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: `Unauthorized to sync external account. Only the portfolio owner (${GITHUB_USERNAME}) can be synchronized.`,
            }),
          };
        }
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Request body must be valid JSON.' }) };
      }
    }

    const projects = await syncAllPortfolioRepositories(targetUser, true);
    const updatedContent = await syncGitHubProjects(projects);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        syncedCount: projects.length,
        projects: projects.map((p) => ({
          id: p.repoId,
          name: p.name,
          technologies: p.stack,
          url: p.githubUrl,
          liveUrl: p.liveUrl,
          deployment: p.deploymentInfo?.provider,
        })),
        totalProjects: updatedContent.projects.length,
        lastSynced: updatedContent.lastSynced,
      }),
    };
  } catch (err: any) {
    reportApiFailure('sync', err);
    return {
      statusCode: err?.code === 'GITHUB_DISCOVERY_FAILED' ? 502 : 500,
      headers,
      body: JSON.stringify({ success: false, error: err?.code === 'GITHUB_DISCOVERY_FAILED' ? 'GitHub repository discovery failed. Check GITHUB_TOKEN permissions and API rate limits.' : 'Portfolio persistence failed. Check database configuration and function logs.' }),
    };
  }
  } catch (error) {
    reportApiFailure('sync', error);
    return { statusCode: 503, headers, body: JSON.stringify({ success: false, error: 'Portfolio storage or authentication configuration is unavailable.' }) };
  }
};
