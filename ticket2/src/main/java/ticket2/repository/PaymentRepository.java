package ticket2.repository;

import ticket2.entity.Payment;
import ticket2.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionRef(String ref);
    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);
    List<Payment> findByBookingId(Long bookingId);
}
