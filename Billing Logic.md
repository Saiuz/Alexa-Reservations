Billing Logic and Calculation Notes
===================================
The general design approach is to treat all billable items as "ExpenseItems" that are added to a reservation. These
expense items have a price associated with them and can be multiplied by a count or by the number of days of the
reservation. However, because of some of the business logic around certain types of reservations and some of the rules
associated with certain expense items, the logic involved in designing and handling expense items becomes complex.

##Taxes:

**Kurtaxe** - The city collects a kur tax. This tax is a number of conditions:

  1. The tax is a per person per day tax.
  2. If two people share a room, then the logic seems to be dependent on the type of reservation. For a standard or business
  reservation, the tax is per person per day. For a Kur where each person gets their own bill, the second person pays a
  lower tax rate.
  3. Some people get a reduced rate (10% discount Ermässigung).
  4. Some people get to wave the Kurtax.
  5. Kurtax has a 7% sales tax included in the price.

**Sales taxes**

There are two different tax rates for different hotel expenses. For example hotel rooms are taxed at 7% while food and
drink are taxed at 19%.

 **Discussion:**

   Treating Kurtaxe as an expense item can handle conditions 1 and 4 easily. (4 simply set price to 0). To handle item
 3, we need a kurtaxe specific flag that indicates a 10% discount, or some easy way of handling the calculation in the
 UI. For item 2, the solution will depend on how the concept of two separate bills for people who share the same room
 is solved.

  The two-tier tax requires that expense items have a tax rate associated with them. Where it gets complicated is for
 the inclusive package plan offerings that include say room and breakfast or other included items at different tax rates.
 This can be handled by either including two tax rate and amount fields per item so that total price can be broken up
 into the amount at 19% and the amount at 7%. Alternatively, the included items can be added to the bill for tax
 calculations but not show up on the bill. Both approaches have pros and cons. The first approach makes bill tax
 calculation easy, however, one loses flexibility if an included item has to be refunded. The second approach is more
 fine grained but the calculation of tax for the plan package becomes more complex because all items that make up the
 plan have to be included as expense items and the plan price has to broken down into all its parts.

## Reservation "Plan" Rules
The hotel offers a number of fixed day plans. These plans are of fixed duration and offer a number of pre-included
items. However there needs to be some flexibility in billing these plans. Here are some of the special conditions:

1. People may stay extra days. The extra days must be handled separately. For example if the plan is for 3 days, the
plan price item in the bill must say, for example: 3 Tage Urlaub in der Kurstadt ... 356,00, then there needs to be an
extra item that says, for example: 2 tage Extra ... 120,00 that represent the room and breakfast.

2. Some plans offer activities included in the price. These activities are some times not available and therefore must
be subtracted from the plan price. Normally these included items are not displayed on the bill. However, if a credit
is issued then the item should be displayed and its cost removed from the total bill.

3. Plans are priced per person with typically a single person up-charge.

 **Discussion:**

   The best way to handle condition 1 is to have a "Plan" expense item vs a straight room expense item when the room plan selection
to the reservation is of type "Plan". If the actual reservation is longer, then there can be an additional item added for
the remaining days and room price. The only complicating logic will be to determine if the extra days are in a double
room or single room.

   For condition 2, the best way to handle these is to add them to the reservation when the plan is selected but these
items do not show up on the bill. The UI would need a way of exposing them so that the can be refunded.

  For condition 3, this is easily handled by the Reservation VM. The Reservation view model calculates the total plan
price. This would need to be added to the Plan expense item.

  Note, kurtaxe is still charged for plans and listed separately per bill. Again there does not seem to be any discount
for the second person for a non-Kur plan.

##Standard and Business Reservations - Non-package plan
These room plans are rather straight forward to handle from an expense point of view. The basic standard plans include
breakfast in the room price. For these room plans, the breakfast does not need to be added as an expense, or if added
for tax purposes, is not shown. The business plans do not include breakfast. This is an added expense. For business
reservations, the extras, such as drinks and snacks are shown on a separate page of the bill and is typically
paid separately. For standard reservations, breakfast is included in the advertised room prices. Therefore,
logic would be needed to (behind the scenes) remove the breakfast price from the room price and add it to the
breakfast expense item entry. This may be handled when the bill taxes are calculated. This sort of thing would not
show up on the customer's bill other than being baked in to the tax summary.

