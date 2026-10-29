package ticket2.controller;

import ticket2.entity.*;
import ticket2.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth")
@RequestMapping("/api/tickets")
class TicketController {
    private final UserRepository users;
    private final TicketRepository tickets;
    TicketController(UserRepository users,TicketRepository tickets) { this.users=users; this.tickets=tickets; }

    @GetMapping
    List<Map<String,Object>> mine(Authentication auth) {
        User user=users.findByEmail(auth.getName()).orElseThrow();
        return tickets.findByBookingSeatBookingUserId(user.id).stream().map(this::view).toList();
    }

    private Map<String,Object> view(Ticket ticket) {
        Booking booking=ticket.bookingSeat.booking;
        return Map.ofEntries(
                Map.entry("id",ticket.id),
                Map.entry("ticketCode",ticket.ticketCode),
                Map.entry("status",ticket.status),
                Map.entry("issuedAt",ticket.issuedAt),
                Map.entry("usedAt",Objects.toString(ticket.usedAt,"")),
                Map.entry("bookingId",booking.id),
                Map.entry("movie",booking.showtime.movie.title),
                Map.entry("cinema",booking.showtime.room.cinema.name),
                Map.entry("room",booking.showtime.room.name),
                Map.entry("startAt",booking.showtime.startAt),
                Map.entry("rowLabel",ticket.bookingSeat.seat.rowLabel),
                Map.entry("seatNumber",ticket.bookingSeat.seat.seatNumber),
                Map.entry("price",ticket.bookingSeat.unitPrice));
    }
}
