package ticket2.dto;
import ticket2.entity.RecordStatus;
import jakarta.validation.constraints.NotBlank;
public record CinemaInput(@NotBlank String name,String address,String phone,RecordStatus status) {}
