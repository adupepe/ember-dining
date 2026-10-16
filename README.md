# EMBER

Kompletna strona restauracji z responsywnym frontendem, formularzem rezerwacji, API i panelem administracyjnym.

## Uruchomienie

Wymagany jest Python 3, bez dodatkowych bibliotek.

```bash
python server.py
```

Otwórz:

- Strona: http://localhost:8000
- Panel rezerwacji: http://localhost:8000/admin.html

Domyślny klucz panelu demonstracyjnego to `ember-demo-2026`.

Własny klucz ustaw przed uruchomieniem:

```bash
EMBER_ADMIN_KEY="twoj-bezpieczny-klucz" python server.py
```

Rezerwacje są zapisywane lokalnie w `data/reservations.json`. Plik jest ignorowany przez Git, aby dane klientów nie trafiły do repozytorium.

## Struktura

- `public/` — frontend strony i panel administracyjny
- `server.py` — serwer statyczny i API rezerwacji
- `data/` — lokalne dane rezerwacji
