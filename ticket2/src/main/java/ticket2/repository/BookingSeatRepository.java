package ticket2.repository;
import ticket2.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
public interface BookingSeatRepository extends JpaRepository<BookingSeat,Long>{List<BookingSeat> findByShowtimeId(Long id);List<BookingSeat> findByBookingId(Long id);boolean existsByShowtimeId(Long showtimeId);boolean existsByShowtimeIdAndSeatIdAndHoldStatusAndHoldExpiresAtAfter(Long showtime,Long seat,HoldStatus status,LocalDateTime now);}
