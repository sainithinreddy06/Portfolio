import { reportApiFailure } from '../../server/apiErrors';
import { env } from '../../server/runtimeEnv';
import type { Handler } from './types';
import { getPortfolioStore } from '../../server/deployedPortfolioStore';
import { syncAllPortfolioRepositories } from '../../server/githubService';
import { syncGitHubProjects } from '../../server/deployedPortfolioStore';


export const handler: Handler = async (event) => {
  const GITHUB_USERNAME = env('GITHUB_USERNAME') || 'sainithinreddy06';

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  };

  try {
    const shouldRefresh = event.queryStringParameters?.refresh === 'true';
    if (shouldRefresh) {
      const discovered = await syncAllPortfolioRepositories(GITHUB_USERNAME, true);
      const updatedContent = await syncGitHubProjects(discovered);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          source: 'github_live',
          lastUpdated: updatedContent.lastSynced || new Date().toISOString(),
          total: updatedContent.projects.length,
          projects: updatedContent.projects,
        }),
      };
    }

    const store = await getPortfolioStore();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        source: 'synchronized_store',
        lastUpdated: store.lastUpdated,
        total: store.content.projects.length,
        projects: store.content.projects,
      }),
    };
  } catch (err: any) {
    reportApiFailure('projects', err);
    return { statusCode: 502, headers: { ...headers, 'Cache-Control': 'no-store' }, body: JSON.stringify({ success: false, error: 'Project refresh failed. Check GitHub and database configuration.' }) };
  }
};
