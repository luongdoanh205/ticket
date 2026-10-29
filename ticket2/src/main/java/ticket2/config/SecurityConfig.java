package ticket2.config;

import ticket2.entity.*;
import ticket2.repository.UserRepository;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.List;

@Configuration
class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
 @Bean SecurityFilterChain filterChain(HttpSecurity http,TokenFilter tokenFilter)throws Exception {
  return http.csrf(c->c.disable())
   .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a->a
    .requestMatchers("/api/auth/**","/api/movies/**","/api/genres/**","/api/cinemas/**","/api/rooms/**","/api/showtimes/**","/swagger-ui.html","/swagger-ui/**","/v3/api-docs/**","/webjars/**","/error").permitAll()
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .requestMatchers("/api/bookings/**","/api/me/**","/api/tickets/**").hasAnyRole("CUSTOMER","ADMIN")
    .requestMatchers("/api/**").denyAll()
    .anyRequest().denyAll())
   .addFilterBefore(tokenFilter,UsernamePasswordAuthenticationFilter.class).build();
 }
}

@Component
class TokenFilter extends OncePerRequestFilter {
 private final TokenService tokens;private final UserRepository users;
 TokenFilter(TokenService t,UserRepository u){tokens=t;users=u;}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{String h=req.getHeader("Authorization");if(h!=null&&h.startsWith("Bearer "))tokens.validate(h.substring(7)).flatMap(c->users.findByEmail(c[0]).filter(u->u.status==AccountStatus.ACTIVE)).ifPresent(u->{var auth=new UsernamePasswordAuthenticationToken(u.email,null,List.of(new SimpleGrantedAuthority("ROLE_"+u.role.name())));org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);});chain.doFilter(req,res);}
}
