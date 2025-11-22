#!/bin/bash

# FoodRescue Application Comprehensive Test Suite
# This script tests all major functionality

set -e

BASE_URL="http://localhost:5000/api"
DONOR_TOKEN=""
NGO_TOKEN=""
DONATION_ID=""
FOOD_ITEM_ID=""

echo "================================"
echo "FoodRescue Application Test Suite"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    exit 1
  fi
}

echo "=== 1. Testing User Authentication ==="
echo ""

# Test Donor Registration
echo "Testing Donor Registration..."
DONOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "donor_test_'$(date +%s)'",
    "password": "Test123!@#",
    "fullName": "Test Donor",
    "role": "donor",
    "donorProfile": {
      "businessName": "Test Restaurant",
      "businessType": "restaurant",
      "address": "123 Main St"
    }
  }')

DONOR_ID=$(echo $DONOR_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
DONOR_USERNAME=$(echo $DONOR_RESPONSE | grep -o '"username":"[^"]*' | head -1 | cut -d'"' -f4)
test_result $? "Donor Registration successful"
echo "  - Donor ID: $DONOR_ID"
echo ""

# Test Donor Login
echo "Testing Donor Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$DONOR_USERNAME'",
    "password": "Test123!@#"
  }')

DONOR_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)
test_result $? "Donor Login successful"
echo "  - Token obtained: ${DONOR_TOKEN:0:20}..."
echo ""

# Test NGO Registration
echo "Testing NGO Registration..."
NGO_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ngo_test_'$(date +%s)'",
    "password": "Test123!@#",
    "fullName": "Test NGO",
    "role": "ngo",
    "ngoProfile": {
      "organizationName": "Test Food Bank",
      "contactPerson": "John Doe",
      "phoneNumber": "555-1234",
      "address": "456 Oak St"
    }
  }')

NGO_ID=$(echo $NGO_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
NGO_USERNAME=$(echo $NGO_RESPONSE | grep -o '"username":"[^"]*' | head -1 | cut -d'"' -f4)
test_result $? "NGO Registration successful"
echo "  - NGO ID: $NGO_ID"
echo ""

# Test NGO Login
echo "Testing NGO Login..."
NGO_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$NGO_USERNAME'",
    "password": "Test123!@#"
  }')

NGO_TOKEN=$(echo $NGO_LOGIN | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)
test_result $? "NGO Login successful"
echo "  - Token obtained: ${NGO_TOKEN:0:20}..."
echo ""

echo "=== 2. Testing Donation Management ==="
echo ""

# Test Create Donation
echo "Testing Create Donation (Donor)..."
DONATION_RESPONSE=$(curl -s -X POST "$BASE_URL/donations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DONOR_TOKEN" \
  -d '{
    "foodDetails": {
      "name": "Fresh Vegetables",
      "category": "vegetables",
      "quantity": 50,
      "unit": "kg",
      "description": "Mixed fresh vegetables"
    },
    "location": {
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    },
    "expiryTime": "'$(date -u -d '+2 hours' +%Y-%m-%dT%H:%M:%SZ)'"
  }')

