#!/bin/bash

# =========================================================
# AUSTA SuperApp - Grafana Dashboard Setup Script
# =========================================================
# This script generates and updates Grafana dashboards for each journey
# (health, care, plan) and cross-cutting concerns (API Gateway, authentication,
# gamification), with customized visualizations for service health, performance
# metrics, and business KPIs.
# =========================================================

set -e

# Configuration variables
GRAFANA_URL="${GRAFANA_URL:-http://grafana.monitoring.svc.cluster.local:3000}"
GRAFANA_API_KEY="${GRAFANA_API_KEY:-}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-}"
DASHBOARD_FOLDER="AUSTA SuperApp"
TEMPLATE_DIR="${TEMPLATE_DIR:-/tmp/dashboard-templates}"
OUTPUT_DIR="${OUTPUT_DIR:-/etc/grafana/dashboards}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
  local missing_deps=false
  
  for cmd in curl jq sed; do
    if ! command -v "$cmd" &> /dev/null; then
      log_error "$cmd is required but not installed."
      missing_deps=true
    fi
  done
  
  if [ "$missing_deps" = true ]; then
    log_error "Please install the missing dependencies and try again."
    exit 1
  fi
}

# Create authentication header for Grafana API
get_auth_header() {
  if [ -n "$GRAFANA_API_KEY" ]; then
    echo "Authorization: Bearer $GRAFANA_API_KEY"
  elif [ -n "$GRAFANA_USER" ] && [ -n "$GRAFANA_PASSWORD" ]; then
    echo "Authorization: Basic $(echo -n "$GRAFANA_USER:$GRAFANA_PASSWORD" | base64)"
  else
    log_error "Either GRAFANA_API_KEY or both GRAFANA_USER and GRAFANA_PASSWORD must be provided."
    exit 1
  fi
}

# Create folder in Grafana if it doesn't exist
create_dashboard_folder() {
  local folder_name="$1"
  local auth_header
  auth_header=$(get_auth_header)
  
  # Check if folder exists
  local folder_id
  folder_id=$(curl -s -H "$auth_header" -H "Content-Type: application/json" \
    "$GRAFANA_URL/api/folders" | jq -r ".[] | select(.title == \"$folder_name\") | .id")
  
  if [ -z "$folder_id" ] || [ "$folder_id" = "null" ]; then
    log_info "Creating folder: $folder_name"
    
    local response
    response=$(curl -s -X POST -H "$auth_header" -H "Content-Type: application/json" \
      -d "{\"title\": \"$folder_name\"}" \
      "$GRAFANA_URL/api/folders")
    
    folder_id=$(echo "$response" | jq -r '.id')
    
    if [ -z "$folder_id" ] || [ "$folder_id" = "null" ]; then
      log_error "Failed to create folder: $folder_name"
      log_error "Response: $response"
      exit 1
    fi
    
    log_success "Created folder: $folder_name with ID: $folder_id"
  else
    log_info "Folder already exists: $folder_name with ID: $folder_id"
  fi
  
  echo "$folder_id"
}

# Create or update a dashboard in Grafana
create_or_update_dashboard() {
  local dashboard_json="$1"
  local folder_id="$2"
  local auth_header
  auth_header=$(get_auth_header)
  
  # Extract dashboard title and uid for logging
  local dashboard_title
  dashboard_title=$(echo "$dashboard_json" | jq -r '.title')
  local dashboard_uid
  dashboard_uid=$(echo "$dashboard_json" | jq -r '.uid')
  
  log_info "Provisioning dashboard: $dashboard_title (UID: $dashboard_uid)"
  
  # Prepare the dashboard JSON for the API
  local api_json
  api_json=$(jq -n \
    --arg dashboard "$dashboard_json" \
    --arg folder_id "$folder_id" \
    --arg overwrite "true" \
    '{"dashboard": $dashboard | fromjson, "folderId": $folder_id | tonumber, "overwrite": $overwrite | test("true")}')
  
  # Send the request to Grafana API
  local response
  response=$(curl -s -X POST -H "$auth_header" -H "Content-Type: application/json" \
    -d "$api_json" \
    "$GRAFANA_URL/api/dashboards/db")
  
  local status
  status=$(echo "$response" | jq -r '.status')
  
  if [ "$status" = "success" ]; then
    log_success "Dashboard provisioned successfully: $dashboard_title"
  else
    log_error "Failed to provision dashboard: $dashboard_title"
    log_error "Response: $response"
    return 1
  fi
  
  return 0
}

