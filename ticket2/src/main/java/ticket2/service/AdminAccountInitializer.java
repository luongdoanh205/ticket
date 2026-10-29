package ticket2.service;

import ticket2.entity.AccountStatus;
import ticket2.entity.Role;
import ticket2.entity.User;
import ticket2.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Locale;

@Component
class AdminAccountInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final String email;
    private final String password;
    private final String fullName;

    AdminAccountInitializer(UserRepository users, PasswordEncoder passwords,
                            @Value("${ADMIN_EMAIL:}") String email,
                            @Value("${ADMIN_PASSWORD:}") String password,
                            @Value("${ADMIN_FULL_NAME:System Administrator}") String fullName) {
        this.users=users;
        this.passwords=passwords;
        this.email=email;
        this.password=password;
        this.fullName=fullName;
    }

    @Override
    public void run(String... args) {
        if(email.isBlank() || password.isBlank() || password.startsWith("CHANGE_ME")) {
            log.warn("Admin bootstrap skipped: set ADMIN_EMAIL and a real ADMIN_PASSWORD in .env");
            return;
        }
        String normalizedEmail=email.trim().toLowerCase(Locale.ROOT);
        User user=users.findByEmail(normalizedEmail).orElseGet(() -> {
            User created=new User();
            created.email=normalizedEmail;
            created.fullName=fullName;
            created.passwordHash=passwords.encode(password);
            created.status=AccountStatus.ACTIVE;
            return created;
        });
        boolean roleChanged=user.role!=Role.ADMIN;
        user.role=Role.ADMIN;
        // The bootstrap password is only used when creating the account. Re-encoding it
        // on every startup would silently undo password changes made by an administrator.
        if(user.id==null || roleChanged) users.save(user);
        if(roleChanged) log.info("Admin role configured for {}", normalizedEmail);
    }
}
