package ticket2.controller;

import ticket2.dto.UserAdminInput;
import ticket2.entity.User;
import ticket2.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController @io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth") @RequestMapping("/api/admin/users")
class AdminUsersController {
    private final UserRepository users;
    AdminUsersController(UserRepository users) { this.users=users; }

    @GetMapping List<Map<String,Object>> list() {
        return users.findAll().stream().map(user -> Map.<String,Object>of("id",user.id,
                "fullName",user.fullName,"email",user.email,"phone",Objects.toString(user.phone,""),
                "status",user.status,"role",user.role)).toList();
    }

    @PatchMapping("/{id}") Map<String,Object> update(@PathVariable Long id,@RequestBody UserAdminInput input) {
        User user=users.findById(id).orElseThrow(() -> missing("USER_NOT_FOUND"));
        if(input.status()!=null) user.status=input.status();
        if(input.role()!=null) user.role=input.role();
        users.save(user);
        return Map.of("id",user.id,"status",user.status,"role",user.role);
    }

    private ResponseStatusException missing(String code) { return new ResponseStatusException(HttpStatus.NOT_FOUND,code); }
}
