#!/bin/bash
# ============================================
# SpaceUp - Script de despliegue a AWS
# ============================================
# Uso: ./scripts/deploy-aws.sh [ECR_REGISTRY] [IMAGE_TAG]
# Ejemplo:
#   ./scripts/deploy-aws.sh 123456789012.dkr.ecr.us-east-1.amazonaws.com abc123
# ============================================

set -e

ECR_REGISTRY=${1:-$ECR_REGISTRY}
IMAGE_TAG=${2:-latest}
AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME=${CLUSTER_NAME:-spaceup-cluster}
BACKEND_SERVICE=${BACKEND_SERVICE:-spaceup-backend}
FRONTEND_SERVICE=${FRONTEND_SERVICE:-spaceup-frontend}

if [ -z "$ECR_REGISTRY" ]; then
  echo "❌ Error: ECR_REGISTRY no definido."
  echo "Uso: $0 <ECR_REGISTRY> [IMAGE_TAG]"
  exit 1
fi

echo "🚀 Desplegando SpaceUp en AWS"
echo "   Registry: $ECR_REGISTRY"
echo "   Tag: $IMAGE_TAG"
echo "   Cluster: $CLUSTER_NAME"

# Forzar nuevo despliegue en ECS
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$BACKEND_SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION"

aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$FRONTEND_SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION"

echo "✅ Despliegue iniciado correctamente."
echo "   Verifica el estado en la consola de AWS ECS."
