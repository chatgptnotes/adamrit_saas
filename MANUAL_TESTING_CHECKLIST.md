# 🧪 Manual Testing Checklist
## Hospital Management System - Complete Test Suite

**Version:** 1.0  
**Last Updated:** 2025-02-27  
**Test Environment:** Development / Staging / Production (circle one)

---

## 📋 How to Use This Checklist

1. **Test each feature systematically**
2. **Mark ✅ for pass, ❌ for fail**
3. **Document bugs in "Issues Found" column**
4. **Retest after fixes**

---

## 1. Authentication & Authorization

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| AUTH-001 | Login with valid credentials | 1. Enter valid email<br>2. Enter valid password<br>3. Click Login | User logged in, redirected to dashboard | ☐ | |
| AUTH-002 | Login with invalid email | 1. Enter invalid email<br>2. Enter password<br>3. Click Login | Error: "Invalid credentials" | ☐ | |
| AUTH-003 | Login with invalid password | 1. Enter valid email<br>2. Enter wrong password<br>3. Click Login | Error: "Invalid credentials" | ☐ | |
| AUTH-004 | Login with empty fields | 1. Leave fields empty<br>2. Click Login | Validation errors shown | ☐ | |
| AUTH-005 | Session persistence | 1. Login<br>2. Refresh page | Still logged in | ☐ | |
| AUTH-006 | Logout | 1. Click Logout button | Logged out, redirected to login | ☐ | |
| AUTH-007 | Hospital selection | 1. Select hospital from dropdown | Correct hospital theme applied | ☐ | |
| AUTH-008 | Role-based access (Admin) | 1. Login as admin<br>2. Check sidebar | All features visible | ☐ | |
| AUTH-009 | Role-based access (User) | 1. Login as user<br>2. Check sidebar | Limited features visible | ☐ | |
| AUTH-010 | Direct URL access (unauthorized) | 1. Logout<br>2. Visit /patients directly | Redirected to login | ☐ | |

**Notes:**
- Default admin credentials should be changed after first login
- Test on different browsers (Chrome, Firefox, Safari)

---

## 2. Patient Management

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| PAT-001 | Register new patient | 1. Click "New Patient"<br>2. Fill all required fields<br>3. Submit | Patient created, ID generated | ☐ | |
| PAT-002 | Validate required fields | 1. Click "New Patient"<br>2. Submit without filling | Validation errors shown | ☐ | |
| PAT-003 | Validate phone number | 1. Enter invalid phone<br>2. Submit | Error: "Invalid phone number" | ☐ | |
| PAT-004 | Validate email format | 1. Enter invalid email<br>2. Submit | Error: "Invalid email" | ☐ | |
| PAT-005 | Search patient by name | 1. Enter patient name<br>2. Search | Matching patients listed | ☐ | |
| PAT-006 | Search patient by ID | 1. Enter patient ID<br>2. Search | Exact patient found | ☐ | |
| PAT-007 | Search patient by phone | 1. Enter phone number<br>2. Search | Patient found | ☐ | |
| PAT-008 | Edit patient details | 1. Open patient<br>2. Edit fields<br>3. Save | Changes saved | ☐ | |
| PAT-009 | View patient history | 1. Open patient<br>2. Click History tab | All visits shown | ☐ | |
| PAT-010 | Upload patient documents | 1. Click upload<br>2. Select file<br>3. Submit | Document uploaded | ☐ | |
| PAT-011 | Duplicate patient check | 1. Create patient<br>2. Create again with same phone | Warning shown | ☐ | |
| PAT-012 | Age calculation from DOB | 1. Enter DOB<br>2. Check age field | Age auto-calculated | ☐ | |

**Test Data:**
- Name: Test Patient
- Age: 35
- Phone: 9876543210
- Email: test@example.com

---

