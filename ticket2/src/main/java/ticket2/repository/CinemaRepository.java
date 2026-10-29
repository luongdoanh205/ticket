package ticket2.repository;
import ticket2.entity.Cinema;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CinemaRepository extends JpaRepository<Cinema,Long>{}
