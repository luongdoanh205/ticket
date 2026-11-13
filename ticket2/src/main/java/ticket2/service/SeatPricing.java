package ticket2.service;

import ticket2.entity.Seat;
import ticket2.entity.Showtime;

import java.math.BigDecimal;
import java.util.Objects;

public final class SeatPricing {
    private static final BigDecimal VIP_MULTIPLIER = new BigDecimal("1.20");
    private static final BigDecimal DOUBLE_MULTIPLIER = new BigDecimal("1.80");

    private SeatPricing() {}

    public static BigDecimal price(Showtime showtime, Seat seat) {
        return switch (Objects.toString(seat.seatType, "STANDARD").toUpperCase()) {
            case "VIP" -> showtime.basePrice.multiply(VIP_MULTIPLIER);
            case "DOUBLE" -> showtime.basePrice.multiply(DOUBLE_MULTIPLIER);
            default -> showtime.basePrice;
        };
    }
}
