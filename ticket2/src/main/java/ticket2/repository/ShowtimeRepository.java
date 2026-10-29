package ticket2.repository;
import ticket2.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.*;
public interface ShowtimeRepository extends JpaRepository<Showtime,Long>{@org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE) @org.springframework.data.jpa.repository.Query("select s from Showtime s where s.id=:id") Optional<Showtime> lockById(@org.springframework.data.repository.query.Param("id") Long id);List<Showtime> findByMovieIdAndRoomCinemaIdAndStartAtBetweenAndStatusNot(Long movie,Long cinema,LocalDateTime from,LocalDateTime to,ShowtimeStatus status);List<Showtime> findByMovieIdAndStartAtBetweenAndStatusNot(Long movie,LocalDateTime from,LocalDateTime to,ShowtimeStatus status);List<Showtime> findByRoomCinemaIdAndStartAtBetweenAndStatusNot(Long cinema,LocalDateTime from,LocalDateTime to,ShowtimeStatus status);List<Showtime> findByStartAtBetweenAndStatusNot(LocalDateTime from,LocalDateTime to,ShowtimeStatus status);}
