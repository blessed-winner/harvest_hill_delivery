# Testing Checklist - Harvest Hill Delivery

## Pre-Testing Setup
- [ ] Backend server running (`python manage.py runserver`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Database seeded with test data (`python manage.py seed_data`)
- [ ] At least one admin, farmer, and client user created

---

## Test 1: Price Filter Removal ✅
**Expected:** Price filter slider should NOT appear in Catalog

### Steps:
1. Login as client
2. Navigate to Catalog
3. Check left sidebar filters

### Verification:
- [ ] No price range slider visible
- [ ] Only "In Season" and "Bulk Available" toggles present
- [ ] Categories list visible

---

## Test 2: In Season Filter ✅
**Expected:** Filter shows only high-urgency products

### Steps:
1. Login as client
2. Navigate to Catalog
3. Toggle "In Season" ON
4. Check displayed products

### Verification:
- [ ] Products have "SEASONAL" badge
- [ ] Backend receives `urgency=high` parameter
- [ ] Product count updates correctly
- [ ] Toggle OFF restores all products

---

## Test 3: Bulk Available Filter ✅
**Expected:** Shows only products with quantity >= 100kg

### Steps:
1. Login as client
2. Navigate to Catalog
3. Toggle "Bulk Available" ON
4. Check product quantities

### Verification:
- [ ] All displayed products have quantity >= 100kg
- [ ] Product count updates correctly
- [ ] Toggle OFF restores all products
- [ ] Works with other filters (combined filtering)

---

## Test 4: Cart Count Fix ✅
**Expected:** Cart starts at 0, updates dynamically

### Steps:
1. Login as client (fresh session)
2. Check cart icon in header
3. Add product to cart
4. Check cart count

### Verification:
- [ ] Initial cart count shows 0 (not 17)
- [ ] Count increases when adding items
- [ ] Count persists on page refresh
- [ ] Count decreases when removing items

---

## Test 5: Delivery Note Pagination ✅
**Expected:** 8 items per page with dynamic pages

### Steps:
1. Login as client
2. Navigate to Orders
3. Check delivery notes table

### Verification:
- [ ] Maximum 8 items per page
- [ ] Pagination controls appear when > 8 items
- [ ] Page numbers update correctly
- [ ] Next/Previous buttons work
- [ ] No "1/1" shown when only 1 page exists

---

## Test 6: Admin Dashboard Cleanup ✅
**Expected:** No vertical dots on Order Volume chart

### Steps:
1. Login as admin
2. Check dashboard
3. View Order Volume Over Time chart

### Verification:
- [ ] Chart displays correctly
- [ ] No MoreVertical (⋮) button in corner
- [ ] Clean, minimal chart header
- [ ] Chart data displays properly

---

## Test 7: Farmer of the Month - Admin View ✅
**Expected:** Top farmer appears in Supplier Rankings

### Steps:
1. Login as admin
2. Navigate to Reports → Supplier Rankings
3. Note the #1 ranked farmer

### Verification:
- [ ] Supplier rankings table displays
- [ ] Farmers ranked by performance
- [ ] Top farmer visible in position #1
- [ ] Performance percentage shown
- [ ] Farm name, location visible

---

## Test 8: Farmer of the Month - Client Dashboard ✅
**Expected:** Dynamic Farmer of the Month card on client dashboard

### Steps:
1. Login as client
2. View dashboard
3. Check for Farmer of the Month card

### Verification:
- [ ] Card displays below KPI metrics
- [ ] Shows farmer name (matches admin #1 ranking)
- [ ] Shows location
- [ ] Shows performance percentage
- [ ] "Browse Collection" button present
- [ ] Card has gradient green background
- [ ] NO "Hillside Orchards" mock data

---

## Test 9: Browse Collection Navigation ✅
**Expected:** Clicking button filters catalog to farmer's products

### Steps:
1. Login as client
2. On dashboard, note Farmer of the Month name
3. Click "Browse Collection" button
4. Observe catalog page

### Verification:
- [ ] Navigates to Catalog page
- [ ] Header shows: "Showing X products from [Farmer Name]"
- [ ] Filter badge visible: "Filtered by: [Farmer Name]"
- [ ] Only that farmer's products displayed
- [ ] X button to clear filter present
- [ ] Other filters still work (In Season, Bulk, Category)

---

## Test 10: Farmer Filter Persistence ✅
**Expected:** Filter clears after navigation or manual clear

### Steps:
1. From Test 9, with farmer filter active
2. Click X on filter badge
3. Check products displayed

### Verification:
- [ ] Filter badge disappears
- [ ] All products from all farmers shown
- [ ] Product count increases
- [ ] SessionStorage cleared
- [ ] Filter doesn't persist on page refresh

---

## Test 11: Combined Filters ✅
**Expected:** All filters work together

### Steps:
1. Login as client
2. Navigate to Catalog
3. Apply farmer filter from dashboard
4. Toggle "In Season" ON
5. Toggle "Bulk Available" ON
6. Select specific category

### Verification:
- [ ] Products match ALL filter criteria (AND logic)
- [ ] Product count reflects combined filters
- [ ] Clear Filters button resets all
- [ ] No errors in console

---

## Test 12: Clear Filters Button ✅
**Expected:** Resets all filters at once

### Steps:
1. Login as client
2. Navigate to Catalog
3. Apply multiple filters:
   - Farmer filter (from dashboard)
   - Category selection
   - In Season toggle
   - Bulk Available toggle
4. Click "Clear Filters" button

### Verification:
- [ ] All filters reset
- [ ] Category set to "All Products"
- [ ] All toggles OFF
- [ ] Farmer filter cleared
- [ ] All products displayed
- [ ] No errors in console

---

## Test 13: Backend Farmer Filter ✅
**Expected:** API correctly filters by farmer parameter

### Steps:
1. Open browser DevTools → Network tab
2. Login as client
3. Navigate to dashboard
4. Click "Browse Collection"
5. Check API request

### Verification:
- [ ] Request URL includes `?farmer=FarmerName`
- [ ] Response contains only that farmer's supplies
- [ ] Status code: 200
- [ ] Response format: `{ results: [...], count: N }`

---

## Test 14: No Mock Data ✅
**Expected:** All data comes from database, no hardcoded values

### Steps:
1. Search entire codebase for "Hillside Orchards"
2. Login as client → check dashboard
3. Check catalog sidebar

### Verification:
- [ ] No "Hillside Orchards" references in code
- [ ] Farmer of the Month shows actual DB farmer
- [ ] No mock/placeholder farmer cards
- [ ] All data dynamic

---

## Test 15: End-to-End Workflow ✅
**Expected:** Complete user journey works seamlessly

### Steps:
1. **Admin Portal:**
   - Login as admin
   - Approve some farmer supplies
   - Check Supplier Rankings → note #1 farmer

2. **Client Portal:**
   - Login as client
   - View dashboard → verify Farmer of the Month matches admin #1
   - Click "Browse Collection"
   - Verify only that farmer's products shown
   - Apply additional filters (In Season, Bulk)
   - Add product to cart
   - Verify cart count updates
   - Clear farmer filter
   - View all products

### Verification:
- [ ] All steps complete without errors
- [ ] Data consistency between admin and client
- [ ] Filters work correctly
- [ ] Cart functions properly
- [ ] Navigation smooth
- [ ] No console errors
- [ ] No broken images/links

---

## Performance Tests

### Test 16: Large Dataset
**Expected:** Filters work efficiently with many products

### Steps:
1. Seed database with 100+ products
2. Apply filters
3. Monitor performance

### Verification:
- [ ] Filter response < 2 seconds
- [ ] No UI lag
- [ ] Pagination works smoothly

---

## Edge Cases

### Test 17: No Top Farmer
**Expected:** Graceful handling when no farmer data exists

### Steps:
1. Fresh database (no supplies)
2. Login as client
3. Check dashboard

### Verification:
- [ ] No error shown
- [ ] Farmer of the Month card doesn't display
- [ ] Dashboard still functional

### Test 18: Farmer With No Products
**Expected:** Shows "No products found" message

### Steps:
1. Click "Browse Collection" for farmer with no supplies
2. Check catalog

### Verification:
- [ ] "No Products Found" message displayed
- [ ] Clear filters button visible
- [ ] No errors in console

---

## Browser Compatibility
Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Mobile Responsiveness
Test on:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet

---

## Final Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] No broken functionality
- [ ] Data persistence working
- [ ] User experience smooth
- [ ] Ready for production

---

## Test Results Summary

**Date:** _____________
**Tester:** _____________

**Total Tests:** 18
**Passed:** ___
**Failed:** ___
**Blocked:** ___

**Critical Issues:** _____________________________________________

**Notes:** ____________________________________________________

**Sign-off:** □ Ready for Production □ Needs Fixes
