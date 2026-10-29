package ticket2.dto;
import jakarta.validation.constraints.*;
import java.util.List;
public record HoldRequest(@NotNull Long showtimeId,@NotEmpty List<Long> seatIds) {}