# Generate journey-specific dashboard with enhanced metrics
generate_journey_dashboard() {
  local journey="$1"
  local template_file="$TEMPLATE_DIR/${journey}-journey-dashboard.json"
  local output_file="$OUTPUT_DIR/${journey}-journey-dashboard.json"
  local journey_title
  
  # Convert journey name to title case for display
  journey_title=$(echo "$journey" | sed 's/\b\(\w\)/\u\1/g')
  
  if [ ! -f "$template_file" ]; then
    log_warning "Template file not found: $template_file. Creating a new template."
    
    # Create a basic dashboard template if it doesn't exist
    cat > "$template_file" << EOF
{
  "title": "${journey_title} Journey Dashboard",
  "uid": "${journey}-journey",
  "tags": ["journey", "${journey}"],
  "timezone": "browser",
  "schemaVersion": 36,
  "version": 1,
  "refresh": "5s",
  "panels": []
}
EOF
  fi
  
  log_info "Generating dashboard for ${journey_title} journey"
  
  # Read the template file
  local dashboard_json
  dashboard_json=$(cat "$template_file")
  
  # Add standard panels for all journeys
  dashboard_json=$(echo "$dashboard_json" | jq '.panels = []')
  
  # Add API Response Times panel
  dashboard_json=$(echo "$dashboard_json" | jq --arg journey "$journey" '.
    .panels += [{
      "title": "API Response Times",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"\($journey)-service\"}[5m])) by (le))",
          "legendFormat": "95th Percentile"
        },
        {
          "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{service=\"\($journey)-service\"}[5m])) by (le))",
          "legendFormat": "Median"
        }
      ]
    }]')
  
  # Add Error Rates panel
  dashboard_json=$(echo "$dashboard_json" | jq --arg journey "$journey" '.
    .panels += [{
      "title": "Error Rates",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{service=\"\($journey)-service\", status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total{service=\"\($journey)-service\"}[5m]))",
          "legendFormat": "Error Rate"
        }
      ],
      "options": {
        "legend": {"showLegend": true},
        "tooltip": {"mode": "single", "sort": "none"},
        "thresholds": {
          "mode": "absolute",
          "steps": [
            {"color": "green", "value": null},
            {"color": "yellow", "value": 0.01},
            {"color": "red", "value": 0.05}
          ]
        }
      }
    }]')
  
  # Add Request Volume panel
  dashboard_json=$(echo "$dashboard_json" | jq --arg journey "$journey" '.
    .panels += [{
      "title": "Request Volume",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{service=\"\($journey)-service\"}[5m]))",
          "legendFormat": "Requests/sec"
        }
      ]
    }]')
  
  # Add journey-specific panels based on the journey type
  case "$journey" in
    "health")
      # Add Health Metrics Recorded panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Health Metrics Recorded",
          "type": "stat",
          "gridPos": {"h": 8, "w": 6, "x": 12, "y": 8},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "textMode": "value",
            "colorMode": "value",
            "graphMode": "area",
            "justifyMode": "auto"
          },
          "targets": [
            {
              "expr": "sum(increase(health_metrics_recorded_total[24h]))",
              "legendFormat": "Metrics Recorded"
            }
          ]
        }]')
      
      # Add Device Connections panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Device Connections",
          "type": "gauge",
          "gridPos": {"h": 8, "w": 6, "x": 18, "y": 8},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "orientation": "auto",
            "showThresholdLabels": false,
            "showThresholdMarkers": true
          },
          "targets": [
            {
              "expr": "sum(device_connections_active)",
              "legendFormat": "Active Connections"
            }
          ]
        }]')
      
      # Add Health Goals Progress panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Health Goals Progress",
          "type": "bargauge",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "orientation": "horizontal",
            "displayMode": "gradient",
            "showUnfilled": true
          },
          "targets": [
            {
              "expr": "avg(health_goal_progress) by (goal_type)",
              "legendFormat": "{{goal_type}}"
            }
          ]
        }]')
      ;;
      
    "care")
      # Add Appointments Booked panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Appointments Booked",
          "type": "stat",
          "gridPos": {"h": 8, "w": 6, "x": 12, "y": 8},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "textMode": "value",
            "colorMode": "value",
            "graphMode": "area",
            "justifyMode": "auto"
          },
          "targets": [
            {
              "expr": "sum(increase(appointments_booked_total[24h]))",
              "legendFormat": "Appointments Booked"
            }
          ]
        }]')
      
      # Add Telemedicine Sessions panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Telemedicine Sessions",
          "type": "gauge",
          "gridPos": {"h": 8, "w": 6, "x": 18, "y": 8},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "orientation": "auto",
            "showThresholdLabels": false,
            "showThresholdMarkers": true
          },
          "targets": [
            {
              "expr": "sum(telemedicine_sessions_active)",
              "legendFormat": "Active Sessions"
            }
          ]
        }]')
      
      # Add Provider Availability panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Provider Availability",
          "type": "piechart",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "legend": {"showLegend": true, "placement": "right"},
            "pieType": "pie",
            "reduceOptions": {
              "values": true,
              "calcs": ["lastNotNull"],
              "fields": ""
            }
          },
          "targets": [
            {
              "expr": "sum(provider_availability) by (specialty)",
              "legendFormat": "{{specialty}}"
            }
          ]
        }]')
      ;;
      
    "plan")
      # Add Claims Submitted panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Claims Submitted",
          "type": "stat",
          "gridPos": {"h": 8, "w": 6, "x": 12, "y": 8},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "textMode": "value",
            "colorMode": "value",
            "graphMode": "area",
            "justifyMode": "auto"
          },
          "targets": [
            {
              "expr": "sum(increase(claims_submitted_total[24h]))",
              "legendFormat": "Claims Submitted"
            }
          ]
        }]')
      
      # Add Claim Processing Time panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Claim Processing Time",
          "type": "gauge",
          "gridPos": {"h": 8, "w": 6, "x": 18, "y": 8},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "orientation": "auto",
            "showThresholdLabels": false,
            "showThresholdMarkers": true
          },
          "targets": [
            {
              "expr": "avg(claim_processing_time_seconds)",
              "legendFormat": "Avg Processing Time"
            }
          ]
        }]')
      
      # Add Benefit Utilization panel
      dashboard_json=$(echo "$dashboard_json" | jq '.
        .panels += [{
          "title": "Benefit Utilization",
          "type": "bargauge",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16},
          "datasource": {"type": "prometheus", "uid": "prometheus"},
          "options": {
            "orientation": "horizontal",
            "displayMode": "gradient",
            "showUnfilled": true
          },
          "targets": [
            {
              "expr": "sum(benefit_utilization_percentage) by (benefit_type)",
              "legendFormat": "{{benefit_type}}"
            }
          ]
        }]')
      ;;
      
    *)
      log_warning "Unknown journey type: $journey. Using generic dashboard."
      ;;
  esac
  
  # Add cross-service tracing panel for all journeys
  dashboard_json=$(echo "$dashboard_json" | jq --arg journey "$journey" '.
    .panels += [{
      "title": "Cross-Service Request Tracing",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 24, "x": 0, "y": 24},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{journey=\"\($journey)\"}[5m])) by (service)",
          "legendFormat": "{{service}}"
        }
      ],
      "options": {
        "legend": {"showLegend": true},
        "tooltip": {"mode": "multi", "sort": "desc"}
      }
    }]')
  
  # Add business KPI panel based on journey type
  dashboard_json=$(echo "$dashboard_json" | jq --arg journey "$journey" '.
    .panels += [{
      "title": "Business KPIs",
      "type": "stat",
      "gridPos": {"h": 8, "w": 24, "x": 0, "y": 32},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "textMode": "auto",
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "horizontal",
        "reduceOptions": {
          "values": false,
          "calcs": ["lastNotNull"],
          "fields": ""
        }
      },
      "targets": [
        {
          "expr": "sum(\($journey)_journey_active_users)",
          "legendFormat": "Active Users"
        },
        {
          "expr": "sum(\($journey)_journey_conversion_rate)",
          "legendFormat": "Conversion Rate"
        },
        {
          "expr": "sum(\($journey)_journey_engagement_score)",
          "legendFormat": "Engagement Score"
        }
      ]
    }]')
  
  # Write the dashboard JSON to the output file
  echo "$dashboard_json" > "$output_file"
  
  log_success "Generated dashboard for ${journey_title} journey: $output_file"
  
  echo "$dashboard_json"
}

