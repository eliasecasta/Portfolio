import { describe, expect, it } from 'vitest';
import { BookingError, BookingStore, type Slot } from './bookingStore';

const slots: Slot[] = [
  { id: 'a', title: 'Session A', startsAt: '2030-01-01T18:00:00.000Z', capacity: 2 },
  { id: 'b', title: 'Session B', startsAt: '2030-01-02T18:00:00.000Z', capacity: 1 },
];

function makeStore() {
  let sequence = 0;
  return new BookingStore(
    slots,
    () => 'booking-' + ++sequence,
    () => new Date('2030-01-01T12:00:00.000Z'),
  );
}

describe('BookingStore', () => {
  it('reserves one seat and updates remaining capacity', () => {
    const store = makeStore();
    const result = store.reserve({ slotId: 'a', email: ' USER@EXAMPLE.COM ', requestId: 'request-1' });

    expect(result).toMatchObject({
      replayed: false,
      booking: { id: 'booking-1', email: 'user@example.com', createdAt: '2030-01-01T12:00:00.000Z' },
    });
    expect(store.listSlots().find((slot) => slot.id === 'a')?.remaining).toBe(1);
  });

  it('replays an identical request without consuming another seat', () => {
    const store = makeStore();
    const input = { slotId: 'a', email: 'user@example.com', requestId: 'request-1' };
    const first = store.reserve(input);
    const replay = store.reserve({ ...input, email: 'USER@EXAMPLE.COM' });

    expect(replay).toEqual({ booking: first.booking, replayed: true });
    expect(store.listSlots()[0].remaining).toBe(1);
  });

  it('rejects reusing a request ID for a different booking', () => {
    const store = makeStore();
    store.reserve({ slotId: 'a', email: 'a@example.com', requestId: 'request-1' });

    expect(() => store.reserve({ slotId: 'b', email: 'a@example.com', requestId: 'request-1' }))
      .toThrowError(new BookingError('REQUEST_ID_REUSED'));
  });

  it('prevents a duplicate reservation for the same email and session', () => {
    const store = makeStore();
    store.reserve({ slotId: 'a', email: 'a@example.com', requestId: 'request-1' });

    expect(() => store.reserve({ slotId: 'a', email: 'A@example.com', requestId: 'request-2' }))
      .toThrowError(new BookingError('ALREADY_BOOKED'));
  });

  it('rejects a booking when capacity is exhausted', () => {
    const store = makeStore();
    store.reserve({ slotId: 'b', email: 'a@example.com', requestId: 'request-1' });

    expect(() => store.reserve({ slotId: 'b', email: 'b@example.com', requestId: 'request-2' }))
      .toThrowError(new BookingError('SLOT_FULL'));
  });

  it('rejects an unknown session without modifying state', () => {
    const store = makeStore();
    expect(() => store.reserve({ slotId: 'missing', email: 'a@example.com', requestId: 'request-1' }))
      .toThrowError(new BookingError('SLOT_NOT_FOUND'));
    expect(store.listSlots()[0].remaining).toBe(2);
  });

  it('allows the same email to reserve different sessions', () => {
    const store = makeStore();
    store.reserve({ slotId: 'a', email: 'a@example.com', requestId: 'request-1' });
    store.reserve({ slotId: 'b', email: 'a@example.com', requestId: 'request-2' });
    expect(store.listSlots().map((slot) => slot.remaining)).toEqual([1, 0]);
  });

  it('validates the session configuration on startup', () => {
    expect(() => new BookingStore([{ ...slots[0], capacity: 0 }])).toThrow('positive integer');
    expect(() => new BookingStore([slots[0], slots[0]])).toThrow('unique');
  });
});
