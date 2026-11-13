package ticket2.controller;

import ticket2.dto.HoldRequest;
import ticket2.entity.*;
import ticket2.repository.*;
import ticket2.service.SeatPricing;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/bookings")
class BookingController {

    private final UserRepository users;
    private final ShowtimeRepository showtimes;
    private final SeatRepository seats;
    private final BookingRepository bookings;
    private final BookingSeatRepository bookingSeats;
    private final PaymentRepository payments;

    BookingController(UserRepository users,
                      ShowtimeRepository showtimes,
                      SeatRepository seats,
                      BookingRepository bookings,
                      BookingSeatRepository bookingSeats,
                      PaymentRepository payments) {
        this.users = users;
        this.showtimes = showtimes;
        this.seats = seats;
        this.bookings = bookings;
        this.bookingSeats = bookingSeats;
        this.payments = payments;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> hold(@Valid @RequestBody HoldRequest request, Authentication auth) {
        User user = current(auth);
        Showtime showtime = showtimes.lockById(request.showtimeId())
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "SHOWTIME_NOT_FOUND"));

        LocalDateTime now = LocalDateTime.now();
        if (showtime.status == ShowtimeStatus.CANCELLED || !showtime.startAt.isAfter(now)
                || !showtime.endAt.isAfter(showtime.startAt)) {
            throw error(HttpStatus.CONFLICT, "SHOWTIME_NOT_BOOKABLE");
        }

        List<Long> ids = request.seatIds().stream().distinct().toList();
        if (ids.size() != request.seatIds().size()) {
            throw error(HttpStatus.BAD_REQUEST, "DUPLICATE_SEAT");
        }

        List<Seat> selected = seats.findAllById(ids);
        if (selected.size() != ids.size() || selected.stream().anyMatch(seat -> !seat.active || !seat.room.id.equals(showtime.room.id))) {
            throw error(HttpStatus.BAD_REQUEST, "INVALID_SEAT");
        }

        List<Long> unavailable = new ArrayList<>();
        List<BookingSeat> existingSeats = bookingSeats.findByShowtimeId(showtime.id);
        for (Seat seat : selected) {
            for (BookingSeat existing : existingSeats) {
                if (existing.seat.id.equals(seat.id) && existing.holdStatus != HoldStatus.RELEASED
                        && (existing.holdStatus == HoldStatus.SOLD || existing.holdExpiresAt.isAfter(now))) {
                    unavailable.add(seat.id);
                }
            }
        }
        if (!unavailable.isEmpty()) {
            throw error(HttpStatus.CONFLICT, "SEAT_UNAVAILABLE:" + unavailable);
        }

        Booking booking = new Booking();
        booking.user = user;
        booking.showtime = showtime;
        booking.status = BookingStatus.PENDING;
        booking.holdExpiresAt = now.plusMinutes(10);
        booking.totalAmount = selected.stream()
                .map(seat -> SeatPricing.price(showtime, seat))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        bookings.save(booking);

        for (Seat seat : selected) {
            BookingSeat detail = new BookingSeat();
            detail.booking = booking;
            detail.showtime = showtime;
            detail.seat = seat;
            detail.unitPrice = SeatPricing.price(showtime, seat);
            detail.holdExpiresAt = booking.holdExpiresAt;
            bookingSeats.save(detail);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", booking.id,
                "status", booking.status,
                "totalAmount", booking.totalAmount,
                "holdExpiresAt", booking.holdExpiresAt,
                "seatIds", ids
        ));
    }

    @GetMapping
    public List<Map<String, Object>> mine(Authentication auth) {
        return bookings.findByUserIdOrderByCreatedAtDesc(current(auth).id).stream()
                .map(this::view)
                .toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id, Authentication auth) {
        return view(own(id, current(auth)));
    }

    @PostMapping("/{id}/cancel")
    @Transactional
    public Map<String, Object> cancel(@PathVariable Long id, Authentication auth) {
        User user = current(auth);
        Booking booking = bookings.lockByIdAndUserId(id, user.id)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND"));

        if (booking.status != BookingStatus.PENDING) {
            throw error(HttpStatus.CONFLICT, "BOOKING_NOT_CANCELLABLE");
        }

        booking.status = BookingStatus.CANCELLED;
        bookingSeats.findByBookingId(id).forEach(seat -> seat.holdStatus = HoldStatus.RELEASED);
        bookings.save(booking);

        return Map.of("id", id, "status", booking.status);
    }

    private Map<String, Object> view(Booking booking) {
        Showtime showtime = booking.showtime;

        List<Map<String, Object>> seatRows = bookingSeats.findByBookingId(booking.id).stream()
                .map(seat -> Map.<String, Object>of(
                        "seatId", seat.seat.id,
                        "rowLabel", seat.seat.rowLabel,
                        "seatNumber", seat.seat.seatNumber,
                        "unitPrice", seat.unitPrice,
                        "holdStatus", seat.holdStatus
                )).toList();

        // Optimized: Query only payments for this booking, not findAll()
        List<Map<String, Object>> paymentRows = payments.findByBookingId(booking.id).stream()
                .map(p -> Map.<String, Object>of(
                        "id", p.id,
                        "method", Objects.toString(p.method, ""),
                        "amount", p.amount,
                        "status", p.status,
                        "transactionRef", Objects.toString(p.transactionRef, ""),
                        "paidAt", Objects.toString(p.paidAt, "")
                )).toList();

        return Map.of(
                "id", booking.id,
                "status", booking.status,
                "totalAmount", booking.totalAmount,
                "holdExpiresAt", booking.holdExpiresAt,
                "createdAt", booking.createdAt,
                "showtime", Map.of(
                        "id", showtime.id,
                        "startAt", showtime.startAt,
                        "endAt", showtime.endAt,
                        "movie", Map.of(
                                "id", showtime.movie.id,
                                "title", showtime.movie.title,
                                "posterUrl", Objects.toString(showtime.movie.posterUrl, "")
                        ),
                        "cinema", Map.of("id", showtime.room.cinema.id, "name", showtime.room.cinema.name),
                        "room", Map.of("id", showtime.room.id, "name", showtime.room.name)
                ),
                "seats", seatRows,
                "payments", paymentRows
        );
    }

    private User current(Authentication auth) {
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));
    }

    private Booking own(Long id, User user) {
        return bookings.findByIdAndUserId(id, user.id)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND"));
    }

    private ResponseStatusException error(HttpStatus status, String code) {
        return new ResponseStatusException(status, code);
    }
}
