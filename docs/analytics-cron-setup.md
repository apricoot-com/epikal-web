# Analytics Cron Job Setup

## Overview

The analytics system includes a daily aggregation job that processes raw `AnalyticsEvent` records into `DailyStats` summaries.

## Endpoint

```
GET /api/cron/aggregate-analytics
```

**Authentication:** Requires `Authorization: Bearer <CRON_SECRET>` header

## What It Does

1. **Aggregates Events**: Processes yesterday's analytics events for all companies
2. **Calculates Metrics**:
   - Total page views
   - Unique visitors
   - Top 5 services by views
   - Top 5 traffic sources (UTM)
3. **Cleans Up**: Deletes events older than 90 days (configurable)

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

1. Create `vercel.json` in project root:

```json
{
  "crons": [{
    "path": "/api/cron/aggregate-analytics",
    "schedule": "0 2 * * *"
  }]
}
```

2. Set environment variable in Vercel dashboard:
   - `CRON_SECRET`: Generate a secure random string

### Option 2: GitHub Actions

1. Create `.github/workflows/analytics-cron.yml`:

```yaml
name: Analytics Aggregation

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  aggregate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Aggregation
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/aggregate-analytics
```

2. Add `CRON_SECRET` to GitHub repository secrets

### Option 3: External Cron Service (cron-job.org, EasyCron, etc.)

1. Configure a daily job at 2:00 AM
2. Set URL: `https://your-domain.com/api/cron/aggregate-analytics`
3. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

## Environment Variables

```env
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Manual Execution

For testing or manual aggregation:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/aggregate-analytics
```

## Response Format

```json
{
  "success": true,
  "aggregation": {
    "success": true,
    "date": "2024-01-20T00:00:00.000Z",
    "companiesProcessed": 5,
    "companiesTotal": 5
  },
  "cleanup": {
    "success": true,
    "deletedCount": 1234
  },
  "timestamp": "2024-01-21T02:00:00.000Z"
}
```

## Monitoring

Check logs for:
- `[Analytics Aggregator]` - Aggregation progress
- `[Analytics Cleanup]` - Old event deletion
- `[Cron]` - Endpoint access and errors

## Troubleshooting

**401 Unauthorized**: Check that `CRON_SECRET` matches in both environment and request

**500 Error**: Check application logs for specific error messages

**No data**: Ensure there are analytics events from the previous day
