import type { Handler } from './types';
import {
  verifyGitHubSignature,
  fetchRepositoryData,
} from '../../server/githubService';
import {
  syncGitHubProjects,
  handleRepositoryUntagged,
} from '../../server/portfolioStore';

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'sainithinreddy06';

export const handler: Handler = async (event) => {
  const eventName = event.headers['x-github-event'] || event.headers['X-GitHub-Event'];
  const signature = event.headers['x-hub-signature-256'] || event.headers['X-Hub-Signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (secret) {
    const rawBody = event.body || '';
    const isValid = verifyGitHubSignature(rawBody, signature, secret);
    if (!isValid) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid webhook signature.' }),
      };
    }
  }

  if (eventName === 'ping') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Pong! Webhook active.' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const repo = payload.repository;
    if (!repo) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing repository in payload.' }),
      };
    }

    const owner = repo.owner?.login || repo.owner?.name;
    if (owner && owner.toLowerCase() !== GITHUB_USERNAME.toLowerCase()) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ignored: true, reason: 'Owner mismatch' }),
      };
    }

    if (payload.action === 'deleted') {
      handleRepositoryUntagged(repo.id);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, action: 'archived_deleted' }),
      };
    }

    const fullProject = await fetchRepositoryData(owner || GITHUB_USERNAME, repo.name);
    if (!fullProject) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, action: 'skipped' }),
      };
    }

    syncGitHubProjects([fullProject]);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'synchronized',
        project: fullProject.name,
        liveUrl: fullProject.liveUrl,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