# Generate gamification dashboard
generate_gamification_dashboard() {
  local template_file="$TEMPLATE_DIR/gamification-dashboard.json"
  local output_file="$OUTPUT_DIR/gamification-dashboard.json"
  
  if [ ! -f "$template_file" ]; then
    log_warning "Template file not found: $template_file. Creating a new template."
    
    # Create a basic dashboard template if it doesn't exist
    cat > "$template_file" << EOF
{
  "title": "Gamification Dashboard",
  "uid": "gamification",
  "tags": ["gamification"],
  "timezone": "browser",
  "schemaVersion": 36,
  "version": 1,
  "refresh": "5s",
  "panels": []
}
EOF
  fi
  
  log_info "Generating Gamification dashboard"
  
  # Read the template file
  local dashboard_json
  dashboard_json=$(cat "$template_file")
  
  # Add standard panels for gamification
  dashboard_json=$(echo "$dashboard_json" | jq '.panels = []')
  
  # Add Events Processed panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Events Processed",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(gamification_events_processed_total[5m])) by (event_type)",
          "legendFormat": "{{event_type}}"
        }
      ]
    }]')
  
  # Add Event Processing Time panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Event Processing Time",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(event_processing_duration_seconds_bucket[5m])) by (le, event_type))",
          "legendFormat": "{{event_type}} - 95th Percentile"
        }
      ]
    }]')
  
  # Add Achievements Unlocked panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Achievements Unlocked",
      "type": "stat",
      "gridPos": {"h": 8, "w": 8, "x": 0, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "textMode": "value",
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto"
      },
      "targets": [
        {
          "expr": "sum(increase(achievements_unlocked_total[24h]))",
          "legendFormat": "Achievements Unlocked"
        }
      ]
    }]')
  
  # Add XP Awarded panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "XP Awarded",
      "type": "gauge",
      "gridPos": {"h": 8, "w": 8, "x": 8, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "orientation": "auto",
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "targets": [
        {
          "expr": "sum(increase(xp_awarded_total[24h]))",
          "legendFormat": "XP Awarded"
        }
      ]
    }]')
  
  # Add Quests Completed panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Quests Completed",
      "type": "stat",
      "gridPos": {"h": 8, "w": 8, "x": 16, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "textMode": "value",
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto"
      },
      "targets": [
        {
          "expr": "sum(increase(quests_completed_total[24h]))",
          "legendFormat": "Quests Completed"
        }
      ]
    }]')
  
  # Add Journey Contribution panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Journey Contribution to Gamification",
      "type": "piechart",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "legend": {"showLegend": true, "placement": "right"},
        "pieType": "pie",
        "reduceOptions": {
          "values": true,
          "calcs": ["lastNotNull"],
          "fields": ""
        }
      },
      "targets": [
        {
          "expr": "sum(increase(gamification_events_processed_total[24h])) by (journey)",
          "legendFormat": "{{journey}}"
        }
      ]
    }]')
  
  # Add Achievement Types panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Achievement Types Unlocked",
      "type": "bargauge",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "orientation": "horizontal",
        "displayMode": "gradient",
        "showUnfilled": true
      },
      "targets": [
        {
          "expr": "sum(increase(achievements_unlocked_total[24h])) by (achievement_type)",
          "legendFormat": "{{achievement_type}}"
        }
      ]
    }]')
  
  # Add Cross-Journey Achievement panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Cross-Journey Achievement Tracking",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 24, "x": 0, "y": 24},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(achievements_unlocked_total[5m])) by (journey)",
          "legendFormat": "{{journey}}"
        }
      ],
      "options": {
        "legend": {"showLegend": true},
        "tooltip": {"mode": "multi", "sort": "desc"}
      }
    }]')
  
  # Write the dashboard JSON to the output file
  echo "$dashboard_json" > "$output_file"
  
  log_success "Generated Gamification dashboard: $output_file"
  
  echo "$dashboard_json"
}

