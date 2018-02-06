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
 3. **DONE** ~~Need to develop the checkin logic for a group reservation. For multi-bill group res need to check in the roomsindividually. - need to modify the ax-reservation-details directive to display only the selected guest/room combination if provided.~~
 2. Document the logic around creating the room plans and the Plan itemsTypes that are used by the plans.
 2. **DONE** Redesign the home page, move the stats to a separate page, add the graphic view zimmer plan and the three lists
    currently there.
 6. Consider developing a help system.
 7. Work on checkout logic. Should reservation be locked once it is checked out? Could still print bill, but would we need to edit after the fact?
 8. **DONE** Modify ax-reservation-list to show reservations in red if their end date is in the past, and in some other color if
 their start date is in the past and they are not checked in.
 9. **DONE** Complete final bill and checkout page. Need to figure out group reservations (non-business) (have flag on room?) The
 checkout logic needs to check for early checkout and ask.
 10. **Partially DONE** Need data import code from old excel data.

**08/2017 UPDATES**
Major change will be to move application to MongoDB. There is a few minor issues with the models. Reservations use IDs which are numeric in TingoDB and complex ObjectID type in MongoDB. Need to work out the handling of these. The one point it is problematic is with the plan type and the plan type dropdown. Check for other ids also.

Will need to import the data and convert where needed from the json files into mongodb. I have set up MongoDB on the actual server and have recreated the environment on my dev box.

Bugs / changes on the fly:
1) Address list export, added email and firm and took off firm filter.
2) Spelling corrections Parking charge.
3) Data update: Removed Kur Klassika from kur tab, renamed standard kur data.
4) Updated reservation list to show room number, number of guests and number of rooms in one column
5) Kur bill, removed "Minus" from bill

Bugs that still need fixing
1) **DONE** ~~Plans with half/full pensions, the meal price is 0 and needs to be manually updated.~~
2) **DONE** ~~For private (Separate) bill feature, the address needs to be taken from the guest, not the firm.~~
3) **DONE** ~~colors need to be changed for some rooms~~

~~standard = light blue  9,18,19,47 
suites = lilac 21,26,27,32,42
comfort = dark blue 35,45,46,48,53,58~~

4) **DONE** ~~correct Spelling of Standard !!~~
5) Kur bill, the last page, the u umlaut is printing as a weird symbol, don't know why, it shows up ok in HTML page.

*Issues found during data conversion*
**DONE** ~~Need to tighten up logic around firm and guest on res form and room names for bus res. There are a lot of business reservations that are using guests without firm while the correct guest exists. Should never be able to add a new guest from the res form without a firm when the res has a firm. (Firm is added from res form when user selects a firm then adds a new guest. Group business res are now one bill only. For individual bill group business reservations, need to add individual reservations.)~~

**DONE** Update name virtual property of the guest model. If first name is missing, names in reservations have 'undefined' as first names.

**DONE** ~~Note updating guest names need to update reservations with the guest name if they are still open. - Cant edit guests in rooms.~~

**DONE** ~~Many group business reservations require one bill instead of individual bills. Currently Carola converts them to travel group reservations. Modified the Group business reservation function. Now it defaults to one-bill so the guest names are not required. It still handles the business breakfast logic just like a single room bill. For group
reservations that require individual bills, you will need to create individual business reservations for each room required. ~~


Conversion tasks (to MongoDB) that still need to be done:
1) Replace $q promise wrapped methods with async functions - only replacing those methods I need to touch so far.

Bugs Introduced:
1) **DONE** ~~new res - when new res form comes up, everything is blank until I click cursor in window (not sure if this is from conversion of reservation view model factory or not); Requires $apply in numerous spots to fix this and others~~
2) **DONE** ~~clicking on a reservation link in Gebuhren and Rechnung tabs does not select res - jumps to top of list. Requires a second click to actually select (same fix as 1)~~

Others:
1) **DONE** ~~need way to edit name on room without deleting and replacing room - only for multi-room - not needed with new group single bill logic.~~
2) **DONE** ~~add multi-room business - one bill~~
3) **DONE** ~~remove birthday from address list add number of stays for guest~~
4) **DONE** ~~on checkout, update guests last_stay field with checkout date - need to deal with group business NOTE: Changed to end of res date not checkout date.~~
5) **DONE** ~~adding new guest from res input form needs to supply firm if there is one~~
6) **DONE** ~~Add function to guest form, if name changed then any active reservations with the old name are updated to the new name.~~
7) **DONE** ~~Update the validation error display on the modal forms to hide after a predefined time interval, refactor all common modal code into utility service method.~~
8) Can we modify the address list to not scroll to the top when a res is selected or checked in on pages with lots of entries

NEW BUGS FOUND During testing

**NOTE** Whenever a $q promise is replaced with a native promise then the controller or directive calling the method may need to manually call $scope.$apply()!!!

NEW Features:

Address export
   .. For eastern germany, leading zeros are needed on address list.
   .. Export format separate lines for salutation, name, address. 
   .. Added a Guest and Firm detail popup which shows all reservations for a guest or firm. For firm also shows guest names associated with firm.

