package ticket2.dto;
import jakarta.validation.constraints.NotBlank;
public record GenreInput(@NotBlank String name,String description) {}
