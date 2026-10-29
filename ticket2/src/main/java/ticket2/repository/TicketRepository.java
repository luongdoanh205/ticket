package ticket2.repository;
import ticket2.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface TicketRepository extends JpaRepository<Ticket,Long>{List<Ticket> findByBookingSeatBookingUserId(Long id);Optional<Ticket> findByTicketCode(String code);long countByBookingSeatBookingStatusAndStatus(BookingStatus bookingStatus,TicketStatus status);}
