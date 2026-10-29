package ticket2.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="payments", indexes=@Index(columnList="transaction_ref",unique=true))
public class Payment extends BaseEntity {
    @ManyToOne(optional=false) public Booking booking;
    public String method;
    @Column(nullable=false,precision=12,scale=2) public BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public PaymentStatus status=PaymentStatus.PENDING;
    @Column(name="transaction_ref") public String transactionRef;
    public LocalDateTime paidAt;
}
