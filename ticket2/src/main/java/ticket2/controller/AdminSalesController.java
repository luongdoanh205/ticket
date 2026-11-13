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
    private final BookingSeatRepository bookingSeats;
    private final PaymentRepository payments;
    private final TicketRepository tickets;
    AdminSalesController(BookingRepository bookings,BookingSeatRepository bookingSeats,PaymentRepository payments,TicketRepository tickets) {
        this.bookings=bookings; this.bookingSeats=bookingSeats; this.payments=payments; this.tickets=tickets;
    }
    @GetMapping("/bookings") List<Map<String,Object>> bookings() {
        return bookings.findAll().stream().map(b -> {
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("id",b.id); row.put("userId",b.user == null ? null : b.user.id); row.put("customerName",customerName(b));
            row.put("email",customerEmail(b)); row.put("phone",customerPhone(b)); row.put("saleChannel",saleChannel(b));
            row.put("soldByName",b.soldBy == null ? null : b.soldBy.fullName); row.put("showtimeId",b.showtime.id);
            row.put("movieTitle",b.showtime.movie.title); row.put("cinemaName",b.showtime.room.cinema.name);
            row.put("roomName",b.showtime.room.name); row.put("startAt",b.showtime.startAt); row.put("endAt",b.showtime.endAt);
            row.put("status",b.status); row.put("totalAmount",b.totalAmount); row.put("holdExpiresAt",b.holdExpiresAt);
            row.put("createdAt",b.createdAt); row.put("seats",seatRows(b.id));
            return row;
        }).sorted(Comparator.comparing(row -> (Long)row.get("id"), Comparator.reverseOrder())).toList();
    }
    @GetMapping("/payments") List<Map<String,Object>> payments() {
        return payments.findAll().stream().map(p -> {
            Booking b=p.booking;
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("id",p.id); row.put("bookingId",b.id); row.put("customerName",customerName(b));
            row.put("email",customerEmail(b)); row.put("saleChannel",saleChannel(b));
            row.put("soldByName",b.soldBy == null ? null : b.soldBy.fullName); row.put("movieTitle",b.showtime.movie.title);
            row.put("cinemaName",b.showtime.room.cinema.name); row.put("roomName",b.showtime.room.name);
            row.put("startAt",b.showtime.startAt); row.put("seats",seatRows(b.id));
            row.put("bookingStatus",b.status); row.put("amount",p.amount); row.put("method",Objects.toString(p.method,""));
            row.put("status",p.status); row.put("transactionRef",Objects.toString(p.transactionRef,""));
            row.put("paidAt",Objects.toString(p.paidAt,""));
            return row;
        }).sorted(Comparator.comparing(row -> (Long)row.get("id"), Comparator.reverseOrder())).toList();
    }
    @GetMapping("/tickets") List<Map<String,Object>> tickets() {
        return tickets.findAll().stream().map(t -> {
            Booking b=t.bookingSeat.booking;
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("id",t.id); row.put("ticketCode",t.ticketCode); row.put("status",t.status);
            row.put("bookingId",b.id); row.put("seatId",t.bookingSeat.seat.id); row.put("seatLabel",seatLabel(t.bookingSeat.seat));
            row.put("showtimeId",t.bookingSeat.showtime.id); row.put("customerName",customerName(b));
            row.put("email",customerEmail(b)); row.put("saleChannel",saleChannel(b));
            row.put("soldByName",b.soldBy == null ? null : b.soldBy.fullName); row.put("movieTitle",b.showtime.movie.title);
            row.put("cinemaName",b.showtime.room.cinema.name); row.put("roomName",b.showtime.room.name);
            row.put("startAt",b.showtime.startAt); row.put("price",t.bookingSeat.unitPrice);
            row.put("issuedAt",t.issuedAt); row.put("usedAt",t.usedAt);
            return row;
        }).sorted(Comparator.comparing(row -> (Long)row.get("id"), Comparator.reverseOrder())).toList();
    }
    @GetMapping("/tickets/{code}/validate") Map<String,Object> validate(@PathVariable String code) {
        Ticket ticket=tickets.findByTicketCode(code).orElseThrow(() -> missing("TICKET_NOT_FOUND"));
        Booking booking=ticket.bookingSeat.booking;
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("valid",ticket.status==TicketStatus.VALID&&booking.status==BookingStatus.PAID);
        result.put("status",ticket.status); result.put("ticketCode",ticket.ticketCode); result.put("bookingId",booking.id);
        result.put("customerName",customerName(booking)); result.put("email",customerEmail(booking));
        result.put("movieTitle",booking.showtime.movie.title); result.put("cinemaName",booking.showtime.room.cinema.name);
        result.put("roomName",booking.showtime.room.name); result.put("startAt",booking.showtime.startAt);
        result.put("seatLabel",seatLabel(ticket.bookingSeat.seat)); result.put("seatId",ticket.bookingSeat.seat.id);
        result.put("showtimeId",ticket.bookingSeat.showtime.id); result.put("price",ticket.bookingSeat.unitPrice);
        result.put("issuedAt",ticket.issuedAt); result.put("usedAt",ticket.usedAt);
        return result;
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
    private String customerName(Booking booking) {
        if (booking.customerName != null && !booking.customerName.isBlank()) return booking.customerName;
        return booking.user == null ? "Khách mua tại quầy" : booking.user.fullName;
    }
    private String customerEmail(Booking booking) {
        return booking.customerEmail != null ? booking.customerEmail : booking.user == null ? null : booking.user.email;
    }
    private String customerPhone(Booking booking) {
        return booking.customerPhone != null ? booking.customerPhone : booking.user == null ? null : booking.user.phone;
    }
    private String saleChannel(Booking booking) { return booking.soldBy == null ? "ONLINE" : "COUNTER"; }
    private List<Map<String,Object>> seatRows(Long bookingId) {
        return bookingSeats.findByBookingId(bookingId).stream().map(bs -> {
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("seatId",bs.seat.id); row.put("label",seatLabel(bs.seat)); row.put("rowLabel",bs.seat.rowLabel);
            row.put("seatNumber",bs.seat.seatNumber); row.put("seatType",bs.seat.seatType);
            row.put("unitPrice",bs.unitPrice); row.put("holdStatus",bs.holdStatus);
            return row;
        }).toList();
    }
    private String seatLabel(Seat seat) { return seat.rowLabel + seat.seatNumber; }
}
