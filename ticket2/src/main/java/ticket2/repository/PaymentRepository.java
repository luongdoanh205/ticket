package ticket2.repository;
import ticket2.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PaymentRepository extends JpaRepository<Payment,Long>{Optional<Payment> findByTransactionRef(String ref);boolean existsByBookingIdAndStatus(Long booking,PaymentStatus status);}
