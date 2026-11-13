package ticket2.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="bookings")
public class Booking extends BaseEntity {
    @ManyToOne public User user;
    @ManyToOne public User soldBy;
    @ManyToOne(optional=false) public Showtime showtime;
    @Column(length=120) public String customerName;
    @Column(length=254) public String customerEmail;
    @Column(length=32) public String customerPhone;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public BookingStatus status=BookingStatus.PENDING;
    @Column(nullable=false,precision=12,scale=2) public BigDecimal totalAmount;
    @Column(nullable=false) public LocalDateTime holdExpiresAt;
}
