#!/bin/bash

# Quick import script for Grafana Cloud Playground
# Usage: ./quick-import.sh

echo "🚀 Faro Shop Dashboard Import Helper"
echo "===================================="

# Check if jq is installed (for JSON formatting)
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Install it for better JSON handling."
    echo "   On macOS: brew install jq"
    echo "   On Ubuntu: apt-get install jq"
fi

# Menu
echo ""
echo "Choose a dashboard to import:"
echo "1) Faro Shop Dashboard (Simplified for Cloud)"
echo "2) Full E-commerce Analytics Dashboard"
echo "3) Session Explorer Dashboard"
echo "4) Production Support Dashboard"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        DASHBOARD="grafana-faro-shop-cloud.json"
        ;;
    2)
        DASHBOARD="grafana-ecommerce-dashboard.json"
        ;;
    3)
        DASHBOARD="grafana-session-explorer-dashboard.json"
        ;;
    4)
        DASHBOARD="grafana-production-support-dashboard.json"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "📋 Dashboard: $DASHBOARD"
echo ""
echo "Instructions:"
echo "1. Copy the dashboard JSON below"
echo "2. Go to https://play.grafana.org/"
echo "3. Navigate to Dashboards → Import"
echo "4. Paste the JSON and click Load"
echo "5. Configure the data source and click Import"
echo ""
echo "Press any key to display the dashboard JSON..."
read -n 1 -s

echo ""
echo "========== DASHBOARD JSON START =========="
if command -v jq &> /dev/null; then
    cat "$DASHBOARD" | jq '.'
else
    cat "$DASHBOARD"
fi
echo "========== DASHBOARD JSON END =========="

echo ""
echo "✅ Dashboard JSON displayed above."
echo ""
echo "Additional Notes:"
echo "- The dashboard uses simplified metric names for Grafana Cloud"
echo "- Update the 'app' variable to match your application name"
echo "- Some panels may need metric name adjustments based on your setup"
echo ""
echo "Need help? Check grafana-cloud-import-guide.md for detailed instructions."

