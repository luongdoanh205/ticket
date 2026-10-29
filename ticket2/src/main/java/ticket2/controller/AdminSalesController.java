package ticket2.controller;

import ticket2.entity.*;
import ticket2.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@RestController @io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth") @RequestMapping("/api/admin")
class AdminSalesController {
    private final BookingRepository bookings;
    private final PaymentRepository payments;
    private final TicketRepository tickets;
    AdminSalesController(BookingRepository bookings,PaymentRepository payments,TicketRepository tickets) {
        this.bookings=bookings; this.payments=payments; this.tickets=tickets;
    }
    @GetMapping("/bookings") List<Map<String,Object>> bookings() {
        return bookings.findAll().stream().map(b -> Map.<String,Object>of("id",b.id,"userId",b.user.id,
                "email",b.user.email,"showtimeId",b.showtime.id,"status",b.status,"totalAmount",b.totalAmount,
                "holdExpiresAt",b.holdExpiresAt,"createdAt",b.createdAt)).toList();
    }
    @GetMapping("/payments") List<Map<String,Object>> payments() {
        return payments.findAll().stream().map(p -> Map.<String,Object>of("id",p.id,"bookingId",p.booking.id,
                "amount",p.amount,"method",Objects.toString(p.method,""),"status",p.status,
                "transactionRef",Objects.toString(p.transactionRef,""),"paidAt",Objects.toString(p.paidAt,""))).toList();
    }
    @GetMapping("/tickets") List<Map<String,Object>> tickets() {
        return tickets.findAll().stream().map(t -> Map.<String,Object>of("id",t.id,"ticketCode",t.ticketCode,
                "status",t.status,"bookingId",t.bookingSeat.booking.id,"seatId",t.bookingSeat.seat.id,
                "showtimeId",t.bookingSeat.showtime.id,"issuedAt",t.issuedAt)).toList();
    }
    @GetMapping("/tickets/{code}/validate") Map<String,Object> validate(@PathVariable String code) {
        Ticket ticket=tickets.findByTicketCode(code).orElseThrow(() -> missing("TICKET_NOT_FOUND"));
        return Map.of("valid",ticket.status==TicketStatus.VALID&&ticket.bookingSeat.booking.status==BookingStatus.PAID,
                "status",ticket.status,"showtimeId",ticket.bookingSeat.showtime.id,"seatId",ticket.bookingSeat.seat.id);
    }
    @PostMapping("/tickets/{code}/use") @Transactional Map<String,Object> use(@PathVariable String code) {
        Ticket ticket=tickets.findByTicketCode(code).orElseThrow(() -> missing("TICKET_NOT_FOUND"));
        if(ticket.status!=TicketStatus.VALID||ticket.bookingSeat.booking.status!=BookingStatus.PAID
                ||ticket.bookingSeat.showtime.endAt.isBefore(LocalDateTime.now()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"TICKET_NOT_VALID");
        ticket.status=TicketStatus.USED; ticket.usedAt=LocalDateTime.now(); tickets.save(ticket);
        return Map.of("ticketCode",code,"status",ticket.status);
    }
    private ResponseStatusException missing(String code) { return new ResponseStatusException(HttpStatus.NOT_FOUND,code); }
}
