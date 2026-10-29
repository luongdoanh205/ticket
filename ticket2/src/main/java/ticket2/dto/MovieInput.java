package ticket2.dto;
import ticket2.entity.MovieStatus;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;
public record MovieInput(@NotBlank String title,String description,@Min(1) Integer duration,LocalDate releaseDate,String posterUrl,String director,String castNames,MovieStatus status,List<Long> genreIds) {}
