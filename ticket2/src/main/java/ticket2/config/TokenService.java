package ticket2.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ticket2.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@Component
public class TokenService {

    private final String secret;
    private final ObjectMapper objectMapper;

    public TokenService(@Value("${JWT_SECRET}") String secret, ObjectMapper objectMapper) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
        }
        this.secret = secret;
        this.objectMapper = objectMapper;
    }

    public String issue(User user) {
        long exp = (System.currentTimeMillis() / 1000) + 3600; // 1 hour expiration
        try {
            String headerJson = objectMapper.writeValueAsString(Map.of("alg", "HS256", "typ", "JWT"));
            String payloadJson = objectMapper.writeValueAsString(Map.of(
                    "sub", user.email,
                    "role", user.role.name(),
                    "exp", exp
            ));

            String headerEncoded = encodeBase64Url(headerJson.getBytes(StandardCharsets.UTF_8));
            String payloadEncoded = encodeBase64Url(payloadJson.getBytes(StandardCharsets.UTF_8));

            String content = headerEncoded + "." + payloadEncoded;
            String signature = sign(content);

            return content + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to issue JWT token", e);
        }
    }

    public Optional<String[]> validate(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }

            String content = parts[0] + "." + parts[1];
            String expectedSignature = sign(content);

            // Constant-time comparison to prevent timing attacks
            boolean signatureValid = MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8)
            );
            if (!signatureValid) {
                return Optional.empty();
            }

            byte[] decodedPayload = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payloadNode = objectMapper.readTree(decodedPayload);

            JsonNode subNode = payloadNode.get("sub");
            JsonNode roleNode = payloadNode.get("role");
            JsonNode expNode = payloadNode.get("exp");

            if (subNode == null || roleNode == null || expNode == null) {
                return Optional.empty();
            }

            long exp = expNode.asLong();
            long nowSeconds = System.currentTimeMillis() / 1000;
            if (exp <= nowSeconds) {
                return Optional.empty(); // Token expired
            }

            return Optional.of(new String[]{subNode.asText(), roleNode.asText()});
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signatureBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return encodeBase64Url(signatureBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Error calculating HMAC signature", e);
        }
    }

    private String encodeBase64Url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }
}
