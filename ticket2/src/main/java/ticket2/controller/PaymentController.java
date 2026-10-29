package ticket2.controller;

import ticket2.dto.PayRequest;
import ticket2.entity.*;
import ticket2.repository.*;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth")
@RequestMapping("/api/bookings/{bookingId}/payments")
class PaymentController {
    private final UserRepository users;
    private final BookingRepository bookings;
    private final BookingSeatRepository bookingSeats;
    private final PaymentRepository payments;
    private final TicketRepository tickets;

    PaymentController(UserRepository users, BookingRepository bookings, BookingSeatRepository bookingSeats,
                      PaymentRepository payments, TicketRepository tickets) {
        this.users=users; this.bookings=bookings; this.bookingSeats=bookingSeats;
        this.payments=payments; this.tickets=tickets;
    }

    @PostMapping
    @Transactional
    ResponseEntity<?> pay(@PathVariable Long bookingId, @Valid @RequestBody PayRequest request, Authentication auth) {
        User user=users.findByEmail(auth.getName()).orElseThrow(() -> error(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS"));
        Booking booking=bookings.lockByIdAndUserId(bookingId,user.id)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,"BOOKING_NOT_FOUND"));
        Optional<Payment> duplicate=payments.findByTransactionRef(request.transactionRef());
        if(duplicate.isPresent()) {
            Payment old=duplicate.get();
            if(!old.booking.id.equals(bookingId)) throw error(HttpStatus.CONFLICT,"TRANSACTION_REF_CONFLICT");
            return ResponseEntity.ok(Map.of("paymentId",old.id,"status",old.status,"bookingStatus",booking.status));
        }
        if(booking.status==BookingStatus.PAID && payments.existsByBookingIdAndStatus(bookingId,PaymentStatus.SUCCESS))
            throw error(HttpStatus.CONFLICT,"BOOKING_ALREADY_PAID");
        LocalDateTime now=LocalDateTime.now();
        if(booking.status!=BookingStatus.PENDING || !booking.holdExpiresAt.isAfter(now)) {
            booking.status=BookingStatus.EXPIRED;
            bookingSeats.findByBookingId(bookingId).forEach(seat -> seat.holdStatus=HoldStatus.RELEASED);
            bookings.save(booking);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code","BOOKING_EXPIRED"));
        }
        if(request.amount().compareTo(booking.totalAmount)!=0) throw error(HttpStatus.CONFLICT,"PAYMENT_AMOUNT_MISMATCH");
        Payment payment=new Payment(); payment.booking=booking; payment.method=request.method();
        payment.amount=request.amount(); payment.transactionRef=request.transactionRef();
        payment.status=request.success()?PaymentStatus.SUCCESS:PaymentStatus.FAILED;
        if(request.success()) {
            payment.paidAt=now; booking.status=BookingStatus.PAID; bookings.save(booking);
            for(BookingSeat bookingSeat:bookingSeats.findByBookingId(bookingId)) {
                bookingSeat.holdStatus=HoldStatus.SOLD;
                Ticket ticket=new Ticket(); ticket.bookingSeat=bookingSeat;
                ticket.ticketCode=UUID.randomUUID().toString().replace("-",""); tickets.save(ticket);
            }
        }
        payment=payments.save(payment);
        return ResponseEntity.ok(Map.of("paymentId",payment.id,"paymentStatus",payment.status,"bookingStatus",booking.status));
    }

    private ResponseStatusException error(HttpStatus status,String code) { return new ResponseStatusException(status,code); }
}
