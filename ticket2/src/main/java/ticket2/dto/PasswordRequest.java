package ticket2.dto;
import jakarta.validation.constraints.*;
public record PasswordRequest(@NotBlank String oldPassword,@NotBlank @Size(min=8) String newPassword) {}
