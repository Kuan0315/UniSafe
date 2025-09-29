# Malaysian Universities Geofencing Setup Guide

## 🎓 Universities Included

### 1. **University of Malaya (UM)**
- **Location**: Kuala Lumpur, Malaysia
- **Coordinates**: 3.1201°N, 101.6544°E
- **Coverage**: 10km radius from campus center
- **Campus Area**: Main campus in Pantai Valley, KL

### 2. **Multimedia University (MMU) - Cyberjaya**
- **Location**: Cyberjaya, Selangor, Malaysia
- **Coordinates**: 2.9189°N, 101.6565°E
- **Coverage**: 10km radius from campus center
- **Campus Area**: Cyberjaya Technology Park

### 3. **Universiti Sains Malaysia (USM)**
- **Location**: Penang, Malaysia
- **Coordinates**: 5.3561°N, 100.3017°E
- **Coverage**: 10km radius from campus center
- **Campus Area**: Main campus in Minden, Penang

### 4. **Universiti Kebangsaan Malaysia (UKM)**
- **Location**: Bangi, Selangor, Malaysia
- **Coordinates**: 2.9300°N, 101.7770°E
- **Coverage**: 10km radius from campus center
- **Campus Area**: Bangi campus, Selangor

### 5. **Universiti Teknologi Malaysia (UTM)**
- **Location**: Skudai, Johor, Malaysia
- **Coordinates**: 1.5587°N, 103.6388°E
- **Coverage**: 10km radius from campus center
- **Campus Area**: Main campus in Skudai, Johor

## 🗺️ Coverage Areas

### **Zone Definitions:**
- **🟢 Campus Area**: Within university boundaries (Green polygon)
- **🟠 Coverage Area**: Within 10km radius but outside campus (Orange circle)
- **🔴 Outside Coverage**: Beyond 10km radius (App disabled)

### **Help Message Routing:**
- **On Campus**: Direct to campus security office
- **Coverage Area**: To emergency contacts
- **Outside Coverage**: App disabled

## 📍 Geographic Coverage

### **Kuala Lumpur Area:**
- **UM**: Central KL, Pantai Valley
- **Coverage**: KLCC, Bukit Bintang, Petaling Jaya

### **Cyberjaya Area:**
- **MMU**: Cyberjaya Technology Park
- **Coverage**: Putrajaya, Cyberjaya, Dengkil

### **Penang Area:**
- **USM**: Minden, Penang
- **Coverage**: Georgetown, Bayan Lepas, Batu Ferringhi

### **Selangor Area:**
- **UKM**: Bangi, Selangor
- **Coverage**: Kajang, Putrajaya, Bangi

### **Johor Area:**
- **UTM**: Skudai, Johor
- **Coverage**: Johor Bahru, Tebrau, Skudai

## 🚨 Emergency Response

### **Campus Security:**
- **UM**: +603-7967-7000
- **MMU**: +603-8312-5000
- **USM**: +604-653-3888
- **UKM**: +603-8921-5555
- **UTM**: +607-553-3333

### **Emergency Services:**
- **Police**: 999
- **Ambulance**: 999
- **Fire Department**: 994

## 🔧 Technical Details

### **Coordinates System:**
- **Format**: Decimal degrees (DD)
- **Precision**: 4 decimal places
- **Reference**: WGS84 (World Geodetic System)

### **Coverage Calculation:**
- **Radius**: 10 kilometers
- **Formula**: Haversine distance calculation
- **Accuracy**: ±100 meters

### **Boundary Detection:**
- **Algorithm**: Point-in-polygon (Ray casting)
- **Performance**: O(n) complexity
- **Real-time**: Updates every location change

## 📱 App Features

### **University Selection:**
- Dropdown menu with all 5 universities
- Automatic coverage area visualization
- Real-time status updates

### **Location Tracking:**
- GPS-based positioning
- Zone detection (Campus/Coverage/Outside)
- Distance from campus center

### **Help System:**
- Smart message routing
- Custom help messages
- Emergency contact management

## 🚀 Future Enhancements

### **Additional Universities:**
- **UPM**: Universiti Putra Malaysia
- **UMT**: Universiti Malaysia Terengganu
- **UNIMAS**: Universiti Malaysia Sarawak
- **UMS**: Universiti Malaysia Sabah

### **Advanced Features:**
- **Real-time Updates**: Live incident reporting
- **Push Notifications**: Safety alerts
- **Integration**: Campus security systems
- **Analytics**: Safety trend analysis

## 📋 Setup Instructions

1. **Select University**: Choose your campus from the dropdown
2. **Grant Permissions**: Allow location access
3. **Verify Coverage**: Check your current zone
4. **Test Help Button**: Ensure emergency routing works
5. **Customize Settings**: Set emergency contacts and messages

## 🔒 Privacy & Security

- **Location Data**: Stored locally on device
- **No Tracking**: No personal data sent to servers
- **Emergency Only**: Help messages sent only when requested
- **Campus Compliance**: Follows university security protocols

---

*This system is designed specifically for Malaysian university campuses and provides comprehensive safety coverage for students, staff, and visitors.*
