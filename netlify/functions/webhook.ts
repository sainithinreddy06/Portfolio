import { reportApiFailure } from '../../server/apiErrors';
import { env } from '../../server/runtimeEnv';
import type { Handler } from './types';
import {
  verifyGitHubSignature,
  fetchRepositoryData,
} from '../../server/githubService';
import {
  syncGitHubProjects,
  handleRepositoryUntagged,
} from '../../server/deployedPortfolioStore';


export const handler: Handler = async (event) => {
  const GITHUB_USERNAME = env('GITHUB_USERNAME') || 'sainithinreddy06';

  const eventName = event.headers['x-github-event'] || event.headers['X-GitHub-Event'];
  const signature = event.headers['x-hub-signature-256'] || event.headers['X-Hub-Signature-256'];
  const secret = env('GITHUB_WEBHOOK_SECRET');

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
      await handleRepositoryUntagged(repo.id);
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

    await syncGitHubProjects([fullProject]);
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
    reportApiFailure('webhook', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Portfolio service failed. Check function logs and database configuration.' }),
    };
  }
};
