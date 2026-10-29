package ticket2.entity;

import jakarta.persistence.*;

@Entity @Table(name="rooms", uniqueConstraints=@UniqueConstraint(columnNames={"cinema_id","name"}))
public class Room extends BaseEntity {
    @ManyToOne(optional=false) public Cinema cinema;
    @Column(nullable=false) public String name;
    public String roomType;
    @Enumerated(EnumType.STRING) public RecordStatus status=RecordStatus.ACTIVE;
}
