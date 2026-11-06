import { randomUUID } from 'node:crypto';

export type Slot = {
  id: string;
  title: string;
  startsAt: string;
  capacity: number;
};

export type Booking = {
  id: string;
  slotId: string;
  email: string;
  requestId: string;
  createdAt: string;
};

export type BookingInput = Pick<Booking, 'slotId' | 'email' | 'requestId'>;
export type BookingErrorCode =
  | 'SLOT_NOT_FOUND'
  | 'SLOT_FULL'
  | 'ALREADY_BOOKED'
  | 'REQUEST_ID_REUSED';

const messages: Record<BookingErrorCode, string> = {
  SLOT_NOT_FOUND: 'That session does not exist.',
  SLOT_FULL: 'This session is fully booked.',
  ALREADY_BOOKED: 'This email already has a reservation for this session.',
  REQUEST_ID_REUSED: 'This request ID belongs to a different reservation.',
};

export class BookingError extends Error {
  constructor(public readonly code: BookingErrorCode) {
    super(messages[code]);
    this.name = 'BookingError';
  }
}

export class BookingStore {
  private readonly bookings: Booking[] = [];

  constructor(
    private readonly slots: readonly Slot[],
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {
    if (slots.some((slot) => !Number.isInteger(slot.capacity) || slot.capacity < 1)) {
      throw new Error('Each session must have a positive integer capacity.');
    }
    if (new Set(slots.map((slot) => slot.id)).size !== slots.length) {
      throw new Error('Session IDs must be unique.');
    }
  }

  reset() {
    this.bookings.length = 0;
  }

  listSlots() {
    return this.slots.map((slot) => ({
      ...slot,
      remaining: slot.capacity - this.bookings.filter((booking) => booking.slotId === slot.id).length,
    }));
  }

  reserve(input: BookingInput): { booking: Booking; replayed: boolean } {
    const email = input.email.trim().toLowerCase();

    // Check idempotency first: a network retry must not consume another seat.
    const previous = this.bookings.find((booking) => booking.requestId === input.requestId);
    if (previous) {
      if (previous.slotId === input.slotId && previous.email === email) {
        return { booking: previous, replayed: true };
      }
      throw new BookingError('REQUEST_ID_REUSED');
    }

    const slot = this.slots.find((candidate) => candidate.id === input.slotId);
    if (!slot) throw new BookingError('SLOT_NOT_FOUND');

    if (this.bookings.some((booking) => booking.slotId === slot.id && booking.email === email)) {
      throw new BookingError('ALREADY_BOOKED');
    }

    const reserved = this.bookings.filter((booking) => booking.slotId === slot.id).length;
    if (reserved >= slot.capacity) throw new BookingError('SLOT_FULL');

    const booking: Booking = {
      id: this.createId(),
      slotId: slot.id,
      email,
      requestId: input.requestId,
      createdAt: this.now().toISOString(),
    };

    // No await between the capacity check and write in this single-process demo.
    this.bookings.push(booking);
    return { booking, replayed: false };
  }
}