## 3. Visit Management (OPD/IPD)

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| VIS-001 | Create OPD visit | 1. Select patient<br>2. Click "New OPD Visit"<br>3. Fill details<br>4. Save | Visit created | ☐ | |
| VIS-002 | Create IPD visit (Admission) | 1. Select patient<br>2. Click "Admit"<br>3. Fill admission form<br>4. Save | Patient admitted | ☐ | |
| VIS-003 | Select diagnosis | 1. In visit form<br>2. Search diagnosis<br>3. Select | Diagnosis added | ☐ | |
| VIS-004 | Add multiple diagnoses | 1. Add diagnosis 1<br>2. Add diagnosis 2<br>3. Save | Both diagnoses saved | ☐ | |
| VIS-005 | Assign bed to patient | 1. In admission form<br>2. Select ward<br>3. Select bed | Bed assigned | ☐ | |
| VIS-006 | Bed availability check | 1. Try to assign occupied bed | Error: "Bed not available" | ☐ | |
| VIS-007 | Discharge patient | 1. Open admitted patient<br>2. Click Discharge<br>3. Fill discharge form<br>4. Save | Patient discharged | ☐ | |
| VIS-008 | View currently admitted | 1. Click "Currently Admitted"<br>2. Check list | All admitted patients shown | ☐ | |
| VIS-009 | View discharged patients | 1. Click "Discharged Patients" | List shown with dates | ☐ | |
| VIS-010 | Filter patients by date | 1. Select date range<br>2. Apply filter | Filtered list shown | ☐ | |

**Test Scenarios:**
- [ ] Same patient multiple visits
- [ ] Transfer between beds
- [ ] Change diagnosis after creation

---

## 4. Billing & Invoicing

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| BILL-001 | Create new bill | 1. Select patient/visit<br>2. Click "New Bill"<br>3. Add items<br>4. Save | Bill created | ☐ | |
| BILL-002 | Add service to bill | 1. Click "Add Service"<br>2. Select service<br>3. Enter quantity | Service added, total updated | ☐ | |
| BILL-003 | Add lab test to bill | 1. Click "Add Lab Test"<br>2. Select test | Test added with price | ☐ | |
| BILL-004 | Add medication to bill | 1. Click "Add Medicine"<br>2. Select medicine<br>3. Enter quantity | Medicine added | ☐ | |
| BILL-005 | Apply discount (percentage) | 1. Enter 10% discount<br>2. Check total | Total reduced by 10% | ☐ | |
| BILL-006 | Apply discount (fixed amount) | 1. Enter ₹500 discount<br>2. Check total | Total reduced by ₹500 | ☐ | |
| BILL-007 | Calculate tax (GST) | 1. Check tax amount | Tax calculated correctly | ☐ | |
| BILL-008 | Record payment | 1. Enter payment amount<br>2. Select payment mode<br>3. Save | Payment recorded | ☐ | |
| BILL-009 | Partial payment | 1. Pay less than total<br>2. Check balance | Balance shown correctly | ☐ | |
| BILL-010 | Print invoice | 1. Click Print | Invoice preview shown | ☐ | |
| BILL-011 | Edit existing bill | 1. Open bill<br>2. Modify items<br>3. Save | Changes saved | ☐ | |
| BILL-012 | Cancel bill | 1. Open bill<br>2. Click Cancel<br>3. Confirm | Bill cancelled | ☐ | |
| BILL-013 | Credit billing | 1. Select corporate patient<br>2. Create bill<br>3. Mark as credit | Bill saved as credit | ☐ | |

**Test Calculations:**
```
Example Bill:
- Consultation: ₹500
- Lab Test: ₹1000
- Medicine: ₹750
- Subtotal: ₹2250
- Discount 10%: -₹225
- Tax (5%): ₹101.25
- Total: ₹2126.25
```

---

## 5. Laboratory

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| LAB-001 | Order lab test | 1. Select patient<br>2. Order test<br>3. Save | Test ordered | ☐ | |
| LAB-002 | Order test panel (CBC) | 1. Select CBC<br>2. Check sub-tests | All sub-tests included | ☐ | |
| LAB-003 | Enter test results | 1. Open pending test<br>2. Enter values<br>3. Save | Results saved | ☐ | |
| LAB-004 | Validate normal ranges | 1. Enter out-of-range value<br>2. Check flag | Marked as High/Low | ☐ | |
| LAB-005 | Formula calculation (MCV) | 1. Enter RBC, HCT<br>2. Check MCV | Auto-calculated | ☐ | |
| LAB-006 | Print lab report | 1. Click Print<br>2. Check report | Report formatted correctly | ☐ | |
| LAB-007 | Search pending tests | 1. Enter patient name<br>2. Filter pending | Pending tests shown | ☐ | |
| LAB-008 | Search completed tests | 1. Filter by date<br>2. Check completed | Completed tests shown | ☐ | |
| LAB-009 | Edit test results | 1. Open completed test<br>2. Modify value<br>3. Save | Changes saved with audit | ☐ | |
| LAB-010 | Nested sub-tests | 1. Order test with nested structure<br>2. Enter results | All levels saved | ☐ | |

