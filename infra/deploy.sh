#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── 1. Load credentials ──────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: infra/.env not found. Copy .env.example and fill in your values."
  exit 1
fi
set -a
# shellcheck source=/dev/null
source .env
set +a

# ─── 2. Validate required variables ──────────────────────────────────────────
REQUIRED_VARS=(
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_REGION
  TF_VAR_db_password
  TF_VAR_wompi_private_key
  TF_VAR_wompi_public_key
  TF_VAR_wompi_integrity_key
  TF_VAR_ec2_key_name
)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: Required variable '$var' is not set in infra/.env"
    exit 1
  fi
done

SSH_KEY="${SSH_KEY_PATH:-$HOME/.ssh/${TF_VAR_ec2_key_name}.pem}"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -o BatchMode=yes"

# ─── 3. Terraform init + apply ────────────────────────────────────────────────
echo ""
echo "==> [1/8] Provisioning AWS infrastructure with Terraform..."
terraform init -input=false
terraform apply -auto-approve -input=false

# ─── 4. Capture outputs ───────────────────────────────────────────────────────
EC2_IP=$(terraform output -raw ec2_public_ip)
FRONTEND_URL=$(terraform output -raw frontend_url)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
S3_BUCKET=$(terraform output -raw s3_bucket_name)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
BACKEND_URL=$(terraform output -raw backend_url)
SWAGGER_URL=$(terraform output -raw swagger_url)

echo "    EC2 IP:        $EC2_IP"
echo "    RDS endpoint:  $RDS_ENDPOINT"
echo "    Frontend URL:  $FRONTEND_URL"

# ─── 5. Build Docker image ───────────────────────────────────────────────────
echo ""
echo "==> [2/8] Building Docker image..."
docker build --platform linux/amd64 -t checkout-backend:latest ../backend

# ─── 6. Save Docker image ────────────────────────────────────────────────────
echo ""
echo "==> [3/8] Saving Docker image to /tmp/checkout-backend.tar.gz..."
docker save checkout-backend:latest | gzip > /tmp/checkout-backend.tar.gz
echo "    Image size: $(du -sh /tmp/checkout-backend.tar.gz | cut -f1)"

# ─── 7. Wait for SSH ─────────────────────────────────────────────────────────
echo ""
echo "==> [4/8] Waiting for EC2 SSH to be ready (max 5 min)..."
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if ssh $SSH_OPTS -i "$SSH_KEY" ec2-user@"$EC2_IP" "echo ready" 2>/dev/null; then
    echo "    SSH is ready."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: SSH not available after $MAX_RETRIES attempts. Check EC2 security group and key."
    exit 1
  fi
  echo "    Retry $i/$MAX_RETRIES — waiting 10s..."
  sleep 10
done

# Wait until Docker is ready on the instance (user_data may still be running)
echo "    Waiting for Docker to be ready on EC2..."
for i in $(seq 1 20); do
  if ssh $SSH_OPTS -i "$SSH_KEY" ec2-user@"$EC2_IP" "docker info" &>/dev/null; then
    echo "    Docker is ready."
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "ERROR: Docker not ready after 20 attempts."
    exit 1
  fi
  echo "    Retry $i/20 — waiting 10s..."
  sleep 10
done

# ─── 8. Copy image + deploy to EC2 ───────────────────────────────────────────
echo ""
echo "==> [5/8] Copying Docker image to EC2..."
scp $SSH_OPTS -i "$SSH_KEY" /tmp/checkout-backend.tar.gz ec2-user@"$EC2_IP":~/

echo "    Configuring EC2 environment and loading image..."
# DATABASE_URL: RDS endpoint already includes the port (host:5432)
DB_URL="postgresql://postgres:${TF_VAR_db_password}@${RDS_ENDPOINT}/checkout_db"
WOMPI_API="${TF_VAR_wompi_api_url:-https://api-sandbox.co.uat.wompi.dev/v1}"

