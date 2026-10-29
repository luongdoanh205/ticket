package ticket2.dto;
import java.time.LocalDateTime;
public record ApiError(String code,String message,LocalDateTime timestamp) {}
