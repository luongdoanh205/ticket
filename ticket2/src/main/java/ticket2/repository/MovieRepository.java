package ticket2.repository;
import ticket2.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;
public interface MovieRepository extends JpaRepository<Movie,Long>{
    @EntityGraph(attributePaths="genres")
    List<Movie> findByTitleContainingIgnoreCaseAndStatus(String title,MovieStatus status);
    @EntityGraph(attributePaths="genres")
    List<Movie> findByTitleContainingIgnoreCase(String title);
    @EntityGraph(attributePaths="genres")
    Optional<Movie> findWithGenresById(Long id);
}
