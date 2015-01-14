Development Notes
=================

**Upgrade to angular 1.3**
Since this app depends on angular-bootstrap, I will not upgrade until a new version of angular-bootstrap comes out. There
appears to be too many bugs at this time (Jan/15)


 **TASKS**
  Done ~~ax-reservation-details directive, need to work through logic for checkout.~~

  Done ~~ax-reservation-list directive, need a way of indicating when a reservation is fully checked in and when it is checked out (strike-through text?)~~

  ~~**DONE: Added guest_count property to reservedRoom schema. Need to have the ax-room-select directive populate this some how. Only
  need to manually populate when Travel group reservation, other reservations should be able to auto populate.**
  logic for populating guest_count:
    normally the guest_count can be inferred by the room (double vs single) and, in the cases where the name field doesn't show up,
    the number of guest names actually provided in guest and guest2 parameters, however there needs to be a checkbox
    that appears with a double room for the cases when names are solicited (group reservations). This checkbox would
    indicate that only one person is staying in a double room. When it is checked, then only one name box is shown and the
    second guest name is cleared.~~


**ISSUES**

**DONE** ~~Currently, the UI logic prevents changing the Guest count to 1 when a Double room plan is selected. There may be a need
to allow 1 guest to stay in a double room.~~

Certain expense items are associated with each person. Some are associated per room and per person (e.g. kurtax for
multi-room reservations). We may need to modify the Reserved room collection and the subsequent select room directive to
associate multiple names to a double room and suite. If the person selected has a spouse then this could be
automatically added to the room guest (need guest1 and guest2 properties).
If so then we need to expose the second person's name in the guest modal form. Also, will need to modify logic in
the _updateRequiredExpenses method. left off at ~372 in reservationVM.

**NEEDED CHANGES**

1. **DONE** Resources also need a name associated with them (like rooms) for multiple room business reservations.

**Reservation, Pre-save action (new reservation)**

  1. Done ~~Add the fixed expense items from the room plan.~~
  2. **Done** If multiple rooms with individual bills, add the correct number of room expense items. (clone existing from plan).
  3. Complete rigorous testing of expense item addition, modification when a reservation is edited.

 **To-do items:**

 1. **DONE** ~~Need to re-purpose the reservation details directive to show basic info about the reservation with buttons
    to checking, checkout edit and view etc the reservation.~~
 4. **DONE**expense items must be modified to include room numbers so that expenses can be assigned to each room
 5. **DONE** ~~Figure out how to handle the old Kur functionality where we need individual bills for two people in the same room.~~
 3. **PARTIALLY DONE**Need to develop the checkin logic for a group reservation. For multi-bill group res need to check in the rooms
    individually. - need to modify the ax-reservation-details directive to display only the selected guest/room combination if provided.
 2. Document the logic around creating the room plans and the Plan itemsTypes that are used by the plans.
 2. Redesign the home page, move the stats to a separate page, add the graphic view zimmer plan and the three lists
    currently there.
 6. Consider developing a help system.
 7. Work on checkout logic. Should reservation be locked once it is checked out? Could still print bill, but would we need to edit after the fact?
 8. Modify ax-reservation-list to show reservations in red if their end date is in the past, and in some other color if
 their start date is in the past and they are not checked in.
 9. Complete final bill and checkout page. Need to figure out group reservations (non-business) (have flag on room?) The
 checkout logic needs to check for early checkout and ask.
 10. Need data import code from old excel data.
 11. REVAMP? checkin logic - checkout logic. For multiple room reservations, we currently just have a flag for the room. Is this enough? do we actually need a date?

