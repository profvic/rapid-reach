# RapidReach Backend Deployment Guide

This guide explains how to deploy the RapidReach backend to Vercel.

## Deployment Steps

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the backend:
   ```
   vercel
   ```

## Environment Variables

You need to set up the following environment variables in the Vercel dashboard:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `MAPBOX_ACCESS_TOKEN`: Your Mapbox access token
- `AWS_REGION`: AWS region (if using AWS services)
- `AWS_ACCESS_KEY_ID`: AWS access key (if using AWS services)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (if using AWS services)

## Important Notes

- The backend is configured to run on Node.js
- Socket.io is used for real-time communication
- The deployment is configured to use 1024MB of memory and has a maximum execution duration of 10 seconds
- All API routes are directed to the main server.js entry point