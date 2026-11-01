import { useEffect, useState } from 'react';

type Slot = {
  id: string;
  title: string;
  startsAt: string;
  capacity: number;
  remaining: number;
};

type Feedback = { kind: 'success' | 'error'; text: string };

async function getSlots(): Promise<Slot[]> {
  const response = await fetch('/api/slots');
  if (!response.ok) throw new Error('Could not load sessions. Is the API running?');
  const payload = (await response.json()) as { slots: Slot[] };
  return payload.slots;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export default function App() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [email, setEmail] = useState('');
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;
    getSlots()
      .then((result) => { if (active) setSlots(result); })
      .catch((error: unknown) => {
        if (active) setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Unexpected error.' });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function reserve(slotId: string) {
    if (busySlot || !email.trim()) return;
    setBusySlot(slotId);
    setFeedback(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slotId, email: email.trim(), requestId: crypto.randomUUID() }),
      });
      const payload = (await response.json()) as { error?: { message: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? 'Booking failed.');

      setSlots(await getSlots());
      setFeedback({ kind: 'success', text: 'Seat reserved! This is a demo; no confirmation email is sent.' });
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Unexpected error.' });
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div className="eyebrow"><span className="pulse" /> FULL-STACK CODE SAMPLE</div>
        <h1>Mini<span>Booker</span></h1>
        <p className="subtitle">Small interface. Real booking rules. Clear engineering trade-offs.</p>
        <div className="tags"><span>React + TypeScript</span><span>Node.js API</span><span>Tests + Idempotency</span></div>
      </header>

      <section className="panel" aria-labelledby="sessions-title">
        <div className="section-header">
          <div><p className="section-kicker">AVAILABLE SESSIONS</p><h2 id="sessions-title">Choose a session</h2></div>
          <span className="demo-badge">DEMO DATA</span>
        </div>

        <label className="field-label" htmlFor="email">Email for your reservation</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="email-field"
        />

        {feedback && (
          <p className={'notice ' + feedback.kind} role={feedback.kind === 'error' ? 'alert' : 'status'}>
            {feedback.text}
          </p>
        )}

        {loading ? <p className="empty">Loading sessions…</p> : (
          <div className="sessions">
            {slots.map((slot) => (
              <article className="session" key={slot.id}>
                <div className="session-details">
                  <h3>{slot.title}</h3>
                  <p>{formatDate(slot.startsAt)}</p>
                  <span className={slot.remaining === 0 ? 'capacity full' : 'capacity'}>
                    {slot.remaining === 0 ? 'Fully booked' : slot.remaining + ' / ' + slot.capacity + ' seats available'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={slot.remaining === 0 || busySlot !== null || !email.trim()}
                  onClick={() => void reserve(slot.id)}
                >
                  {busySlot === slot.id ? 'Booking…' : 'Reserve seat'} <span aria-hidden="true">↗</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <p>Original portfolio sample · In-memory demo · No payments or real emails</p>
        <p>Built with AI assistance, reviewed through explicit rules and tests.</p>
      </footer>
    </main>
  );
}
