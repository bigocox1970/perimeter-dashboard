# Deployment Script Approach

## Current Setup (Recommended)
Keep `customers.json` in `.gitignore` for data safety.

## Deployment Process:
1. Make dashboard changes
2. Push to GitHub (data file stays safe)
3. Netlify deploys new dashboard
4. Manually upload latest `customers.json` to Netlify

## Automated Script (Optional)
Create a deployment script that:
- Backs up current data
- Pushes code changes
- Uploads data file to Netlify via API

## Benefits:
- ✅ Data stays safe from Git overwrites
- ✅ Full control over when data updates
- ✅ Simple file-based approach
- ✅ No external dependencies

## Trade-offs:
- ❌ Manual step required for data updates
- ❌ Need to remember to upload data file
- ❌ Not real-time across devices
