import type { Handler } from './types';
import { getPortfolioStore } from '../../server/portfolioStore';
import { syncAllPortfolioRepositories } from '../../server/githubService';
import { syncGitHubProjects } from '../../server/portfolioStore';

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'sainithinreddy06';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  };

  try {
    const shouldRefresh = event.queryStringParameters?.refresh === 'true';
    if (shouldRefresh) {
      const discovered = await syncAllPortfolioRepositories(GITHUB_USERNAME, true);
      const updatedContent = syncGitHubProjects(discovered);
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

    const store = getPortfolioStore();
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
    const store = getPortfolioStore();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        source: 'fallback_store',
        lastUpdated: store.lastUpdated,
        total: store.content.projects.length,
        projects: store.content.projects,
        error: err.message,
      }),
    };
  }
};
