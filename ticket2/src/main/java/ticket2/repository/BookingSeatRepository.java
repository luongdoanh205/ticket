package ticket2.repository;

import ticket2.entity.BookingSeat;
import ticket2.entity.HoldStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {

    List<BookingSeat> findByShowtimeId(Long showtimeId);

    List<BookingSeat> findByBookingId(Long bookingId);

    boolean existsByShowtimeId(Long showtimeId);

    boolean existsByShowtimeIdAndSeatIdAndHoldStatusAndHoldExpiresAtAfter(
            Long showtimeId,
            Long seatId,
            HoldStatus status,
            LocalDateTime now
    );
}
