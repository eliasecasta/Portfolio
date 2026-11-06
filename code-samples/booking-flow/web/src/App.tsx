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

function formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
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

  async function resetDemo() {
    setFeedback(null);
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (!response.ok) throw new Error('Could not reset the demo.');
      setSlots(await getSlots());
      setFeedback({ kind: 'success', text: 'Demo reservations cleared.' });
    } catch {
      setFeedback({ kind: 'error', text: 'Could not reset the demo.' });
    }
  }

  return (
    <div className="app">
      <header className="site-header">
        <a className="brand" href="/" aria-label="MiniBooker home"><span className="brand-mark" aria-hidden="true">m.</span> minibooker<span className="brand-dot">.</span></a>
        <div className="header-right"><span className="header-label">A booking experiment</span><a className="source-link" href="https://github.com/eliasecasta/Portfolio/tree/gh-pages/code-samples/booking-flow">View source <span aria-hidden="true">↗</span></a></div>
      </header>

      <main className="shell">
        <div className="intro">
          <div><p className="eyebrow"><span className="status-dot" /> THE MINI SESSIONS <span className="eyebrow-muted"> / &nbsp; DEMO 01</span></p>
            <h1>Good ideas<br /><span>start here.</span></h1>
            <p className="intro-copy">A little space to explore big ideas. Pick a session, save a seat, and see how a booking flow comes together.</p>
          </div>
          <div className="intro-note"><span className="note-number">01 / 03</span><p>Made for curious<br />minds &amp; makers.</p><span className="note-arrow" aria-hidden="true">↘</span></div>
        </div>

        <div className="booking-layout">
          <section className="schedule" aria-labelledby="sessions-title">
            <div className="section-header"><div><p className="section-kicker">THE SCHEDULE</p><h2 id="sessions-title">Find your session<span className="heading-dot">.</span></h2></div><span className="session-count">{loading ? '—' : String(slots.length).padStart(2, '0')} SESSIONS</span></div>
            {feedback && <p className={'notice ' + feedback.kind} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
            <div className="list-heading" aria-hidden="true"><span>DATE</span><span>SESSION DETAILS</span><span>AVAILABILITY</span></div>
            {loading ? <p className="empty">Loading sessions…</p> : slots.length === 0 ? <p className="empty">No sessions available right now.</p> : (
              <div className="sessions">
                {slots.map((slot) => (
                  <article className="session" key={slot.id}>
                    <div className="date-block"><span>{formatDate(slot.startsAt, { month: 'short' })}</span><strong>{formatDate(slot.startsAt, { day: '2-digit' })}</strong><span>{formatDate(slot.startsAt, { weekday: 'short' })}</span></div>
                    <div className="session-details"><p className="session-category">ONLINE SESSION</p><h3>{slot.title}</h3><p className="session-time">{formatDate(slot.startsAt, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })} <span>·</span> Online</p></div>
                    <div className="session-action"><span className={slot.remaining === 0 ? 'capacity full' : 'capacity'}><span className="capacity-dot" />{slot.remaining === 0 ? 'Fully booked' : slot.remaining + ' of ' + slot.capacity + ' spots left'}</span>
                      <button className="reserve-button" type="button" disabled={slot.remaining === 0 || busySlot !== null || !email.trim()} onClick={() => void reserve(slot.id)} aria-label={'Reserve a seat for ' + slot.title}>
                        {busySlot === slot.id ? 'Booking…' : 'Reserve'} <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="booking-panel" aria-labelledby="booking-title">
            <div className="panel-top"><span className="panel-icon" aria-hidden="true">✳</span><span className="panel-index">YOUR DETAILS / 01</span></div>
            <h2 id="booking-title">Let's get you a seat.</h2>
            <p className="panel-copy">Enter a sample email, then choose a session from the schedule.</p>
            <label className="field-label" htmlFor="email">Email address</label>
            <input id="email" type="email" required autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sample@example.com" className="email-field" aria-describedby="email-hint" />
            <p className="input-hint" id="email-hint">Please don't use personal information.</p>
            <div className="demo-info"><span className="demo-indicator" aria-hidden="true" /><div><strong>Just a demo, by design.</strong><p>Sessions are fictional. No real reservations, payments, or confirmation emails. Data is temporary and shared.</p></div></div>
            <button className="reset-button" type="button" disabled={busySlot !== null} onClick={() => void resetDemo()}>Reset demo data <span aria-hidden="true">↻</span></button>
          </aside>
        </div>
      </main>
      <footer className="site-footer"><span>MINIBOOKER <span className="footer-dot">●</span> AN INTERACTIVE CODE SAMPLE</span><span>Designed to be explored. Built to be understood.</span><a href="https://github.com/eliasecasta/Portfolio/tree/gh-pages/code-samples/booking-flow">VIEW THE CODE ↗</a></footer>
    </div>
  );
}
