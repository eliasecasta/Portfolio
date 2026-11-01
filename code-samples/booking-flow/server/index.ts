import { createApp } from './app';
import { BookingStore, type Slot } from './bookingStore';

function nextSession(daysAhead: number, hourUTC: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  date.setUTCHours(hourUTC, 0, 0, 0);
  return date.toISOString();
}

const slots: Slot[] = [
  { id: 'design-systems', title: 'Design Systems Workshop', startsAt: nextSession(2, 18), capacity: 4 },
  { id: 'typescript-clinic', title: 'TypeScript Clinic', startsAt: nextSession(3, 17), capacity: 3 },
  { id: 'product-lab', title: 'Product Engineering Lab', startsAt: nextSession(5, 19), capacity: 5 },
];

const store = new BookingStore(slots);
const port = Number(process.env.PORT ?? 3001);
createApp(store).listen(port, '127.0.0.1', () => {
  console.log('MiniBooker API listening on http://127.0.0.1:' + port);
});
