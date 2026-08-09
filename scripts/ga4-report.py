#!/usr/bin/env python3
"""GA4 Data API report fetcher for likorea.com.

Auth: service account JSON at .content-workspace/.ga4-sa.json (JWT -> access token).
Usage:
  python3 scripts/ga4-report.py summary [days]      # users/sessions/pageviews by day
  python3 scripts/ga4-report.py sources [days]      # sessions by source/medium
  python3 scripts/ga4-report.py pages [days]        # users/views per page path
  python3 scripts/ga4-report.py post <postId> [days]  # metrics for one board post
Requires: pyjwt, cryptography (stdlib otherwise). Output: compact JSON to stdout.
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import jwt

PROPERTY_ID = '500298765'
KEY_PATH = Path(__file__).resolve().parent.parent / '.content-workspace' / '.ga4-sa.json'
SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
TOKEN_URL = 'https://oauth2.googleapis.com/token'
API_URL = f'https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport'


def get_access_token():
  sa = json.loads(KEY_PATH.read_text())
  now = int(time.time())
  assertion = jwt.encode(
    {
      'iss': sa['client_email'],
      'scope': SCOPE,
      'aud': TOKEN_URL,
      'iat': now,
      'exp': now + 3600
    },
    sa['private_key'],
    algorithm='RS256'
  )
  body = urllib.parse.urlencode({
    'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion': assertion
  }).encode()
  req = urllib.request.Request(TOKEN_URL, data=body,
                               headers={'Content-Type': 'application/x-www-form-urlencoded'})
  with urllib.request.urlopen(req, timeout=30) as res:
    return json.load(res)['access_token']


def run_report(token, payload):
  req = urllib.request.Request(
    API_URL,
    data=json.dumps(payload).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
  )
  with urllib.request.urlopen(req, timeout=30) as res:
    return json.load(res)


def rows_to_dicts(report):
  dims = [d['name'] for d in report.get('dimensionHeaders', [])]
  mets = [m['name'] for m in report.get('metricHeaders', [])]
  out = []
  for row in report.get('rows', []):
    item = {}
    for i, d in enumerate(dims):
      item[d] = row['dimensionValues'][i]['value']
    for i, m in enumerate(mets):
      item[m] = row['metricValues'][i]['value']
    out.append(item)
  return out


def date_range(days):
  return [{'startDate': f'{days}daysAgo', 'endDate': 'today'}]


def main():
  cmd = sys.argv[1] if len(sys.argv) > 1 else 'summary'
  token = get_access_token()

  if cmd == 'summary':
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    report = run_report(token, {
      'dateRanges': date_range(days),
      'dimensions': [{'name': 'date'}],
      'metrics': [{'name': 'activeUsers'}, {'name': 'sessions'}, {'name': 'eventCount'}],
      'orderBys': [{'dimension': {'dimensionName': 'date'}}]
    })
  elif cmd == 'sources':
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    report = run_report(token, {
      'dateRanges': date_range(days),
      'dimensions': [{'name': 'sessionSourceMedium'}],
      'metrics': [{'name': 'activeUsers'}, {'name': 'sessions'}],
      'orderBys': [{'metric': {'metricName': 'sessions'}, 'desc': True}],
      'limit': 15
    })
  elif cmd == 'pages':
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    report = run_report(token, {
      'dateRanges': date_range(days),
      'dimensions': [{'name': 'pagePath'}],
      'metrics': [{'name': 'activeUsers'}, {'name': 'eventCount'}],
      'orderBys': [{'metric': {'metricName': 'eventCount'}, 'desc': True}],
      'limit': 25
    })
  elif cmd == 'post':
    post_id = sys.argv[2]
    days = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    report = run_report(token, {
      'dateRanges': date_range(days),
      'dimensions': [{'name': 'sessionSourceMedium'}],
      'metrics': [{'name': 'activeUsers'}, {'name': 'eventCount'}],
      'dimensionFilter': {
        'filter': {
          'fieldName': 'pagePath',
          'stringFilter': {'matchType': 'CONTAINS', 'value': f'/boards/{post_id}'}
        }
      }
    })
  else:
    sys.exit(f'unknown command: {cmd}')

  print(json.dumps(rows_to_dicts(report), ensure_ascii=False, indent=1))


if __name__ == '__main__':
  main()
