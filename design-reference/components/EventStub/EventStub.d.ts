import * as React from 'react';

export interface EventStubEvent {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  tags?: string[];
  gradient?: string;
  /** Ticket price in whole dollars. 0 / undefined renders as "Free". */
  price?: number;
  /** ISO start timestamp — drives the countdown in the utility column. */
  startISO?: string;
  /** Distance from the user, in miles (photo variant only). */
  mi?: number;
  saved?: boolean;
  going?: boolean;
  rsvps?: number;
}

export interface EventStubProps {
  /** The event to render. */
  event: EventStubEvent;
  /** "photo" for Explore/discovery, "compact" for Saved/logistics. */
  variant?: 'photo' | 'compact';
  onTap?: () => void;
  onSave?: (event: EventStubEvent) => void;
  onShare?: (event: EventStubEvent) => void;
}

export interface Countdown {
  value: string;
  label: string;
  sub: string;
  urgent?: boolean;
  live?: boolean;
}

/** Derive the live countdown shown in the utility column. */
export declare function eventCountdown(startISO?: string): Countdown;

/** Sparked's universal ticket-stub event card. */
export declare const EventStub: React.FC<EventStubProps>;

export default EventStub;
