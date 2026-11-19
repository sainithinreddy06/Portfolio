import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';

const app = express();

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // OWASP-recommended security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // HSTS (HTTP Strict Transport Security) - enable in production only
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // X-Frame-Options - prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Content-Security-Policy if configured via env
  if (process.env.CSP_HEADER_VALUE) {
    res.setHeader('Content-Security-Policy', process.env.CSP_HEADER_VALUE);
  }

  next();
});

// JSON body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import './services/apiResponse';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

export { app };