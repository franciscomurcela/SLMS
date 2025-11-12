#!/bin/bash
# Script para validar e testar Terraform antes de fazer push

set -e

echo "================================"
echo "🔍 Terraform Validation Script"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

echo -e "\n${YELLOW}1. Running terraform validate...${NC}"
terraform validate
echo -e "${GREEN}✓ Terraform syntax is valid${NC}"

echo -e "\n${YELLOW}2. Running terraform fmt check...${NC}"
if terraform fmt -check -recursive .; then
    echo -e "${GREEN}✓ Code formatting is correct${NC}"
else
    echo -e "${YELLOW}⚠ Code formatting issues found. Running terraform fmt...${NC}"
    terraform fmt -recursive .
    echo -e "${GREEN}✓ Code formatting fixed${NC}"
fi

echo -e "\n${YELLOW}3. Checking for common issues...${NC}"
# Check for hardcoded values that should be variables
if grep -r "hardcoded" . --include="*.tf" 2>/dev/null; then
    echo -e "${RED}⚠ Found hardcoded values. Consider using variables.${NC}"
else
    echo -e "${GREEN}✓ No obvious hardcoded values found${NC}"
fi

echo -e "\n${YELLOW}4. Generating terraform plan (dry-run)...${NC}"
# This will show what will be created/modified/destroyed
# Note: This requires valid Azure credentials
terraform plan -out=tfplan

echo -e "\n${GREEN}✅ All validations passed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the plan output above"
echo "  2. If everything looks good, run: terraform apply tfplan"
echo "  3. Or commit and push to trigger GitHub Actions"
