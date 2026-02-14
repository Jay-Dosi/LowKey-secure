import requests, json, time

BASE = 'http://127.0.0.1:8000'
UNIQ = f'prtest_{int(time.time())}'

print('=== 1. Register student ===')
r = requests.post(f'{BASE}/register', json={
    'username': UNIQ,
    'name': 'Privacy Test Student',
    'email': f'{UNIQ}@test.com',
    'password': 'Test1234!',
    'role': 'student',
    'branch': 'CS'
})
print(r.status_code, r.json())

print()
print('=== 2. Login ===')
r = requests.post(f'{BASE}/login', json={'username': UNIQ, 'password': 'Test1234!'})
print(r.status_code)
token = r.json().get('access_token', '')
headers = {'Authorization': f'Bearer {token}'}

print()
print('=== 3. GET /student/privacy-report (default month, no events) ===')
r = requests.get(f'{BASE}/student/privacy-report', headers=headers)
print(r.status_code)
print(json.dumps(r.json(), indent=2))

print()
print('=== 4. GET /student/privacy-report?month=2026-02 ===')
r = requests.get(f'{BASE}/student/privacy-report?month=2026-02', headers=headers)
print(r.status_code)
print(json.dumps(r.json(), indent=2))

print()
print('=== 5. GET /student/privacy-report?month=bad-format ===')
r = requests.get(f'{BASE}/student/privacy-report?month=bad-format', headers=headers)
print(r.status_code)
print(json.dumps(r.json(), indent=2))

print()
print('=== ALL TESTS DONE ===')
