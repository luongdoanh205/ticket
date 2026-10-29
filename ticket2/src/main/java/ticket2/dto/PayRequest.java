package ticket2.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record PayRequest(@NotBlank String method,@NotBlank String transactionRef,@NotNull BigDecimal amount,boolean success) {}
