package ticket2.controller;

import ticket2.dto.*;
import ticket2.entity.User;
import ticket2.repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth")
@RequestMapping("/api/me")
class AccountController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    AccountController(UserRepository users,PasswordEncoder passwords) { this.users=users; this.passwords=passwords; }

    @GetMapping
    Map<String,Object> profile(Authentication auth) { return view(current(auth)); }

    @PutMapping
    @Transactional
    Map<String,Object> update(@Valid @RequestBody ProfileRequest request,Authentication auth) {
        User user=current(auth); user.fullName=request.fullName(); user.phone=request.phone();
        users.save(user); return view(user);
    }

    @PostMapping("/change-password")
    @Transactional
    Map<String,String> changePassword(@Valid @RequestBody PasswordRequest request,Authentication auth) {
        User user=current(auth);
        if(!passwords.matches(request.oldPassword(),user.passwordHash))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"INVALID_CURRENT_PASSWORD");
        user.passwordHash=passwords.encode(request.newPassword()); users.save(user);
        return Map.of("status","updated");
    }

    private User current(Authentication auth) {
        return users.findByEmail(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS"));
    }
    private Map<String,Object> view(User user) {
        return Map.of("id",user.id,"fullName",user.fullName,"email",user.email,
                "phone",Objects.toString(user.phone,""),"role",user.role,"status",user.status);
    }
}
