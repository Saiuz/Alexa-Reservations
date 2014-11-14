Development Notes
=================

**I left off here:**

  Done ~~ax-reservation-details directive, need to work through logic for checkout.~~

  Done ~~ax-reservation-list directive, need a way of indicating when a reservation is fully checked in and when it is checked out (strike-through text?)~~

**ISSUE**

Certain expense items are associated with each person. Some are associated per room and per person (e.g. kurtax for
multi-room reservations). We may need to modify the Reserved room collection and the subsequent select room directive to
associate multiple names to a double room and suite. If the person selected has a spouse then this could be
automatically added to the room guest (need guest1 and guest2 properties).
If so then we need to expose the second person's name in the guest modal form. Also, will need to modify logic in
the _updateRequiredExpenses method. left off at ~372 in reservationVM.

**Reservation, Pre-save action (new reservation)**

  1. Done ~~Add the fixed expense items from the room plan.~~
  2. If multiple rooms with individual bills, add the correct number of room expense items. (clone existing from plan).
  3. For items whose counts equal the days stayed, pre-set the counts.

 **To-do items:**

 1. Need to re-purpose the reservation details directive to show basic info about the reservation with buttons
    to checking, checkout edit and view etc the reservation. **In Progress-still need checkout logic**
 2. Redesign the home page, move the stats to a separate page, add the graphic view zimmer plan and the three lists
    currently there.
 3. Need to develop the checkin logic for a group reservation. For multi-bill group res need to check in the rooms
    individually.
 4. expense items must be modified to include room numbers so that expenses can be assigned to each room
 5. Figure out how to handle the old Kur functionality where we need individual bills for two people in the same room.
