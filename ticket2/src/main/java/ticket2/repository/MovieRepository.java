package ticket2.repository;
import ticket2.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MovieRepository extends JpaRepository<Movie,Long>{List<Movie> findByTitleContainingIgnoreCaseAndStatus(String title,MovieStatus status);List<Movie> findByTitleContainingIgnoreCase(String title);}
