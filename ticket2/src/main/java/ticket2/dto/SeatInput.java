package ticket2.dto;
import jakarta.validation.constraints.*;
public record SeatInput(@NotNull Long roomId,@NotBlank String rowLabel,@NotNull @Min(1) Integer seatNumber,String seatType,Boolean active) {}
