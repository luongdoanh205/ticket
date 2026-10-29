package ticket2.controller;

import ticket2.entity.*;
import ticket2.repository.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController @io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth") @RequestMapping("/api/admin/dashboard")
class AdminDashboardController {
    private final PaymentRepository payments;
    private final BookingRepository bookings;
    private final TicketRepository tickets;
    AdminDashboardController(PaymentRepository payments,BookingRepository bookings,TicketRepository tickets) {
        this.payments=payments; this.bookings=bookings; this.tickets=tickets;
    }
    @GetMapping Map<String,Object> report(@RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
                                          @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Payment> successful=payments.findAll().stream().filter(payment -> payment.status==PaymentStatus.SUCCESS
                && payment.paidAt!=null && !payment.paidAt.toLocalDate().isBefore(from)
                && !payment.paidAt.toLocalDate().isAfter(to)).toList();
        BigDecimal revenue=successful.stream().map(payment -> payment.amount).reduce(BigDecimal.ZERO,BigDecimal::add);
        long soldTickets=tickets.countByBookingSeatBookingStatusAndStatus(BookingStatus.PAID,TicketStatus.VALID)
                +tickets.countByBookingSeatBookingStatusAndStatus(BookingStatus.PAID,TicketStatus.USED);
        return Map.of("paidTickets",soldTickets,"bookingsByStatus",Map.of(
                "PENDING",bookings.countByStatus(BookingStatus.PENDING),"PAID",bookings.countByStatus(BookingStatus.PAID),
                "CANCELLED",bookings.countByStatus(BookingStatus.CANCELLED),"EXPIRED",bookings.countByStatus(BookingStatus.EXPIRED)),
                "revenue",revenue,"from",from,"to",to);
    }
}
