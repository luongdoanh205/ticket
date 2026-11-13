package ticket2.service;

import ticket2.entity.Booking;
import ticket2.entity.BookingSeat;
import ticket2.entity.BookingStatus;
import ticket2.entity.HoldStatus;
import ticket2.repository.BookingRepository;
import ticket2.repository.BookingSeatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class BookingExpiryJobTest {

    private BookingRepository bookingRepository;
    private BookingSeatRepository bookingSeatRepository;
    private BookingExpiryJob bookingExpiryJob;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        bookingSeatRepository = mock(BookingSeatRepository.class);
        bookingExpiryJob = new BookingExpiryJob(bookingRepository, bookingSeatRepository);
    }

    @Test
    @DisplayName("Không có đơn PENDING hết hạn thì không thực hiện update")
    void testNoExpiredBookingsDoesNothing() {
        when(bookingRepository.findByStatusAndHoldExpiresAtBefore(eq(BookingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        bookingExpiryJob.expireHolds();

        verify(bookingRepository, never()).save(any());
        verify(bookingSeatRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Tự động chuyển status EXPIRED và giải phóng ghế RELEASED cho các đơn quá hạn")
    void testExpiresPendingBookingsAndReleasesSeats() {
        Booking expiredBooking = new Booking();
        expiredBooking.id = 100L;
        expiredBooking.status = BookingStatus.PENDING;
        expiredBooking.holdExpiresAt = LocalDateTime.now().minusMinutes(5);

        BookingSeat seat1 = new BookingSeat();
        seat1.id = 1L;
        seat1.holdStatus = HoldStatus.HELD;

        BookingSeat seat2 = new BookingSeat();
        seat2.id = 2L;
        seat2.holdStatus = HoldStatus.HELD;

        when(bookingRepository.findByStatusAndHoldExpiresAtBefore(eq(BookingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredBooking));
        when(bookingSeatRepository.findByBookingId(100L))
                .thenReturn(List.of(seat1, seat2));

        bookingExpiryJob.expireHolds();

        assertEquals(BookingStatus.EXPIRED, expiredBooking.status);
        assertEquals(HoldStatus.RELEASED, seat1.holdStatus);
        assertEquals(HoldStatus.RELEASED, seat2.holdStatus);

        verify(bookingSeatRepository).saveAll(argThat(iterable -> {
            List<BookingSeat> list = (List<BookingSeat>) iterable;
            return list.size() == 2 && list.stream().allMatch(s -> s.holdStatus == HoldStatus.RELEASED);
        }));
        verify(bookingRepository).save(expiredBooking);
    }
}
