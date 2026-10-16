#!/usr/bin/env python3
import json
import os
import re
import secrets
from datetime import date, datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
PUBLIC = ROOT / "public"
DATA_FILE = ROOT / "data" / "reservations.json"
ADMIN_KEY = os.environ.get("EMBER_ADMIN_KEY", "ember-demo-2026")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

DATA_FILE.parent.mkdir(exist_ok=True)
if not DATA_FILE.exists():
    DATA_FILE.write_text("[]", encoding="utf-8")

class EmberHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 20_000:
            raise ValueError("Żądanie jest zbyt duże.")
        return json.loads(self.rfile.read(length) or b"{}")

    def load_reservations(self):
        try:
            return json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []

    def do_GET(self):
        if self.path == "/api/health":
            return self.send_json({"status": "ok"})
        if self.path == "/api/reservations":
            if not secrets.compare_digest(self.headers.get("X-Admin-Key", ""), ADMIN_KEY):
                return self.send_json({"error": "Nieprawidłowy klucz administratora."}, HTTPStatus.UNAUTHORIZED)
            reservations = sorted(self.load_reservations(), key=lambda item: (item["date"], item["time"]))
            return self.send_json(reservations)
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/reservations":
            return self.send_json({"error": "Nie znaleziono endpointu."}, HTTPStatus.NOT_FOUND)
        try:
            data = self.read_json()
            required = ("name", "email", "phone", "date", "time", "guests")
            if any(not str(data.get(field, "")).strip() for field in required):
                raise ValueError("Uzupełnij wszystkie wymagane pola.")
            if len(str(data["name"]).strip()) < 2:
                raise ValueError("Podaj prawidłowe imię i nazwisko.")
            if not EMAIL_RE.match(str(data["email"]).strip()):
                raise ValueError("Podaj prawidłowy adres e-mail.")
            booking_date = date.fromisoformat(str(data["date"]))
            if booking_date < date.today():
                raise ValueError("Data rezerwacji nie może być w przeszłości.")
            guests = int(data["guests"])
            if guests < 1 or guests > 8:
                raise ValueError("Rezerwacja może obejmować od 1 do 8 osób.")
            if data["time"] not in {"17:00", "18:00", "19:00", "20:00", "21:00", "22:00"}:
                raise ValueError("Wybierz dostępną godzinę.")

            reservation = {
                "reference": f"EMB-{datetime.now():%y%m%d}-{secrets.token_hex(2).upper()}",
                "name": str(data["name"]).strip()[:100],
                "email": str(data["email"]).strip()[:150],
                "phone": str(data["phone"]).strip()[:50],
                "date": booking_date.isoformat(),
                "time": data["time"],
                "guests": guests,
                "notes": str(data.get("notes", "")).strip()[:500],
                "created_at": datetime.now().isoformat(timespec="seconds"),
            }
            reservations = self.load_reservations()
            reservations.append(reservation)
            DATA_FILE.write_text(json.dumps(reservations, ensure_ascii=False, indent=2), encoding="utf-8")
            return self.send_json({"ok": True, "reference": reservation["reference"]}, HTTPStatus.CREATED)
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            return self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def log_message(self, format, *args):
        print(f"[EMBER] {self.address_string()} - {format % args}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"EMBER działa na http://localhost:{port}")
    print(f"Panel: http://localhost:{port}/admin.html")
    ThreadingHTTPServer(("0.0.0.0", port), EmberHandler).serve_forever()
