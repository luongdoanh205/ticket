package ticket2.controller;

import ticket2.dto.PageResult;
import ticket2.entity.*;
import ticket2.repository.*;
import jakarta.validation.constraints.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@Transactional(readOnly = true)
class CatalogController {
    private final MovieRepository movies;
    private final CinemaRepository cinemas;
    private final RoomRepository rooms;
    private final SeatRepository seats;
    private final ShowtimeRepository showtimes;
    private final GenreRepository genres;
    private final BookingSeatRepository bookingSeats;

    CatalogController(MovieRepository movies, CinemaRepository cinemas, RoomRepository rooms,
                      SeatRepository seats, ShowtimeRepository showtimes, GenreRepository genres,
                      BookingSeatRepository bookingSeats) {
        this.movies = movies;
        this.cinemas = cinemas;
        this.rooms = rooms;
        this.seats = seats;
        this.showtimes = showtimes;
        this.genres = genres;
        this.bookingSeats = bookingSeats;
    }

    @GetMapping("/movies")
    PageResult<Movie> movies(@RequestParam(defaultValue="") String q,
                             @RequestParam(required=false) MovieStatus status,
                             @RequestParam(required=false) Long genreId,
                             @RequestParam(defaultValue="0") int page,
                             @RequestParam(defaultValue="20") int size) {
        var results = status == null ? movies.findByTitleContainingIgnoreCase(q)
                : movies.findByTitleContainingIgnoreCaseAndStatus(q, status);
        if (genreId != null)
            results = results.stream().filter(movie -> movie.genres.stream()
                    .anyMatch(genre -> genre.id.equals(genreId))).toList();
        return PageResult.of(results, page, size);
    }

    @GetMapping("/movies/{id}")
    Movie movie(@PathVariable Long id) {
        return movies.findWithGenresById(id).orElseThrow(() -> missing("MOVIE_NOT_FOUND"));
    }

    @GetMapping("/genres") List<Genre> genres() { return genres.findAll(); }
    @GetMapping("/cinemas") List<Cinema> cinemas() { return cinemas.findAll(); }
    @GetMapping("/cinemas/{id}/rooms") List<Room> rooms(@PathVariable Long id) { return rooms.findByCinemaId(id); }

    @GetMapping("/rooms/{id}/seats")
    List<Map<String, Object>> seats(@PathVariable Long id, @RequestParam(required=false) Long showtimeId) {
        Map<Long, String> busy = new HashMap<>();
        if (showtimeId != null) {
            Showtime showtime = showtimes.findById(showtimeId).orElseThrow(() -> missing("SHOWTIME_NOT_FOUND"));
            if (!showtime.room.id.equals(id))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SHOWTIME_ROOM_MISMATCH");
            for (BookingSeat bookingSeat : bookingSeats.findByShowtimeId(showtimeId)) {
                if (bookingSeat.holdStatus == HoldStatus.SOLD) busy.put(bookingSeat.seat.id, "SOLD");
                else if (bookingSeat.holdStatus == HoldStatus.HELD
                        && bookingSeat.holdExpiresAt.isAfter(LocalDateTime.now()))
                    busy.put(bookingSeat.seat.id, "HELD");
            }
        }
        return seats.findByRoomIdOrderByRowLabelAscSeatNumberAsc(id).stream().map(seat ->
                Map.<String, Object>of("id", seat.id, "rowLabel", seat.rowLabel,
                        "seatNumber", seat.seatNumber, "seatType", Objects.toString(seat.seatType, "STANDARD"),
                        "active", seat.active, "status", !seat.active ? "INACTIVE"
                                : busy.getOrDefault(seat.id, "AVAILABLE"))).toList();
    }

    @GetMapping("/showtimes")
    List<Map<String, Object>> showtimes(@RequestParam(required=false) Long movieId,
                                        @RequestParam(required=false) Long cinemaId,
                                        @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDateTime from = date.atStartOfDay(), to = date.plusDays(1).atStartOfDay();
        List<Showtime> results;
        if (movieId != null && cinemaId != null)
            results = showtimes.findByMovieIdAndRoomCinemaIdAndStartAtBetweenAndStatusNot(
                    movieId, cinemaId, from, to, ShowtimeStatus.CANCELLED);
        else if (movieId != null)
            results = showtimes.findByMovieIdAndStartAtBetweenAndStatusNot(movieId, from, to, ShowtimeStatus.CANCELLED);
        else if (cinemaId != null)
            results = showtimes.findByRoomCinemaIdAndStartAtBetweenAndStatusNot(cinemaId, from, to, ShowtimeStatus.CANCELLED);
        else results = showtimes.findByStartAtBetweenAndStatusNot(from, to, ShowtimeStatus.CANCELLED);
        return results.stream().map(this::showtimeView).toList();
    }

    private Map<String, Object> showtimeView(Showtime showtime) {
        List<Seat> activeSeats = seats.findByRoomIdOrderByRowLabelAscSeatNumberAsc(showtime.room.id)
                .stream().filter(seat -> seat.active).toList();
        long occupied = bookingSeats.findByShowtimeId(showtime.id).stream()
                .filter(seat -> seat.holdStatus == HoldStatus.SOLD
                        || (seat.holdStatus == HoldStatus.HELD && seat.holdExpiresAt.isAfter(LocalDateTime.now())))
                .map(seat -> seat.seat.id).distinct().count();
        String status = !activeSeats.isEmpty() && occupied >= activeSeats.size()
                ? "FULL" : showtime.status.toString();
        return Map.of("id", showtime.id,
                "movie", Map.of("id", showtime.movie.id, "title", showtime.movie.title,
                        "posterUrl", Objects.toString(showtime.movie.posterUrl, "")),
                "cinema", Map.of("id", showtime.room.cinema.id, "name", showtime.room.cinema.name),
                "room", Map.of("id", showtime.room.id, "name", showtime.room.name),
                "startAt", showtime.startAt, "endAt", showtime.endAt,
                "basePrice", showtime.basePrice, "status", status);
    }

    private ResponseStatusException missing(String code) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, code);
    }
}
