Bug & Issue Tracking
====================

1. **FIXED BUG** Reservation form, changing the Guest count to 2 for a Kur or another plan that does not specify the room type is not
changing the filter on the rooms (single rooms still showing
2. **FIXED ISSUE** For a plan that specifies the room type as double (e.g. Overnight in Double Room), the guest count changes
 to two but does not allow a switch back to one. It should allow only one guest in a double room.
3. **FIXED BUG** Plan price not working correctly in VM (always showing single price).
4. **ISSUE** On reservation form, when working with group reservations if we change the number of occupants on the reservation
we don't want the list of available rooms to be updated.
5. **BUG** The reservation list directive does not update when the reservation checked in status changes - need to
add a watch to the directive
6. **FIXED ISSUE** The reservation list needs to have the ability to, on click, not just display the reservation but also
differentiate which person the reservation is for in a group, business reservation.
7. **FIXED BUG** room-select directive, for multiple business rooms the guest_count property is not correct. Seems to be cross-talk
between the rooms added. e.g. add a double room, then delete, then add a single room, followed by a double room, the
single room guest_count is 2.
8. **BUG** reservation list directive displaying extra entry for single room in group reservation. only saw this once after adding reservation!