**Test Data - CBC Example:**
- Hemoglobin: 14.5 g/dL (Normal: 12-16)
- RBC: 4.8 million/µL (Normal: 4.5-5.5)
- WBC: 8000 /µL (Normal: 4000-11000)

---

## 6. Pharmacy

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| PHAR-001 | Search medicine | 1. Enter medicine name<br>2. Search | Matching medicines shown | ☐ | |
| PHAR-002 | Create sale | 1. Add medicines<br>2. Enter quantity<br>3. Save | Sale created | ☐ | |
| PHAR-003 | Check stock availability | 1. Add medicine<br>2. Enter quantity > stock | Warning shown | ☐ | |
| PHAR-004 | Batch selection | 1. Select medicine<br>2. View batches | Available batches shown | ☐ | |
| PHAR-005 | Expiry date validation | 1. Select expired batch | Warning shown | ☐ | |
| PHAR-006 | Stock deduction | 1. Complete sale<br>2. Check stock | Stock reduced | ☐ | |
| PHAR-007 | Create GRN (Purchase) | 1. Click New GRN<br>2. Add items<br>3. Save | Stock increased | ☐ | |
| PHAR-008 | Return medicine | 1. Select sale<br>2. Click Return<br>3. Enter quantity<br>4. Save | Stock increased | ☐ | |
| PHAR-009 | Low stock alert | 1. Check inventory<br>2. View alerts | Low stock items shown | ☐ | |
| PHAR-010 | Print bill | 1. Complete sale<br>2. Print | Bill formatted correctly | ☐ | |

**Test Scenarios:**
- [ ] Sale with prescription
- [ ] Sale without prescription (OTC)
- [ ] Different payment modes

---

## 7. Radiology

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| RAD-001 | Order X-Ray | 1. Select patient<br>2. Order X-Ray<br>3. Save | Order created | ☐ | |
| RAD-002 | Order CT Scan | 1. Select CT Scan<br>2. Enter details<br>3. Save | Order created | ☐ | |
| RAD-003 | Upload report | 1. Open pending order<br>2. Upload PDF<br>3. Save | Report uploaded | ☐ | |
| RAD-004 | Enter findings | 1. Open order<br>2. Enter text findings<br>3. Save | Findings saved | ☐ | |
| RAD-005 | Print radiology report | 1. Click Print | Report shown | ☐ | |

---

## 8. Operation Theatre (OT)

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| OT-001 | Create surgery record | 1. Select patient<br>2. Fill surgery details<br>3. Save | Record created | ☐ | |
| OT-002 | Add surgeon | 1. Search surgeon<br>2. Add to surgery | Surgeon added | ☐ | |
| OT-003 | Add anesthetist | 1. Search anesthetist<br>2. Add | Anesthetist added | ☐ | |
| OT-004 | Record implants used | 1. Add implant<br>2. Enter quantity | Implant recorded | ☐ | |
| OT-005 | OT notes | 1. Fill pre-op notes<br>2. Fill post-op notes<br>3. Save | Notes saved | ☐ | |

---

## 9. Accounting

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| ACC-001 | View ledger | 1. Navigate to Ledger<br>2. Select account | Transactions shown | ☐ | |
| ACC-002 | Filter by date | 1. Select date range<br>2. Apply | Filtered transactions | ☐ | |
| ACC-003 | Cash book entries | 1. View Cash Book | All cash transactions shown | ☐ | |
| ACC-004 | Day book | 1. View Day Book<br>2. Select date | Day's transactions shown | ☐ | |
| ACC-005 | Payment voucher | 1. Create voucher<br>2. Save | Ledger updated | ☐ | |
| ACC-006 | Receipt voucher | 1. Create receipt<br>2. Save | Ledger updated | ☐ | |
| ACC-007 | Financial summary | 1. View summary<br>2. Check totals | Totals match | ☐ | |

