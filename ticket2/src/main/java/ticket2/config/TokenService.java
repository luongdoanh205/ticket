package ticket2.config;

import ticket2.entity.User;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Component
public class TokenService {
    private final String secret;

    public TokenService(@Value("${JWT_SECRET}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
        }
        this.secret = secret;
    }

    public String issue(User user) {
        long exp = System.currentTimeMillis() / 1000 + 3600;
        String head = b64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String body = b64("{\"sub\":\"" + user.email + "\",\"role\":\"" + user.role + "\",\"exp\":" + exp + "}");
        String data = head + "." + body;
        return data + "." + sign(data);
    }

    Optional<String[]> validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !MessageDigest.isEqual(
                    sign(parts[0] + "." + parts[1]).getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) return Optional.empty();
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            var subject = java.util.regex.Pattern.compile("\\\"sub\\\":\\\"([^\\\"]+)\\\"").matcher(payload);
            var role = java.util.regex.Pattern.compile("\\\"role\\\":\\\"([^\\\"]+)\\\"").matcher(payload);
            var expiry = java.util.regex.Pattern.compile("\\\"exp\\\":([0-9]+)").matcher(payload);
            if (!subject.find() || !role.find() || !expiry.find()
                    || Long.parseLong(expiry.group(1)) <= System.currentTimeMillis() / 1000) return Optional.empty();
            return Optional.of(new String[]{subject.group(1), role.group(1)});
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String b64(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }
}
