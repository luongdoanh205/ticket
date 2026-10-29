package ticket2.controller;

import ticket2.dto.*;
import ticket2.entity.*;
import ticket2.repository.*;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth") @RequestMapping("/api/admin")
class AdminMovieController {
    private final MovieRepository movies;
    private final GenreRepository genres;
    AdminMovieController(MovieRepository movies,GenreRepository genres) { this.movies=movies; this.genres=genres; }

    @PostMapping("/movies") @Transactional ResponseEntity<Movie> createMovie(@Valid @RequestBody MovieInput input) {
        Movie movie=new Movie(); copy(input,movie); return ResponseEntity.status(HttpStatus.CREATED).body(movies.save(movie));
    }
    @PutMapping("/movies/{id}") @Transactional Movie updateMovie(@PathVariable Long id,@Valid @RequestBody MovieInput input) {
        Movie movie=movies.findById(id).orElseThrow(() -> missing("MOVIE_NOT_FOUND")); copy(input,movie); return movies.save(movie);
    }
    @DeleteMapping("/movies/{id}") ResponseEntity<Void> hideMovie(@PathVariable Long id) {
        Movie movie=movies.findById(id).orElseThrow(() -> missing("MOVIE_NOT_FOUND"));
        movie.status=MovieStatus.ENDED; movies.save(movie); return ResponseEntity.noContent().build();
    }
    private void copy(MovieInput input,Movie movie) {
        movie.title=input.title(); movie.description=input.description(); movie.duration=input.duration();
        movie.releaseDate=input.releaseDate(); movie.posterUrl=input.posterUrl(); movie.director=input.director();
        movie.castNames=input.castNames(); if(input.status()!=null) movie.status=input.status();
        if(input.genreIds()!=null) {
            movie.genres.clear();
            for(Long id:input.genreIds()) movie.genres.add(genres.findById(id).orElseThrow(() -> missing("GENRE_NOT_FOUND")));
        }
    }
    @PostMapping("/genres") ResponseEntity<Genre> createGenre(@Valid @RequestBody GenreInput input) {
        Genre genre=new Genre(); genre.name=input.name(); genre.description=input.description();
        return ResponseEntity.status(HttpStatus.CREATED).body(genres.save(genre));
    }
    @PutMapping("/genres/{id}") Genre updateGenre(@PathVariable Long id,@Valid @RequestBody GenreInput input) {
        Genre genre=genres.findById(id).orElseThrow(() -> missing("GENRE_NOT_FOUND"));
        genre.name=input.name(); genre.description=input.description(); return genres.save(genre);
    }
    @DeleteMapping("/genres/{id}") ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        genres.delete(genres.findById(id).orElseThrow(() -> missing("GENRE_NOT_FOUND")));
        return ResponseEntity.noContent().build();
    }
    private ResponseStatusException missing(String code) { return new ResponseStatusException(HttpStatus.NOT_FOUND,code); }
}
