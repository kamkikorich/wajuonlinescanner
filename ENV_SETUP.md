# Environment Setup Guide

## Server Environment Variables

Copy the `.env.example` file to create your local environment configuration:

```bash
cp server/.env.example server/.env.local
```

### Required Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | `5000` |
| `DEEPSEEK_API_KEY` | Your DeepSeek API key (get from [DeepSeek Platform](https://platform.deepseek.com/)) | Required |
| `MAX_FILE_SIZE` | Maximum file upload size in bytes | `5242880` (5MB) |
| `UPLOAD_DIR` | Directory for temporary file uploads | `uploads/` |
| `NODE_ENV` | Node environment (development/production) | `development` |
| `CORS_ORIGIN` | Frontend URL for CORS configuration | `http://localhost:5173` |
| `TESSERACT_LANG` | OCR language code | `eng` |
| `TESSERACT_PSM` | Tesseract Page Segmentation Mode | `3` |

### Getting DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up for an account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your `.env.local` file

### Security Notes

- **Never commit** your `.env.local` file to version control
- The `.env.local` file is already included in `.gitignore`
- Always use environment variables for sensitive data like API keys
- In production, use proper secret management services

### Local Development

For local development, you can use the default values provided in `.env.example`. Just make sure to:

1. Copy `.env.example` to `.env.local`
2. Add your DeepSeek API key
3. Start the development servers using `start.bat`