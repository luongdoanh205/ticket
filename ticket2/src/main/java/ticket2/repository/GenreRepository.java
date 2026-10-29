package ticket2.repository;
import ticket2.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
public interface GenreRepository extends JpaRepository<Genre,Long>{boolean existsByNameIgnoreCase(String name);}
