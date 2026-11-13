package ticket2.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import ticket2.entity.Role;
import ticket2.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class TokenServiceTest {

    private TokenService tokenService;
    private static final String SECRET = "A_VERY_SECURE_AND_LONG_SECRET_KEY_FOR_TESTING_123456";

    @BeforeEach
    void setUp() {
        tokenService = new TokenService(SECRET, new ObjectMapper());
    }

    @Test
    @DisplayName("Cấp và xác thực JWT token thành công")
    void testIssueAndValidateToken() {
        User user = new User();
        user.email = "test@example.com";
        user.role = Role.CUSTOMER;

        String token = tokenService.issue(user);
        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3);

        Optional<String[]> claims = tokenService.validate(token);
        assertTrue(claims.isPresent());
        assertEquals("test@example.com", claims.get()[0]);
        assertEquals("CUSTOMER", claims.get()[1]);
    }

    @Test
    @DisplayName("Từ chối JWT token khi bị giả mạo chữ ký")
    void testTamperedTokenFails() {
        User user = new User();
        user.email = "hacker@example.com";
        user.role = Role.CUSTOMER;

        String token = tokenService.issue(user);
        String tamperedToken = token.substring(0, token.length() - 4) + "XXXX";

        Optional<String[]> claims = tokenService.validate(tamperedToken);
        assertTrue(claims.isEmpty());
    }

    @Test
    @DisplayName("Từ chối khi secret quá ngắn (dưới 32 ký tự)")
    void testShortSecretThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> new TokenService("short_key", new ObjectMapper()));
    }
}
