import type { Handler } from './types';
import { getGitHubDiagnostics } from '../../server/githubService';
import { getPortfolioStore } from '../../server/portfolioStore';

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const diagnostics = getGitHubDiagnostics();
    const store = getPortfolioStore();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        diagnostics,
        syncedRepositoriesCount: Object.keys(store.syncedRepositories).length,
        lastStoreUpdate: store.lastUpdated,
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
