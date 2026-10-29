package ticket2.repository;
import ticket2.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SeatRepository extends JpaRepository<Seat,Long>{List<Seat> findByRoomIdOrderByRowLabelAscSeatNumberAsc(Long id);}
