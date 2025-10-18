import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Api } from '../../services/api';

type AlertType = 'critical' | 'warning' | 'info';

interface AlertData {
    id: string;
    type: AlertType;
    category: string;
    title: string;
    message: string;
    time: string;
    distance: string;
    icon: string;
    priority: string;
}

export default function AlertsScreen() {
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<'all' | AlertType>('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const response = await Api.get("/safety-alerts");
            const rawAlerts = (response || []).filter((alert: any) => alert && typeof alert === 'object');
            
            // Transform backend data to match frontend interface
            const transformedAlerts: AlertData[] = rawAlerts.map((alert: any) => ({
                id: alert._id || alert.id,
                type: alert.type as AlertType,
                category: (alert.category || 'GENERAL').toUpperCase(),
                title: alert.title,
                message: alert.message,
                time: formatTimeAgo(new Date(alert.createdAt)),
                distance: alert.scope === 'Campus Wide' ? 'Campus-wide' : 'Location-specific',
                icon: getAlertIcon(alert.type),
                priority: (alert.priority || 'medium').toUpperCase(),
            }));
            
            setAlerts(transformedAlerts);
        } catch (error) {
            console.error("Error loading alerts:", error);
            Alert.alert("Error", "Failed to load alerts");
            setAlerts([]);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAlerts();
        setRefreshing(false);
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical': return 'alert-circle';
            case 'warning': return 'warning';
            case 'info': return 'information-circle';
            default: return 'information-circle';
        }
    };

    const filteredAlerts = selectedFilter === 'all'
        ? alerts
        : alerts.filter(alert => alert.type === selectedFilter);

    const getAlertCardStyle = (type: AlertType) => {
        switch (type) {
            case 'critical':
                return [styles.alertCard, styles.alertCardCritical];
            case 'warning':
                return [styles.alertCard, styles.alertCardWarning];
            case 'info':
                return [styles.alertCard, styles.alertCardInfo];
            default:
                return styles.alertCard;
        }
    };

    const getAlertIconStyle = (type: AlertType) => {
        switch (type) {
            case 'critical':
                return [styles.alertIconContainer, styles.alertIconCritical];
            case 'warning':
                return [styles.alertIconContainer, styles.alertIconWarning];
            case 'info':
                return [styles.alertIconContainer, styles.alertIconInfo];
            default:
                return styles.alertIconContainer;
        }
    };

    const getPriorityBadgeStyle = (type: AlertType) => {
        switch (type) {
            case 'critical':
                return [styles.priorityBadge, styles.priorityBadgeCritical];
            case 'warning':
                return [styles.priorityBadge, styles.priorityBadgeWarning];
            case 'info':
                return [styles.priorityBadge, styles.priorityBadgeInfo];
            default:
                return styles.priorityBadge;
        }
    };

    const handleAlertPress = (alert: AlertData) => {
        Alert.alert(
            alert.title,
            alert.message,
            [
                { text: 'Dismiss', style: 'cancel' },
                { text: 'Get Directions', onPress: () => console.log('Navigate to location') },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <LinearGradient
                colors={['#f8f9fa', '#e9f0f8']}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Safety Alerts</Text>
                    <View style={styles.headerRight}>
                        <View style={styles.alertCountBadge}>
                            <Text style={styles.alertCountText}>{alerts.length}</Text>
                        </View>
                    </View>
                </View>

                {/* Filter Buttons */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
                            onPress={() => setSelectedFilter('all')}
                        >
                            <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
                                All ({alerts.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedFilter === 'critical' && styles.filterButtonActive]}
                            onPress={() => setSelectedFilter('critical')}
                        >
                            <Text style={[styles.filterButtonText, selectedFilter === 'critical' && styles.filterButtonTextActive]}>
                                Critical ({alerts.filter((a: AlertData) => a.type === 'critical').length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedFilter === 'warning' && styles.filterButtonActive]}
                            onPress={() => setSelectedFilter('warning')}
                        >
                            <Text style={[styles.filterButtonText, selectedFilter === 'warning' && styles.filterButtonTextActive]}>
                                Warning ({alerts.filter((a: AlertData) => a.type === 'warning').length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedFilter === 'info' && styles.filterButtonActive]}
                            onPress={() => setSelectedFilter('info')}
                        >
                            <Text style={[styles.filterButtonText, selectedFilter === 'info' && styles.filterButtonTextActive]}>
                                Info ({alerts.filter((a: AlertData) => a.type === 'info').length})
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Alerts List */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#007AFF"
                        />
                    }
                >
                    {filteredAlerts.map((alert) => (
                        <TouchableOpacity
                            key={alert.id}
                            style={getAlertCardStyle(alert.type)}
                            onPress={() => handleAlertPress(alert)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.alertLeftSection}>
                                <View style={getAlertIconStyle(alert.type)}>
                                    <Ionicons name={alert.icon as any} size={22} color="#fff" />
                                </View>
                                <View style={styles.priorityIndicator}>
                                    <View style={[styles.priorityDot, { backgroundColor: alert.type === 'critical' ? '#FF3B30' : alert.type === 'warning' ? '#FF9500' : '#007AFF' }]} />
                                </View>
                            </View>
                            <View style={styles.alertContent}>
                                <View style={styles.alertHeader}>
                                    <View style={styles.alertTitleRow}>
                                        <Text style={styles.alertCategory}>{alert.category}</Text>
                                        <View style={getPriorityBadgeStyle(alert.type)}>
                                            <Text style={styles.priorityText}>{alert.priority}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.alertTitle}>{alert.title}</Text>
                                    <Text style={styles.alertMessage}>{alert.message}</Text>
                                </View>
                                <View style={styles.alertFooter}>
                                    <Text style={styles.alertTime}>{alert.time}</Text>
                                    <Text style={styles.alertDistance}>� {alert.distance}</Text>
                                    <View style={styles.alertActions}>
                                        <Ionicons name="location" size={14} color={alert.type === 'critical' ? '#FF3B30' : alert.type === 'warning' ? '#FF9500' : '#007AFF'} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    headerRight: {
        width: 40,
        alignItems: 'center',
    },
    alertCountBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    alertCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    filterContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8e8e93',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    alertCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    alertCardCritical: {
        borderLeftWidth: 5,
        borderLeftColor: '#FF3B30',
        backgroundColor: '#fff5f5',
    },
    alertCardWarning: {
        borderLeftWidth: 5,
        borderLeftColor: '#FF9500',
        backgroundColor: '#fffbf0',
    },
    alertCardInfo: {
        borderLeftWidth: 5,
        borderLeftColor: '#007AFF',
        backgroundColor: '#f0f8ff',
    },
    alertLeftSection: {
        alignItems: 'center',
        marginRight: 16,
    },
    alertIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    alertIconCritical: {
        backgroundColor: '#FF3B30',
    },
    alertIconWarning: {
        backgroundColor: '#FF9500',
    },
    alertIconInfo: {
        backgroundColor: '#007AFF',
    },
    priorityIndicator: {
        alignItems: 'center',
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    alertContent: {
        flex: 1,
    },
    alertHeader: {
        marginBottom: 8,
    },
    alertTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    alertCategory: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8e8e93',
        letterSpacing: 0.5,
    },
    priorityBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    priorityBadgeCritical: {
        backgroundColor: '#FF3B30',
    },
    priorityBadgeWarning: {
        backgroundColor: '#FF9500',
    },
    priorityBadgeInfo: {
        backgroundColor: '#007AFF',
    },
    priorityText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    alertMessage: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4a4a4a',
        lineHeight: 20,
    },
    alertFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    alertTime: {
        fontSize: 13,
        color: '#8e8e93',
        fontWeight: '500',
    },
    alertDistance: {
        fontSize: 13,
        color: '#8e8e93',
        fontWeight: '500',
    },
    alertActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});