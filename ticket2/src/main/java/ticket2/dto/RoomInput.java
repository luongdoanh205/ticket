package ticket2.dto;
import ticket2.entity.RecordStatus;
import jakarta.validation.constraints.*;
public record RoomInput(@NotNull Long cinemaId,@NotBlank String name,String roomType,RecordStatus status) {}
