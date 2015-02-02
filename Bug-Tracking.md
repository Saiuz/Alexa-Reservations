Bug & Issue Tracking
====================

1. **FIXED BUG** Reservation form, changing the Guest count to 2 for a Kur or another plan that does not specify the room type is not
changing the filter on the rooms (single rooms still showing
2. **FIXED ISSUE** For a plan that specifies the room type as double (e.g. Overnight in Double Room), the guest count changes
 to two but does not allow a switch back to one. It should allow only one guest in a double room.
3. **FIXED BUG** Plan price not working correctly in VM (always showing single price).
4. **FIXED ISSUE** On reservation form, when working with group reservations if we change the number of occupants on the reservation
we don't want the list of available rooms to be updated.
5. **FIXED BUG** The reservation list directive does not update when the reservation checked in status changes - need to
add a watch to the directive - added an event watch
6. **FIXED ISSUE** The reservation list needs to have the ability to, on click, not just display the reservation but also
differentiate which person the reservation is for in a group, business reservation.
7. **FIXED BUG** room-select directive, for multiple business rooms the guest_count property is not correct. Seems to be cross-talk
between the rooms added. e.g. add a double room, then delete, then add a single room, followed by a double room, the
single room guest_count is 2.
8. **FIXED BUG** reservation list directive displaying extra entry for single room in group reservation. only saw this once after adding reservation!
9. **FIXED BUG** reservation modal form - on save button need to clear the error object to clear any previous errors.
10. **FIXED ISSUE** Need way of editing name and price of existing rooms in reservation. If we delete room, it does not show
up as available automatically. - still can't edit room info but we have included the selected rooms in the list of available
rooms so that the same room can be re-added.
11. **FIXED BUG** removing a resource from reservation does not remove the associated expense item. Due to Tingus driver bug.
12 **FIXED BUG-ISSUE** Changing plan of an existing reservation with a room does not update room price. For example, create res single room 1 day,
then change reservation plan to Schnupper, which changes duration to 3 days does not change room price!!!
13 **FIXED BUG** When adding extra days to a fixed plan, the room expense (part of plan) item is getting updated with the extra days. It should not change.
thought I already fixed that. NOTE: This only happens when the reservation is edited after creation and an extra day is added. If the day is added when
the reservation is initially created it works fine.
14 **FIXED ISSUE** editing the name of a firm breaks all guests that are associated with the firm. Have to modify the firm save
routine to also update the guest list with the new name.
15 **FIXED BUG** changes in room aggregation logic are preventing the extra day expense from showing up. May want to try changing is_room flag on expense. Make bill code bcPlan
16 **FIXED BUG** creating reservation with just one click on a room plan day cell adds a reservation with one night. If you then change the type to a fixed duration plan and save,
the nights revert back to 1!!. However, if you select more then one cell (e.g. two nights) it works correctly.
17 **BUG** when room is changed to an existing reservation, the checkin status is not being updated.
18 **FIXED BUB** when a room is edited from the details directive, the To Charges/Rechnung link breaks for reservations that have separate bills in one room.