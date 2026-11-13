package ticket2.service;

import ticket2.entity.Booking;
import ticket2.entity.BookingSeat;
import ticket2.entity.BookingStatus;
import ticket2.entity.HoldStatus;
import ticket2.repository.BookingRepository;
import ticket2.repository.BookingSeatRepository;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryJob.class);

    private final BookingRepository bookings;
    private final BookingSeatRepository seats;

    public BookingExpiryJob(BookingRepository bookings, BookingSeatRepository seats) {
        this.bookings = bookings;
        this.seats = seats;
    }

    @Scheduled(initialDelay = 10000, fixedDelay = 30000)
    @Transactional
    public void expireHolds() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = bookings.findByStatusAndHoldExpiresAtBefore(BookingStatus.PENDING, now);

        if (expiredBookings.isEmpty()) {
            return;
        }

        log.debug("Phát hiện {} đơn đặt vé PENDING quá hạn cần giải phóng", expiredBookings.size());

        for (Booking booking : expiredBookings) {
            try {
                booking.status = BookingStatus.EXPIRED;
                List<BookingSeat> bookingSeats = seats.findByBookingId(booking.id);
                for (BookingSeat seat : bookingSeats) {
                    seat.holdStatus = HoldStatus.RELEASED;
                }
                seats.saveAll(bookingSeats);
                bookings.save(booking);
                log.info("Đã tự động giải phóng đơn đặt vé hết hạn ID: {}, số ghế: {}", booking.id, bookingSeats.size());
            } catch (Exception ex) {
                log.error("Lỗi khi giải phóng đơn đặt vé ID {}: {}", booking.id, ex.getMessage(), ex);
            }
        }
    }
}
