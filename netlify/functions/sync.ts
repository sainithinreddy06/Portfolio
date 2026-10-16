import type { Handler } from './types';
import { syncAllPortfolioRepositories } from '../../server/githubService';
import { syncGitHubProjects } from '../../server/portfolioStore';
import { verifyAdminToken } from '../../server/authService';

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'sainithinreddy06';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (event.headers['x-admin-token'] || event.headers['X-Admin-Token']);

  const authCheck = verifyAdminToken(token);
  if (!authCheck.valid) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, error: 'Unauthorized. Valid admin session token required.' }),
    };
  }

  try {
    let targetUser = GITHUB_USERNAME;
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        if (parsed.username && parsed.username.toLowerCase() !== GITHUB_USERNAME.toLowerCase()) {
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
        // ignore
      }
    }

    const projects = await syncAllPortfolioRepositories(targetUser, true);
    const updatedContent = syncGitHubProjects(projects);

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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
