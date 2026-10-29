package ticket2.service;

import ticket2.entity.*;
import ticket2.repository.BookingRepository;
import ticket2.repository.BookingSeatRepository;

import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
class BookingExpiryJob {
 private final BookingRepository bookings;private final BookingSeatRepository seats;
 BookingExpiryJob(BookingRepository b,BookingSeatRepository s){bookings=b;seats=s;}
 @Scheduled(fixedDelay=30000)
 @Transactional
 void expireHolds(){for(Booking b:bookings.findByStatusAndHoldExpiresAtBefore(BookingStatus.PENDING,LocalDateTime.now())){b.status=BookingStatus.EXPIRED;seats.findByBookingId(b.id).forEach(x->x.holdStatus=HoldStatus.RELEASED);bookings.save(b);}}
}
