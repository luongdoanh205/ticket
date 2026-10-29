package ticket2.controller;

import ticket2.config.TokenService;
import ticket2.dto.RegisterRequest;
import ticket2.dto.LoginRequest;
import ticket2.entity.*;
import ticket2.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final TokenService tokens;

    AuthController(UserRepository users, PasswordEncoder encoder, TokenService tokens) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    @PostMapping("/register")
    ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.findByEmail(email).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EMAIL_EXISTS");
        User user = new User();
        user.fullName = request.fullName();
        user.email = email;
        user.phone = request.phone();
        user.passwordHash = encoder.encode(request.password());
        user.role = Role.CUSTOMER;
        user.status = AccountStatus.ACTIVE;
        users.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", user.id, "fullName", user.fullName, "email", user.email, "role", user.role));
    }

    @PostMapping("/login")
    Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
        User user = users.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                .filter(value -> value.status == AccountStatus.ACTIVE
                        && encoder.matches(request.password(), value.passwordHash))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));
        return Map.of("accessToken", tokens.issue(user), "tokenType", "Bearer", "expiresIn", 3600,
                "user", Map.of("id", user.id, "fullName", user.fullName,
                        "email", user.email, "role", user.role));
    }
}
