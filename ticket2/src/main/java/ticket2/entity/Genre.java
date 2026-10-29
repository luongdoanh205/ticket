package ticket2.entity;

import jakarta.persistence.*;

@Entity @Table(name="genres", uniqueConstraints=@UniqueConstraint(columnNames="name"))
public class Genre extends BaseEntity {
    @Column(nullable=false) public String name;
    public String description;
}
