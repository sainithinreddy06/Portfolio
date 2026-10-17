export default async () => Response.json({ success: false, error: 'API route not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
