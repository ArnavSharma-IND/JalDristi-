import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type {
  StationWithReadings,
  StationForecast,
  Advisory,
  DualClassification,
} from '../../types/station';
import {
  fetchStation,
  fetchStationForecast,
  fetchStationAdvisory,
  fetchDualClassification,
} from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  ShieldCheck,
  MapPin,
  TrendingDown,
  Scale,
  Gauge,
} from 'lucide-react-native';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [station, setStation] = useState<StationWithReadings | null>(null);
  const [forecast, setForecast] = useState<StationForecast | null>(null);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [dualClass, setDualClass] = useState<DualClassification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetchStation(id),
      fetchStationForecast(id).catch(() => null),
      fetchStationAdvisory(id).catch(() => null),
      fetchDualClassification(id).catch(() => null),
    ])
      .then(([st, fc, adv, dual]) => {
        setStation(st);
        setForecast(fc);
        setAdvisory(adv);
        setDualClass(dual);
      })
      .catch((e) => console.error('Station detail error:', e))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Retrieving telemetry profile...</Text>
      </View>
    );
  }

  if (!station) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Station not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isGemini = advisory?.advisory_source === 'gemini';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.stationCode}>{station.station_code}</Text>
          <RiskBadge risk={station.current_risk_category} />
        </View>
        <View style={styles.locationRow}>
          <MapPin size={14} color="#0ea5e9" />
          <Text style={styles.locationText}>
            {station.district}, {station.state} {station.block ? `(${station.block} Block)` : ''}
          </Text>
        </View>
      </View>

      {/* Mini Stat Cards */}
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Depth</Text>
          <Text style={styles.statValue}>
            {station.current_depth_m ? `${station.current_depth_m.toFixed(1)}m` : 'N/A'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Annual Trend</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  forecast && forecast.rate_of_change_m_per_year > 0 ? '#ef4444' : '#22c55e',
              },
            ]}
          >
            {forecast
              ? `${forecast.rate_of_change_m_per_year > 0 ? '+' : ''}${forecast.rate_of_change_m_per_year.toFixed(2)}m/yr`
              : '—'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Confidence</Text>
          <Text style={[styles.statValue, { color: '#38bdf8' }]}>
            {forecast?.confidence || 'Moderate'}
          </Text>
        </View>
      </View>

      {/* Dual Classification Card */}
      {dualClass && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Scale size={16} color="#38bdf8" />
            <Text style={styles.cardTitle}>Dual-Mode CGWB Matrix</Text>
          </View>

          {dualClass.stage_of_development != null && (
            <View style={styles.dualBox}>
              <Text style={styles.dualLabel}>CGWB Statutory Stage:</Text>
              <Text style={styles.dualValue}>{dualClass.stage_of_development.toFixed(1)}%</Text>
              <RiskBadge risk={dualClass.stage_category} size="small" />
            </View>
          )}

          <View style={styles.dualBox}>
            <Text style={styles.dualLabel}>Sensor Depth Proxy:</Text>
            <Text style={styles.dualValue}>
              {dualClass.current_depth_m ? `${dualClass.current_depth_m.toFixed(1)}m` : 'N/A'}
            </Text>
            <RiskBadge risk={dualClass.depth_proxy_category} size="small" />
          </View>
        </View>
      )}

      {/* Advisory Card */}
      <View style={[styles.card, { borderLeftColor: isGemini ? '#0ea5e9' : '#f59e0b', borderLeftWidth: 4 }]}>
        <View style={styles.cardHeader}>
          <Brain size={16} color={isGemini ? '#0ea5e9' : '#f59e0b'} />
          <Text style={styles.cardTitle}>Stakeholder Action Advisory</Text>
          <View
            style={[
              styles.sourceTag,
              {
                backgroundColor: isGemini ? 'rgba(14, 165, 233, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              },
            ]}
          >
            <Text style={[styles.sourceTagText, { color: isGemini ? '#38bdf8' : '#f59e0b' }]}>
              {isGemini ? '✨ Gemini 2.0' : '🛡️ Standard Rules'}
            </Text>
          </View>
        </View>

        {advisory ? (
          <>
            <Text style={styles.advisorySectionTitle}>Situation Analysis</Text>
            <Text style={styles.advisoryBody}>{advisory.summary}</Text>

            <Text style={styles.advisorySectionTitle}>Recommended Actions</Text>
            <Text style={styles.advisoryBody}>{advisory.recommendation}</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>Generating advisory...</Text>
        )}
      </View>

      {/* Hydrogeology Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Gauge size={16} color="#38bdf8" />
          <Text style={styles.cardTitle}>Station Specifications</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Total Well Depth:</Text>
          <Text style={styles.specValue}>{station.well_depth_m ? `${station.well_depth_m}m` : '50m'}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Logged Observations:</Text>
          <Text style={styles.specValue}>{station.readings.length} readings</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Coordinates:</Text>
          <Text style={styles.specValue}>
            {station.latitude.toFixed(3)}°N, {station.longitude.toFixed(3)}°E
          </Text>
        </View>
      </View>
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
    gap: 14,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0b1120',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 14,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  header: {
    gap: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationCode: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  sourceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dualBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 6,
  },
  dualLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  dualValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  advisorySectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  advisoryBody: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  specLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
