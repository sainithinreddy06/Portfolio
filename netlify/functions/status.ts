import { reportApiFailure } from '../../server/apiErrors';
import type { Handler } from './types';
import { getGitHubDiagnostics } from '../../server/githubService';
import { getPortfolioStore } from '../../server/deployedPortfolioStore';

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const diagnostics = getGitHubDiagnostics();
    const store = await getPortfolioStore();
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
    reportApiFailure('status', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Portfolio service failed. Check function logs and database configuration.' }),
    };
  }
};