# Generate system overview dashboard
generate_system_dashboard() {
  local template_file="$TEMPLATE_DIR/system-overview-dashboard.json"
  local output_file="$OUTPUT_DIR/system-overview-dashboard.json"
  
  if [ ! -f "$template_file" ]; then
    log_warning "Template file not found: $template_file. Creating a new template."
    
    # Create a basic dashboard template if it doesn't exist
    cat > "$template_file" << EOF
{
  "title": "System Overview",
  "uid": "system-overview",
  "tags": ["system", "overview"],
  "timezone": "browser",
  "schemaVersion": 36,
  "version": 1,
  "refresh": "5s",
  "panels": []
}
EOF
  fi
  
  log_info "Generating System Overview dashboard"
  
  # Read the template file
  local dashboard_json
  dashboard_json=$(cat "$template_file")
  
  # Add standard panels for system overview
  dashboard_json=$(echo "$dashboard_json" | jq '.panels = []')
  
  # Add API Gateway Requests panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "API Gateway Requests",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{service=\"api-gateway\"}[5m])) by (journey)",
          "legendFormat": "{{journey}}"
        }
      ]
    }]')
  
  # Add Service Health panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Service Health",
      "type": "stat",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "textMode": "name",
        "colorMode": "background",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "horizontal",
        "reduceOptions": {
          "values": false,
          "calcs": ["lastNotNull"],
          "fields": ""
        },
        "text": {},
        "thresholds": {
          "mode": "absolute",
          "steps": [
            {"color": "red", "value": null},
            {"color": "green", "value": 1}
          ]
        }
      },
      "targets": [
        {
          "expr": "up",
          "legendFormat": "{{instance}}"
        }
      ]
    }]')
  
  # Add Memory Usage panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Memory Usage",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(container_memory_usage_bytes{namespace=~\"austa.*\"}) by (pod)",
          "legendFormat": "{{pod}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "bytes"
        }
      }
    }]')
  
  # Add CPU Usage panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "CPU Usage",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(container_cpu_usage_seconds_total{namespace=~\"austa.*\"}[5m])) by (pod)",
          "legendFormat": "{{pod}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "percentunit",
          "min": 0
        }
      }
    }]')
  
  # Add Network Traffic panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Network Traffic",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(container_network_receive_bytes_total{namespace=~\"austa.*\"}[5m])) by (pod)",
          "legendFormat": "{{pod}} - Received"
        },
        {
          "expr": "sum(rate(container_network_transmit_bytes_total{namespace=~\"austa.*\"}[5m])) by (pod)",
          "legendFormat": "{{pod}} - Transmitted"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "Bps"
        }
      }
    }]')
  
  # Add Database Connections panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Database Connections",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(pg_stat_activity_count) by (datname)",
          "legendFormat": "{{datname}}"
        }
      ]
    }]')
  
  # Add Cross-Service Request Tracing panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Cross-Service Request Tracing",
      "type": "nodeGraph",
      "gridPos": {"h": 12, "w": 24, "x": 0, "y": 24},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{source_service=~\".+\", destination_service=~\".+\"}[5m])) by (source_service, destination_service)",
          "legendFormat": "{{source_service}} -> {{destination_service}}"
        }
      ]
    }]')
  
  # Add CI/CD Pipeline Health panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "CI/CD Pipeline Health",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 24, "x": 0, "y": 36},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(github_workflow_run_status{status=\"success\"}) by (workflow)",
          "legendFormat": "{{workflow}} - Success"
        },
        {
          "expr": "sum(github_workflow_run_status{status=\"failure\"}) by (workflow)",
          "legendFormat": "{{workflow}} - Failure"
        }
      ]
    }]')
  
  # Write the dashboard JSON to the output file
  echo "$dashboard_json" > "$output_file"
  
  log_success "Generated System Overview dashboard: $output_file"
  
  echo "$dashboard_json"
}

