package ticket2.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="bookings")
public class Booking extends BaseEntity {
    @ManyToOne(optional=false) public User user;
    @ManyToOne(optional=false) public Showtime showtime;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public BookingStatus status=BookingStatus.PENDING;
    @Column(nullable=false,precision=12,scale=2) public BigDecimal totalAmount;
    @Column(nullable=false) public LocalDateTime holdExpiresAt;
}
