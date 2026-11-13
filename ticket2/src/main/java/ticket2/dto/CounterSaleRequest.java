package ticket2.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CounterSaleRequest(
        @NotNull Long showtimeId,
        @NotEmpty @Size(max = 8) List<@NotNull Long> seatIds,
        @NotBlank @Size(max = 120) String customerName,
        @Email @Size(max = 254) String customerEmail,
        @Size(max = 32) String customerPhone,
        @NotBlank String paymentMethod
) {}