# Generate CI/CD dashboard
generate_cicd_dashboard() {
  local template_file="$TEMPLATE_DIR/cicd-dashboard.json"
  local output_file="$OUTPUT_DIR/cicd-dashboard.json"
  
  if [ ! -f "$template_file" ]; then
    log_warning "Template file not found: $template_file. Creating a new template."
    
    # Create a basic dashboard template if it doesn't exist
    cat > "$template_file" << EOF
{
  "title": "CI/CD Health",
  "uid": "cicd-health",
  "tags": ["cicd", "pipeline"],
  "timezone": "browser",
  "schemaVersion": 36,
  "version": 1,
  "refresh": "5s",
  "panels": []
}
EOF
  fi
  
  log_info "Generating CI/CD Health dashboard"
  
  # Read the template file
  local dashboard_json
  dashboard_json=$(cat "$template_file")
  
  # Add standard panels for CI/CD dashboard
  dashboard_json=$(echo "$dashboard_json" | jq '.panels = []')
  
  # Add Build Performance panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Build Performance",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "avg(github_workflow_run_duration_seconds) by (workflow)",
          "legendFormat": "{{workflow}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s"
        }
      }
    }]')
  
  # Add Pipeline Stability panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Pipeline Stability",
      "type": "stat",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "textMode": "value_and_name",
        "colorMode": "background",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "horizontal",
        "reduceOptions": {
          "values": false,
          "calcs": ["lastNotNull"],
          "fields": ""
        },
        "text": {},
        "thresholds": {
          "mode": "absolute",
          "steps": [
            {"color": "red", "value": null},
            {"color": "yellow", "value": 0.7},
            {"color": "green", "value": 0.9}
          ]
        }
      },
      "targets": [
        {
          "expr": "sum(github_workflow_run_status{status=\"success\"}) by (workflow) / (sum(github_workflow_run_status{status=\"success\"}) by (workflow) + sum(github_workflow_run_status{status=\"failure\"}) by (workflow))",
          "legendFormat": "{{workflow}}"
        }
      ]
    }]')
  
  # Add Dependency Validation panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Dependency Validation",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "sum(rate(dependency_validation_failures_total[6h])) by (repository)",
          "legendFormat": "{{repository}} - Failures"
        },
        {
          "expr": "sum(rate(dependency_validation_runs_total[6h])) by (repository)",
          "legendFormat": "{{repository}} - Total Runs"
        }
      ]
    }]')
  
  # Add Cache Hit Ratio panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Cache Hit Ratio",
      "type": "gauge",
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "orientation": "auto",
        "showThresholdLabels": false,
        "showThresholdMarkers": true,
        "thresholds": {
          "mode": "absolute",
          "steps": [
            {"color": "red", "value": null},
            {"color": "yellow", "value": 0.5},
            {"color": "green", "value": 0.8}
          ]
        }
      },
      "targets": [
        {
          "expr": "sum(github_workflow_cache_hits) / sum(github_workflow_cache_requests)",
          "legendFormat": "Cache Hit Ratio"
        }
      ]
    }]')
  
  # Add Build Time Distribution panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Build Time Distribution",
      "type": "timeseries",
      "gridPos": {"h": 8, "w": 24, "x": 0, "y": 16},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "targets": [
        {
          "expr": "histogram_quantile(0.5, sum(rate(github_workflow_run_duration_seconds_bucket[24h])) by (le, workflow))",
          "legendFormat": "{{workflow}} - p50"
        },
        {
          "expr": "histogram_quantile(0.9, sum(rate(github_workflow_run_duration_seconds_bucket[24h])) by (le, workflow))",
          "legendFormat": "{{workflow}} - p90"
        },
        {
          "expr": "histogram_quantile(0.99, sum(rate(github_workflow_run_duration_seconds_bucket[24h])) by (le, workflow))",
          "legendFormat": "{{workflow}} - p99"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s"
        }
      }
    }]')
  
  # Add Resource Utilization panel
  dashboard_json=$(echo "$dashboard_json" | jq '.
    .panels += [{
      "title": "Runner Resource Utilization",
      "type": "heatmap",
      "gridPos": {"h": 8, "w": 24, "x": 0, "y": 24},
      "datasource": {"type": "prometheus", "uid": "prometheus"},
      "options": {
        "calculate": true,
        "calculation": {
          "xBuckets": {"mode": "size", "value": 10},
          "yBuckets": {"mode": "size", "value": 10}
        }
      },
      "targets": [
        {
          "expr": "sum(github_runner_busy) by (runner_name)",
          "legendFormat": "{{runner_name}}"
        }
      ]
    }]')
  
  # Write the dashboard JSON to the output file
  echo "$dashboard_json" > "$output_file"
  
  log_success "Generated CI/CD Health dashboard: $output_file"
  
  echo "$dashboard_json"
}

