import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { AlertItem } from '../../types/station';
import { fetchAlerts } from '../../services/api';
import { Bell, AlertTriangle, Users, ChevronRight } from 'lucide-react-native';

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const list = await fetchAlerts(25);
      setAlerts(list);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Bell size={18} color="#ef4444" />
          <Text style={styles.headerTitle}>Active Depletion Alerts</Text>
        </View>
        <Text style={styles.headerSub}>
          Live dispatch notifications triggered when DWLR telemetry crosses CGWB statutory thresholds
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginVertical: 40 }} />
      ) : alerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No critical transition alerts active.</Text>
        </View>
      ) : (
        alerts.map((alert) => {
          const isOE = alert.current_risk_category === 'Over-Exploited';
          return (
            <TouchableOpacity
              key={alert.id}
              style={[
                styles.alertCard,
                {
                  borderLeftColor: isOE ? '#ef4444' : '#f97316',
                },
              ]}
              onPress={() => router.push(`/station/${alert.station_id}`)}
            >
              <View style={styles.alertTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color={isOE ? '#ef4444' : '#f97316'} />
                  <Text style={styles.stationCode}>{alert.station_code}</Text>
                  <Text style={styles.districtText}>({alert.district})</Text>
                </View>

                <View
                  style={[
                    styles.riskBadge,
                    {
                      backgroundColor: isOE ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                    },
                  ]}
                >
                  <Text style={[styles.riskText, { color: isOE ? '#ef4444' : '#f97316' }]}>
                    {alert.current_risk_category}
                  </Text>
                </View>
              </View>

              <Text style={styles.messageText}>{alert.message}</Text>

              <View style={styles.alertFooter}>
                <View style={styles.notifiedRow}>
                  <Users size={12} color="#94a3b8" />
                  <Text style={styles.notifiedText}>Notified: Collector, BDO, GP Committee</Text>
                </View>
                <ChevronRight size={16} color="#64748b" />
              </View>
            </TouchableOpacity>
          );
        })
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  alertCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    gap: 8,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  districtText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  notifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifiedText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
