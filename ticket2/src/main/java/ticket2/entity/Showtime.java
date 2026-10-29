package ticket2.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="showtimes")
public class Showtime extends BaseEntity {
    @ManyToOne(optional=false) public Movie movie;
    @ManyToOne(optional=false) public Room room;
    @Column(nullable=false) public LocalDateTime startAt;
    @Column(nullable=false) public LocalDateTime endAt;
    @Column(nullable=false, precision=12,scale=2) public BigDecimal basePrice;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public ShowtimeStatus status=ShowtimeStatus.AVAILABLE;
}
