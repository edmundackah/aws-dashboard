# **Burndown API Response Data Structure**

## **JSON Structure**
```json
{
  "version": "1.0",
  "updatedAt": "2025-03-10T12:00:00Z",
  "environments": [
    {
      "env": "dev",
      "target": "2025-08-01",
      "series": [
        {
          "key": "spa.actual",
          "label": "SPAs (Actual)",
          "points": [
            {
              "x": "2025-01-05",
              "y": 92,
              "total": 118
            },
            {
              "x": "2025-01-12", 
              "y": 88,
              "total": 120
            }
          ]
        },
        {
          "key": "ms.actual",
          "label": "Microservices (Actual)",
          "points": [
            {
              "x": "2025-01-05",
              "y": 152,
              "total": 205
            }
          ]
        }
      ]
    }
  ]
}
```

## **Field Descriptions**

### **Root Level Fields**

- **`version`**: API version (e.g., "1.0") - for API compatibility tracking
- **`updatedAt`**: ISO timestamp when data was last updated - shows data freshness

### **Environment Object**

- **`env`**: Environment identifier (e.g., "dev", "sit", "uat", "nft")
- **`target`**: Target completion date in YYYY-MM-DD format - when migration should be 100% complete

### **Series Object**

- **`key`**: Unique identifier for the data series
  - `"spa.actual"` = Single Page Applications (actual progress)
  - `"ms.actual"` = Microservices (actual progress)
- **`label`**: Human-readable name for the series (optional)

### **Data Points**

- **`x`**: Date in YYYY-MM-DD format - when this measurement was taken
- **`y`**: **Number of services MIGRATED** (not remaining) - this is the key field for progress
- **`total`**: **Total number of services ELIGIBLE** for migration at that point in time

### **Key Understanding Points**

#### **1. The `y` Field = MIGRATED Count**
```json
{
  "x": "2025-01-05",
  "y": 92,        // ← 92 services have been migrated
  "total": 118    // ← 118 services are eligible for migration
}
```
- **NOT remaining services** - this is the count of successfully migrated services
- **Progress calculation**: `(y / total) * 100 = progress percentage`

#### **2. The `total` Field = ELIGIBLE Count**
```json
{
  "y": 92,        // 92 migrated
  "total": 118    // 118 eligible
}
// Remaining = 118 - 92 = 26 services still need migration
```
- **Fluctuates over time** as teams create new services during migration
- **Not a fixed number** - can increase as new services are added

#### **3. Progress Calculation**
```typescript
// For each data point:
const migrated = point.y;           // Services migrated
const eligible = point.total;        // Services eligible
const remaining = eligible - migrated; // Services still to migrate
const progress = (migrated / eligible) * 100; // Progress percentage
```

### **📊 Example Data Interpretation**

#### **DEV Environment - January 5th**
```json
{
  "x": "2025-01-05",
  "y": 92,        // 92 SPAs migrated
  "total": 118    // 118 SPAs eligible
}
```
- **Progress**: 92/118 = 78% complete
- **Remaining**: 118 - 92 = 26 SPAs to migrate
- **Status**: Good progress, but still work to do

#### **SIT Environment - February 12th**
```json
{
  "x": "2025-02-12", 
  "y": 70,        // 70 SPAs migrated
  "total": 90     // 90 SPAs eligible (note: total changed!)
}
```
- **Progress**: 70/90 = 78% complete
- **Remaining**: 90 - 70 = 20 SPAs to migrate
- **Note**: Total changed from previous measurement (new services added)

### **�� Why This Structure Makes Sense**

1. **📈 Progress Tracking**: `y` shows actual migration progress
2. **🎯 Target Setting**: `target` date provides deadline for 100% completion
3. **�� Dynamic Scope**: `total` allows for changing service counts during migration
4. **🔄 Historical Analysis**: Multiple data points show migration trends over time
5. **🌍 Environment Isolation**: Each environment has its own target and progress

### **🔧 How the Dashboard Uses This Data**

1. **Progress Bars**: Calculate `(y / total) * 100` for each environment
2. **Expected Lines**: Project from current `y` to `total` by `target` date
3. **Status Badges**: Determine if progress suggests meeting target deadline
4. **Risk Assessment**: Compare current progress to required rate for target

This structure allows the dashboard to show both current progress and project future completion, giving senior leadership the insights they need to track migration success! 