##Group Reservations
There are two types of group reservations, Business and Tour. For a Business Group, multiple rooms are associated
with the reservation and each room has its own bill. The logic for a standard business reservation applies to each room.
For a a Tour group, There is one bill for all the rooms, however, each individual room can have extra charges for food
and drink. These extra charges need to be handled separately as a bill paid by the room occupant.

##Kur Reservations
For Kur reservations, the logic gets a bit more complicated. Kur reservations all seem to be plan based.  There are
special medical treatments that are offered and the price of the treatments depend on the insurance company, also there
are some special Kurtaxe rules and self-paid portion of treatments. Here is a more detailed list:

1. Kur tax can be discounted or free (see above)
2. Eigenanteil - 10% of the treatments are paid by the guest. This amount is subtracted from the total of the treatments
amount and shows up as a line item in the bill.
3. The treatment offerings and prices are different for the different insurance companies. The current program handles
only three insurance types (VDAK, AOK etc, and Private) in reality there are a lot more plans.
4. If two people are on Kur and share a room, they require separate bills. The plan rates are prorated per person. In
the old program, the second person's kurtaxe is reduced. not clear if this is still the case.

## Design of the ExpenseItem schema
To make the expense item schema flexible enough for handling all of the above logic, there needs to be a number of
properties that are used only in specific cases. A summary of the logic is as follows:

1. Expense items must have a room associated with them (to handle group plan cases)
2. Expense items must have a guest name of a primary/secondary guest indicator (handling shared room-separate bill).
NOTE: This could also be handled by having separate reservations for each guest in the room but this is probably not
the best way to handle things. May cause more work for the hotel.
3. Some items should not be displayed on the normal bill. However the UI will need to access them in case of a credit.

##Relation of expense items to RoomPlan
The RoomPlan schema has a required_items array that contains the required expense types that are associated with the
room plan. When defining each room plan, the items in the required_items array are copied to the reservation and
business logic are applied as needed. For example, an item for the room is added and the count is filled in with the
number of days, or multiple room items are added for a group reservation. Rather than associating acutal ExpenseItem
subdocuments with the definition of the room, plan, the required_items array should contain only the names of the
expense items that actually exist in the the ItemTypes collection. **THis is a change.!!!!** This approach minimizes
changes in say tax rates etc. It requires rework. Need a method to retrieve the actual ItemTypes from the collection
from the string array (in clause)

###Other changes needed
It looks like we need to add two guest names to the reservation and reservedRoom schema. These are needed for business
reservations in a double room (I think) and for a Kur in a double room (definitely). The UI logic should be such that
the second name is shown only when a business reservation (or bus. group) and a Kur reservation is selected and the
plan or room selection indicates a double room. For a Kur guest, it second person would be a spouse. The address schema
does have a place for a second name, however it may be better to add the person separately to the address list. Need to
think through this more.

###Logic to handle changes to expense items based on various reservation changes.

**Reservation Type Change** - This is a major change in the reservation. To simplify the logic the best thing to do
is to completely remove all rooms and all current expenses associated with the reservation. This is handled by the
`reservationTypeChanged` method.

**Room Plan Change** - If the room plan changes, we need to remove all of the current 'Plan'-based expense items and
add the required expense items for the new plan. We follow the business logic based on plan type and item type.

**Room Change or Occupant Change** - If the room number or number of rooms changes then we must update all expenses.

If the room count is the same but the room number or type changes, then we need to do the following:

- all expense items - update the room number with the new room number(s)
- required items - if type changes (single/double) update the room item's price and also check plan logic to make sure
 we don't have to add or remove a room item.


When changing per person price for plan, we must figure out how to discount the calculations. The most logical approach
 is to adjust the room price by the difference. For example new room price == (curr price (double or single) - (plan price - discount price) / duration)

Need to handle the case when a guest takes a plan then extends it by a couple of days. This is handled by adding an extra
item that adds separately the extra days room. Breakfast and Kurtax are already handled correctly. The approach to take
will be to create this expense item on-the-fly rather than have it pre-stored in the ItemTypes collection.

NOTE NOTE: Need to check through the code that we are not non-selectively clearing the expenses array when the reservation changes.


Arg! New logic change? Room items are added as current, some changes to flags and tax rate is not baked in, breakfast and kurtax items are added automatically.
Breakfast (for business), telephone and Parking is added automatically, parking is added based on the resources booked.