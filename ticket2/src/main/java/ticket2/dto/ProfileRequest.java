package ticket2.dto;
import jakarta.validation.constraints.NotBlank;
public record ProfileRequest(@NotBlank String fullName,String phone) {}
