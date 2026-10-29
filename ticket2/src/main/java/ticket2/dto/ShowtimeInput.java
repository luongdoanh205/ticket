package ticket2.dto;
import ticket2.entity.ShowtimeStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record ShowtimeInput(@NotNull Long movieId,@NotNull Long roomId,@NotNull LocalDateTime startAt,@NotNull LocalDateTime endAt,@NotNull @DecimalMin("0.01") BigDecimal basePrice,ShowtimeStatus status) {}
