package ticket2.entity;

import jakarta.persistence.*;

@Entity @Table(name="cinemas")
public class Cinema extends BaseEntity {
    @Column(nullable=false) public String name;
    public String address;
    public String phone;
    @Enumerated(EnumType.STRING) public RecordStatus status=RecordStatus.ACTIVE;
}
