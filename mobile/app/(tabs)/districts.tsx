import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { DistrictSummary } from '../../types/station';
import { fetchDistricts } from '../../services/api';
import { MapPin } from 'lucide-react-native';

export default function DistrictsScreen() {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .catch((e) => console.error('Districts error:', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>District Resource Summary</Text>
        <Text style={styles.sub}>
          Aggregate CGWB categorization across mapped groundwater monitoring regions
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginVertical: 40 }} />
      ) : (
        districts.map((dist) => (
          <View key={`${dist.district}-${dist.state}`} style={styles.districtCard}>
            <View style={styles.distHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color="#0ea5e9" />
                <Text style={styles.distName}>{dist.district}</Text>
              </View>
              <Text style={styles.distState}>{dist.state}</Text>
            </View>

            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Text style={[styles.pillText, { color: '#22c55e' }]}>Safe: {dist.safe_count}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={[styles.pillText, { color: '#f59e0b' }]}>Semi: {dist.semi_critical_count}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                <Text style={[styles.pillText, { color: '#f97316' }]}>Crit: {dist.critical_count}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={[styles.pillText, { color: '#ef4444' }]}>OE: {dist.over_exploited_count}</Text>
              </View>
            </View>

            <Text style={styles.totalText}>
              Total Telemetry Stations: {dist.total_stations}
            </Text>
          </View>
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
    gap: 12,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  sub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  districtCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  distState: {
    fontSize: 12,
    color: '#94a3b8',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  totalText: {
    fontSize: 11,
    color: '#64748b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 6,
  },
});
