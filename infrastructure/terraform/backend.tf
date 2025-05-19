# Configure Terraform backend for state storage and locking
# This configuration implements a split-state approach aligned with the refactored monorepo structure
# Backend infrastructure state is stored separately from web/frontend infrastructure state
terraform {
  # Using S3 for state storage with DynamoDB for state locking
  backend "s3" {
    bucket         = "austa-terraform-state"
    key            = "global/backend/terraform.tfstate"
    region         = "sa-east-1"
    dynamodb_table = "austa-terraform-locks"
    encrypt        = true
    # Encryption enabled for security of sensitive infrastructure data
  }
}

# Note: For web/frontend infrastructure, a separate Terraform configuration should use:
# key = "global/web/terraform.tfstate"
# This split-state approach allows for isolated state management while maintaining
# centralized locking through the shared DynamoDB table.