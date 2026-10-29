package ticket2.entity;

import jakarta.persistence.*;

@Entity @Table(name="seats", uniqueConstraints=@UniqueConstraint(columnNames={"room_id","row_label","seat_number"}))
public class Seat extends BaseEntity {
    @ManyToOne(optional=false) public Room room;
    @Column(name="row_label",nullable=false) public String rowLabel;
    @Column(name="seat_number",nullable=false) public Integer seatNumber;
    public String seatType;
    @Column(nullable=false) public boolean active=true;
}
