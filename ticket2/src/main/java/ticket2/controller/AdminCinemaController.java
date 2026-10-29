package ticket2.controller;

import ticket2.dto.*;
import ticket2.entity.*;
import ticket2.repository.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @io.swagger.v3.oas.annotations.security.SecurityRequirement(name="bearerAuth") @RequestMapping("/api/admin")
class AdminCinemaController {
    private final CinemaRepository cinemas;
    private final RoomRepository rooms;
    private final SeatRepository seats;
    AdminCinemaController(CinemaRepository cinemas,RoomRepository rooms,SeatRepository seats) {
        this.cinemas=cinemas; this.rooms=rooms; this.seats=seats;
    }
    @PostMapping("/cinemas") ResponseEntity<Cinema> createCinema(@Valid @RequestBody CinemaInput input) {
        Cinema cinema=new Cinema(); copy(input,cinema); return ResponseEntity.status(HttpStatus.CREATED).body(cinemas.save(cinema));
    }
    @PutMapping("/cinemas/{id}") Cinema updateCinema(@PathVariable Long id,@Valid @RequestBody CinemaInput input) {
        Cinema cinema=cinemas.findById(id).orElseThrow(() -> missing("CINEMA_NOT_FOUND")); copy(input,cinema); return cinemas.save(cinema);
    }
    private void copy(CinemaInput input,Cinema cinema) {
        cinema.name=input.name(); cinema.address=input.address(); cinema.phone=input.phone();
        if(input.status()!=null) cinema.status=input.status();
    }
    @PostMapping("/rooms") ResponseEntity<Room> createRoom(@Valid @RequestBody RoomInput input) {
        Room room=new Room(); copy(input,room); return ResponseEntity.status(HttpStatus.CREATED).body(rooms.save(room));
    }
    @PutMapping("/rooms/{id}") Room updateRoom(@PathVariable Long id,@Valid @RequestBody RoomInput input) {
        Room room=rooms.findById(id).orElseThrow(() -> missing("ROOM_NOT_FOUND")); copy(input,room); return rooms.save(room);
    }
    private void copy(RoomInput input,Room room) {
        room.cinema=cinemas.findById(input.cinemaId()).orElseThrow(() -> missing("CINEMA_NOT_FOUND"));
        room.name=input.name(); room.roomType=input.roomType(); if(input.status()!=null) room.status=input.status();
    }
    @PostMapping("/seats") ResponseEntity<Seat> createSeat(@Valid @RequestBody SeatInput input) {
        Seat seat=new Seat(); copy(input,seat); return ResponseEntity.status(HttpStatus.CREATED).body(seats.save(seat));
    }
    @PutMapping("/seats/{id}") Seat updateSeat(@PathVariable Long id,@Valid @RequestBody SeatInput input) {
        Seat seat=seats.findById(id).orElseThrow(() -> missing("SEAT_NOT_FOUND")); copy(input,seat); return seats.save(seat);
    }
    private void copy(SeatInput input,Seat seat) {
        seat.room=rooms.findById(input.roomId()).orElseThrow(() -> missing("ROOM_NOT_FOUND"));
        seat.rowLabel=input.rowLabel(); seat.seatNumber=input.seatNumber(); seat.seatType=input.seatType();
        seat.active=input.active()==null || input.active();
    }
    private ResponseStatusException missing(String code) { return new ResponseStatusException(HttpStatus.NOT_FOUND,code); }
}
