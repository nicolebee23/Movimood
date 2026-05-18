import urllib.request

urls = [
    'https://plandecine.com/api/movimood.php?resource=follows&user_id=22222222-2222-2222-2222-222222222222',
    'https://plandecine.com/movimood/api/movimood.php?resource=follows&user_id=22222222-2222-2222-2222-222222222222'
]
for u in urls:
    print('\nGET', u)
    try:
        with urllib.request.urlopen(u, timeout=10) as r:
            print('status', r.status)
            data = r.read().decode('utf-8')
            print(data[:2000])
    except Exception as e:
        print('ERROR', e)
