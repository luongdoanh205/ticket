package ticket2.repository;
import ticket2.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RoomRepository extends JpaRepository<Room,Long>{List<Room> findByCinemaId(Long id);}
