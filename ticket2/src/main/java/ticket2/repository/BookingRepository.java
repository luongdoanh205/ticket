package ticket2.repository;
import ticket2.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.*;
public interface BookingRepository extends JpaRepository<Booking,Long>{List<Booking> findByUserIdOrderByCreatedAtDesc(Long id);Optional<Booking> findByIdAndUserId(Long id,Long user);@org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE) @org.springframework.data.jpa.repository.Query("select b from Booking b where b.id=:id and b.user.id=:userId") Optional<Booking> lockByIdAndUserId(@org.springframework.data.repository.query.Param("id") Long id,@org.springframework.data.repository.query.Param("userId") Long userId);List<Booking> findByStatusAndHoldExpiresAtBefore(BookingStatus status,LocalDateTime now);long countByStatus(BookingStatus s);}
