# MediSync Lite

Clinic management web app: patients, appointment booking with a waitlist, medical records and billing, plus a
"Concurrency lab" that shows why booking needs a lock (mutex) to avoid double-booking.

## Run

```
npm install
npm run dev      # http://localhost:3000
npm run build    # production build in dist/
```

Node 20.19+ (or 22.12+) is required.

## How it works

- Data lives in the browser (localStorage). Dashboard > Data can export SQL/JSON or reset the demo data.
- `database.sql` is the MySQL schema + sample data (now including a `waitlist` table); the SQL export matches it.
- Booking runs through a promise-based mutex. In the Concurrency lab, turn the mutex OFF to see several patients win the
  same slot, then use "Repair" on the Appointments page.
- Cancelling a booked slot automatically promotes the first waitlisted patient for that slot.