# Main function
main() {
  log_info "Starting AUSTA SuperApp Grafana Dashboard Setup"
  
  # Check dependencies
  check_dependencies
  
  # Create template directory if it doesn't exist
  mkdir -p "$TEMPLATE_DIR"
  
  # Create output directory if it doesn't exist
  mkdir -p "$OUTPUT_DIR"
  
  # Create dashboard folder in Grafana
  local folder_id
  folder_id=$(create_dashboard_folder "$DASHBOARD_FOLDER")
  
  # Generate journey-specific dashboards
  log_info "Generating journey-specific dashboards"
  for journey in "health" "care" "plan"; do
    local dashboard_json
    dashboard_json=$(generate_journey_dashboard "$journey")
    create_or_update_dashboard "$dashboard_json" "$folder_id"
  done
  
  # Generate gamification dashboard
  log_info "Generating gamification dashboard"
  local gamification_json
  gamification_json=$(generate_gamification_dashboard)
  create_or_update_dashboard "$gamification_json" "$folder_id"
  
  # Generate system overview dashboard
  log_info "Generating system overview dashboard"
  local system_json
  system_json=$(generate_system_dashboard)
  create_or_update_dashboard "$system_json" "$folder_id"
  
  # Generate CI/CD dashboard
  log_info "Generating CI/CD dashboard"
  local cicd_json
  cicd_json=$(generate_cicd_dashboard)
  create_or_update_dashboard "$cicd_json" "$folder_id"
  
  log_success "All dashboards have been successfully provisioned!"
}

# Run the main function
main "$@"