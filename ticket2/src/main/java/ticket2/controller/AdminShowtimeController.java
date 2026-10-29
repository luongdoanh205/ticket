package ticket2.controller;

import ticket2.dto.ShowtimeInput;
import ticket2.entity.*;
import ticket2.repository.*;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Objects;

@RestController @io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth") @RequestMapping("/api/admin/showtimes")
class AdminShowtimeController {
    private final ShowtimeRepository shows;
    private final MovieRepository movies;
    private final RoomRepository rooms;
    private final BookingRepository bookings;
    private final BookingSeatRepository bookingSeats;
    AdminShowtimeController(ShowtimeRepository shows,MovieRepository movies,RoomRepository rooms,
                            BookingRepository bookings,BookingSeatRepository bookingSeats) {
        this.shows=shows; this.movies=movies; this.rooms=rooms; this.bookings=bookings; this.bookingSeats=bookingSeats;
    }
    @PostMapping @Transactional ResponseEntity<Showtime> create(@Valid @RequestBody ShowtimeInput input) {
        Showtime show=new Showtime(); copy(input,show); return ResponseEntity.status(HttpStatus.CREATED).body(shows.save(show));
    }
    @PutMapping("/{id}") @Transactional Showtime update(@PathVariable Long id,@Valid @RequestBody ShowtimeInput input) {
        Showtime show=shows.findById(id).orElseThrow(() -> missing("SHOWTIME_NOT_FOUND")); copy(input,show); return shows.save(show);
    }
    @DeleteMapping("/{id}") @Transactional ResponseEntity<Void> cancel(@PathVariable Long id) {
        Showtime show=shows.findById(id).orElseThrow(() -> missing("SHOWTIME_NOT_FOUND"));
        show.status=ShowtimeStatus.CANCELLED; shows.save(show);
        for(Booking booking:bookings.findAll()) if(booking.showtime.id.equals(id)&&booking.status==BookingStatus.PENDING) {
            booking.status=BookingStatus.CANCELLED; bookings.save(booking);
            bookingSeats.findByBookingId(booking.id).forEach(seat -> seat.holdStatus=HoldStatus.RELEASED);
        }
        return ResponseEntity.noContent().build();
    }
    private void copy(ShowtimeInput input,Showtime show) {
        if(!input.endAt().isAfter(input.startAt())||!input.startAt().isAfter(LocalDateTime.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"INVALID_SHOWTIME_TIME");
        Room room=rooms.findById(input.roomId()).orElseThrow(() -> missing("ROOM_NOT_FOUND"));
        if(show.id!=null && bookingSeats.existsByShowtimeId(show.id)
                && (!Objects.equals(show.room.id,room.id)
                || !Objects.equals(show.startAt,input.startAt())
                || !Objects.equals(show.endAt,input.endAt())
                || !Objects.equals(show.movie.id,input.movieId())))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"SHOWTIME_HAS_BOOKING_HISTORY");
        for(Showtime other:shows.findAll()) if(Objects.equals(other.room.id,room.id)
                && !Objects.equals(other.id,show.id) && other.status!=ShowtimeStatus.CANCELLED
                && input.startAt().isBefore(other.endAt)&&input.endAt().isAfter(other.startAt))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"SHOWTIME_OVERLAP");
        show.movie=movies.findById(input.movieId()).orElseThrow(() -> missing("MOVIE_NOT_FOUND"));
        show.room=room; show.startAt=input.startAt(); show.endAt=input.endAt(); show.basePrice=input.basePrice();
        if(input.status()!=null) show.status=input.status();
    }
    private ResponseStatusException missing(String code) { return new ResponseStatusException(HttpStatus.NOT_FOUND,code); }
}