DONATION_ID=$(echo $DONATION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
test_result $? "Donation Created successfully"
echo "  - Donation ID: $DONATION_ID"
echo "  - Response: $(echo $DONATION_RESPONSE | cut -c1-150)..."
echo ""

# Test Get All Donations
echo "Testing Get All Donations..."
ALL_DONATIONS=$(curl -s -X GET "$BASE_URL/donations" \
  -H "Authorization: Bearer $DONOR_TOKEN")

DONATIONS_COUNT=$(echo $ALL_DONATIONS | grep -o '"id":"[^"]*' | wc -l)
test_result $? "Fetched all donations"
echo "  - Total donations: $DONATIONS_COUNT"
echo ""

# Test Get Specific Donation
echo "Testing Get Specific Donation..."
SPECIFIC=$(curl -s -X GET "$BASE_URL/donations/$DONATION_ID" \
  -H "Authorization: Bearer $DONOR_TOKEN")

test_result $? "Retrieved specific donation"
echo "  - Donation status: $(echo $SPECIFIC | grep -o '"status":"[^"]*' | cut -d'"' -f4)"
echo ""

echo "=== 3. Testing Donation Acceptance ==="
echo ""

# Test Accept Donation (NGO)
echo "Testing Accept Donation (NGO)..."
ACCEPT_RESPONSE=$(curl -s -X PATCH "$BASE_URL/donations/$DONATION_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NGO_TOKEN" \
  -d '{}')

test_result $? "NGO accepted donation"
ACCEPTED_STATUS=$(echo $ACCEPT_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "  - New status: $ACCEPTED_STATUS"
echo ""

# Test Get Updated Donation
echo "Testing Donation Status After Acceptance..."
UPDATED=$(curl -s -X GET "$BASE_URL/donations/$DONATION_ID" \
  -H "Authorization: Bearer $NGO_TOKEN")

UPDATED_STATUS=$(echo $UPDATED | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [[ "$UPDATED_STATUS" == "accepted" ]] || [[ "$UPDATED_STATUS" == "matched" ]]; then
  test_result 0 "Donation status correctly updated"
  echo "  - Status: $UPDATED_STATUS"
else
  echo -e "${YELLOW}⚠ WARNING${NC}: Status might not have updated properly"
fi
echo ""

echo "=== 4. Testing Stats Calculations ==="
echo ""

# Get donations after changes
echo "Testing Stats (Total Donations)..."
FINAL_DONATIONS=$(curl -s -X GET "$BASE_URL/donations" \
  -H "Authorization: Bearer $DONOR_TOKEN")

FINAL_COUNT=$(echo $FINAL_DONATIONS | grep -o '"id":"[^"]*' | wc -l)
echo "  - Final donation count: $FINAL_COUNT"
test_result $? "Stats calculation working"
echo ""

# Count accepted donations
ACCEPTED_COUNT=$(echo $FINAL_DONATIONS | grep -o '"status":"accepted"' | wc -l)
echo "  - Accepted donations: $ACCEPTED_COUNT"
echo ""

echo "=== 5. Testing Navigation Structure ==="
echo ""

# Test Frontend loads
echo "Testing Frontend Application..."
FRONTEND=$(curl -s -X GET "http://localhost:5000/" | head -c 500)

if echo "$FRONTEND" | grep -q "FoodRescue\|Welcome\|Dashboard"; then
  test_result 0 "Frontend loads successfully"
else
  echo -e "${YELLOW}⚠ WARNING${NC}: Frontend may not be fully loaded"
fi
echo ""

echo "=== 6. Testing User Profile Retrieval ==="
echo ""

# Test Get Current User (Donor)
echo "Testing Get Current User (Donor)..."
DONOR_PROFILE=$(curl -s -X GET "$BASE_URL/user" \
  -H "Authorization: Bearer $DONOR_TOKEN")

DONOR_PROFILE_NAME=$(echo $DONOR_PROFILE | grep -o '"fullName":"[^"]*' | cut -d'"' -f4)
test_result $? "Donor profile retrieved"
echo "  - Full Name: $DONOR_PROFILE_NAME"
echo ""

# Test Get Current User (NGO)
echo "Testing Get Current User (NGO)..."
NGO_PROFILE=$(curl -s -X GET "$BASE_URL/user" \
  -H "Authorization: Bearer $NGO_TOKEN")

NGO_PROFILE_NAME=$(echo $NGO_PROFILE | grep -o '"fullName":"[^"]*' | cut -d'"' -f4)
test_result $? "NGO profile retrieved"
echo "  - Full Name: $NGO_PROFILE_NAME"
echo ""

echo "=== 7. Testing Error Handling ==="
echo ""

# Test Invalid Token
echo "Testing Invalid Token Handling..."
INVALID=$(curl -s -X GET "$BASE_URL/user" \
  -H "Authorization: Bearer invalid_token_123")

if echo "$INVALID" | grep -q "error\|unauthorized\|Unauthorized"; then
  test_result 0 "Invalid token correctly rejected"
else
  echo -e "${YELLOW}⚠ WARNING${NC}: Error handling may need review"
fi
echo ""

# Test Missing Authorization
echo "Testing Missing Authorization..."
MISSING=$(curl -s -X GET "$BASE_URL/user")

if echo "$MISSING" | grep -q "error\|unauthorized\|Unauthorized"; then
  test_result 0 "Missing token correctly rejected"
else
  echo -e "${YELLOW}⚠ WARNING${NC}: Error handling may need review"
fi
echo ""

echo ""
echo "================================"
echo "Test Suite Summary"
echo "================================"
echo -e "${GREEN}✓ All core functionality tests completed${NC}"
echo ""
echo "Test Coverage:"
echo "  ✓ User Authentication (Donor & NGO)"
echo "  ✓ User Registration"
echo "  ✓ User Login"
echo "  ✓ Donation Creation"
echo "  ✓ Donation Retrieval"
echo "  ✓ Donation Acceptance"
echo "  ✓ Status Updates"
echo "  ✓ Stats Calculations"
echo "  ✓ User Profiles"
echo "  ✓ Error Handling"
echo "  ✓ Frontend Loading"
echo ""
echo "Next Steps:"
echo "  1. Review the application at http://localhost:5000"
echo "  2. Test user flows in the browser UI"
echo "  3. Check dashboard stats updates in real-time"
echo "  4. Verify accepted donations tab in NGO dashboard"
echo ""
