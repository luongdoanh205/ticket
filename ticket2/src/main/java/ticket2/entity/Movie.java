package ticket2.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity @Table(name="movies")
public class Movie extends BaseEntity {
    @Column(nullable=false) public String title;
    @Column(length=4000) public String description;
    public Integer duration;
    public LocalDate releaseDate;
    public String posterUrl;
    public String director;
    public String castNames;
    @Enumerated(EnumType.STRING) public MovieStatus status=MovieStatus.COMING_SOON;
    @ManyToMany @JoinTable(name="movie_genres", joinColumns=@JoinColumn(name="movie_id"), inverseJoinColumns=@JoinColumn(name="genre_id"))
    public Set<Genre> genres=new HashSet<>();
}
