package ticket2.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="booking_seats", indexes=@Index(columnList="showtime_id,seat_id"))
public class BookingSeat extends BaseEntity {
    @ManyToOne(optional=false) public Booking booking;
    @ManyToOne(optional=false) public Showtime showtime;
    @ManyToOne(optional=false) public Seat seat;
    @Column(nullable=false,precision=12,scale=2) public BigDecimal unitPrice;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public HoldStatus holdStatus=HoldStatus.HELD;
    @Column(nullable=false) public LocalDateTime holdExpiresAt;
}
