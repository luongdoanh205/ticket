package ticket2.controller;

import ticket2.dto.ApiError;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiError> status(ResponseStatusException error) {
        String reason = error.getReason() == null ? "Request failed" : error.getReason();
        return ResponseEntity.status(error.getStatusCode())
                .body(new ApiError(reason, reason, LocalDateTime.now()));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    ResponseEntity<ApiError> conflict(Exception error) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("CONFLICT", "Dữ liệu bị trùng hoặc đang được sử dụng", LocalDateTime.now()));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalid(Exception error) {
        return ResponseEntity.badRequest()
                .body(new ApiError("VALIDATION_ERROR", "Dữ liệu gửi lên không hợp lệ", LocalDateTime.now()));
    }
}
