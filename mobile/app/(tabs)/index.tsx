import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Station, DataProvenance } from '../../types/station';
import { fetchStations, fetchProvenance } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import { ShieldCheck, Droplets, MapPin, RefreshCw, ChevronRight } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [provenance, setProvenance] = useState<DataProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stList, prov] = await Promise.all([
        fetchStations({ page_size: 100 }),
        fetchProvenance().catch(() => null),
      ]);
      setStations(stList);
      setProvenance(prov);
    } catch (e) {
      console.error('Failed to load mobile dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStations = filterRisk
    ? stations.filter((s) => s.current_risk_category === filterRisk)
    : stations;

  const counts = {
    safe: stations.filter((s) => s.current_risk_category === 'Safe').length,
    semi: stations.filter((s) => s.current_risk_category === 'Semi-Critical').length,
    crit: stations.filter((s) => s.current_risk_category === 'Critical').length,
    oe: stations.filter((s) => s.current_risk_category === 'Over-Exploited').length,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>Ministry of Jal Shakti · CGWB Telemetry</Text>
        <Text style={styles.title}>Groundwater Resource Evaluation</Text>
      </View>

      {/* Provenance Card */}
      {provenance && (
        <View style={styles.provenanceCard}>
          <View style={styles.provenanceHeader}>
            <ShieldCheck size={16} color="#38bdf8" />
            <Text style={styles.provenanceTitle}>Verified Dataset Provenance</Text>
          </View>
          <Text style={styles.provenanceBody}>
            {provenance.total_stations.toLocaleString()} Stations · {provenance.total_readings.toLocaleString()} Readings
          </Text>
          <Text style={styles.provenanceSub}>
            Span: {provenance.date_range_start} – {provenance.date_range_end}
          </Text>
        </View>
      )}

      {/* Risk Filter Metrics */}
      <Text style={styles.sectionHeader}>CGWB Risk Categorization</Text>
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statBox, { borderColor: '#22c55e' }]}
          onPress={() => setFilterRisk(filterRisk === 'Safe' ? null : 'Safe')}
        >
          <Text style={[styles.statNumber, { color: '#22c55e' }]}>{counts.safe}</Text>
          <Text style={styles.statLabel}>Safe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderColor: '#f59e0b' }]}
          onPress={() => setFilterRisk(filterRisk === 'Semi-Critical' ? null : 'Semi-Critical')}
        >
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{counts.semi}</Text>
          <Text style={styles.statLabel}>Semi-Crit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderColor: '#f97316' }]}
          onPress={() => setFilterRisk(filterRisk === 'Critical' ? null : 'Critical')}
        >
          <Text style={[styles.statNumber, { color: '#f97316' }]}>{counts.crit}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderColor: '#ef4444' }]}
          onPress={() => setFilterRisk(filterRisk === 'Over-Exploited' ? null : 'Over-Exploited')}
        >
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{counts.oe}</Text>
          <Text style={styles.statLabel}>Over-Exp</Text>
        </TouchableOpacity>
      </View>

      {/* Station List */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionHeader}>
          Active Telemetry Feeds ({filteredStations.length})
        </Text>
        {filterRisk && (
          <TouchableOpacity onPress={() => setFilterRisk(null)}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginVertical: 30 }} />
      ) : (
        filteredStations.slice(0, 30).map((st) => (
          <TouchableOpacity
            key={st.id}
            style={styles.stationCard}
            onPress={() => router.push(`/station/${st.id}`)}
          >
            <View style={styles.stationTop}>
              <Text style={styles.stationCode}>{st.station_code}</Text>
              <RiskBadge risk={st.current_risk_category} size="small" />
            </View>

            <View style={styles.stationLocation}>
              <MapPin size={12} color="#64748b" />
              <Text style={styles.stationDistrict}>
                {st.district}, {st.state} {st.block ? `(${st.block})` : ''}
              </Text>
            </View>

            <View style={styles.stationFooter}>
              <Text style={styles.stationDepth}>
                Depth: <Text style={styles.depthValue}>{st.current_depth_m ? `${st.current_depth_m.toFixed(1)}m` : 'N/A'}</Text>
              </Text>
              {st.classification_method === 'stage' && (
                <Text style={styles.stageTag}>CGWB Stage: {st.stage_of_development?.toFixed(1)}%</Text>
              )}
              <ChevronRight size={16} color="#64748b" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  provenanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  provenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  provenanceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  provenanceBody: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  provenanceSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },
  stationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  stationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  stationLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stationDistrict: {
    fontSize: 12,
    color: '#94a3b8',
  },
  stationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  stationDepth: {
    fontSize: 12,
    color: '#94a3b8',
  },
  depthValue: {
    fontWeight: '700',
    color: '#ffffff',
  },
  stageTag: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '700',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
