-- Counter sales may belong to a walk-in customer who has no CineTicket account.
ALTER TABLE bookings MODIFY COLUMN user_id BIGINT NULL;
