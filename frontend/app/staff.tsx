import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchStaffSOS, fetchReports, resolveSOS, SOSAlertItem, ReportItem } from '../services/StaffService';
import { Ionicons } from '@expo/vector-icons';

interface SOSGroup { userName: string; alerts: SOSAlertItem[] }

type Tab = 'sos' | 'reports';

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>('sos');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sosAlerts, setSOSAlerts] = useState<SOSAlertItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSOS, setSelectedSOS] = useState<SOSAlertItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'sos') {
  const data = await fetchStaffSOS();
  // Filter to student alerts only if user info contains role
  const filtered = (data.alerts || []).filter(a => (a as any).user?.role ? (a as any).user.role === 'student' : true);
  setSOSAlerts(filtered);
      } else {
        const rep = await fetchReports();
        setReports(rep.items || []);
      }
    } catch (e: any) { setError(e.message || 'Failed loading data'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const grouped: SOSGroup[] = sosAlerts.reduce((acc: SOSGroup[], alert) => {
    const name = alert.user?.name || 'Unknown User';
    let g = acc.find(a => a.userName === name);
    if (!g) { g = { userName: name, alerts: [] }; acc.push(g); }
    g.alerts.push(alert); return acc;
  }, []).sort((a,b) => b.alerts.length - a.alerts.length);

  const renderSOSItem = (alert: SOSAlertItem) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedSOS(alert)}>
      <View style={styles.cardRow}>
        <Ionicons name="alert-circle" size={20} color={alert.status === 'active' ? '#FF3B30' : '#2e7d32'} />
        <Text style={styles.cardTitle}>{alert.message}</Text>
      </View>
      <Text style={styles.meta}>User: {alert.user?.name || 'N/A'} • Severity: {alert.severity} • Status: {alert.status}</Text>
      <Text style={styles.meta}>Created: {new Date(alert.createdAt).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  const renderReportItem = (r: ReportItem) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedReport(r)}>
      <View style={styles.cardRow}>
        <Ionicons name="document-text" size={20} color="#007AFF" />
        <Text style={styles.cardTitle}>{r.category}</Text>
      </View>
      <Text numberOfLines={2} style={styles.meta}>{r.description}</Text>
      <Text style={styles.meta}>By: {r.userName} • {new Date(r.createdAt).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  const resolveCurrent = async () => {
    if (!selectedSOS) return;
    try { await resolveSOS(selectedSOS._id, 'Resolved by staff app'); setSelectedSOS(null); loadData(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabButton, tab==='sos' && styles.tabActive]} onPress={() => setTab('sos')}>
          <Text style={styles.tabText}>SOS Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, tab==='reports' && styles.tabActive]} onPress={() => setTab('reports')}>
          <Text style={styles.tabText}>Reports</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? <ActivityIndicator style={{marginTop:20}} /> : (
        tab === 'sos' ? (
          <FlatList
            data={grouped.flatMap(g => g.alerts)}
            keyExtractor={(a) => a._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={grouped.length ? (
              <View style={{paddingHorizontal:16,paddingTop:8}}>
                {grouped.map(g => (
                  <Text key={g.userName} style={styles.groupSummary}>{g.userName}: {g.alerts.length} alert(s)</Text>
                ))}
              </View>
            ) : null}
            renderItem={({item}) => renderSOSItem(item)}
          />
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(r) => r.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({item}) => renderReportItem(item)}
          />
        )
      )}

      {/* SOS Detail Modal */}
      <Modal visible={!!selectedSOS} animationType='slide' onRequestClose={() => setSelectedSOS(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{padding:16}}>
            {selectedSOS && (
              <>
                <Text style={styles.detailTitle}>SOS Alert</Text>
                <Text style={styles.detailLabel}>Message</Text>
                <Text style={styles.detailValue}>{selectedSOS.message}</Text>
                <Text style={styles.detailLabel}>User</Text>
                <Text style={styles.detailValue}>{selectedSOS.user?.name}</Text>
                <Text style={styles.detailLabel}>Severity / Status</Text>
                <Text style={styles.detailValue}>{selectedSOS.severity} / {selectedSOS.status}</Text>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{new Date(selectedSOS.createdAt).toLocaleString()}</Text>
                {selectedSOS.location?.address && (<>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{selectedSOS.location.address}</Text>
                </>)}
                <TouchableOpacity style={styles.resolveBtn} onPress={resolveCurrent} disabled={selectedSOS.status==='resolved'}>
                  <Text style={styles.resolveBtnText}>{selectedSOS.status==='resolved' ? 'Already Resolved' : 'Resolve Alert'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedSOS(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Report Detail Modal */}
      <Modal visible={!!selectedReport} animationType='slide' onRequestClose={() => setSelectedReport(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{padding:16}}>
            {selectedReport && (
              <>
                <Text style={styles.detailTitle}>Report</Text>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{selectedReport.category}</Text>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedReport.description}</Text>
                <Text style={styles.detailLabel}>User</Text>
                <Text style={styles.detailValue}>{selectedReport.userName}</Text>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{new Date(selectedReport.createdAt).toLocaleString()}</Text>
                {selectedReport.attachments?.length ? (
                  <>
                    <Text style={styles.detailLabel}>Attachments</Text>
                    {selectedReport.attachments.map(f => (
                      <Text key={f.filename} style={styles.attachment}>{f.filename} ({Math.round(f.size/1024)} KB)</Text>
                    ))}
                  </>
                ) : null}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedReport(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f5f7fa' },
  tabRow: { flexDirection:'row', padding:12, gap:12 },
  tabButton: { flex:1, backgroundColor:'#e1e6ed', padding:12, borderRadius:12, alignItems:'center' },
  tabActive: { backgroundColor:'#007AFF' },
  tabText: { color:'#000', fontWeight:'600' },
  error: { color:'#d32f2f', textAlign:'center', marginTop:8 },
  card: { backgroundColor:'#fff', marginHorizontal:16, marginVertical:8, padding:14, borderRadius:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  cardRow: { flexDirection:'row', alignItems:'center', marginBottom:6, gap:8 },
  cardTitle: { fontSize:15, fontWeight:'700', flexShrink:1 },
  meta: { fontSize:12, color:'#555', marginTop:2 },
  groupSummary: { fontSize:12, color:'#333', marginBottom:4 },
  modalContainer: { flex:1, backgroundColor:'#fff' },
  detailTitle: { fontSize:22, fontWeight:'700', marginBottom:12 },
  detailLabel: { marginTop:12, fontSize:12, fontWeight:'700', textTransform:'uppercase', color:'#555' },
  detailValue: { fontSize:14, color:'#222', marginTop:4 },
  resolveBtn: { backgroundColor:'#2e7d32', padding:14, borderRadius:10, marginTop:24, alignItems:'center' },
  resolveBtnText: { color:'#fff', fontWeight:'700' },
  closeBtn: { backgroundColor:'#ccc', padding:12, borderRadius:10, marginTop:16, alignItems:'center' },
  closeBtnText: { color:'#222', fontWeight:'600' },
  attachment: { fontSize:12, color:'#333', marginTop:4 }
});
