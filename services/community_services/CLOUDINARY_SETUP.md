# Cloudinary Setup Guide

This project uses Cloudinary for image and file uploads. Follow these steps to set up Cloudinary:

## 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account (or log in if you already have one)
3. Once logged in, you'll be taken to your dashboard

## 2. Get Your Cloudinary Credentials

From your Cloudinary dashboard:

1. Click on the **Dashboard** link (or go to https://console.cloudinary.com/)
2. You'll see your account details including:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## 3. Add Environment Variables

Add the following environment variables to your `.env.dev` (or `.env` file):

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Example:**
```bash
CLOUDINARY_CLOUD_NAME=shivalik-community
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## 4. Restart Your Server

After adding the environment variables, restart your backend server:

```bash
npm run start:dev
```

## 5. Verify Setup

Once your server is running, try uploading an image through any form (community, event, marketplace, pulse). You should see logs like:

```
☁️  Uploading banner image to Cloudinary...
✅ Banner image uploaded to Cloudinary successfully!
   Cloudinary URL: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/communities/banners/...
```

## Cloudinary Folder Structure

Images are organized in Cloudinary with the following folder structure:

- **Community Banners**: `communities/banners/`
- **Events**: `communities/events/`
- **Marketplace Listings**: `communities/marketplace/`
- **Pulses**: `communities/pulses/`
- **Common Uploads**: `{root}/{fileType}/` (e.g., `users/profile/`)

## Features

- ✅ Automatic image optimization (quality: auto, format: auto)
- ✅ Secure HTTPS URLs
- ✅ Unique filenames to prevent conflicts
- ✅ Organized folder structure
- ✅ Support for multiple file uploads
- ✅ Error handling and logging

## Troubleshooting

### Error: "Invalid API Key"
- Double-check your `CLOUDINARY_API_KEY` in the `.env` file
- Make sure there are no extra spaces or quotes

### Error: "Invalid API Secret"
- Double-check your `CLOUDINARY_API_SECRET` in the `.env` file
- Make sure there are no extra spaces or quotes

### Error: "Cloud name not found"
- Verify your `CLOUDINARY_CLOUD_NAME` matches exactly what's shown in your Cloudinary dashboard
- Cloud names are case-sensitive

### Images not uploading
- Check your server console for error messages
- Verify your internet connection
- Check Cloudinary dashboard for any account limits or issues

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 monthly transformations

For production use, consider upgrading to a paid plan.

