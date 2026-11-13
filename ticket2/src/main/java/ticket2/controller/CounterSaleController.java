package ticket2.controller;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ticket2.dto.CounterSaleRequest;
import ticket2.entity.*;
import ticket2.repository.*;
import ticket2.service.SeatPricing;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/admin/counter-sales")
class CounterSaleController {
    private final UserRepository users;
    private final ShowtimeRepository showtimes;
    private final SeatRepository seats;
    private final BookingRepository bookings;
    private final BookingSeatRepository bookingSeats;
    private final PaymentRepository payments;
    private final TicketRepository tickets;

    CounterSaleController(UserRepository users, ShowtimeRepository showtimes, SeatRepository seats,
                          BookingRepository bookings, BookingSeatRepository bookingSeats,
                          PaymentRepository payments, TicketRepository tickets) {
        this.users = users;
        this.showtimes = showtimes;
        this.seats = seats;
        this.bookings = bookings;
        this.bookingSeats = bookingSeats;
        this.payments = payments;
        this.tickets = tickets;
    }

    @PostMapping
    @Transactional
    ResponseEntity<Map<String, Object>> sell(@Valid @RequestBody CounterSaleRequest request,
                                             Authentication auth) {
        User staff = users.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));
        if (!Set.of("ADMIN", "MANAGER", "STAFF").contains(staff.role.name())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COUNTER_SALE_FORBIDDEN");
        }
        String method = request.paymentMethod().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("CASH", "CARD").contains(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_COUNTER_PAYMENT_METHOD");
        }

        List<Long> seatIds = request.seatIds().stream().distinct().toList();
        if (seatIds.size() != request.seatIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DUPLICATE_SEAT");
        }

        Showtime showtime = showtimes.lockById(request.showtimeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SHOWTIME_NOT_FOUND"));
        LocalDateTime now = LocalDateTime.now();
        if (showtime.status == ShowtimeStatus.CANCELLED || !showtime.startAt.isAfter(now)
                || !showtime.endAt.isAfter(showtime.startAt)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SHOWTIME_NOT_BOOKABLE");
        }

        List<Seat> selected = seats.findAllById(seatIds);
        if (selected.size() != seatIds.size()
                || selected.stream().anyMatch(seat -> !seat.active || !seat.room.id.equals(showtime.room.id))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_SEAT");
        }

        List<BookingSeat> existingSeats = bookingSeats.findByShowtimeId(showtime.id);
        List<Long> unavailable = selected.stream()
                .filter(seat -> existingSeats.stream().anyMatch(existing -> existing.seat.id.equals(seat.id)
                        && existing.holdStatus != HoldStatus.RELEASED
                        && (existing.holdStatus == HoldStatus.SOLD || existing.holdExpiresAt.isAfter(now))))
                .map(seat -> seat.id)
                .toList();
        if (!unavailable.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SEAT_UNAVAILABLE:" + unavailable);
        }

        Booking booking = new Booking();
        booking.user = null;
        booking.soldBy = staff;
        booking.customerName = request.customerName().trim();
        booking.customerEmail = blankToNull(request.customerEmail());
        booking.customerPhone = blankToNull(request.customerPhone());
        booking.showtime = showtime;
        booking.status = BookingStatus.PAID;
        booking.holdExpiresAt = now.plusMinutes(10);
        booking.totalAmount = selected.stream().map(seat -> SeatPricing.price(showtime, seat))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        bookings.save(booking);

        List<Map<String, Object>> issuedTickets = new ArrayList<>();
        for (Seat seat : selected) {
            BookingSeat bookingSeat = new BookingSeat();
            bookingSeat.booking = booking;
            bookingSeat.showtime = showtime;
            bookingSeat.seat = seat;
            bookingSeat.unitPrice = SeatPricing.price(showtime, seat);
            bookingSeat.holdStatus = HoldStatus.SOLD;
            bookingSeat.holdExpiresAt = booking.holdExpiresAt;
            bookingSeats.save(bookingSeat);

            Ticket ticket = new Ticket();
            ticket.bookingSeat = bookingSeat;
            ticket.ticketCode = UUID.randomUUID().toString().replace("-", "");
            tickets.save(ticket);

            Map<String, Object> ticketRow = new LinkedHashMap<>();
            ticketRow.put("ticketId", ticket.id);
            ticketRow.put("ticketCode", ticket.ticketCode);
            ticketRow.put("seatLabel", seat.rowLabel + seat.seatNumber);
            ticketRow.put("price", bookingSeat.unitPrice);
            issuedTickets.add(ticketRow);
        }

        Payment payment = new Payment();
        payment.booking = booking;
        payment.method = method;
        payment.amount = booking.totalAmount;
        payment.transactionRef = "counter-" + UUID.randomUUID();
        payment.status = PaymentStatus.SUCCESS;
        payment.paidAt = now;
        payments.save(payment);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("bookingId", booking.id);
        result.put("bookingStatus", booking.status);
        result.put("customerName", booking.customerName);
        result.put("showtime", showtime.startAt);
        result.put("totalAmount", booking.totalAmount);
        result.put("paymentMethod", method);
        result.put("soldBy", staff.fullName);
        result.put("tickets", issuedTickets);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
