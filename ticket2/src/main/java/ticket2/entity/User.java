package ticket2.entity;

import jakarta.persistence.*;

@Entity @Table(name="users", indexes=@Index(columnList="email", unique=true))
public class User extends BaseEntity {
    @Column(nullable=false) public String fullName;
    @Column(nullable=false, unique=true) public String email;
    @Column(nullable=false) public String passwordHash;
    public String phone;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public AccountStatus status=AccountStatus.ACTIVE;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public Role role=Role.CUSTOMER;
}