# ─── 9. Migrate + seed + start service (all on EC2) ─────────────────────────
# IMPORTANT: migrations and seed use `docker run --rm` (ephemeral container),
# NOT `docker exec`. The backend container calls $connect() on startup and will
# crash if the DB isn't reachable yet — so we can't exec into it. Running an
# ephemeral container for migrate/seed avoids that chicken-and-egg problem.
# The backend service is started AFTER migrations succeed.
echo ""
echo "==> [6/8] Loading image, running migrations, seeding, starting service..."

ssh $SSH_OPTS -i "$SSH_KEY" ec2-user@"$EC2_IP" "bash -s" <<REMOTE
set -e

# Write environment file for the container
cat > /home/ec2-user/.env <<ENVEOF
DATABASE_URL=${DB_URL}
WOMPI_API_URL=${WOMPI_API}
WOMPI_PUBLIC_KEY=${TF_VAR_wompi_public_key}
WOMPI_PRIVATE_KEY=${TF_VAR_wompi_private_key}
WOMPI_INTEGRITY_KEY=${TF_VAR_wompi_integrity_key}
BASE_FEE_CENTS=300000
DELIVERY_FEE_CENTS=500000
PORT=3001
FRONTEND_URL=${FRONTEND_URL}
ENVEOF

echo "--- Loading Docker image..."
gunzip -c ~/checkout-backend.tar.gz | docker load
rm ~/checkout-backend.tar.gz

echo "--- Running Prisma migrations (ephemeral container)..."
docker run --rm --env-file /home/ec2-user/.env checkout-backend:latest \
  npx prisma migrate deploy

echo "--- Running database seed (ephemeral container, idempotent)..."
docker run --rm --env-file /home/ec2-user/.env checkout-backend:latest \
  npx prisma db seed || echo "Seed returned non-zero (may be already seeded — continuing)."

echo "--- Starting backend service..."
sudo systemctl restart checkout-backend.service

echo "--- Done on EC2."
REMOTE

# ─── 10. Wait for backend health ─────────────────────────────────────────────
echo ""
echo "==> [7/8] Waiting for backend to be healthy..."
for i in $(seq 1 24); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://${EC2_IP}:3001/api/v1/products" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "    Backend is healthy (HTTP 200)."
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "WARNING: Backend health check failed after 2 minutes (last HTTP $HTTP_CODE)."
    echo "         Check logs: ssh -i $SSH_KEY ec2-user@$EC2_IP 'docker logs checkout-backend'"
    break
  fi
  echo "    Attempt $i/24 — HTTP $HTTP_CODE, waiting 5s..."
  sleep 5
done

# ─── 11. Build + deploy frontend ─────────────────────────────────────────────
echo ""
echo "==> [8/8] Building and deploying frontend..."
cd "$SCRIPT_DIR/../frontend"

VITE_API_URL="http://${EC2_IP}:3001/api/v1" \
VITE_WOMPI_PUBLIC_KEY="${TF_VAR_wompi_public_key}" \
VITE_WOMPI_API_URL="${WOMPI_API}" \
  pnpm run build

echo "    Uploading to S3..."
aws s3 sync dist/ "s3://${S3_BUCKET}/" --delete

echo "    Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

# ─── Done ─────────────────────────────────────────────────────────────────────
cd "$SCRIPT_DIR"
echo ""
echo "=============================================="
echo "  Deployment Complete!"
echo "=============================================="
echo "  Frontend:  ${FRONTEND_URL}"
echo "  Backend:   ${BACKEND_URL}"
echo "  Swagger:   ${SWAGGER_URL}"
echo "  EC2 IP:    ${EC2_IP}"
echo "  RDS:       ${RDS_ENDPOINT}"
echo "=============================================="
echo ""
echo "  Tip: to destroy all resources run:"
echo "       cd infra && source .env && terraform destroy"
echo ""
