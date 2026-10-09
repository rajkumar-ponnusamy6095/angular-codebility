const fs = require('fs');
const path = require('path');

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL environment variable is required');
}

const parsedUrl = new URL(apiBaseUrl);

if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
  throw new Error('API_BASE_URL must use HTTP or HTTPS');
}

const content = `export const environment = {
  production: true,
  apiBaseUrl: ${JSON.stringify(apiBaseUrl.replace(/\/+$/, ''))},
};
`;

const outputPath = path.join(
  process.cwd(),
  'src',
  'environments',
  'environment.ts'
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);

console.log('Angular environment generated successfully.');