---

## 10. Reports

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| REP-001 | Patient visit report | 1. Select date range<br>2. Generate | Report shown | ☐ | |
| REP-002 | Revenue report | 1. Select period<br>2. Generate | Revenue breakdown shown | ☐ | |
| REP-003 | Discharge summary | 1. Select discharged patient<br>2. Print | Summary formatted | ☐ | |
| REP-004 | Bill aging report | 1. View aging<br>2. Check dues | Aging calculated correctly | ☐ | |
| REP-005 | Export to Excel | 1. Click Export<br>2. Open file | Data exported correctly | ☐ | |

---

## 11. Cross-Browser Testing

| Browser | Version | Status | Issues Found |
|---------|---------|--------|--------------|
| Chrome | Latest | ☐ | |
| Firefox | Latest | ☐ | |
| Safari | Latest | ☐ | |
| Edge | Latest | ☐ | |

---

## 12. Responsive Testing

| Device | Resolution | Status | Issues Found |
|--------|------------|--------|--------------|
| iPhone SE | 375x667 | ☐ | |
| iPhone 12 | 390x844 | ☐ | |
| iPad | 768x1024 | ☐ | |
| Desktop | 1920x1080 | ☐ | |

---

## 13. Performance Testing

| Test | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Page load time (Dashboard) | < 2s | | ☐ | |
| Patient search (1000+ records) | < 1s | | ☐ | |
| Bill generation | < 1s | | ☐ | |
| Report generation | < 3s | | ☐ | |
| Image upload | < 5s | | ☐ | |

---

## 14. Security Testing

| ID | Test Case | Expected Result | Status | Issues Found |
|----|-----------|-----------------|--------|--------------|
| SEC-001 | SQL injection in search | No error, sanitized | ☐ | |
| SEC-002 | XSS in patient name | HTML not rendered | ☐ | |
| SEC-003 | Direct URL access (no auth) | Redirected to login | ☐ | |
| SEC-004 | Session timeout | Logged out after timeout | ☐ | |
| SEC-005 | Password visibility toggle | Works correctly | ☐ | |
| SEC-006 | HTTPS connection | All pages HTTPS | ☐ | |

---

## 15. Data Integrity

| ID | Test Case | Steps | Expected Result | Status | Issues Found |
|----|-----------|-------|-----------------|--------|--------------|
| DATA-001 | Concurrent edits | 1. User A opens record<br>2. User B opens same<br>3. Both edit<br>4. Both save | Conflict warning | ☐ | |
| DATA-002 | Foreign key integrity | 1. Delete patient with visits | Error or cascade | ☐ | |
| DATA-003 | Duplicate prevention | 1. Create duplicate | Warning shown | ☐ | |
| DATA-004 | Data validation | 1. Enter negative age<br>2. Save | Validation error | ☐ | |

---

## 📊 Test Summary

**Date Completed:** __________

**Total Tests:** 150+
**Passed:** __________
**Failed:** __________
**Skipped:** __________

**Pass Rate:** _________%

---

## 🐛 Bug Report Template

```markdown
### Bug ID: BUG-XXX
**Severity:** Critical / High / Medium / Low
**Module:** Authentication / Patients / Billing / etc.
**Found In:** Test Case ID

**Description:**
[What is the issue?]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen?]

**Actual Result:**
[What actually happened?]

**Screenshots:**
[Attach if available]

**Environment:**
- Browser: 
- OS: 
- User Role:

**Assigned To:** __________
**Status:** Open / In Progress / Fixed / Closed
```

---

## ✅ Sign-Off

**Tester Name:** __________________  
**Date:** __________________  
**Signature:** __________________

**Reviewed By:** __________________  
**Date:** __________________  
**Signature:** __________________

---

**Notes:**
- Retest all failed cases after fixes
- Document all edge cases discovered
- Update test cases as features change
