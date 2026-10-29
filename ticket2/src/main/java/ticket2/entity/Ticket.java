package ticket2.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="tickets", uniqueConstraints={@UniqueConstraint(columnNames="ticket_code"),@UniqueConstraint(columnNames="booking_seat_id")})
public class Ticket extends BaseEntity {
    @OneToOne(optional=false) @JoinColumn(name="booking_seat_id") public BookingSeat bookingSeat;
    @Column(name="ticket_code",nullable=false,unique=true) public String ticketCode;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public TicketStatus status=TicketStatus.VALID;
    @Column(nullable=false) public LocalDateTime issuedAt=LocalDateTime.now();
    public LocalDateTime usedAt;
}
