# AI Assessment Setup Guide

## Prerequisites

To use the AI Assessment feature, you need to set up your OpenAI API key.

## Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (it starts with `sk-`)

## Step 2: Configure Environment Variables

Create a `.env` file in your project root with the following content:

```env
# OpenAI API Configuration
VITE_OPENAI_API_KEY=sk-your_actual_api_key_here

# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Step 3: Restart Development Server

After adding the environment variables, restart your development server:

```bash
npm run dev
```

## Step 4: Test AI Assessment

1. Go to the AI Assessment page
2. Enter symptoms or upload photos
3. Click "Get AI Assessment"
4. You should now see real AI analysis results

## Features Now Available

- **Real AI Analysis**: Uses GPT-4 to analyze symptoms and provide medical triage
- **Photo Analysis**: Analyzes uploaded medical photos (requires Google Cloud API key)
- **Confidence Scoring**: Shows AI confidence level in the assessment
- **Detailed Recommendations**: Provides specific medical recommendations
- **Risk Factor Analysis**: Identifies potential risk factors
- **Professional Medical Guidance**: AI-powered medical assessment

## Troubleshooting

### "OpenAI API key not configured" Error
- Make sure you have created a `.env` file
- Ensure the API key is correct and starts with `sk-`
- Restart the development server after adding the environment variable

### "API rate limit exceeded" Error
- You may have hit your OpenAI API usage limits
- Check your OpenAI account dashboard for usage
- Wait a few minutes and try again

### "Network error" Error
- Check your internet connection
- Ensure you can access https://api.openai.com
- Try again in a few minutes

## Cost Considerations

- OpenAI API calls cost money based on usage
- GPT-4 is more expensive than GPT-3.5
- Monitor your usage in the OpenAI dashboard
- Consider setting up usage limits in your OpenAI account

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure
- Consider using environment variables in production
- Monitor API usage for unexpected charges

## Optional: Google Cloud Vision API

For photo analysis features, you can also set up Google Cloud Vision API:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Vision API
3. Create an API key
4. Add `VITE_GOOGLE_CLOUD_API_KEY=your_google_api_key` to your `.env` file

This enables AI analysis of uploaded medical photos. 